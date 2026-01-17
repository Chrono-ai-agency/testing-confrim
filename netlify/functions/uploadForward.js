import formidable from "formidable";
import fs from "fs";
import { Readable } from "stream";

export async function handler(event) {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No body received" })
      };
    }

    // ✅ Decode Netlify base64 body
    const buffer = Buffer.from(
      event.body,
      event.isBase64Encoded ? "base64" : "utf8"
    );

    // ✅ Convert buffer to stream for formidable
    const stream = Readable.from(buffer);

    // Fake request object (required by formidable)
    stream.headers = event.headers;

    const form = new formidable.IncomingForm({
      multiples: true,
      keepExtensions: true
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(stream, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const expense_id = fields.expense_id;
    const token = fields.token;

    if (!expense_id || !token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing expense_id or token" })
      };
    }

    const uploadedFiles = Array.isArray(files.files)
      ? files.files
      : [files.files];

    const payload = {
      expense_id,
      token,
      files: uploadedFiles.map(f => ({
        name: f.originalFilename,
        type: f.mimetype,
        data: fs.readFileSync(f.filepath, "base64")
      }))
    };

    // 🔥 Send to n8n
    const webhook = "https://aawcr1400.app.n8n.cloud/webhook/invoice-upload";

    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("n8n error:", text);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Webhook failed" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error("Upload error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
}

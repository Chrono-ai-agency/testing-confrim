// netlify/functions/uploadForward.js
import formidable from "formidable";
import fs from "fs";
import { Readable } from "stream";

export async function handler(event) {
  try {
    // Must have a body
    if (!event || !event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "No body received" }) };
    }

    // Decode body (Netlify may base64-encode it)
    const buffer = Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");

    // Create a readable stream for formidable to parse
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Add headers so formidable can read content-type / boundary
    // normalize header keys to lowercase (formidable expects it)
    stream.headers = {};
    if (event.headers) {
      for (const k of Object.keys(event.headers)) {
        stream.headers[k.toLowerCase()] = event.headers[k];
      }
    }

    // Use formidable to parse the stream
    const form = new formidable.IncomingForm({ multiples: true, keepExtensions: true });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(stream, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // Basic validation
    const expense_id = fields.expense_id || fields.expenseId || fields.expenseID;
    const token = fields.token;
    if (!expense_id || !token) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing expense_id or token" }) };
    }

    // Ensure files exist
    // formidable may return a single file object or array under files.files (name "files")
    let uploaded = [];
    if (files && files.files) {
      uploaded = Array.isArray(files.files) ? files.files : [files.files];
    } else {
      // check for any key in files
      uploaded = Object.keys(files || {}).flatMap(k => Array.isArray(files[k]) ? files[k] : [files[k]]);
    }

    const payload = {
      expense_id,
      token,
      files: uploaded.map(f => ({
        name: f.originalFilename || f.newFilename || f.name,
        type: f.mimetype || f.type || "application/octet-stream",
        data: fs.readFileSync(f.filepath || f.file, { encoding: "base64" })
      }))
    };

    // Forward to n8n webhook (production webhook)
    const webhook = "https://aawcr1400.app.n8n.cloud/webhook/invoice-upload";

    const resp = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("n8n webhook error", resp.status, text);
      return { statusCode: 502, body: JSON.stringify({ error: "Webhook forwarding failed", status: resp.status, body: text }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error("uploadForward error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error", message: String(err) }) };
  }
}

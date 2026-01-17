import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function handler(event) {
  try {
    const form = new formidable.IncomingForm({ multiples: true });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(event, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const uploaded = Array.isArray(files.files)
      ? files.files
      : [files.files];

    const payload = {
      expense_id: fields.expense_id,
      token: fields.token,
      files: uploaded.map(f => ({
        name: f.originalFilename,
        type: f.mimetype,
        data: fs.readFileSync(f.filepath, "base64"),
      })),
    };

    const res = await fetch(
      "https://aawcr1400.app.n8n.cloud/webhook/invoice-upload",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) throw new Error("n8n failed");

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Upload failed" }),
    };
  }
}

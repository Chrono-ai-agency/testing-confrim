import formidable from "formidable";
import fs from "fs";

export async function handler(event) {
  return new Promise((resolve) => {
    const form = new formidable.IncomingForm({
      multiples: true,
      keepExtensions: true
    });

    form.parse(event, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error", err);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: "Form parse failed" })
        });
        return;
      }

      try {
        const expense_id = fields.expense_id;
        const token = fields.token;

        if (!expense_id || !token) {
          resolve({
            statusCode: 400,
            body: JSON.stringify({ error: "Missing expense_id or token" })
          });
          return;
        }

        const webhook = "https://aawcr1400.app.n8n.cloud/webhook/invoice-upload";

        const uploadedFiles = Array.isArray(files.files)
          ? files.files
          : [files.files];

        const payload = {
          expense_id,
          token,
          files: uploadedFiles.map(f => ({
            name: f.originalFilename,
            type: f.mimetype,
            data: fs.readFileSync(f.filepath, { encoding: "base64" })
          }))
        };

        const response = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const text = await response.text();
          console.error("n8n error:", text);
          resolve({
            statusCode: 500,
            body: JSON.stringify({ error: "Webhook failed" })
          });
          return;
        }

        resolve({
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ success: true })
        });

      } catch (e) {
        console.error("Upload error", e);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: "Internal error" })
        });
      }
    });
  });
}

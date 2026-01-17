import fetch from 'node-fetch';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false
  }
};

export async function handler(event) {
  const form = new formidable.IncomingForm({ multiples:true });

  return new Promise((resolve) => {
    form.parse(event, async (err, fields, files) => {
      if(err){
        resolve({ statusCode:500, body:'Parse error' });
        return;
      }

      const expense_id = fields.expense_id;
      const token = fields.token;

      const webhook = 'https://aawcr1400.app.n8n.cloud/webhook/invoice-upload';

      const payload = {
        expense_id,
        token,
        files: []
      };

      const uploaded = Array.isArray(files.files)
        ? files.files
        : [files.files];

      for(const f of uploaded){
        payload.files.push({
          name: f.originalFilename,
          type: f.mimetype,
          data: fs.readFileSync(f.filepath, { encoding:'base64' })
        });
      }

      await fetch(webhook, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });

      resolve({ statusCode:200, body:'ok' });
    });
  });
}

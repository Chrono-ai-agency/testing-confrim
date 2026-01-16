// netlify/functions/forward.js
// Deploy this file under /netlify/functions in your repo for Netlify Functions to pick up.

const fetch = globalThis.fetch || require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON body' };
  }

  const { webhook, expense_id, action, token } = body;
  if (!webhook || !expense_id || !action || !token) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  // WHITELIST the allowed webhook hostnames (adjust to your webhooks)
  const ALLOWED_HOSTS = [
    'aawcr1400.app.n8n.cloud',
    // add other permitted hosts here if needed
  ];

  let url;
  try {
    url = webhook.startsWith('http') ? webhook : `https://${webhook}`;
    const parsed = new URL(url);
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
      return { statusCode: 400, body: 'Webhook host not allowed' };
    }
  } catch (err) {
    return { statusCode: 400, body: 'Invalid webhook URL' };
  }

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expense_id, action, token })
    });

    const text = await resp.text();
    // Optionally return webhook response back to client (or just OK)
    return {
      statusCode: resp.status === 0 ? 200 : resp.status,
      body: text || JSON.stringify({ ok: resp.ok, status: resp.status })
    };
  } catch (err) {
    console.error('Forward error', err);
    return { statusCode: 502, body: 'Failed to forward to webhook: ' + err.message };
  }
};

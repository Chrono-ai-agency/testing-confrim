exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { webhook, payload } = body;

    if (!webhook) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing webhook URL" }),
      };
    }

    const response = await fetch(`https://${webhook}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

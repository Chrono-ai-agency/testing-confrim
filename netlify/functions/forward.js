exports.handler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    const { webhook, payload } = JSON.parse(event.body);

    if (!webhook) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing webhook URL" }),
      };
    }

    const response = await fetch(webhook, {
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
      body: JSON.stringify({
        error: "Forward failed",
        details: err.message,
      }),
    };
  }
};

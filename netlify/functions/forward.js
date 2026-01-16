exports.handler = async (event) => {
  console.log("FUNCTION STARTED");

  try {
    console.log("RAW BODY:", event.body);

    if (!event.body) {
      console.log("NO BODY");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    const parsed = JSON.parse(event.body);
    console.log("PARSED BODY:", parsed);

    const { webhook, payload } = parsed;

    if (!webhook) {
      console.log("NO WEBHOOK PROVIDED");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing webhook URL" }),
      };
    }

    console.log("FORWARDING TO:", webhook);
    console.log("PAYLOAD:", payload);

    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });

    console.log("WEBHOOK RESPONSE STATUS:", response.status);

    const text = await response.text();
    console.log("WEBHOOK RESPONSE BODY:", text);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("FUNCTION ERROR:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Forward failed",
        details: err.message,
      }),
    };
  }
};

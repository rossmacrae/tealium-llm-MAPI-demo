const axios = require('axios');

module.exports = {
  async run({ email, plate_text, risk_score, risk_reason, collectApiUrl, traceId, event_name }) {
    if (!email || !plate_text || risk_score === undefined || !collectApiUrl) {
      throw new Error("Missing required input(s): email, plate_text, risk_score, or collectApiUrl");
    }

console.log("🚀 send-plate-score-to-tealium tool called with:", JSON.stringify({ email, plate_text, risk_score, risk_reason, traceId }));


    const collectUrl = new URL(collectApiUrl);
    collectUrl.searchParams.delete("tealium_datasource");
    collectUrl.searchParams.delete("tealium_event");

    // Override parameters for plate score events
    collectUrl.searchParams.set("tealium_datasource", "9hc6ay");
    collectUrl.searchParams.set("tealium_event", event_name || "plate_score_event");
    collectUrl.searchParams.set("plate_score_email_address", email);
    collectUrl.searchParams.set("plate_score_plate_text", plate_text);
    collectUrl.searchParams.set("plate_score_risk_score", risk_score.toString());
    collectUrl.searchParams.set("plate_score_risk_reason", (risk_reason || "No reason provided").slice(0, 1000));

    if (traceId) {
      collectUrl.searchParams.set("tealium_trace_id", traceId);
    }

    console.log("📤 Sending plate score data to Tealium:", collectUrl.toString());

    await axios.post(collectUrl.toString());

    return { status: "success" };
  }
};

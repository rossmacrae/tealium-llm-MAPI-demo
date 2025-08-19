require('dotenv').config();

const sendPlateScore = require('../mcp-server/tools/send-plate-score-to-tealium/index.js');

// Replace this with your actual base Collect URL for testing
const TEST_COLLECT_URL = "https://collect.tealiumiq.com/event?tealium_account=csm-ross-macrae&tealium_profile=demo-plates&tealium_datasource=r0v73c&tealium_event=chat_interaction_eventchat";

(async () => {
  const result = await sendPlateScore.run({
    email: "demo_mhigbin02@jigsy.com",
    plate_text: "FKNFAST",
    risk_score: 84,
    risk_reason: "Contains hidden profanity ('FKN') and an aggressive tone ('FAST')",
    collectApiUrl: TEST_COLLECT_URL,
    traceId: "DerjEVnJ"
  });

  console.log("✅ Test result:", result);
})();

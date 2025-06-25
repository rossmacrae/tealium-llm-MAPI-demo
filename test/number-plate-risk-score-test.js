require('dotenv').config();  // Load OPENROUTER_API_KEY

const plateTool = require('../mcp-server/tools/number-plate-risk-score/index.js');

const testCases = [
  {
    input: { plate_text: "FKNFAST", context: "number_plate", industry: "custom-plates" },
    expectedRisk: "high"
  },
  {
    input: { plate_text: "EV1L", context: "number_plate", industry: "custom-plates" },
    expectedRisk: "moderate"
  },
  {
    input: { plate_text: "CLEAN1", context: "number_plate", industry: "custom-plates" },
    expectedRisk: "low"
  },
  {
    input: { plate_text: "TRUMP01", context: "number_plate", industry: "custom-plates" },
    expectedRisk: "moderate"
  },
  {
    input: { plate_text: "MRDRR", context: "number_plate", industry: "custom-plates" },
    expectedRisk: "high"
  },
  {
    input: { plate_text: "ROSS65", context: "number_plate", industry: "custom-plates" },
    expectedRisk: "low"
  },
  {
    input: { plate_text: "XXX4U", context: "number_plate", industry: "custom-plates" },
    expectedRisk: "low"
  },
  {
    input: { plate_text: "M4SS1V3", context: "number_plate", industry: "custom-plates" },
    expectedRisk: "low"
  }
];

const classifyRisk = (score) => {
  if (score >= 70) return "high";
  if (score >= 30) return "moderate";
  return "low";
};

(async () => {
  for (const testCase of testCases) {
    const result = await plateTool.run(testCase.input);
    const riskLevel = classifyRisk(result.score);

    console.log(`🚘 Plate: ${testCase.input.plate_text}`);
    console.log(`📊 Score: ${result.score} — ${riskLevel.toUpperCase()}`);
    console.log(`📝 Reason: ${result.reason}`);

    if (riskLevel === testCase.expectedRisk) {
      console.log("✅ PASSED\n");
    } else {
      console.log(`❌ FAILED — expected ${testCase.expectedRisk.toUpperCase()}\n`);
    }
  }
})();

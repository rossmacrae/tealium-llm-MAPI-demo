require('dotenv').config(); // Load .env manually for this test

const interpretMessage = require('../mcp-server/tools/interpret-message/index.js');

const testCases = [
  {
    input: "How do I upgrade my plan?",
    expected: { intent: "upgrade", topic: "upgrade" }
  },
  {
    input: "Rate the plate 'BAD4U'",
    expected: { intent: "evaluate_plate", topic: "number plate" }
  },
  {
    input: "Can you check if FKNFAST is okay?",
    expected: { intent: "evaluate_plate", topic: "number plate" }
  },
  {
    input: "What's my billing history?",
    expected: { intent: "check_billing", topic: "billing" }
  },
  {
    input: "Evaluate L8RLOS3R",
    expected: { intent: "evaluate_plate", topic: "number plate" }
  },
  {
    input: "I need support with my SIM card",
    expected: { intent: "get_support", topic: "support" }
  }
];

(async () => {
  for (const testCase of testCases) {
    const result = await interpretMessage.run({ userMessage: testCase.input });

    console.log(`💬 Input: ${testCase.input}`);
    console.log(`📤 Output:`, result);
    const matchIntent = result.intent === testCase.expected.intent;
    const matchTopic = result.topic === testCase.expected.topic;
    const passed = matchIntent && matchTopic;
    console.log(passed ? "✅ PASSED\n" : "❌ FAILED\n");
  }
})();

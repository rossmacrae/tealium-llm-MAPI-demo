// File: /widget/app-bridge.js
// Description: Optional bridge that wires the widget into your existing app.js
// Exposes window.ChatbotWidgetBridge.handleMessage used by the widget in function mode
// ==========================
(function () {
if (window.ChatbotWidgetBridge && typeof window.ChatbotWidgetBridge.handleMessage === 'function') return;
window.ChatbotWidgetBridge = window.ChatbotWidgetBridge || {};


// Expect your app.js to export a global function callMCPOrchestratedChat(message, history?, sessionId?)
// If not present, we fallback to a simple echo.
window.ChatbotWidgetBridge.handleMessage = async function (text, context) {
if (typeof window.callMCPOrchestratedChat === 'function') {
const out = await window.callMCPOrchestratedChat(text, context && context.history, context && context.chat_session_id);
// Normalise shape for the widget
return {
text: out && (out.reply || out.text || out.message) || '(no response)',
meta: Object.assign({ model: out && out.model }, out && out.meta ? out.meta : {})
};
}
return { text: `You said: ${text}\n(No MCP bridge found – using fallback)`, meta: { model: 'fallback' } };
};
})();

(function (){
  /* =========================
   * Chatbot globals & runtime params
   * ========================= */
  window.ChatbotParams = window.ChatbotParams || {
    attributeId: 5036,
    attributeValue: "demo_skeablep@qq.com", // default; will be overwritten by ChatbotSetEmail
    profileApiUrl: "https://personalization-api.ap-southeast-2.prod.tealiumapis.com/personalization/accounts/csm-ross-macrae/profiles/demo-telco/engines/93152c19-95f5-443a-9223-6a394d854ff9",
    collectApiUrl: "https://collect.tealiumiq.com/event?tealium_account=csm-ross-macrae&tealium_profile=demo-telco&tealium_datasource=31o5i9&tealium_event=chat_interaction_event",
    traceId: "",
    industryContext: "telco",
    recommendationHint: "Recommend telco products based on the customer's recent and favourite categories viewed. Encourage prepaid plan customers to switch to a postpaid plan.",
    model: "anthropic/claude-3-haiku",
    isConcise: true,
    useProfile: false
  };

  /* Restore email for this tab (survives page navigations on same origin) */
  try {
    var savedEmail = window.sessionStorage.getItem('cbw_user_email');
    if (savedEmail) { window.ChatbotParams.attributeValue = savedEmail; }
  } catch(e){}

  /* Public setters (use anywhere: Moments IQ, login capture, console) */
  window.ChatbotSetEmail = function(email){
    if (!email) return;
    var em = String(email).trim();
    if (!em) return;

    window.ChatbotParams.attributeValue = em;
    try { window.sessionStorage.setItem('cbw_user_email', em); } catch(e){}

    // Notify the widget to refresh the "tracking as" line immediately
    try {
      var ev;
      if (typeof CustomEvent === 'function') {
        ev = new CustomEvent('cbw:email', { detail: { email: em } });
      } else {
        ev = document.createEvent('CustomEvent');
        ev.initCustomEvent('cbw:email', false, false, { email: em });
      }
      window.dispatchEvent(ev);
    } catch (e) {}

    if (window.console && console.log) console.log('[chatbot] email set to', em);
};


  window.ChatbotClearEmail = function(){
    try { window.sessionStorage.removeItem('cbw_user_email'); } catch(e){}
    window.ChatbotParams.attributeValue = "demo_skeablep@qq.com";
    if (window.console && console.log) console.log('[chatbot] email cleared, reverted to default');
  };

  /* Widget display config */
  window.ChatbotWidgetConfig = {
    title: "Tealium AI Assistant",
    subtitle: "Powered by MCP",
    position: "right",
    accent: "#0ea5e9",
    apiMode: "function",
    placeholder: "Type a message…",
    useProfile: false,
    isConcise: true,
    suggest: ["What can you do?", "Personalise my experience"],
    persist: "session"  // keep chat history & open state per tab
  };

  /* Bridge: reads CURRENT values from ChatbotParams on every send */
  var AGENT_URL = "https://leading-merry-albacore.ngrok-free.app/agent";
  window.ChatbotWidgetBridge = window.ChatbotWidgetBridge || {};
  window.ChatbotWidgetBridge.handleMessage = function (text, ctx) {
    var P = window.ChatbotParams || {};
    var history = (ctx && ctx.history) || [];
    var chat_session_id = (ctx && ctx.chat_session_id) || (Date.now().toString(36) + Math.random().toString(36).slice(2,8)).toUpperCase();
    var include = (ctx && typeof ctx.useProfile !== "undefined") ? !!ctx.useProfile : !!window.ChatbotWidgetConfig.useProfile;
    var concise = (ctx && typeof ctx.isConcise !== "undefined") ? !!ctx.isConcise : !!window.ChatbotWidgetConfig.isConcise;
    var t0 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();

    return fetch(AGENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: {
          attributeId: P.attributeId,
          attributeValue: P.attributeValue,   // <-- live email here
          userMessage: text,
          model: P.model,
          isConcise: concise,
          includeContext: include,
          history: history,
          profileApiUrl: P.profileApiUrl,
          collectApiUrl: P.collectApiUrl,
          traceId: P.traceId || chat_session_id,
          industryContext: P.industryContext,
          recommendationHint: P.recommendationHint
        }
      })
    }).then(function(resp){ return resp.json(); })
      .then(function(data){
        var out = (data && data.output) || {};
        var t1 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
        var latency = Math.round(t1 - t0);
        return { text: out.llmReply || "(no response)", meta: { latency: latency, model: out.model || P.model } };
      }).catch(function(e){
        return { text: "Sorry, something went wrong.", meta: { error: String(e) } };
      });
  };

  /* Load the widget JS via XHR (bypasses ngrok warning), then inject */
  function injectWidgetJs(code){
    var s = document.createElement('script');
    s.type = 'text/javascript';
    try { s.appendChild(document.createTextNode(code)); }
    catch (e) { s.text = code; }
    document.body.appendChild(s);
  }
  function loadWidgetViaXHR(){
    var url = "https://leading-merry-albacore.ngrok-free.app/widget/chatbot-widget.js?v=1.3a";
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('ngrok-skip-browser-warning', 'true'); // <-- key for ngrok interstitial
    xhr.onreadystatechange = function(){
      if (xhr.readyState === 4){
        if (xhr.status >= 200 && xhr.status < 300){
          injectWidgetJs(xhr.responseText);
          if (window.console && console.log) console.log('✅ widget loaded via XHR');
        } else {
          if (window.console && console.log) console.log('❌ widget fetch failed:', xhr.status);
        }
      }
    };
    xhr.send(null);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadWidgetViaXHR);
  } else {
    loadWidgetViaXHR();
  }
})();

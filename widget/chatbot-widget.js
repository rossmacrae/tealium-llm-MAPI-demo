// ==========================
// Chatbot Widget v1.3a (safe-init + Use Profile toggle + Session persistence + “tracking as …”)
// - Defers until DOM is ready
// - Uses only window.ChatbotWidgetConfig (no currentScript reliance)
// - Adds "Use profile" toggle in header
// - Persists open/closed state, history, useProfile, session id across page loads (per tab)
// - NEW: shows “tracking as: <email|anonymous>” and keeps it in sync with Use profile + runtime email
// ==========================
(function () {
  if (window.__CHATBOT_WIDGET__) return;
  window.__CHATBOT_WIDGET__ = true;

  const ready = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  };

  ready(() => {
    try {
      const DEFAULTS = {
        title: 'Assistant',
        subtitle: 'How can I help today?',
        position: 'right',
        accent: '#2563eb',
        apiMode: 'function',       // 'function' | 'http'
        apiUrl: '/api/agent/chat', // used only if apiMode === 'http'
        zIndex: 2147482000,
        placeholder: 'Type a message…',
        suggest: ['What can you do?', 'Personalise my experience'],
        tealiumVendor: 'utag',
        useProfile: false,
        isConcise: false,
        persist: 'session',        // 'session' (per-tab) or 'local' (across tabs)
        maxTurns: 80               // cap stored history (total items)
      };

      const CFG = Object.assign({}, DEFAULTS, window.ChatbotWidgetConfig || {});
      // Keep global in sync
      window.ChatbotWidgetConfig = Object.assign({}, CFG);

      // ---------- Persistence ----------
      const STORAGE = CFG.persist === 'local' ? window.localStorage : window.sessionStorage;
      const STORE_KEY = 'cbw_state_v1';
      const loadState = () => {
        try { return JSON.parse(STORAGE.getItem(STORE_KEY) || 'null'); } catch { return null; }
      };
      const saveState = (state) => {
        try { STORAGE.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
      };

      // Generate a default session id
      let sid = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).toUpperCase();
      let history = [];

      // ---------- Host + Shadow Root ----------
      const host = document.createElement('div');
      host.id = 'cbw-host';
      host.style.all = 'initial';
      host.style.position = 'fixed';
      host.style[CFG.position === 'left' ? 'left' : 'right'] = '20px';
      host.style.bottom = '20px';
      host.style.zIndex = String(CFG.zIndex);
      document.body.appendChild(host);

      const root = host.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        :host { all: initial; }
        *, *::before, *::after { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
        .btn { display:inline-flex; align-items:center; justify-content:center; border-radius:9999px; height:56px; width:56px; border:none; cursor:pointer; box-shadow: 0 10px 25px rgba(0,0,0,.15); }
        .btn svg { height:24px; width:24px; }
        .launcher { background:${CFG.accent}; color:white; }
        .panel { position:fixed; bottom:90px; ${CFG.position === 'left' ? 'left:20px;' : 'right:20px;'} width:360px; max-width:calc(100vw - 40px); height:520px; max-height: calc(100vh - 140px); background:white; border-radius:16px; box-shadow: 0 25px 60px rgba(0,0,0,.2); display:flex; flex-direction:column; overflow:hidden; opacity:0; transform: translateY(20px); pointer-events:none; transition: all .18s ease-out; }
        .panel.open { opacity:1; transform: translateY(0); pointer-events:auto; }
        .hdr { background:${CFG.accent}; color:white; padding:12px 12px; display:flex; align-items:center; gap:10px; }
        .hdr h3 { margin:0; font-size:16px; line-height:1.2; }
        .hdr p { margin:0; font-size:12px; opacity:.9; }
        .hdr .grow { flex:1; }
        .hdr .x { background:rgba(255,255,255,.2); color:white; border:none; border-radius:8px; padding:6px; cursor:pointer; }
        .ctrls { display:flex; align-items:center; gap:8px; }
        .switch { display:inline-flex; align-items:center; gap:6px; font-size:12px; background:rgba(255,255,255,.2); color:#fff; padding:4px 8px; border-radius:10px; }
        .switch input { accent-color: ${CFG.accent}; }
        .trk { margin: 4px 0 0 0; font-size: 11px; color: #fff; opacity: .95; }
        .msgs { flex:1; background:#f7f7f8; overflow:auto; padding:14px; display:flex; flex-direction:column; gap:10px; }
        .msg { max-width:86%; padding:10px 12px; border-radius:14px; font-size:14px; line-height:1.35; white-space:pre-wrap; word-wrap:break-word; }
        .bot { background:white; border:1px solid #ececec; color:#111827; border-top-left-radius:4px; }
        .you { background:${CFG.accent}; color:white; margin-left:auto; border-top-right-radius:4px; }
        .meta { font-size:11px; color:#6b7280; margin-top:2px; }
        .inp { border-top:1px solid #ececec; padding:10px; background:white; display:flex; gap:8px; }
        .inp input[type="text"] { flex:1; border:1px solid #e5e7eb; border-radius:9999px; padding:10px 14px; outline:none; font-size:14px; }
        .inp button { border:none; border-radius:12px; padding:10px 14px; background:${CFG.accent}; color:white; cursor:pointer; }
        .sugg { display:flex; gap:8px; padding:8px 10px; flex-wrap:wrap; }
        .chip { background:white; border:1px solid #e5e7eb; color:#374151; border-radius:9999px; padding:6px 10px; font-size:12px; cursor:pointer; }
      `;
      root.appendChild(style);

      // Launcher
      const launcher = document.createElement('button');
      launcher.setAttribute('aria-label', 'Open chat');
      launcher.className = 'btn launcher';
      launcher.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>`;

      // Panel
      const panel = document.createElement('div');
      panel.className = 'panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'false');
      panel.setAttribute('aria-label', 'Chatbot panel');

      const header = document.createElement('div');
      header.className = 'hdr';
      header.innerHTML = `
        <div class="grow">
          <h3>${CFG.title}</h3>
          <p>${CFG.subtitle}</p>
          <p class="trk" id="cbw_track_line"></p>
        </div>
      `;
      const ctrls = document.createElement('div');
      ctrls.className = 'ctrls';
      ctrls.innerHTML = `
        <label class="switch">
          <input type="checkbox" id="cbw_use_profile" ${CFG.useProfile ? 'checked' : ''}/>
          <span>Use profile</span>
        </label>
        <button class="x" aria-label="Close chat">✕</button>
      `;
      header.appendChild(ctrls);

      const msgs = document.createElement('div');
      msgs.className = 'msgs';

      const sugg = document.createElement('div');
      sugg.className = 'sugg';
      (CFG.suggest || []).forEach(txt => {
        const c = document.createElement('button');
        c.className = 'chip';
        c.textContent = txt;
        c.addEventListener('click', () => { input.value = txt; sendMessage(); });
        sugg.appendChild(c);
      });

      const inputWrap = document.createElement('form');
      inputWrap.className = 'inp';
      inputWrap.setAttribute('aria-label', 'Message input');
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = CFG.placeholder;
      input.autocomplete = 'off';
      input.setAttribute('aria-label', 'Type your message');
      const sendBtn = document.createElement('button');
      sendBtn.type = 'submit';
      sendBtn.textContent = 'Send';
      inputWrap.appendChild(input);
      inputWrap.appendChild(sendBtn);

      panel.appendChild(header);
      panel.appendChild(msgs);
      panel.appendChild(sugg);
      panel.appendChild(inputWrap);

      root.appendChild(launcher);
      root.appendChild(panel);

      // ---------- Tealium tracking ----------
      const trackTealium = (event_name, data) => {
        try {
          const v = CFG.tealiumVendor;
          if (v && window[v] && typeof window[v].link === 'function') {
            window[v].link(Object.assign({
              event_name,
              event_category: 'chatbot',
              widget: 'chatbot-widget',
            }, data || {}));
          }
        } catch (e) { /* no-op */ }
      };

      // ---------- UI helpers ----------
      const addMsg = (text, who, meta) => {
        const b = document.createElement('div');
        b.className = `msg ${who}`;
        b.textContent = text;
        msgs.appendChild(b);
        if (meta && meta.latency) {
          const m = document.createElement('div');
          m.className = 'meta';
          m.textContent = `in ${meta.latency} ms`;
          msgs.appendChild(m);
        }
        msgs.scrollTop = msgs.scrollHeight;
      };

      const openPanel = () => {
        panel.classList.add('open');
        trackTealium('chat_open', { chat_session_id: sid });
        persist(); // save open state
      };
      const closePanel = () => {
        panel.classList.remove('open');
        trackTealium('chat_close', { chat_session_id: sid });
        persist(); // save closed state
      };
      launcher.addEventListener('click', openPanel);
      header.querySelector('.x').addEventListener('click', closePanel);

      // Use Profile toggle
      const useProfileInput = header.querySelector('#cbw_use_profile');

      // --- Tracking line (email / anonymous) ---
      const trackLine = header.querySelector('#cbw_track_line');
      const updateTracking = (explicitEmail) => {
        let txt = '';
        if (!CFG.useProfile) {
          txt = 'tracking as: anonymous';
        } else {
          const email = explicitEmail || (window.ChatbotParams && window.ChatbotParams.attributeValue) || '';
          txt = 'tracking as: ' + (email ? email : '—');
        }
        if (trackLine) trackLine.textContent = txt;
      };

      const syncUseProfile = (val) => {
        CFG.useProfile = !!val;
        window.ChatbotWidgetConfig.useProfile = CFG.useProfile;
        trackTealium('chat_toggle_use_profile', { chat_session_id: sid, use_profile: CFG.useProfile ? 'true' : 'false' });
        updateTracking();   // keep tracking line in sync
        persist(); // save setting
      };
      useProfileInput.addEventListener('change', () => syncUseProfile(useProfileInput.checked));

      // Listen for runtime email changes from TiQ (ChatbotSetEmail dispatches this)
      window.addEventListener('cbw:email', (e) => {
        const em = e && e.detail && e.detail.email;
        updateTracking(em);
      });

      // ---------- Backend bridge ----------
      async function backendSend(text) {
        const started = performance.now();
        if (CFG.apiMode === 'function' && window.ChatbotWidgetBridge && typeof window.ChatbotWidgetBridge.handleMessage === 'function') {
          const res = await window.ChatbotWidgetBridge.handleMessage(text, { history, chat_session_id: sid, useProfile: CFG.useProfile, isConcise: CFG.isConcise });
          const latency = Math.round(performance.now() - started);
          return { text: res && res.text ? res.text : '(no response)', meta: Object.assign({ latency }, res && res.meta ? res.meta : {}) };
        }
        const resp = await fetch(CFG.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history, chat_session_id: sid, useProfile: CFG.useProfile, isConcise: CFG.isConcise })
        });
        const data = await resp.json().catch(() => ({}));
        const latency = Math.round(performance.now() - started);
        return { text: data && data.text ? data.text : (data.message || '(no response)'), meta: Object.assign({ latency }, data && data.meta ? data.meta : {}) };
      }

      async function sendMessage() {
        const text = (input.value || '').trim();
        if (!text) return;
        input.value = '';
        addMsg(text, 'you');
        history.push({ role: 'user', content: text });
        persist(); // save after user message

        const typing = document.createElement('div');
        typing.className = 'msg bot';
        typing.textContent = '…';
        msgs.appendChild(typing);
        msgs.scrollTop = msgs.scrollHeight;

        try {
          const res = await backendSend(text);
          msgs.removeChild(typing);
          addMsg(res.text, 'bot', res.meta);
          history.push({ role: 'assistant', content: res.text, meta: res.meta });
          trackTealium('chat_message_bot', { chat_session_id: sid, latency_ms: res.meta && res.meta.latency, model: res.meta && res.meta.model });
          persist(); // save after bot message
        } catch (e) {
          msgs.removeChild(typing);
          const err = 'Sorry, something went wrong.';
          addMsg(err, 'bot');
          history.push({ role: 'assistant', content: err, error: true });
          trackTealium('chat_error', { chat_session_id: sid, error_message: String(e) });
          persist();
        }
      }
      inputWrap.addEventListener('submit', (e) => { e.preventDefault(); sendMessage(); });

      // ---------- Persistence wiring ----------
      const persist = () => {
        const snapshot = {
          sid,
          useProfile: CFG.useProfile,
          isConcise: CFG.isConcise,
          open: panel.classList.contains('open'),
          history: history.slice(-CFG.maxTurns)
        };
        saveState(snapshot);
      };

      // Restore state (history, settings, open state, session id)
      const restored = loadState();
      if (restored) {
        if (restored.sid) sid = restored.sid;
        if (typeof restored.useProfile !== 'undefined') {
          CFG.useProfile = !!restored.useProfile;
          window.ChatbotWidgetConfig.useProfile = CFG.useProfile;
          useProfileInput.checked = CFG.useProfile;
        }
        if (typeof restored.isConcise !== 'undefined') CFG.isConcise = !!restored.isConcise;
        if (Array.isArray(restored.history)) {
          history = restored.history;
          // Render prior transcript
          for (const turn of history) {
            const who = turn.role === 'user' ? 'you' : 'bot';
            addMsg(turn.content, who, turn.meta);
          }
        }
        // Re-open if previously open
        if (restored.open) openPanel();
      }

      // Initial “tracking as …” render
      updateTracking();

      // Save on visibility change / unload as a safety net
      window.addEventListener('beforeunload', persist);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') persist(); });

      // Expose programmatic controls
      window.ChatbotWidgetBridge = window.ChatbotWidgetBridge || {};
      window.ChatbotWidgetBridge.open = openPanel;
      window.ChatbotWidgetBridge.close = closePanel;

      console.log('[chatbot-widget] mounted v1.3a (with persistence + tracking line)');
    } catch (err) {
      console.error('[chatbot-widget] init error:', err);
    }
  });
})();

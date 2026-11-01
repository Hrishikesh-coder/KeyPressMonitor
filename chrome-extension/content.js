// KeyPressMonitor — Content Script & Draggable / Resizable Floating Mini HUD
// Captures real-time key presses across web pages (skipping password fields for privacy)
// and displays a sleek, freely draggable and resizable floating HUD with 1-click Reset, Sound, and Combo meter.

(function () {
  // Do not run content script inside the extension's own popup/dashboard pages
  if (typeof window !== 'undefined') {
    if (document.getElementById('viewDash') || (window.location && window.location.pathname && (window.location.pathname.endsWith('popup.html') || window.location.pathname.endsWith('index.html')))) {
      return;
    }
  }

  // Remove any stale HUD elements from previous extension reloads in this tab
  document.querySelectorAll('#kpm-floating-hud-host').forEach((el) => el.remove());

  if (window.__kpmCleanup) {
    try { window.__kpmCleanup(); } catch (_) {}
  }

  let hudHost = null;
  let hudRefs = {};
  let isTopFrame = false;
  try { isTopFrame = (window.self === window.top); } catch (_) { isTopFrame = false; }

  let hudLayout = {
    x: null,
    y: null,
    scale: 1.0,
    width: null,
    minimized: false
  };

  function saveLayout() {
    try {
      chrome.storage.local.set({ kpmHudLayout: hudLayout });
    } catch (_) {}
  }

  function applyLayout() {
    if (!hudHost || !hudRefs.box) return;
    if (typeof hudLayout.x === 'number' && typeof hudLayout.y === 'number') {
      const maxX = Math.max(40, window.innerWidth - 80);
      const maxY = Math.max(30, window.innerHeight - 40);
      const clampedX = Math.max(6, Math.min(maxX, hudLayout.x));
      const clampedY = Math.max(6, Math.min(maxY, hudLayout.y));
      hudHost.style.left = clampedX + 'px';
      hudHost.style.top = clampedY + 'px';
      hudHost.style.right = 'auto';
      hudHost.style.bottom = 'auto';
    } else {
      hudHost.style.right = '16px';
      hudHost.style.bottom = '16px';
      hudHost.style.left = 'auto';
      hudHost.style.top = 'auto';
    }

    const sc = Math.max(0.7, Math.min(1.8, hudLayout.scale || 1.0));
    hudRefs.box.style.zoom = String(sc);
    if (hudLayout.width && !hudLayout.minimized) {
      hudRefs.box.style.width = Math.max(260, Math.min(900, hudLayout.width)) + 'px';
    } else {
      hudRefs.box.style.width = 'auto';
    }
    hudRefs.box.classList.toggle('minimized', !!hudLayout.minimized);
  }

  function createHud() {
    if (!isTopFrame || hudHost || !document.body) return;
    document.querySelectorAll('#kpm-floating-hud-host').forEach((el) => el.remove());
    hudHost = document.createElement('div');
    hudHost.id = 'kpm-floating-hud-host';
    hudHost.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483647;font-family:Segoe UI,system-ui,sans-serif;user-select:none;touch-action:none;';
    const shadow = hudHost.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
      <style>
        .hud {
          position: relative;
          background: rgba(18, 23, 41, 0.94);
          backdrop-filter: blur(8px);
          border: 1px solid #2A3352;
          border-radius: 12px;
          padding: 7px 14px 7px 10px;
          color: #E2E8F0;
          box-shadow: 0 8px 28px rgba(0,0,0,0.48);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 12px;
          min-width: 72px;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .hud.dragging {
          border-color: #67E8F9;
          box-shadow: 0 12px 34px rgba(103, 232, 249, 0.25);
          cursor: grabbing !important;
        }
        .hud.hidden { display: none !important; }
        .hud.minimized .stats, .hud.minimized .last-key, .hud.minimized .resize-grip, .hud.minimized .hud-combo { display: none !important; }
        .drag-grip {
          cursor: grab;
          color: #64748B;
          font-size: 13px;
          line-height: 1;
          padding: 2px 3px;
          letter-spacing: -1px;
        }
        .drag-grip:hover { color: #67E8F9; }
        .brand {
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          padding-right: 6px;
          border-right: 1px solid #2A3352;
        }
        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ADE80;
          display: inline-block;
        }
        .dot.paused { background: #FACC15; }
        .stats {
          display: flex;
          align-items: center;
          gap: 9px;
          font-family: Consolas, monospace;
          font-size: 11.5px;
          flex-wrap: wrap;
          cursor: grab;
          flex: 1;
        }
        .stat { white-space: nowrap; }
        .stat b { font-weight: 700; margin-left: 2px; }
        .v-wpm { color: #C4B5FD; }
        .v-keys { color: #67E8F9; }
        .v-vow { color: #6EE7B7; }
        .v-con { color: #FCD34D; }
        .v-strk { color: #4ADE80; }
        .hud-combo {
          color: #FACC15;
          font-weight: 800;
          padding: 1px 5px;
          background: rgba(245, 158, 11, 0.2);
          border-radius: 4px;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }
        .last-key {
          background: #1C2238;
          border: 1px solid #2A3352;
          border-radius: 5px;
          padding: 1px 6px;
          font-family: Consolas, monospace;
          font-size: 11px;
          color: #67E8F9;
          font-weight: 700;
          min-width: 24px;
          text-align: center;
        }
        .actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        button {
          background: #1C2238;
          color: #E2E8F0;
          border: 1px solid #2A3352;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 11px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, border-color 0.15s;
        }
        button:hover { background: #2A3352; border-color: #67E8F9; color: #fff; }
        button.reset-btn:hover { background: #E11D48; border-color: #E11D48; }
        .resize-grip {
          position: absolute;
          right: 2px;
          bottom: 2px;
          width: 11px;
          height: 11px;
          cursor: nwse-resize;
          background: linear-gradient(135deg, transparent 50%, #64748B 50%, #64748B 65%, transparent 65%, transparent 80%, #67E8F9 80%);
          border-bottom-right-radius: 8px;
          opacity: 0.75;
        }
        .resize-grip:hover { opacity: 1; }
      </style>
      <div class="hud" id="hudBox" title="Drag anywhere to move • Scroll wheel to zoom • Drag corner to resize">
        <div class="drag-grip" id="dragGrip" title="Drag to move HUD anywhere on screen">⋮⋮</div>
        <div class="brand" id="btnBrand" title="Click to open Full Dashboard • Double-click to minimize">
          <span class="dot" id="hudDot"></span>
          <span>KP</span>
        </div>
        <div class="stats" id="hudStats">
          <span class="stat" title="Live Typing Speed (WPM)">WPM <b class="v-wpm" id="hWpm">0</b></span>
          <span class="stat" title="Total Keys Pressed">Keys <b class="v-keys" id="hKeys">0</b></span>
          <span class="stat" title="Vowels / Consonants">V/C <b class="v-vow" id="hVow">0</b>/<b class="v-con" id="hCon">0</b></span>
          <span class="stat" title="Current Error-Free Streak">Streak <b class="v-strk" id="hStrk">0</b></span>
          <span class="stat hud-combo" id="hCombo" style="display:none" title="Combo Multiplier">🔥 <b id="hComboTxt">10x</b></span>
        </div>
        <div class="last-key" id="hLast" title="Last Key Pressed">-</div>
        <div class="actions">
          <button id="btnSound" title="Toggle mechanical switch click sound">🔊</button>
          <button class="reset-btn" id="btnReset" title="Refresh / Clear all recorded stats (Reset to 0)">↻</button>
          <button id="btnPause" title="Pause / Resume tracking">⏸</button>
          <button id="btnOpenDash" title="Open Full Analytics Dashboard in new tab">⛶</button>
          <button id="btnMin" title="Minimize / Expand HUD">_</button>
        </div>
        <div class="resize-grip" id="resizeGrip" title="Drag to resize / scale HUD (double-click to reset size)"></div>
      </div>
    `;

    document.body.appendChild(hudHost);

    hudRefs = {
      box: shadow.getElementById('hudBox'),
      dot: shadow.getElementById('hudDot'),
      wpm: shadow.getElementById('hWpm'),
      keys: shadow.getElementById('hKeys'),
      vow: shadow.getElementById('hVow'),
      con: shadow.getElementById('hCon'),
      strk: shadow.getElementById('hStrk'),
      combo: shadow.getElementById('hCombo'),
      comboTxt: shadow.getElementById('hComboTxt'),
      last: shadow.getElementById('hLast'),
      btnSound: shadow.getElementById('btnSound'),
      btnPause: shadow.getElementById('btnPause'),
      btnMin: shadow.getElementById('btnMin'),
      btnOpenDash: shadow.getElementById('btnOpenDash'),
      btnBrand: shadow.getElementById('btnBrand'),
      resizeGrip: shadow.getElementById('resizeGrip')
    };

    // Load saved position & size
    try {
      chrome.storage.local.get(['kpmHudLayout'], (res) => {
        if (res && res.kpmHudLayout) {
          hudLayout = Object.assign(hudLayout, res.kpmHudLayout);
          applyLayout();
        }
      });
    } catch (_) {}

    // Dragging anywhere on the HUD bar (except buttons & resize handle)
    let isDragging = false;
    let dragOffX = 0;
    let dragOffY = 0;

    hudRefs.box.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'BUTTON' || e.target === hudRefs.resizeGrip) return;
      isDragging = true;
      const rect = hudHost.getBoundingClientRect();
      dragOffX = e.clientX - rect.left;
      dragOffY = e.clientY - rect.top;
      hudRefs.box.classList.add('dragging');
      e.preventDefault();
    });

    // Corner Resize / Scale handle
    let isResizing = false;
    let resizeStartX = 0;
    let resizeStartY = 0;
    let startWidth = 0;
    let startScale = 1.0;

    hudRefs.resizeGrip.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      isResizing = true;
      resizeStartX = e.clientX;
      resizeStartY = e.clientY;
      startWidth = hudRefs.box.getBoundingClientRect().width / (hudLayout.scale || 1.0);
      startScale = hudLayout.scale || 1.0;
    });

    hudRefs.resizeGrip.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      hudLayout.scale = 1.0;
      hudLayout.width = null;
      applyLayout();
      saveLayout();
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        hudLayout.x = Math.max(6, Math.min(window.innerWidth - 60, e.clientX - dragOffX));
        hudLayout.y = Math.max(6, Math.min(window.innerHeight - 36, e.clientY - dragOffY));
        applyLayout();
      } else if (isResizing) {
        const dx = e.clientX - resizeStartX;
        const dy = e.clientY - resizeStartY;
        hudLayout.width = Math.max(260, Math.min(900, Math.round(startWidth + dx)));
        hudLayout.scale = Math.max(0.75, Math.min(1.75, Number((startScale + dy * 0.004).toFixed(2))));
        applyLayout();
      }
    }, true);

    window.addEventListener('mouseup', () => {
      if (isDragging || isResizing) {
        isDragging = false;
        isResizing = false;
        if (hudRefs.box) hudRefs.box.classList.remove('dragging');
        saveLayout();
      }
    }, true);

    // Mouse wheel over HUD scales zoom smoothly
    hudRefs.box.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.06 : -0.06;
      hudLayout.scale = Math.max(0.75, Math.min(1.75, Number(((hudLayout.scale || 1.0) + delta).toFixed(2))));
      applyLayout();
      saveLayout();
    }, { passive: false });

    window.addEventListener('resize', applyLayout);

    // Minimize / Expand
    function toggleMinimize(e) {
      if (e) e.stopPropagation();
      hudLayout.minimized = !hudLayout.minimized;
      hudRefs.btnMin.textContent = hudLayout.minimized ? '□' : '_';
      applyLayout();
      saveLayout();
    }
    hudRefs.btnMin.addEventListener('click', toggleMinimize);
    hudRefs.btnBrand.addEventListener('dblclick', toggleMinimize);

    // Open Dashboard in Full Tab
    function openDashboard(e) {
      if (e) e.stopPropagation();
      try {
        chrome.runtime.sendMessage({ type: 'KPM_OPEN_DASH' });
      } catch (_) {}
    }
    hudRefs.btnOpenDash.addEventListener('click', openDashboard);
    hudRefs.btnBrand.addEventListener('click', (e) => {
      if (e.detail === 1) {
        // Single click: open dashboard
        setTimeout(() => { if (!hudLayout.minimized) openDashboard(e); }, 200);
      }
    });

    // Sound toggle directly from HUD
    hudRefs.btnSound.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        chrome.runtime.sendMessage({ type: 'KPM_GET_STATE' }, (res) => {
          const next = !(res && res.state && res.state.soundOn);
          chrome.runtime.sendMessage({ type: 'KPM_SET_PREFS', soundOn: next }, (r) => {
            if (r && r.state) updateHud(r.state);
          });
        });
      } catch (_) {}
    });

    shadow.getElementById('btnReset').addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        chrome.runtime.sendMessage({ type: 'KPM_RESET', clearAll: true }, (res) => {
          if (res && res.state) updateHud(res.state);
        });
      } catch (_) {}
    });

    shadow.getElementById('btnPause').addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        chrome.runtime.sendMessage({ type: 'KPM_TOGGLE_PAUSE' }, (res) => {
          if (res && res.state) updateHud(res.state);
        });
      } catch (_) {}
    });
  }

  function updateHud(s) {
    if (!isTopFrame) return;
    if (!hudHost) createHud();
    if (!hudRefs.box || !s) return;

    if (s.hudOn === false) {
      hudRefs.box.classList.add('hidden');
      return;
    }
    hudRefs.box.classList.remove('hidden');
    hudRefs.dot.className = 'dot' + (s.paused ? ' paused' : '');
    hudRefs.btnPause.textContent = s.paused ? '▶' : '⏸';
    hudRefs.btnSound.textContent = s.soundOn ? '🔊' : '🔇';
    hudRefs.wpm.textContent = s.wpmNow || 0;
    hudRefs.keys.textContent = s.totalKeys || 0;
    hudRefs.vow.textContent = s.vowels || 0;
    hudRefs.con.textContent = s.consonants || 0;
    hudRefs.strk.textContent = s.curStreak || 0;
    hudRefs.last.textContent = s.lastKeyName || '-';

    // Combo Pill in HUD
    if (hudRefs.combo && hudRefs.comboTxt) {
      const curStreak = s.curStreak || 0;
      if (curStreak >= 10 && !hudLayout.minimized) {
        hudRefs.combo.style.display = 'inline-block';
        let mult = '1.5x';
        if (curStreak >= 100) mult = '10x';
        else if (curStreak >= 50) mult = '5x';
        else if (curStreak >= 25) mult = '3x';
        else if (curStreak >= 15) mult = '2x';
        hudRefs.comboTxt.textContent = `${curStreak} (${mult})`;
      } else {
        hudRefs.combo.style.display = 'none';
      }
    }
  }

  // Initial state load
  if (isTopFrame) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createHud);
    } else {
      createHud();
    }
    try {
      chrome.runtime.sendMessage({ type: 'KPM_GET_STATE' }, (res) => {
        if (res && res.state) updateHud(res.state);
      });
    } catch (_) {}
  }

  // Listen to storage updates so HUD position, size & stats sync across tabs
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        if (changes.kpmState && changes.kpmState.newValue) {
          updateHud(changes.kpmState.newValue);
        }
        if (changes.kpmHudLayout && changes.kpmHudLayout.newValue) {
          hudLayout = Object.assign(hudLayout, changes.kpmHudLayout.newValue);
          applyLayout();
        }
      }
    });
  } catch (_) {}

  // Sensitive input detector for privacy & Chrome Web Store compliance
  function isSensitiveElement(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toUpperCase();
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return false;

    // Check type
    if (el.type === 'password' || el.type === 'hidden') return true;

    // Check autocomplete attribute
    const ac = (el.getAttribute('autocomplete') || '').toLowerCase();
    if (ac.includes('password') || ac.includes('cc-') || ac.includes('credit-card') || ac.includes('cvv') || ac.includes('security-code')) {
      return true;
    }

    // Check identifiers (name, id, placeholder, aria-label)
    const probe = `${el.name || ''} ${el.id || ''} ${el.placeholder || ''} ${el.getAttribute('aria-label') || ''}`.toLowerCase();
    const sensitiveTerms = ['password', 'passwd', 'pwd', 'secret', 'cvv', 'cvc', 'pin', 'ssn', 'creditcard', 'cardnumber', 'card-number'];
    for (const term of sensitiveTerms) {
      if (probe.includes(term)) return true;
    }
    return false;
  }

  // Capture keystrokes in real-time with duplicate-dispatch mitigation
  let lastContentKey = '';
  let lastContentTime = 0;
  let privacyMode = false;

  function onKeyDown(e) {
    try {
      // Hotkey: Ctrl + Shift + P toggles local Privacy Mode
      if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        privacyMode = !privacyMode;
        return;
      }
      if (privacyMode) return;

      if (e.isComposing) return;
      if (isSensitiveElement(e.target)) return;
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

      const now = Date.now();
      if (e.key === lastContentKey && (now - lastContentTime) < 25) return;
      lastContentKey = e.key;
      lastContentTime = now;

      chrome.runtime.sendMessage({
        type: 'KPM_KEY',
        payload: {
          key: e.key,
          code: e.code
        }
      }, (res) => {
        if (res && res.state) updateHud(res.state);
      });
    } catch (_) {
      // Extension context invalidated on reload — self-remove stale HUD and listener
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('compositionend', onCompositionEnd, true);
      if (hudHost) { hudHost.remove(); hudHost = null; }
    }
  }

  // Handle Indic / IME composition completions (Bengali, Hindi, etc.)
  function onCompositionEnd(e) {
    try {
      if (privacyMode || isSensitiveElement(e.target)) return;
      const text = e.data || '';
      if (!text) return;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        chrome.runtime.sendMessage({
          type: 'KPM_KEY',
          payload: {
            key: char,
            code: 'Indic'
          }
        }, (res) => {
          if (res && res.state) updateHud(res.state);
        });
      }
    } catch (_) {}
  }

  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('compositionend', onCompositionEnd, true);

  window.__kpmCleanup = () => {
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('compositionend', onCompositionEnd, true);
    if (hudHost) { hudHost.remove(); hudHost = null; }
  };
})();

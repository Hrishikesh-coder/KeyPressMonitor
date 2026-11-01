// KeyPressMonitor — Enhanced Interactive Dashboard, Arcade & Linguistics Suite

const KB_ROWS = [
  ['1','2','3','4','5','6','7','8','9','0','-','='],
  ['Q','W','E','R','T','Y','U','I','O','P','[',']'],
  ['A','S','D','F','G','H','J','K','L',';',"'"],
  ['Z','X','C','V','B','N','M',',','.','/']
];

const THEMES = ['midnight', 'cyberpunk', 'matrix', 'nord', 'dracula', 'synthwave', 'solarized', 'amber'];
const RANKS = ['NOVICE', 'TYPIST', 'PRO', 'MASTER', 'GRANDMASTER'];
const FINGER_NAMES = [
  'L-Pinky', 'L-Ring', 'L-Middle', 'L-Index',
  'R-Index', 'R-Middle', 'R-Ring', 'R-Pinky', 'Thumbs'
];
const ROW_NAMES = [
  'Number Row (1-0)', 'Top Row (QWERTY)', 'Home Row (ASDFG)', 'Bottom Row (ZXCV)', 'Space & Modifiers'
];

const TEST_SENTENCES = {
  STANDARD: [
    'the quick brown fox jumps over the lazy dog',
    'pack my box with five dozen liquor jugs',
    'sphinx of black quartz, judge my vow'
  ],
  QUOTES: [
    'assembly language gives you full control of the machine',
    'every keystroke is counted, classified and drawn in real time',
    'simplicity is prerequisite for reliability in software design'
  ],
  CODE: [
    'mov eax, [ebx+ecx*4] ; invoke WriteConsoleW, hOut, pBuf, n',
    'for (int i = 0; i < n; ++i) { freq[str[i]]++; total += 1; }',
    'const wpm = Math.round((chars / 5) / (elapsedMs / 60000));'
  ],
  NUMBERS: [
    '192.168.1.254:8080 #42 = 100% - $39.95 + (2026 / 4) * 7!',
    '0xFF00AA55 -> [256 * 4] = 1024 bytes @ 60fps (33.3ms/frame)',
    'key #1: 98.6%, key #2: 450ms, total = 1,234,567 (0x12D687)'
  ],
  PANGRAMS: [
    'the quick onyx goblin jumps over the lazy dwarf',
    'waltz, bad nymph, for quick jigs vex',
    'bright vixens jump; dozy fowl quack',
    'how vexingly quick daft zebras jump'
  ],
  DEV_WISDOM: [
    'there are only two hard things in Computer Science: cache invalidation and naming things',
    'premature optimization is the root of all evil in programming',
    'good code is its own best documentation as you write it'
  ],
  CUSTOM: [
    'practice typing with your own custom sentence or code snippet'
  ]
};
const MODE_KEYS = ['STANDARD', 'QUOTES', 'CODE', 'NUMBERS', 'PANGRAMS', 'DEV_WISDOM', 'CUSTOM'];

// English letter frequencies for Chi-Squared Caesar cipher cryptanalysis
const ENG_FREQ = {
  a: 0.0817, b: 0.0149, c: 0.0278, d: 0.0425, e: 0.1270, f: 0.0223, g: 0.0202,
  h: 0.0609, i: 0.0697, j: 0.0015, k: 0.0077, l: 0.0403, m: 0.0241, n: 0.0675,
  o: 0.0751, p: 0.0193, q: 0.0010, r: 0.0599, s: 0.0633, t: 0.0906, u: 0.0276,
  v: 0.0098, w: 0.0236, x: 0.0015, y: 0.0197, z: 0.0007
};

let curState = null;
let viewMode = 0; // 0=Dash, 1=Test, 2=Ergo, 3=Arcade, 4=Zen
let audioCtx = null;
let soundProfile = 'blue';
let soundVolume = 0.7;
let heatMode = 'freq'; // 'freq', 'fingers', 'errors'
let missedKeysMap = {};

// Ergonomic ANSI 10-Finger Color Map
const FINGER_MAP = {
  '1': { finger: 'L.Pinky', color: 'rgba(248, 113, 113, 0.45)' },
  'Q': { finger: 'L.Pinky', color: 'rgba(248, 113, 113, 0.45)' },
  'A': { finger: 'L.Pinky', color: 'rgba(248, 113, 113, 0.45)' },
  'Z': { finger: 'L.Pinky', color: 'rgba(248, 113, 113, 0.45)' },

  '2': { finger: 'L.Ring', color: 'rgba(251, 146, 60, 0.45)' },
  'W': { finger: 'L.Ring', color: 'rgba(251, 146, 60, 0.45)' },
  'S': { finger: 'L.Ring', color: 'rgba(251, 146, 60, 0.45)' },
  'X': { finger: 'L.Ring', color: 'rgba(251, 146, 60, 0.45)' },

  '3': { finger: 'L.Middle', color: 'rgba(250, 204, 21, 0.45)' },
  'E': { finger: 'L.Middle', color: 'rgba(250, 204, 21, 0.45)' },
  'D': { finger: 'L.Middle', color: 'rgba(250, 204, 21, 0.45)' },
  'C': { finger: 'L.Middle', color: 'rgba(250, 204, 21, 0.45)' },

  '4': { finger: 'L.Index', color: 'rgba(74, 222, 128, 0.45)' },
  '5': { finger: 'L.Index', color: 'rgba(74, 222, 128, 0.45)' },
  'R': { finger: 'L.Index', color: 'rgba(74, 222, 128, 0.45)' },
  'T': { finger: 'L.Index', color: 'rgba(74, 222, 128, 0.45)' },
  'F': { finger: 'L.Index', color: 'rgba(74, 222, 128, 0.45)' },
  'G': { finger: 'L.Index', color: 'rgba(74, 222, 128, 0.45)' },
  'V': { finger: 'L.Index', color: 'rgba(74, 222, 128, 0.45)' },
  'B': { finger: 'L.Index', color: 'rgba(74, 222, 128, 0.45)' },

  'SPC': { finger: 'Thumbs', color: 'rgba(56, 189, 248, 0.45)' },

  '6': { finger: 'R.Index', color: 'rgba(167, 139, 250, 0.45)' },
  '7': { finger: 'R.Index', color: 'rgba(167, 139, 250, 0.45)' },
  'Y': { finger: 'R.Index', color: 'rgba(167, 139, 250, 0.45)' },
  'U': { finger: 'R.Index', color: 'rgba(167, 139, 250, 0.45)' },
  'H': { finger: 'R.Index', color: 'rgba(167, 139, 250, 0.45)' },
  'J': { finger: 'R.Index', color: 'rgba(167, 139, 250, 0.45)' },
  'N': { finger: 'R.Index', color: 'rgba(167, 139, 250, 0.45)' },
  'M': { finger: 'R.Index', color: 'rgba(167, 139, 250, 0.45)' },

  '8': { finger: 'R.Middle', color: 'rgba(244, 114, 182, 0.45)' },
  'I': { finger: 'R.Middle', color: 'rgba(244, 114, 182, 0.45)' },
  'K': { finger: 'R.Middle', color: 'rgba(244, 114, 182, 0.45)' },
  ',': { finger: 'R.Middle', color: 'rgba(244, 114, 182, 0.45)' },

  '9': { finger: 'R.Ring', color: 'rgba(96, 165, 250, 0.45)' },
  'O': { finger: 'R.Ring', color: 'rgba(96, 165, 250, 0.45)' },
  'L': { finger: 'R.Ring', color: 'rgba(96, 165, 250, 0.45)' },
  '.': { finger: 'R.Ring', color: 'rgba(96, 165, 250, 0.45)' },

  '0': { finger: 'R.Pinky', color: 'rgba(192, 132, 252, 0.45)' },
  '-': { finger: 'R.Pinky', color: 'rgba(192, 132, 252, 0.45)' },
  '=': { finger: 'R.Pinky', color: 'rgba(192, 132, 252, 0.45)' },
  'P': { finger: 'R.Pinky', color: 'rgba(192, 132, 252, 0.45)' },
  '[': { finger: 'R.Pinky', color: 'rgba(192, 132, 252, 0.45)' },
  ']': { finger: 'R.Pinky', color: 'rgba(192, 132, 252, 0.45)' },
  ';': { finger: 'R.Pinky', color: 'rgba(192, 132, 252, 0.45)' },
  "'": { finger: 'R.Pinky', color: 'rgba(192, 132, 252, 0.45)' },
  '/': { finger: 'R.Pinky', color: 'rgba(192, 132, 252, 0.45)' }
};

// Resilient Web Audio context retrieval
function getAudioContext() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch (_) {}
  return audioCtx;
}

// Particle & Laser FX Engine
let fxParticles = [];
let fxBeams = [];
let fxAnimFrame = null;

function initFX() {
  const canvas = document.getElementById('fxCanvas');
  if (!canvas) return;
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function loop() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = fxParticles.length - 1; i >= 0; i--) {
      const p = fxParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0.12;
      p.alpha -= p.fade || 0.025;
      if (p.rot !== undefined) p.rot += p.vRot || 0.05;

      if (p.alpha <= 0) {
        fxParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      if (p.rot !== undefined) ctx.rotate(p.rot);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    for (let i = fxBeams.length - 1; i >= 0; i--) {
      const b = fxBeams[i];
      b.alpha -= b.fade || 0.07;
      if (b.alpha <= 0) {
        fxBeams.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, b.alpha);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width || 3;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.restore();
    }

    fxAnimFrame = requestAnimationFrame(loop);
  }
  loop();
}

function spawnLaserBeam(x1, y1, x2, y2, color = '#67E8F9') {
  fxBeams.push({
    x1, y1, x2, y2,
    color,
    alpha: 1.0,
    width: 3.5,
    fade: 0.07
  });
}

function spawnKeySparks(x, y, color = '#67E8F9') {
  for (let i = 0; i < 7; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3.5;
    fxParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      gravity: 0.15,
      alpha: 1.0,
      fade: 0.04 + Math.random() * 0.03,
      size: 2 + Math.random() * 2.5,
      color
    });
  }
}

function spawnConfetti() {
  const colors = ['#6EE7B7', '#FCD34D', '#67E8F9', '#C4B5FD', '#F472B6', '#FACC15', '#FF5555'];
  const w = window.innerWidth;
  for (let i = 0; i < 80; i++) {
    fxParticles.push({
      x: w / 2 + (Math.random() - 0.5) * 350,
      y: window.innerHeight * 0.35 + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 12,
      vy: -4 - Math.random() * 8,
      gravity: 0.22,
      rot: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 0.2,
      shape: 'rect',
      alpha: 1.0,
      fade: 0.012 + Math.random() * 0.015,
      size: 5 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

// Multi-Profile Mechanical Switch Sound Synthesizer with Volume Control & Dynamic Modulation
function playClickSound(keyChar) {
  if (!curState || !curState.soundOn || soundVolume <= 0) return;
  try {
    const eq = document.getElementById('audioEq');
    if (eq) {
      eq.classList.add('playing');
      clearTimeout(eq._timer);
      eq._timer = setTimeout(() => eq.classList.remove('playing'), 110);
    }

    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const code = (keyChar && keyChar.charCodeAt(0)) || 65;
    const masterVol = Math.max(0, Math.min(1, soundVolume));
    const jitter = 0.97 + Math.random() * 0.06;
    const comboPitch = (viewMode === 3 && typeof arcadeRunning !== 'undefined' && arcadeRunning) ? Math.min(1.8, 1 + (typeof arcadeCombo !== 'undefined' ? arcadeCombo * 0.08 : 0)) : 1;
    const pMod = jitter * comboPitch;

    if (soundProfile === 'blue') {
      // Crisp tactile mechanical click + bounce
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime((1800 + (code & 15) * 35) * pMod, t);
      osc.frequency.exponentialRampToValueAtTime(800 * pMod, t + 0.02);
      gain.gain.setValueAtTime(0.08 * masterVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.028);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.03);
    } else if (soundProfile === 'brown') {
      // Warm cushioned thud (thock)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime((320 + (code & 7) * 15) * pMod, t);
      osc.frequency.exponentialRampToValueAtTime(140 * pMod, t + 0.04);
      gain.gain.setValueAtTime(0.12 * masterVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (soundProfile === 'modelm') {
      // IBM Buckling Spring ping + clatter
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(1250 * pMod, t);
      gain1.gain.setValueAtTime(0.05 * masterVol, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.035);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(2400 * pMod, t);
      gain2.gain.setValueAtTime(0.03 * masterVol, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(t + 0.005);
      osc2.stop(t + 0.065);
    } else if (soundProfile === 'typewriter') {
      // Vintage typewriter clack, and Bell on Enter!
      if (keyChar === 'Enter') {
        const bell = ctx.createOscillator();
        const bGain = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(2100 * pMod, t);
        bGain.gain.setValueAtTime(0.15 * masterVol, t);
        bGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        bell.connect(bGain);
        bGain.connect(ctx.destination);
        bell.start(t);
        bell.stop(t + 0.55);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450 * pMod, t);
        osc.frequency.exponentialRampToValueAtTime(150 * pMod, t + 0.03);
        gain.gain.setValueAtTime(0.07 * masterVol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.04);
      }
    } else if (soundProfile === 'scifi') {
      // Sci-Fi Blaster chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400 * pMod, t);
      osc.frequency.exponentialRampToValueAtTime(350 * pMod, t + 0.035);
      gain.gain.setValueAtTime(0.06 * masterVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    }
  } catch (_) {}
}

function showToast(msg) {
  const el = document.getElementById('statusToast');
  if (el) el.textContent = msg;
}

function formatMMSS(sec) {
  const m = Math.min(99, Math.floor(sec / 60));
  const s = Math.floor(sec % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function heatColor(cnt, maxCnt) {
  if (!cnt || cnt <= 0) return 'var(--offkey)';
  const r = Math.min(1, cnt / Math.max(1, maxCnt));
  const stops = [
    [29, 78, 216],
    [6, 182, 212],
    [16, 185, 129],
    [250, 204, 21],
    [249, 115, 22],
    [225, 29, 72]
  ];
  const pos = r * (stops.length - 1);
  const idx = Math.min(stops.length - 2, Math.floor(pos));
  const f = pos - idx;
  const c1 = stops[idx], c2 = stops[idx + 1];
  const rgb = [
    Math.round(c1[0] + (c2[0] - c1[0]) * f),
    Math.round(c1[1] + (c2[1] - c1[1]) * f),
    Math.round(c1[2] + (c2[2] - c1[2]) * f)
  ];
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

// Initialize Interactive DOM structures for A-Z histogram and QWERTY keyboard
function initStaticDOM() {
  const histBars = document.getElementById('histBars');
  if (histBars) {
    histBars.innerHTML = '';
    for (let i = 0; i < 26; i++) {
      const ch = String.fromCharCode(65 + i);
      const isV = 'AEIOU'.includes(ch);
      const col = document.createElement('div');
      col.className = 'hbar-col';
      col.id = 'hcol_' + ch;
      col.innerHTML = `<div class="hbar-fill ${isV ? 'vowel' : 'cons'}" id="hbar_${i}" style="height:2px"></div><div class="hbar-lbl" id="hlbl_${i}">${ch}</div>`;

      // Interactive Histogram Bar Click: shows frequency details and highlights keyboard key
      col.addEventListener('click', (e) => {
        e.stopPropagation();
        const u = ch;
        const l = ch.toLowerCase();
        const count = (curState && curState.freq && ((curState.freq[u] || 0) + (curState.freq[l] || 0))) || 0;
        const letters = (curState && ((curState.vowels || 0) + (curState.consonants || 0))) || 1;
        const pct = Math.round((count * 100) / letters);
        showToast(`📊 Letter [${u}] · Count: ${count} (${pct}% of letters) · ${isV ? 'Vowel' : 'Consonant'}`);

        // Highlight matching keycap
        const cap = document.getElementById('kcap_' + u);
        if (cap) {
          cap.classList.add('ripple');
          setTimeout(() => cap.classList.remove('ripple'), 240);
        }
        playClickSound(u);
        const rect = col.getBoundingClientRect();
        spawnKeySparks(rect.left + rect.width / 2, rect.top + 10, isV ? 'var(--green)' : 'var(--amber)');
      });

      histBars.appendChild(col);
    }
  }

  const kbWrap = document.getElementById('kbWrap');
  if (kbWrap) {
    kbWrap.innerHTML = '';
    KB_ROWS.forEach((row) => {
      const rDiv = document.createElement('div');
      rDiv.className = 'kb-row';
      row.forEach((k) => {
        const cap = document.createElement('div');
        cap.className = 'keycap';
        cap.id = 'kcap_' + k;
        cap.textContent = k;

        // Interactive Keycap Click: plays switch sound, ripples, bursts sparks, and shows stats
        cap.addEventListener('click', (e) => {
          e.stopPropagation();
          playClickSound(k);
          cap.classList.add('ripple');
          setTimeout(() => cap.classList.remove('ripple'), 220);
          const rect = cap.getBoundingClientRect();
          spawnKeySparks(rect.left + rect.width / 2, rect.top + rect.height / 2, 'var(--cyan)');

          const count = (curState && curState.vkFreq && (curState.vkFreq[k] || curState.vkFreq[k.toLowerCase()])) || 0;
          const total = (curState && curState.totalKeys) || 1;
          const pct = Math.round((count * 100) / total);
          const fInfo = FINGER_MAP[k] ? ` · ✋ Finger: ${FINGER_MAP[k].finger}` : '';
          const errCount = missedKeysMap[k] ? ` · ⚠️ Errors: ${missedKeysMap[k]}` : '';
          showToast(`⌨️ Key [${k}] · Pressed: ${count} times (${pct}% of all keys)${fInfo}${errCount}`);
        });

        rDiv.appendChild(cap);
      });
      kbWrap.appendChild(rDiv);
    });

    const spRow = document.createElement('div');
    spRow.className = 'kb-row';
    const spCap = document.createElement('div');
    spCap.className = 'keycap space';
    spCap.id = 'kcap_SPC';
    spCap.textContent = 'SPACE';
    spCap.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickSound(' ');
      spCap.classList.add('ripple');
      setTimeout(() => spCap.classList.remove('ripple'), 220);
      const rect = spCap.getBoundingClientRect();
      spawnKeySparks(rect.left + rect.width / 2, rect.top + rect.height / 2, 'var(--cyan)');
      const count = (curState && curState.spaces) || 0;
      const spErr = missedKeysMap['SPC'] ? ` · ⚠️ Errors: ${missedKeysMap['SPC']}` : '';
      showToast(`⌨️ Key [SPACE] · Pressed: ${count} times · ✋ Finger: Thumbs${spErr}`);
    });
    spRow.appendChild(spCap);
    kbWrap.appendChild(spRow);
  }
}

function topEntries(obj, n = 5) {
  return Object.entries(obj || {})
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

// Expanded 12 Badges & Gamification
function computeXPAndBadges(s) {
  const xp = (s.totalKeys || 0) * 3 + (s.words || 0) * 10 + (s.bestStreak || 0) * 2;
  const level = 1 + Math.floor(xp / 250);
  const rank = RANKS[Math.min(RANKS.length - 1, level - 1)];
  const totH = Math.max(1, (s.leftHand || 0) + (s.rightHand || 0));
  const leftPct = Math.round(((s.leftHand || 0) * 100) / totH);

  const badges = [
    { name: 'First Steps (50+ keys)', ok: s.totalKeys >= 50 },
    { name: 'Centurion (100+ keys)', ok: s.totalKeys >= 100 },
    { name: 'Marathon Typist (500+ keys)', ok: s.totalKeys >= 500 },
    { name: 'Iron Typist (1,500+ keys)', ok: s.totalKeys >= 1500 },
    { name: 'Speed Demon (60+ Peak WPM)', ok: s.wpmPeak >= 60 },
    { name: 'Hyper Velocity (100+ Peak WPM)', ok: s.wpmPeak >= 100 },
    { name: 'Sonic Velocity (130+ Peak WPM)', ok: s.wpmPeak >= 130 },
    { name: 'Flawless Streak (100+ streak)', ok: s.bestStreak >= 100 },
    { name: 'Zen Master (250+ streak)', ok: s.bestStreak >= 250 },
    { name: 'Polyglot Coder (20+ digits/sym)', ok: (s.digits + s.symbols) >= 20 },
    { name: 'Ambidextrous (45-55% balance)', ok: s.totalKeys >= 100 && leftPct >= 45 && leftPct <= 55 },
    { name: 'Rhythm Virtuoso (<120ms latency)', ok: s.totalKeys >= 60 && s.avgLatMs > 0 && s.avgLatMs <= 120 }
  ];
  return { xp, level, rank, badges };
}

// Calculate Ergonomic Typing Strain Index (0 - 100%)
function computeStrainIndex(s) {
  if (!s || !s.totalKeys) return { score: 0, label: 'RELAXED', color: 'var(--green)' };
  const totH = Math.max(1, (s.leftHand || 0) + (s.rightHand || 0));
  const leftPct = Math.round(((s.leftHand || 0) * 100) / totH);
  const handImbalance = Math.abs(leftPct - 50);

  const activeMin = (s.activeMs || 0) / 60000;
  const timeFactor = Math.min(40, activeMin * 1.5);
  const speedFactor = Math.min(30, (s.wpmNow || 0) * 0.3);
  const balanceFactor = Math.min(30, handImbalance * 0.9);

  const strain = Math.min(100, Math.round(timeFactor + speedFactor + balanceFactor));
  let label = 'RELAXED';
  let color = 'var(--green)';

  if (strain >= 75) {
    label = 'FATIGUE ALERT';
    color = 'var(--red)';
  } else if (strain >= 50) {
    label = 'ELEVATED STRAIN';
    color = 'var(--amber)';
  } else if (strain >= 25) {
    label = 'NOMINAL';
    color = 'var(--cyan)';
  }

  return { score: strain, label, color };
}

function render(s) {
  curState = s;
  document.documentElement.setAttribute('data-theme', s.theme || 'midnight');
  document.getElementById('lblSound').textContent = s.soundOn ? 'Sound:On' : 'Sound:Off';
  const hudBtn = document.getElementById('lblHud');
  if (hudBtn) hudBtn.textContent = (s.hudOn !== false) ? 'HUD:On' : 'HUD:Off';

  const { xp, level, rank, badges } = computeXPAndBadges(s);
  document.getElementById('hdrLevel').textContent = 'LVL ' + level;
  document.getElementById('hdrRank').textContent = rank;

  // Dynamic Combo Multiplier Pill
  const comboPill = document.getElementById('hdrCombo');
  const comboTxt = document.getElementById('hdrComboTxt');
  if (comboPill && comboTxt) {
    const curStreak = s.curStreak || 0;
    if (curStreak >= 10) {
      comboPill.classList.remove('hidden');
      let mult = '1.5x';
      if (curStreak >= 100) mult = '10x GODLIKE';
      else if (curStreak >= 50) mult = '5x ULTRA';
      else if (curStreak >= 25) mult = '3x MEGA';
      else if (curStreak >= 15) mult = '2x COMBO';
      comboTxt.textContent = `${curStreak} STREAK · ${mult}`;
    } else {
      comboPill.classList.add('hidden');
    }
  }

  const stBadge = document.getElementById('hdrStatus');
  const stTxt = document.getElementById('hdrStatusTxt');
  if (s.paused) {
    stBadge.classList.add('paused');
    stTxt.textContent = 'PAUSED';
    document.getElementById('lblPause').textContent = 'Resume';
  } else {
    stBadge.classList.remove('paused');
    stTxt.textContent = 'LIVE';
    document.getElementById('lblPause').textContent = 'Pause';
  }

  const elapsedSec = Math.floor((Date.now() - (s.startTick || Date.now())) / 1000);
  document.getElementById('hdrTime').textContent = formatMMSS(elapsedSec);

  // Cards
  const letters = Math.max(1, s.vowels + s.consonants);
  document.getElementById('valVowels').textContent = s.vowels;
  document.getElementById('pctVowels').textContent = Math.round((s.vowels * 100) / letters);
  document.getElementById('valCons').textContent = s.consonants;
  document.getElementById('pctCons').textContent = Math.round((s.consonants * 100) / letters);
  document.getElementById('valTotal').textContent = s.totalKeys;
  document.getElementById('valWpm').textContent = s.wpmNow;
  document.getElementById('valPeak').textContent = s.wpmPeak;
  document.getElementById('valAvg').textContent = s.wpmAvg;

  // Chips & Mix Bar
  document.getElementById('chDigits').textContent = s.digits;
  document.getElementById('chSpaces').textContent = s.spaces;
  document.getElementById('chSymbols').textContent = s.symbols;
  document.getElementById('chOthers').textContent = s.others;
  document.getElementById('chWords').textContent = s.words;
  const elIndV = document.getElementById('chIndVow');
  if (elIndV) elIndV.textContent = s.indicVowels || 0;
  const elIndC = document.getElementById('chIndCons');
  if (elIndC) elIndC.textContent = s.indicConsonants || 0;
  const elIndM = document.getElementById('chIndMatras');
  if (elIndM) elIndM.textContent = s.indicMatras || 0;
  const vPct = (s.vowels + s.consonants) > 0 ? Math.round((s.vowels * 100) / letters) : 50;
  document.getElementById('mixV').style.width = vPct + '%';
  document.getElementById('mixC').style.width = (100 - vPct) + '%';

  // Last N Characters
  document.getElementById('valN').textContent = s.nView || 32;
  const lastNBox = document.getElementById('lastNBox');
  lastNBox.innerHTML = '';
  const slice = (s.lastChars || []).slice(-(s.nView || 32));
  slice.forEach((ch, idx) => {
    const sp = document.createElement('span');
    sp.className = 'char-cell' + (idx === slice.length - 1 ? ' newest' : '');
    sp.textContent = ch === ' ' ? '␣' : ch;
    lastNBox.appendChild(sp);
  });
  document.getElementById('valLastKey').textContent = s.lastKeyName || '-';
  document.getElementById('valLastAscii').textContent = s.lastKeyCode || 0;

  // A-Z Histogram
  let maxLet = 0;
  const letCounts = [];
  for (let i = 0; i < 26; i++) {
    const u = String.fromCharCode(65 + i);
    const l = String.fromCharCode(97 + i);
    const c = (s.freq[u] || 0) + (s.freq[l] || 0);
    letCounts.push(c);
    if (c > maxLet) maxLet = c;
  }
  document.getElementById('histMax').textContent = maxLet;
  for (let i = 0; i < 26; i++) {
    const bar = document.getElementById('hbar_' + i);
    const lbl = document.getElementById('hlbl_' + i);
    const h = maxLet > 0 ? Math.max(2, Math.round((letCounts[i] / maxLet) * 86)) : 2;
    if (bar) bar.style.height = h + 'px';
    if (lbl) {
      const active = (s.lastKeyName || '').toUpperCase() === String.fromCharCode(65 + i);
      lbl.className = 'hbar-lbl' + (active ? ' active' : '');
    }
  }

  // Keyboard Heatmap Mode Rendering (Frequency / Fingers / Missed Keys)
  const heatLegend = document.getElementById('heatLegend');
  if (heatMode === 'fingers') {
    if (heatLegend) heatLegend.textContent = '✋ Ergonomic Touch-Typing 10-Finger Map';
    KB_ROWS.flat().forEach((k) => {
      const cap = document.getElementById('kcap_' + k);
      if (!cap) return;
      const fInfo = FINGER_MAP[k];
      if (fInfo) {
        cap.style.background = fInfo.color;
        cap.style.color = '#fff';
        cap.style.boxShadow = `0 0 6px ${fInfo.color}`;
        cap.classList.add('finger-mode');
      } else {
        cap.style.background = 'var(--offkey)';
        cap.style.color = 'var(--muted)';
        cap.style.boxShadow = 'none';
        cap.classList.remove('finger-mode');
      }
    });
    const spCap = document.getElementById('kcap_SPC');
    if (spCap) {
      spCap.style.background = FINGER_MAP['SPC'].color;
      spCap.style.color = '#fff';
      spCap.style.boxShadow = `0 0 6px ${FINGER_MAP['SPC'].color}`;
    }
  } else if (heatMode === 'errors') {
    if (heatLegend) heatLegend.textContent = '⚠️ Typing Test Missed Keys Heatmap';
    const errValues = Object.values(missedKeysMap);
    const errMax = Math.max(1, ...errValues);
    KB_ROWS.flat().forEach((k) => {
      const cap = document.getElementById('kcap_' + k);
      if (!cap) return;
      const errCnt = missedKeysMap[k] || 0;
      if (errCnt > 0) {
        const alpha = 0.35 + (errCnt / errMax) * 0.65;
        cap.style.background = `rgba(239, 68, 68, ${alpha})`;
        cap.style.color = '#fff';
        cap.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.7)';
      } else {
        cap.style.background = 'var(--offkey)';
        cap.style.color = 'var(--muted)';
        cap.style.boxShadow = 'none';
      }
    });
    const spCap = document.getElementById('kcap_SPC');
    if (spCap) {
      const spErr = missedKeysMap['SPC'] || 0;
      if (spErr > 0) {
        spCap.style.background = 'rgba(239, 68, 68, 0.7)';
        spCap.style.color = '#fff';
        spCap.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.7)';
      } else {
        spCap.style.background = 'var(--offkey)';
        spCap.style.color = 'var(--muted)';
        spCap.style.boxShadow = 'none';
      }
    }
  } else {
    if (heatLegend) heatLegend.textContent = 'cold 🟦🟩🟨🟧🟥 hot';
    const vkValues = Object.values(s.vkFreq || {});
    const heatMax = Math.max(1, ...vkValues);
    KB_ROWS.flat().forEach((k) => {
      const cap = document.getElementById('kcap_' + k);
      if (!cap) return;
      const cnt = s.vkFreq[k] || 0;
      cap.style.background = heatColor(cnt, heatMax);
      cap.style.color = cnt > 0 ? '#fff' : 'var(--muted)';
      cap.style.boxShadow = 'none';
    });
    const spCap = document.getElementById('kcap_SPC');
    if (spCap) {
      const spCnt = s.vkFreq['SPC'] || s.vkFreq[' '] || 0;
      spCap.style.background = heatColor(spCnt, heatMax);
      spCap.style.color = spCnt > 0 ? '#fff' : 'var(--muted)';
      spCap.style.boxShadow = 'none';
    }
  }

  // WPM History SVG
  const hist = s.wpmHist || [];
  const wMax = Math.max(20, ...hist);
  document.getElementById('wpmHistMax').textContent = wMax;
  if (hist.length > 0) {
    const pts = hist.map((v, idx) => {
      const x = Math.round(((52 - hist.length + idx) / 51) * 520);
      const y = Math.round(58 - (v / wMax) * 52);
      return `${x},${y}`;
    });
    const startX = Math.round(((52 - hist.length) / 51) * 520);
    document.getElementById('wpmLine').setAttribute('points', pts.join(' '));
    document.getElementById('wpmArea').setAttribute('points', `${startX},60 ${pts.join(' ')} 520,60`);
  }

  // Top 5 Table
  const topK = topEntries(s.freq, 5);
  const topB = topEntries(s.bigrams, 5);
  const topT = topEntries(s.trigrams, 5);
  const tbody = document.getElementById('top5Body');
  tbody.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const k = topK[i] || ['-', ''];
    const b = topB[i] || ['-', ''];
    const t = topT[i] || ['-', ''];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color:var(--gold)">${i + 1}</td>
      <td style="color:var(--cyan)">${k[0]}</td><td class="num">${k[1]}</td>
      <td>${b[0]}</td><td class="num" style="color:var(--purp)">${b[1]}</td>
      <td>${t[0]}</td><td class="num" style="color:var(--green)">${t[1]}</td>
    `;
    tbody.appendChild(tr);
  }

  // Bottom Stats Strip
  const corrRate = s.totalKeys > 0 ? Math.round((s.bsCount * 100) / s.totalKeys) : 0;
  document.getElementById('stLongest').textContent = s.longestWord || 0;
  document.getElementById('stBs').textContent = s.bsCount || 0;
  document.getElementById('stErr').textContent = corrRate + '%';
  document.getElementById('stStreak').textContent = s.bestStreak || 0;
  document.getElementById('stLat').textContent = (s.avgLatMs || 0) + 'ms';

  // Biomechanics & Achievements View (View 2)
  const totH = Math.max(1, (s.leftHand || 0) + (s.rightHand || 0));
  document.getElementById('erLH').textContent = Math.round(((s.leftHand || 0) * 100) / totH) + '%';
  document.getElementById('erLHKeys').textContent = s.leftHand || 0;
  document.getElementById('erRH').textContent = Math.round(((s.rightHand || 0) * 100) / totH) + '%';
  document.getElementById('erRHKeys').textContent = s.rightHand || 0;
  document.getElementById('erAlt').textContent = s.handAlt || 0;
  document.getElementById('erAlt2').textContent = s.handAlt || 0;
  document.getElementById('erLat').textContent = s.avgLatMs || 0;
  document.getElementById('erMinLat').textContent = s.minLatMs || 0;
  document.getElementById('erStreak').textContent = s.curStreak || 0;
  document.getElementById('erBestStreak').textContent = s.bestStreak || 0;
  document.getElementById('erActiveTime').textContent = formatMMSS(Math.floor((s.activeMs || 0) / 1000));

  // Strain Index
  const strain = computeStrainIndex(s);
  const erStrainEl = document.getElementById('erStrain');
  const erStrainTxtEl = document.getElementById('erStrainTxt');
  if (erStrainEl) {
    erStrainEl.textContent = strain.score + '%';
    erStrainEl.style.color = strain.color;
  }
  if (erStrainTxtEl) {
    erStrainTxtEl.textContent = strain.label;
    erStrainTxtEl.style.color = strain.color;
  }

  const fBars = document.getElementById('fingerBars');
  fBars.innerHTML = '';
  FINGER_NAMES.forEach((name, idx) => {
    const cnt = (s.fingerCnt && s.fingerCnt[idx]) || 0;
    const pct = s.totalKeys > 0 ? Math.round((cnt * 100) / s.totalKeys) : 0;
    const col = idx < 4 ? 'var(--cyan)' : (idx < 8 ? 'var(--purp)' : 'var(--green)');
    fBars.innerHTML += `<div class="bar-row"><span class="bar-lbl">${name}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${col}"></div></div><span style="width:65px;text-align:right">${cnt} (${pct}%)</span></div>`;
  });

  const rBars = document.getElementById('rowBars');
  rBars.innerHTML = '';
  ROW_NAMES.forEach((name, idx) => {
    const cnt = (s.rowCnt && s.rowCnt[idx]) || 0;
    const pct = s.totalKeys > 0 ? Math.round((cnt * 100) / s.totalKeys) : 0;
    rBars.innerHTML += `<div class="bar-row"><span class="bar-lbl" style="width:130px">${name}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:var(--amber)"></div></div><span style="width:65px;text-align:right">${cnt} (${pct}%)</span></div>`;
  });

  const bGrid = document.getElementById('badgesGrid');
  bGrid.innerHTML = '';
  let unlockedCnt = 0;
  badges.forEach((b) => {
    if (b.ok) unlockedCnt++;
    bGrid.innerHTML += `<div class="badge-item ${b.ok ? 'unlocked' : 'locked'}"><span class="b-tag">${b.ok ? '[UNLOCKED]' : '[LOCKED]'}</span><span>${b.name}</span></div>`;
  });
  document.getElementById('erBadgeSummary').textContent = `${unlockedCnt} / ${badges.length} Unlocked`;
}

// Typing Test Logic
let ttModeIdx = 0;
let ttSentIdx = 0;
let ttTarget = TEST_SENTENCES.STANDARD[0];
let ttTyped = '';
let ttErrors = 0;
let ttKeys = 0;
let ttStart = 0;
let ttDone = false;

function resetTypingTest(nextSent = false) {
  const modeKey = MODE_KEYS[ttModeIdx];
  const list = TEST_SENTENCES[modeKey] || TEST_SENTENCES.STANDARD;
  if (nextSent) ttSentIdx = (ttSentIdx + 1) % list.length;
  ttTarget = list[ttSentIdx] || list[0] || 'the quick brown fox jumps over the lazy dog';
  ttTyped = '';
  ttErrors = 0;
  ttKeys = 0;
  ttStart = 0;
  ttDone = false;
  document.getElementById('ttModeName').textContent = modeKey;
  renderTypingTest();
}

function renderTypingTest() {
  const box = document.getElementById('ttSentence');
  box.innerHTML = '';
  let correct = 0;
  for (let i = 0; i < ttTarget.length; i++) {
    if (i === ttTyped.length && !ttDone) {
      const cur = document.createElement('span');
      cur.className = 'tt-cursor';
      box.appendChild(cur);
    }
    const sp = document.createElement('span');
    sp.className = 't-ch';
    sp.textContent = ttTarget[i];
    if (i < ttTyped.length) {
      if (ttTyped[i] === ttTarget[i]) {
        sp.classList.add('ok');
        correct++;
      } else {
        sp.classList.add('err');
      }
    } else if (i === ttTyped.length && !ttDone) {
      sp.classList.add('cur');
    }
    box.appendChild(sp);
  }
  if (ttTyped.length >= ttTarget.length && !ttDone) {
    const cur = document.createElement('span');
    cur.className = 'tt-cursor';
    box.appendChild(cur);
  }

  const pct = Math.round((ttTyped.length * 100) / Math.max(1, ttTarget.length));
  const progEl = document.getElementById('ttProg');
  if (progEl) progEl.style.width = pct + '%';

  const elapsedMs = ttStart > 0 ? Math.max(500, Date.now() - ttStart) : 0;
  const wpm = elapsedMs > 0 ? Math.round((correct * 12000) / elapsedMs) : 0;
  const acc = ttKeys > 0 ? Math.max(0, Math.round(((ttKeys - ttErrors) * 100) / ttKeys)) : 100;
  document.getElementById('ttWpm').textContent = wpm;
  document.getElementById('ttAcc').textContent = acc;
  document.getElementById('ttErr').textContent = ttErrors;
  document.getElementById('ttTime').textContent = Math.floor(elapsedMs / 1000);

  const accLiveEl = document.getElementById('ttAccLive');
  if (accLiveEl) accLiveEl.textContent = acc + '%';
  const progTxtEl = document.getElementById('ttProgTxt');
  if (progTxtEl) progTxtEl.textContent = `${ttTyped.length} / ${ttTarget.length} chars (${pct}%)`;
  const pacingEl = document.getElementById('ttPacing');
  if (pacingEl) pacingEl.textContent = wpm >= 65 ? '⚡ Blazing' : (wpm >= 40 ? '👍 Good' : (ttStart > 0 ? '🚶 Steady' : 'Ready'));

  if (curState) {
    document.getElementById('ttBest').textContent = curState.testBest || 0;
    document.getElementById('ttAllBest').textContent = curState.allTimeTestBest || 0;
  }
}

// Switch between the Views (0: Dash, 1: Test, 2: Ergo, 3: Arcade, 4: Zen, 5: Race)
function switchView(mode) {
  viewMode = mode;
  document.getElementById('viewDash').classList.toggle('hidden', mode !== 0);
  document.getElementById('viewTest').classList.toggle('hidden', mode !== 1);
  document.getElementById('viewErgo').classList.toggle('hidden', mode !== 2);
  document.getElementById('viewArcade').classList.toggle('hidden', mode !== 3);
  document.getElementById('viewZen').classList.toggle('hidden', mode !== 4);
  const viewRace = document.getElementById('viewRace');
  if (viewRace) viewRace.classList.toggle('hidden', mode !== 5);

  // Update Navigation Tab Buttons
  document.querySelectorAll('.nav-tab').forEach((t) => {
    const m = parseInt(t.getAttribute('data-view'), 10);
    t.classList.toggle('active', m === mode);
  });

  document.getElementById('lblTest').textContent = mode === 1 ? 'Dash' : 'Test';
  if (mode === 1) resetTypingTest(false);
  if (mode === 3 && !arcadeRunning) startArcadeGame();
  else if (mode !== 3 && arcadeRunning) stopArcadeGame(false);
  if (mode === 4) analyzeZenText();
}

// ==========================================
// VIEW 3: WORD BLITZ ARCADE GAME ENGINE
// ==========================================
let arcadeRunning = false;
let arcadeScore = 0;
let arcadeHighScore = 0;
let arcadeShields = 3;
let arcadeCombo = 1;
let arcadeStreak = 0;
let arcadeMaxCombo = 1;
let arcadeWordsCleared = 0;
let arcadeWave = 1;
let arcadeActiveWords = [];
let arcadeLastSpawn = 0;
let arcadeTargetWordId = null;

const ARCADE_VOCAB = {
  chill: [
    'cat', 'sun', 'sky', 'code', 'fast', 'play', 'game', 'type', 'wind', 'star',
    'moon', 'fire', 'glow', 'jump', 'blue', 'pink', 'cool', 'zen', 'rain', 'gold'
  ],
  speed: [
    'rocket', 'velocity', 'keyboard', 'terminal', 'cyberpunk', 'dashboard',
    'blazing', 'lightning', 'analytics', 'telemetry', 'hardware', 'assembly',
    'matrix', 'monitor', 'function', 'processor', 'overclock', 'quantum'
  ],
  hacker: [
    'syscall', 'register', 'pointer', 'interrupt', 'bytecode', 'pipeline',
    'overflow', 'payload', 'bitshift', 'debugger', 'deadlock', 'mutex',
    'semaphore', 'coroutine', 'virtual', 'heuristic', 'cryptography', 'memory'
  ]
};

let arcadePaused = false;
function pauseArcadeGame() {
  if (!arcadeRunning) return;
  arcadePaused = !arcadePaused;
  const btnPause = document.getElementById('btnArcadePause');
  const prompt = document.getElementById('arcadePrompt');
  if (arcadePaused) {
    if (btnPause) btnPause.innerHTML = '<span>▶ Resume</span>';
    if (prompt) {
      prompt.classList.remove('hidden');
      prompt.innerHTML = `
        <div style="font-size:22px;font-weight:800;color:var(--gold);margin-bottom:6px">GAME PAUSED</div>
        <div style="color:#fff;font-size:13px;margin-bottom:10px">Press 'Resume' or Esc to continue</div>
        <button class="pill-btn green" id="btnArcadeResumePrompt" style="padding:6px 16px;font-size:12px"><span>▶ Resume Game</span></button>
      `;
      const resBtn = document.getElementById('btnArcadeResumePrompt');
      if (resBtn) resBtn.addEventListener('click', pauseArcadeGame);
    }
    showToast('⏸️ Game paused');
  } else {
    if (btnPause) btnPause.innerHTML = '<span>⏸️ Pause</span>';
    if (prompt) prompt.classList.add('hidden');
    arcadeLastSpawn = Date.now();
    requestAnimationFrame(arcadeLoop);
    showToast('▶ Game resumed');
  }
}

function startArcadeGame() {
  arcadeRunning = true;
  arcadePaused = false;
  arcadeScore = 0;
  arcadeShields = 3;
  arcadeCombo = 1;
  arcadeStreak = 0;
  arcadeMaxCombo = 1;
  arcadeWordsCleared = 0;
  arcadeWave = 1;
  arcadeActiveWords = [];
  arcadeTargetWordId = null;

  const btnPause = document.getElementById('btnArcadePause');
  if (btnPause) {
    btnPause.style.display = 'inline-block';
    btnPause.innerHTML = '<span>⏸️ Pause</span>';
  }

  try {
    const savedHigh = localStorage.getItem('kpmArcadeHigh');
    if (savedHigh) arcadeHighScore = parseInt(savedHigh, 10) || 0;
  } catch (_) {}

  const prompt = document.getElementById('arcadePrompt');
  if (prompt) prompt.classList.add('hidden');
  updateArcadeUI();
  arcadeLoop();
}

function stopArcadeGame(isOver = true) {
  arcadeRunning = false;
  arcadePaused = false;
  const btnPause = document.getElementById('btnArcadePause');
  if (btnPause) btnPause.style.display = 'none';

  if (isOver) {
    if (arcadeScore > arcadeHighScore) {
      arcadeHighScore = arcadeScore;
      try { localStorage.setItem('kpmArcadeHigh', String(arcadeHighScore)); } catch (_) {}
      spawnConfetti();
      showToast(`🏆 NEW ARCADE HIGH SCORE: ${arcadeScore} POINTS!`);
    }
    const prompt = document.getElementById('arcadePrompt');
    if (prompt) {
      prompt.classList.remove('hidden');
      prompt.innerHTML = `
        <div style="font-size:22px;font-weight:800;color:var(--red);margin-bottom:6px">GAME OVER</div>
        <div style="color:#fff;font-size:14px;margin-bottom:8px">Final Score: <b>${arcadeScore}</b> · Words Cleared: <b>${arcadeWordsCleared}</b></div>
        <button class="pill-btn green" id="btnArcadeReplay" style="padding:6px 14px;font-size:12px"><span>Play Again</span></button>
      `;
      const replayBtn = document.getElementById('btnArcadeReplay');
      if (replayBtn) replayBtn.addEventListener('click', startArcadeGame);
    }
  }
}

function updateArcadeUI() {
  const sh = document.getElementById('arcShields');
  if (sh) sh.textContent = '❤️'.repeat(Math.max(0, arcadeShields));
  const sc = document.getElementById('arcScore');
  if (sc) sc.textContent = arcadeScore;
  const hi = document.getElementById('arcHighScore');
  if (hi) hi.textContent = arcadeHighScore;
  const cb = document.getElementById('arcCombo');
  if (cb) cb.textContent = arcadeCombo + 'x';
  const wc = document.getElementById('arcWords');
  if (wc) wc.textContent = arcadeWordsCleared;
  const mc = document.getElementById('arcMaxCombo');
  if (mc) mc.textContent = arcadeMaxCombo + 'x';
  const wv = document.getElementById('arcWave');
  if (wv) wv.textContent = arcadeWave;
}

function spawnArcadeWord() {
  const diff = document.getElementById('selArcadeDiff').value || 'speed';
  const list = ARCADE_VOCAB[diff] || ARCADE_VOCAB.speed;
  const text = list[Math.floor(Math.random() * list.length)];
  const arena = document.getElementById('arcadeArena');
  const arenaW = Math.max(300, arena.clientWidth || 700);

  const id = 'w_' + Math.random().toString(36).substring(2, 9);
  const el = document.createElement('div');
  el.className = 'falling-word';
  el.id = id;
  el.innerHTML = `<span class="matched"></span><span class="remaining">${text}</span>`;

  const spawnX = 20 + Math.random() * (arenaW - 140);
  el.style.left = spawnX + 'px';
  el.style.top = '-30px';
  arena.appendChild(el);

  const baseSpeed = diff === 'chill' ? 0.65 : (diff === 'speed' ? 1.05 : 1.35);
  arcadeActiveWords.push({
    id,
    text,
    typedLen: 0,
    x: spawnX,
    y: -30,
    speed: baseSpeed + (arcadeWave * 0.08),
    el
  });
}

function arcadeLoop() {
  if (!arcadeRunning || arcadePaused || viewMode !== 3) return;
  const now = Date.now();
  const diff = document.getElementById('selArcadeDiff').value || 'speed';
  const spawnRate = diff === 'chill' ? 2400 : (diff === 'speed' ? 1750 : 1300);

  if (now - arcadeLastSpawn > spawnRate && arcadeActiveWords.length < 7) {
    spawnArcadeWord();
    arcadeLastSpawn = now;
  }

  const arena = document.getElementById('arcadeArena');
  const arenaH = 280; // danger threshold
  for (let i = arcadeActiveWords.length - 1; i >= 0; i--) {
    const w = arcadeActiveWords[i];
    w.y += w.speed;
    w.el.style.top = w.y + 'px';

    if (w.y >= arenaH) {
      // Hit danger line -> shake arena and lose a shield!
      if (arena) {
        arena.classList.add('shake');
        setTimeout(() => arena.classList.remove('shake'), 350);
      }
      w.el.remove();
      arcadeActiveWords.splice(i, 1);
      if (arcadeTargetWordId === w.id) arcadeTargetWordId = null;

      arcadeShields--;
      arcadeCombo = 1;
      arcadeStreak = 0;
      updateArcadeUI();

      if (arcadeShields <= 0) {
        stopArcadeGame(true);
        return;
      }
    }
  }

  requestAnimationFrame(arcadeLoop);
}

function handleArcadeKey(key) {
  if (!arcadeRunning || arcadePaused || viewMode !== 3 || key.length !== 1) return;

  let target = arcadeActiveWords.find((w) => w.id === arcadeTargetWordId);
  if (!target) {
    target = arcadeActiveWords.find((w) => w.text[w.typedLen] === key.toLowerCase());
    if (target) {
      arcadeTargetWordId = target.id;
      arcadeActiveWords.forEach((w) => w.el.classList.remove('active-target'));
      target.el.classList.add('active-target');
    }
  }

  if (target && target.text[target.typedLen] === key.toLowerCase()) {
    target.typedLen++;
    const matched = target.text.slice(0, target.typedLen);
    const rem = target.text.slice(target.typedLen);
    target.el.innerHTML = `<span class="matched">${matched}</span><span class="remaining">${rem}</span>`;

    const rect = target.el.getBoundingClientRect();
    spawnKeySparks(rect.left + 15, rect.top + 10, 'var(--gold)');

    // Word destroyed!
    if (target.typedLen >= target.text.length) {
      spawnKeySparks(rect.left + rect.width / 2, rect.top, '#6EE7B7');
      const pts = target.text.length * 15 * arcadeCombo;

      const arena = document.getElementById('arcadeArena');
      if (arena) {
        const aRect = arena.getBoundingClientRect();
        const startX = aRect.left + aRect.width / 2;
        const startY = aRect.bottom - 15;
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;
        spawnLaserBeam(startX, startY, targetX, targetY, 'var(--cyan)');

        // Floating score animation
        const floatEl = document.createElement('div');
        floatEl.className = 'floating-score';
        floatEl.textContent = `+${pts} (${arcadeCombo}x)`;
        floatEl.style.left = (target.x + 20) + 'px';
        floatEl.style.top = (target.y + 10) + 'px';
        arena.appendChild(floatEl);
        setTimeout(() => floatEl.remove(), 850);
      }

      target.el.remove();
      arcadeActiveWords = arcadeActiveWords.filter((w) => w.id !== target.id);
      arcadeTargetWordId = null;

      arcadeWordsCleared++;
      arcadeStreak++;
      if (arcadeStreak % 5 === 0) arcadeCombo = Math.min(10, arcadeCombo + 1);
      if (arcadeCombo > arcadeMaxCombo) arcadeMaxCombo = arcadeCombo;

      arcadeScore += pts;
      if (arcadeWordsCleared % 10 === 0) {
        arcadeWave++;
        spawnConfetti();
        showToast(`⚡ WAVE ${arcadeWave} CLEARED! Speed increasing!`);
      }
      updateArcadeUI();
    }
  }
}

// ==========================================
// VIEW 4: ZEN SCRATCHPAD & LINGUISTICS LAB
// ==========================================
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function analyzeZenText() {
  const text = (document.getElementById('zenEditor').value || '').trim();
  const charCount = text.length;
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const sentences = text ? (text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text]).length : 1;

  let totalSyllables = 0;
  words.forEach((w) => { totalSyllables += countSyllables(w); });

  // Flesch Reading Ease
  let flesch = 100;
  let grade = 1.0;
  if (wordCount >= 3) {
    const asl = wordCount / Math.max(1, sentences);
    const asw = totalSyllables / Math.max(1, wordCount);
    flesch = Math.max(0, Math.min(100, Math.round(206.835 - (1.015 * asl) - (84.6 * asw))));
    grade = Math.max(1, Math.min(18, Math.round((0.39 * asl + 11.8 * asw - 15.59) * 10) / 10));
  }

  let verdict = 'Very Easy (Elementary)';
  if (flesch < 30) verdict = 'Very Confusing (Graduate)';
  else if (flesch < 50) verdict = 'Difficult (College)';
  else if (flesch < 60) verdict = 'Fairly Difficult (High School)';
  else if (flesch < 70) verdict = 'Plain English (8th-9th Grade)';
  else if (flesch < 80) verdict = 'Fairly Easy (7th Grade)';
  else if (flesch < 90) verdict = 'Easy (6th Grade)';

  // Shannon Entropy
  let entropy = 0;
  if (charCount > 0) {
    const counts = {};
    for (const ch of text) counts[ch] = (counts[ch] || 0) + 1;
    for (const cnt of Object.values(counts)) {
      const p = cnt / charCount;
      entropy -= p * Math.log2(p);
    }
  }

  // Lexical Diversity (Type-Token Ratio)
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ''))).size;
  const ttr = wordCount > 0 ? Math.round((uniqueWords * 100) / wordCount) : 100;

  document.getElementById('zenCharCount').textContent = charCount;
  document.getElementById('zenWordCount').textContent = wordCount;
  document.getElementById('zenSentCount').textContent = sentences;
  document.getElementById('zenSyllCount').textContent = totalSyllables;
  document.getElementById('zenFleschScore').textContent = flesch;
  document.getElementById('zenFleschVerdict').textContent = verdict;
  document.getElementById('zenGradeLevel').textContent = grade.toFixed(1);
  document.getElementById('zenEntropy').textContent = entropy.toFixed(2);
  document.getElementById('zenEntropyVerdict').textContent = entropy > 4.5 ? 'High Randomness' : (entropy < 3.2 ? 'Repetitive' : 'Natural Text');
  document.getElementById('zenTTR').textContent = ttr + '%';

  // Read and Speech Times
  const readSec = Math.round((wordCount / 200) * 60);
  const speakSec = Math.round((wordCount / 130) * 60);
  document.getElementById('zenReadTime').textContent = readSec < 60 ? readSec + 's' : Math.round(readSec / 60) + 'm';
  document.getElementById('zenSpeakTime').textContent = speakSec < 60 ? speakSec + 's' : Math.round(speakSec / 60) + 'm';

  evaluateCaesarDecryption(text);
}

function evaluateCaesarDecryption(text) {
  const letters = text.toLowerCase().replace(/[^a-z]/g, '');
  if (letters.length < 8) {
    document.getElementById('zenRotDetected').textContent = 'Auto: Need >8 letters';
    document.getElementById('zenChiScore').textContent = 'Chi-Squared: -';
    applyCaesarShift(parseInt(document.getElementById('zenRotSlider').value, 10) || 0);
    return;
  }

  let bestShift = 0;
  let minChi = Infinity;

  for (let shift = 0; shift < 26; shift++) {
    const rotated = {};
    for (const ch of letters) {
      const code = ((ch.charCodeAt(0) - 97 - shift + 26) % 26);
      const decCh = String.fromCharCode(97 + code);
      rotated[decCh] = (rotated[decCh] || 0) + 1;
    }

    let chi = 0;
    for (let c = 0; c < 26; c++) {
      const ch = String.fromCharCode(97 + c);
      const obs = rotated[ch] || 0;
      const exp = letters.length * (ENG_FREQ[ch] || 0.01);
      chi += ((obs - exp) ** 2) / exp;
    }

    if (chi < minChi) {
      minChi = chi;
      bestShift = shift;
    }
  }

  const chiScore = Math.round(minChi * 10) / 10;
  document.getElementById('zenRotDetected').textContent = `Best: ROT ${bestShift} (Chi: ${chiScore})`;
  document.getElementById('zenChiScore').textContent = `Chi-Squared: ${chiScore}`;

  const curSliderVal = parseInt(document.getElementById('zenRotSlider').value, 10) || 0;
  applyCaesarShift(curSliderVal);
}

function applyCaesarShift(shift) {
  const text = document.getElementById('zenEditor').value || '';
  document.getElementById('zenRotVal').textContent = `ROT ${shift}`;
  let out = '';
  for (const ch of text) {
    const isUpper = ch >= 'A' && ch <= 'Z';
    const isLower = ch >= 'a' && ch <= 'z';
    if (isLower) {
      out += String.fromCharCode(97 + ((ch.charCodeAt(0) - 97 - shift + 26) % 26));
    } else if (isUpper) {
      out += String.fromCharCode(65 + ((ch.charCodeAt(0) - 65 - shift + 26) % 26));
    } else {
      out += ch;
    }
  }
  document.getElementById('zenDecodedPreview').textContent = out || 'Decoded text will appear here...';
}

// Export HTML, CSV and JSON reports with Blob URL cleanup to prevent memory leaks
function exportReports() {
  if (!curState) return;
  const s = curState;
  const jsonBlob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
  const jsonUrl = URL.createObjectURL(jsonBlob);
  const a1 = document.createElement('a');
  a1.href = jsonUrl;
  a1.download = 'KeyReport.json';
  a1.click();
  setTimeout(() => URL.revokeObjectURL(jsonUrl), 1500);

  let csv = 'metric,value\r\n';
  csv += `Total keys,${s.totalKeys}\r\nVowels,${s.vowels}\r\nConsonants,${s.consonants}\r\nWords,${s.words}\r\nPeak WPM,${s.wpmPeak}\r\nAverage WPM,${s.wpmAvg}\r\nAvg Latency ms,${s.avgLatMs}\r\nBest Streak,${s.bestStreak}\r\n\r\nkey,count\r\n`;
  Object.entries(s.freq || {}).forEach(([k, v]) => { csv += `"${k}",${v}\r\n`; });
  const csvBlob = new Blob([csv], { type: 'text/csv' });
  const a2 = document.createElement('a');
  const csvUrl = URL.createObjectURL(csvBlob);
  a2.href = csvUrl;
  a2.download = 'KeyReport.csv';
  a2.click();
  setTimeout(() => URL.revokeObjectURL(csvUrl), 1500);

  showToast('✓ Exported KeyReport.json and KeyReport.csv');
}

// Resilient messaging helper
function safeSendMessage(msg, callback) {
  try {
    if (window.chrome && window.chrome.runtime && window.chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(msg, (res) => {
        if (chrome.runtime.lastError) {
          // Extension context may have been invalidated or service worker restarting
          if (typeof callback === 'function') callback(null);
          return;
        }
        if (typeof callback === 'function') callback(res);
      });
    } else {
      if (typeof callback === 'function') callback(null);
    }
  } catch (_) {
    if (typeof callback === 'function') callback(null);
  }
}

// ==========================================
// VIEW 5: MULTIPLAYER RACE & COMPETITION
// ==========================================
let raceTargetText = 'The quick brown fox jumps over the lazy dog.';
let raceStartTime = 0;
let raceDone = false;
let raceBotTimer = null;
let raceChannel = null;
let raceOppProgress = 0;

function initMultiplayerRace() {
  const pNameInput = document.getElementById('racePlayerName');
  const rCodeInput = document.getElementById('raceRoomCode');
  const btnJoin = document.getElementById('btnJoinRace');
  const btnGhost = document.getElementById('btnGhostRace');
  const inputEl = document.getElementById('raceInputBox');
  const sentEl = document.getElementById('raceSentenceText');
  const myProgEl = document.getElementById('raceMyProgress');
  const oppProgEl = document.getElementById('raceOppProgress');
  const myWpmEl = document.getElementById('raceMyWpm');
  const oppWpmEl = document.getElementById('raceOppWpm');
  const myAccEl = document.getElementById('raceMyAcc');
  const oppAccEl = document.getElementById('raceOppAcc');
  const myNameEl = document.getElementById('raceMyName');
  const oppNameEl = document.getElementById('raceOppName');
  const statusEl = document.getElementById('raceStatusMsg');

  if (!btnGhost || !inputEl) return;

  function resetRaceState(targetText, oppLabel) {
    if (raceBotTimer) clearInterval(raceBotTimer);
    raceTargetText = targetText;
    sentEl.textContent = raceTargetText;
    inputEl.value = '';
    inputEl.disabled = false;
    inputEl.focus();
    raceDone = false;
    raceStartTime = 0;
    raceOppProgress = 0;
    if (myProgEl) myProgEl.style.width = '0%';
    if (oppProgEl) oppProgEl.style.width = '0%';
    if (myWpmEl) myWpmEl.textContent = '0 WPM';
    if (oppWpmEl) oppWpmEl.textContent = '0 WPM';
    if (myAccEl) myAccEl.textContent = '100%';
    if (oppAccEl) oppAccEl.textContent = '98%';
    if (myNameEl) myNameEl.textContent = (pNameInput.value.trim() || 'Player 1');
    if (oppNameEl) oppNameEl.textContent = oppLabel || 'Cyber Ghost';
    if (statusEl) statusEl.textContent = '⚡ Race is LIVE! Start typing the sentence above!';
  }

  // Ghost / Bot race
  btnGhost.addEventListener('click', () => {
    const sents = TEST_SENTENCES.STANDARD;
    const chosen = sents[Math.floor(Math.random() * sents.length)] || raceTargetText;
    resetRaceState(chosen, 'Cyber Ghost (MASM Bot)');

    // Start bot progression at ~65 WPM with slight random variance
    const botCharsPerSec = 5.5; // ~66 WPM
    const botStepInterval = 120;
    let botCharsTyped = 0;

    raceBotTimer = setInterval(() => {
      if (raceDone) {
        clearInterval(raceBotTimer);
        return;
      }
      if (raceStartTime > 0) {
        botCharsTyped += (botCharsPerSec * (botStepInterval / 1000)) * (0.85 + Math.random() * 0.3);
        const botPct = Math.min(100, Math.round((botCharsTyped / raceTargetText.length) * 100));
        raceOppProgress = botPct;
        if (oppProgEl) oppProgEl.style.width = botPct + '%';
        const elapsedSec = Math.max(1, (Date.now() - raceStartTime) / 1000);
        const botWpm = Math.round((botCharsTyped / 5) / (elapsedSec / 60));
        if (oppWpmEl) oppWpmEl.textContent = botWpm + ' WPM';

        if (botPct >= 100 && !raceDone) {
          raceDone = true;
          clearInterval(raceBotTimer);
          inputEl.disabled = true;
          if (statusEl) {
            statusEl.innerHTML = '<span style="color:var(--amber)">🤖 Cyber Ghost finished first! Keep practicing!</span>';
          }
        }
      }
    }, botStepInterval);
  });

  // Room Join via BroadcastChannel for multi-tab / peer racing
  btnJoin.addEventListener('click', () => {
    const room = (rCodeInput.value || '').trim().toUpperCase();
    if (!room) {
      showToast('⚠️ Please enter a room code');
      return;
    }
    const myName = (pNameInput.value || 'Player').trim();
    if (raceChannel) raceChannel.close();
    raceChannel = new BroadcastChannel('kpm_room_' + room);

    resetRaceState(raceTargetText, `Opponent [${room}]`);
    if (statusEl) statusEl.textContent = `Connected to Room [${room}] as ${myName}! Type to compete!`;

    raceChannel.onmessage = (e) => {
      const data = e.data;
      if (!data || data.sender === myName) return;
      if (data.type === 'PROGRESS') {
        if (oppNameEl) oppNameEl.textContent = data.sender;
        if (oppProgEl) oppProgEl.style.width = data.progress + '%';
        if (oppWpmEl) oppWpmEl.textContent = data.wpm + ' WPM';
        if (oppAccEl) oppAccEl.textContent = data.acc + '%';
        if (data.progress >= 100 && !raceDone) {
          raceDone = true;
          inputEl.disabled = true;
          if (statusEl) statusEl.innerHTML = `<span style="color:var(--amber)">🏆 ${data.sender} won the race!</span>`;
        }
      }
    };
  });

  // Input typing evaluation
  inputEl.addEventListener('input', () => {
    if (raceDone) return;
    if (raceStartTime === 0) raceStartTime = Date.now();

    const val = inputEl.value;
    const target = raceTargetText;
    let errors = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== target[i]) errors++;
    }

    const elapsedSec = Math.max(0.5, (Date.now() - raceStartTime) / 1000);
    const correctChars = Math.max(0, val.length - errors);
    const wpm = Math.round((correctChars / 5) / (elapsedSec / 60));
    const acc = val.length > 0 ? Math.max(0, Math.round(((val.length - errors) * 100) / val.length)) : 100;
    const progress = Math.min(100, Math.round((val.length / target.length) * 100));

    if (myProgEl) myProgEl.style.width = progress + '%';
    if (myWpmEl) myWpmEl.textContent = wpm + ' WPM';
    if (myAccEl) myAccEl.textContent = acc + '%';

    // Broadcast update to room
    if (raceChannel) {
      raceChannel.postMessage({
        type: 'PROGRESS',
        sender: pNameInput.value.trim() || 'Player 1',
        progress,
        wpm,
        acc
      });
    }

    // Check victory
    if (val === target) {
      raceDone = true;
      if (raceBotTimer) clearInterval(raceBotTimer);
      inputEl.disabled = true;
      if (statusEl) statusEl.innerHTML = '<span style="color:var(--green)">🏆 VICTORY! You finished the race first!</span>';
      spawnKeySparks(window.innerWidth / 2, window.innerHeight / 2, 'var(--gold)');
      showToast('🎉 Race Completed! First Place!');
    }
  });
}

// ==========================================
// MASM JSON REPORT IMPORT ENGINE
// ==========================================
function initMasmImport() {
  const fileInput = document.getElementById('fileMasmImport');
  const btnImport = document.getElementById('btnImportMasm');
  if (!btnImport || !fileInput) return;

  btnImport.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!json || typeof json.totalKeys === 'undefined') {
          showToast('⚠️ Invalid KeyReport.json structure');
          return;
        }

        safeSendMessage({ type: 'KPM_GET_STATE' }, (res) => {
          const s = (res && res.state) || curState || {};
          s.totalKeys = json.totalKeys || s.totalKeys;
          s.vowels = json.vowels || s.vowels;
          s.consonants = json.consonants || s.consonants;
          s.words = json.words || s.words;
          s.wpmPeak = Math.max(s.wpmPeak || 0, json.peakWpm || 0);
          s.wpmAvg = json.avgWpm || s.wpmAvg;
          s.avgLatMs = json.avgLatencyMs || s.avgLatMs;
          s.bestStreak = Math.max(s.bestStreak || 0, json.bestStreak || 0);
          s.leftHand = json.leftHand || s.leftHand;
          s.rightHand = json.rightHand || s.rightHand;

          safeSendMessage({ type: 'KPM_SET_PREFS', importedState: s }, (r) => {
            if (r && r.state) render(r.state);
            showToast('✓ Successfully imported MASM KeyReport.json (v' + (json.schemaVersion || 1) + ')');
            spawnKeySparks(window.innerWidth / 2, window.innerHeight / 2, 'var(--cyan)');
          });
        });
      } catch (err) {
        showToast('⚠️ Failed to parse MASM JSON file');
      }
    };
    reader.readAsText(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initStaticDOM();
  initFX();
  resetTypingTest(false);
  initMultiplayerRace();
  initMasmImport();

  // If running as a standalone web app (e.g. on Render), show the "Get Chrome Extension (.zip)" button
  const isRealExtension = !!(window.chrome && window.chrome.runtime && window.chrome.runtime.id);
  const dlBtn = document.getElementById('btnDownloadExt');
  if (dlBtn && !isRealExtension) {
    dlBtn.style.display = 'inline-flex';
  }

  // Load sound profile preference
  try {
    const savedProf = localStorage.getItem('kpmSoundProfile');
    if (savedProf) {
      soundProfile = savedProf;
      const sel = document.getElementById('selSoundProfile');
      if (sel) sel.value = savedProf;
    }
  } catch (_) {}

  const selProf = document.getElementById('selSoundProfile');
  if (selProf) {
    selProf.addEventListener('change', (e) => {
      soundProfile = e.target.value;
      try { localStorage.setItem('kpmSoundProfile', soundProfile); } catch (_) {}
      getAudioContext();
      playClickSound('A');
      showToast('✓ Switch: ' + selProf.options[selProf.selectedIndex].text);
    });
  }

  // Volume Slider & Mute Toggle
  const rngVol = document.getElementById('rngVolume');
  const volIcon = document.getElementById('volIcon');
  if (rngVol) {
    try {
      const savedVol = localStorage.getItem('kpmVolume');
      if (savedVol !== null) {
        soundVolume = parseFloat(savedVol);
        rngVol.value = Math.round(soundVolume * 100);
      }
    } catch (_) {}

    rngVol.addEventListener('input', (e) => {
      soundVolume = Math.max(0, Math.min(1, parseInt(e.target.value, 10) / 100));
      try { localStorage.setItem('kpmVolume', String(soundVolume)); } catch (_) {}
      if (volIcon) volIcon.textContent = soundVolume === 0 ? '🔇' : (soundVolume < 0.4 ? '🔉' : '🔊');
    });
    rngVol.addEventListener('change', () => {
      getAudioContext();
      playClickSound('A');
    });
  }

  if (volIcon) {
    volIcon.addEventListener('click', () => {
      if (soundVolume > 0) {
        soundVolume = 0;
        rngVol.value = 0;
        volIcon.textContent = '🔇';
        showToast('🔇 Sound muted');
      } else {
        soundVolume = 0.7;
        rngVol.value = 70;
        volIcon.textContent = '🔊';
        showToast('🔊 Sound unmuted');
        getAudioContext();
        playClickSound('A');
      }
      try { localStorage.setItem('kpmVolume', String(soundVolume)); } catch (_) {}
    });
  }

  safeSendMessage({ type: 'KPM_GET_STATE' }, (res) => {
    if (res && res.state) render(res.state);
  });

  setInterval(() => {
    safeSendMessage({ type: 'KPM_GET_STATE' }, (res) => {
      if (res && res.state) render(res.state);
    });
    if (viewMode === 1 && ttStart > 0 && !ttDone) renderTypingTest();
  }, 300);

  // View Navigation Tabs
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      if (e.currentTarget) e.currentTarget.blur();
      const mode = parseInt(tab.getAttribute('data-view'), 10);
      switchView(mode);
    });
  });

  // Buttons
  function doResetAll() {
    safeSendMessage({ type: 'KPM_RESET', clearAll: true }, (res) => {
      if (res && res.state) render(res.state);
      resetTypingTest(false);
      showToast('✓ All records refreshed & cleared to 0');
    });
  }

  document.getElementById('btnReset').addEventListener('click', doResetAll);
  const hdrReset = document.getElementById('btnHeaderReset');
  if (hdrReset) hdrReset.addEventListener('click', doResetAll);

  const hudToggle = document.getElementById('btnHud');
  if (hudToggle) {
    hudToggle.addEventListener('click', () => {
      const next = (curState && curState.hudOn === false) ? true : false;
      safeSendMessage({ type: 'KPM_SET_PREFS', hudOn: next }, (res) => {
        if (res && res.state) render(res.state);
        showToast(next ? '✓ Floating webpage HUD enabled' : '✗ Floating webpage HUD hidden');
      });
    });
  }

  document.getElementById('btnExport').addEventListener('click', exportReports);

  document.getElementById('btnPause').addEventListener('click', () => {
    safeSendMessage({ type: 'KPM_TOGGLE_PAUSE' }, (res) => {
      if (res && res.state) render(res.state);
    });
  });

  document.getElementById('btnArcade').addEventListener('click', () => {
    switchView(viewMode === 3 ? 0 : 3);
  });

  document.getElementById('btnTest').addEventListener('click', () => {
    switchView(viewMode === 1 ? 0 : 1);
  });

  document.getElementById('btnErgo').addEventListener('click', () => {
    switchView(viewMode === 2 ? 0 : 2);
  });

  document.getElementById('btnTheme').addEventListener('click', () => {
    const cur = (curState && curState.theme) || 'midnight';
    const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    safeSendMessage({ type: 'KPM_SET_PREFS', theme: next }, (res) => {
      if (res && res.state) render(res.state);
      showToast('✓ Theme: ' + next.toUpperCase());
    });
  });

  document.getElementById('btnSound').addEventListener('click', () => {
    const next = !(curState && curState.soundOn);
    getAudioContext();
    safeSendMessage({ type: 'KPM_SET_PREFS', soundOn: next }, (res) => {
      if (res && res.state) render(res.state);
      if (next) playClickSound('A');
      showToast(next ? '✓ Mechanical sound ON' : '✗ Mechanical sound OFF');
    });
  });

  document.getElementById('btnOpenTab').addEventListener('click', () => {
    if (window.chrome && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    } else {
      window.open('popup.html', '_blank');
    }
  });

  const helpBtn = document.getElementById('btnHelp');
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      if (window.chrome && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: chrome.runtime.getURL('guide.html') });
      } else {
        window.open('guide.html', '_blank');
      }
    });
  }

  document.getElementById('btnNDec').addEventListener('click', () => {
    const n = Math.max(8, ((curState && curState.nView) || 32) - 4);
    safeSendMessage({ type: 'KPM_SET_PREFS', nView: n }, (res) => {
      if (res && res.state) render(res.state);
    });
  });

  document.getElementById('btnNInc').addEventListener('click', () => {
    const n = Math.min(64, ((curState && curState.nView) || 32) + 4);
    safeSendMessage({ type: 'KPM_SET_PREFS', nView: n }, (res) => {
      if (res && res.state) render(res.state);
    });
  });

  document.getElementById('btnCycleMode').addEventListener('click', (e) => {
    if (e.currentTarget) e.currentTarget.blur();
    ttModeIdx = (ttModeIdx + 1) % MODE_KEYS.length;
    ttSentIdx = 0;
    resetTypingTest(false);
  });

  document.getElementById('btnNextSent').addEventListener('click', (e) => {
    if (e.currentTarget) e.currentTarget.blur();
    resetTypingTest(true);
  });

  const btnRestartSent = document.getElementById('btnRestartSent');
  if (btnRestartSent) {
    btnRestartSent.addEventListener('click', (e) => {
      if (e.currentTarget) e.currentTarget.blur();
      ttTyped = '';
      ttErrors = 0;
      ttKeys = 0;
      ttStart = 0;
      ttDone = false;
      renderTypingTest();
      showToast('↺ Restarted current sentence');
    });
  }

  // Custom Text Modal
  const btnCustom = document.getElementById('btnCustomText');
  const modalCustom = document.getElementById('modalCustomText');
  const txtCustom = document.getElementById('txtCustomInput');
  if (btnCustom && modalCustom) {
    btnCustom.addEventListener('click', () => {
      modalCustom.classList.remove('hidden');
      txtCustom.focus();
    });
    document.getElementById('btnModalClose').addEventListener('click', () => modalCustom.classList.add('hidden'));
    document.getElementById('btnModalCancel').addEventListener('click', () => modalCustom.classList.add('hidden'));
    document.getElementById('modalBackdrop').addEventListener('click', () => modalCustom.classList.add('hidden'));
    document.getElementById('btnModalSave').addEventListener('click', () => {
      const val = txtCustom.value.trim();
      if (val) {
        TEST_SENTENCES.CUSTOM = [val];
        ttModeIdx = MODE_KEYS.indexOf('CUSTOM');
        ttSentIdx = 0;
        resetTypingTest(false);
        showToast('✓ Custom practice sentence loaded');
      }
      modalCustom.classList.add('hidden');
    });
  }

  // Word Blitz Arcade Controls
  const btnArcStart = document.getElementById('btnArcadeStart');
  if (btnArcStart) btnArcStart.addEventListener('click', startArcadeGame);
  const btnArcPause = document.getElementById('btnArcadePause');
  if (btnArcPause) btnArcPause.addEventListener('click', pauseArcadeGame);
  const btnArcReset = document.getElementById('btnArcadeReset');
  if (btnArcReset) btnArcReset.addEventListener('click', () => stopArcadeGame(false));

  // Heatmap Mode Selector
  const selHeat = document.getElementById('selHeatMode');
  if (selHeat) {
    selHeat.addEventListener('change', (e) => {
      heatMode = e.target.value;
      if (curState) render(curState);
      const names = { freq: '🔥 Frequency', fingers: '✋ Finger Ergonomics', errors: '⚠️ Missed Keys' };
      showToast(`Heatmap Mode: ${names[heatMode]}`);
    });
  }

  // Automatic Game Pause on Tab Visibility Change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && arcadeRunning && !arcadePaused) {
      pauseArcadeGame();
    }
  });

  // Zen Scratchpad Events
  const zenEditor = document.getElementById('zenEditor');
  if (zenEditor) zenEditor.addEventListener('input', analyzeZenText);

  const rotSlider = document.getElementById('zenRotSlider');
  if (rotSlider) rotSlider.addEventListener('input', (e) => applyCaesarShift(parseInt(e.target.value, 10)));

  const btnRotDec = document.getElementById('btnRotDec');
  if (btnRotDec) {
    btnRotDec.addEventListener('click', () => {
      const slider = document.getElementById('zenRotSlider');
      let val = (parseInt(slider.value, 10) || 0) - 1;
      if (val < 0) val = 25;
      slider.value = val;
      applyCaesarShift(val);
    });
  }
  const btnRotInc = document.getElementById('btnRotInc');
  if (btnRotInc) {
    btnRotInc.addEventListener('click', () => {
      const slider = document.getElementById('zenRotSlider');
      let val = (parseInt(slider.value, 10) || 0) + 1;
      if (val > 25) val = 0;
      slider.value = val;
      applyCaesarShift(val);
    });
  }

  const btnPangram = document.getElementById('btnZenPangram');
  if (btnPangram) btnPangram.addEventListener('click', () => {
    zenEditor.value = 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.';
    analyzeZenText();
    showToast('✓ Loaded pangram sample');
  });
  const btnQuote = document.getElementById('btnZenQuote');
  if (btnQuote) btnQuote.addEventListener('click', () => {
    zenEditor.value = 'Simplicity is prerequisite for reliability. Hardware eventually fails; software eventually works.';
    analyzeZenText();
    showToast('✓ Loaded engineering quote');
  });
  const btnRot = document.getElementById('btnZenRot');
  if (btnRot) btnRot.addEventListener('click', () => {
    zenEditor.value = 'Gur dhvpx oebja sbk whzcf bire gur ynml qbt (ROT-13 Cipher Text).';
    analyzeZenText();
    showToast('✓ Loaded ROT-13 cipher sample');
  });
  const btnClear = document.getElementById('btnZenClear');
  if (btnClear) btnClear.addEventListener('click', () => {
    zenEditor.value = '';
    analyzeZenText();
    showToast('✓ Cleared scratchpad');
  });
  const btnZenCopy = document.getElementById('btnZenCopy');
  if (btnZenCopy) {
    btnZenCopy.addEventListener('click', () => {
      const val = zenEditor.value || '';
      if (!val) {
        showToast('⚠️ Scratchpad is empty');
        return;
      }
      navigator.clipboard.writeText(val).then(() => {
        showToast('✓ Copied scratchpad text to clipboard');
      }).catch(() => {
        showToast('✓ Text ready in scratchpad');
      });
    });
  }

  // Global Keyboard listener with Input Element Isolation
  window.addEventListener('keydown', (e) => {
    // Error Mitigation: If user is typing in a textarea or input, do not capture hotkeys or trigger tests!
    const isInputEl = e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT');
    if (isInputEl) {
      if (e.key === 'Escape' && modalCustom && !modalCustom.classList.contains('hidden')) {
        modalCustom.classList.add('hidden');
      }
      return;
    }

    if (e.key === 'Escape' && viewMode === 3) {
      e.preventDefault();
      pauseArcadeGame();
      return;
    }

    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && viewMode === 0) {
      e.preventDefault();
      const modes = ['freq', 'fingers', 'errors'];
      const curIdx = modes.indexOf(heatMode);
      const nextIdx = e.key === 'ArrowUp' ? (curIdx + 1) % modes.length : (curIdx + modes.length - 1) % modes.length;
      heatMode = modes[nextIdx];
      const sel = document.getElementById('selHeatMode');
      if (sel) sel.value = heatMode;
      if (curState) render(curState);
      const names = { freq: '🔥 Frequency', fingers: '✋ Finger Ergonomics', errors: '⚠️ Missed Keys' };
      showToast(`Heatmap Mode: ${names[heatMode]}`);
      return;
    }

    if (e.key === 'F1') { e.preventDefault(); document.getElementById('btnReset').click(); return; }
    if (e.key === 'F2') { e.preventDefault(); exportReports(); return; }
    if (e.key === 'F3') { e.preventDefault(); document.getElementById('btnPause').click(); return; }
    if (e.key === 'F4') { e.preventDefault(); switchView(viewMode === 3 ? 0 : 3); return; }
    if (e.key === 'F5') { e.preventDefault(); switchView(viewMode === 1 ? 0 : 1); return; }
    if (e.key === 'F6') { e.preventDefault(); switchView(viewMode === 2 ? 0 : 2); return; }
    if (e.key === 'F7') { e.preventDefault(); document.getElementById('btnTheme').click(); return; }
    if (e.key === 'F8') { e.preventDefault(); document.getElementById('btnSound').click(); return; }

    if (viewMode === 1 && e.key === 'Tab') {
      e.preventDefault();
      document.getElementById('btnCycleMode').click();
      return;
    }

    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

    getAudioContext();
    playClickSound(e.key);

    // Visual ripple and sparks on heatmap
    const kId = e.key === ' ' ? 'SPC' : e.key.toUpperCase();
    const cap = document.getElementById('kcap_' + kId);
    if (cap) {
      cap.classList.add('ripple');
      setTimeout(() => cap.classList.remove('ripple'), 220);
      const rect = cap.getBoundingClientRect();
      spawnKeySparks(rect.left + rect.width / 2, rect.top + rect.height / 2, 'var(--cyan)');
    }

    // Arcade mode keystrokes
    if (viewMode === 3 && arcadeRunning) {
      handleArcadeKey(e.key);
    }

    // Send key to background state
    safeSendMessage({
      type: 'KPM_KEY',
      payload: { key: e.key, code: e.code }
    }, (res) => {
      if (res && res.state) render(res.state);
    });

    // If Typing Test view is active, handle sentence input
    if (viewMode === 1) {
      if (e.key === ' ') {
        e.preventDefault(); // Prevent page scroll and button re-activation
      }
      if (ttDone) {
        if (e.key === 'Enter') {
          e.preventDefault();
          resetTypingTest(true);
        }
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (ttTyped.length > 0) ttTyped = ttTyped.slice(0, -1);
        renderTypingTest();
        return;
      }
      if (e.key.length === 1) {
        if (ttStart === 0) ttStart = Date.now();
        const expected = ttTarget[ttTyped.length];
        ttTyped += e.key;
        ttKeys++;
        if (e.key !== expected) {
          ttErrors++;
          const mKey = expected === ' ' ? 'SPC' : (expected ? expected.toUpperCase() : '?');
          missedKeysMap[mKey] = (missedKeysMap[mKey] || 0) + 1;
        }
        if (ttTyped.length >= ttTarget.length) {
          ttDone = true;
          renderTypingTest();
          spawnConfetti();
          const finalWpm = parseInt(document.getElementById('ttWpm').textContent, 10) || 0;
          safeSendMessage({ type: 'KPM_SET_PREFS', testBest: finalWpm }, (res) => {
            if (res && res.state) render(res.state);
          });
          document.getElementById('ttStatus').innerHTML = `<b style="color:var(--green)">🎉 Sentence complete!</b> Speed: <b>${finalWpm} WPM</b> · Press <b>Enter</b> for next sentence or <b>Tab</b> to switch category.`;
        } else {
          renderTypingTest();
        }
      }
    }
  });
});

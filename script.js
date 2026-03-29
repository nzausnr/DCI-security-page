// ── Utilities ──────────────────────────────────────────────────
function genCase() {
  const yr  = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 8999);
  return `DCI/CC/${yr}/${seq}`;
}

function formatTime(d) {
  return d.toLocaleTimeString([], { hour12: false });
}

function formatFull(d) {
  const localStr = d.toLocaleString();
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const minutes = String(absOffset % 60).padStart(2, '0');
  return `${localStr} (UTC${sign}${hours}:${minutes})`;
}

// ── Initial case & session timestamp ───────────────────────────
document.getElementById('caseNo').textContent    = genCase();
document.getElementById('v-session').textContent = formatFull(new Date());

// ── Device / browser ───────────────────────────────────────────
const ua = navigator.userAgent;
const device  = /iPhone|iPad/.test(ua) ? 'Apple iOS' : /Android/.test(ua) ? 'Android' :
                /Macintosh/.test(ua)   ? 'macOS'     : /Windows/.test(ua) ? 'Windows' : 'Linux';
const browser = /Edg/.test(ua)        ? 'Microsoft Edge' : /OPR|Opera/.test(ua) ? 'Opera' :
                /Chrome/.test(ua)     ? 'Chrome'     : /Safari/.test(ua) ? 'Safari' :
                /Firefox/.test(ua)    ? 'Firefox'    : 'Unknown Browser';
document.getElementById('v-dev').textContent = `${device} · ${browser}`;

// ── Screen resolution ──────────────────────────────────────────
document.getElementById('v-screen').textContent =
  `${window.screen.width} × ${window.screen.height} px (${window.devicePixelRatio}x DPI)`;

// ── Language ───────────────────────────────────────────────────
document.getElementById('v-lang').textContent = navigator.language || navigator.languages?.[0] || 'Unknown';

// ── Timezone ───────────────────────────────────────────────────
document.getElementById('v-tz').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;

// ── Connection type ────────────────────────────────────────────
const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
if (conn) {
  const type = conn.effectiveType || conn.type || 'Unknown';
  const downlink = conn.downlink ? ` · ${conn.downlink} Mbps` : '';
  document.getElementById('v-conn').textContent = `${type.toUpperCase()}${downlink}`;
} else {
  document.getElementById('v-conn').textContent = 'Online';
}

// ── Battery ────────────────────────────────────────────────────
if (navigator.getBattery) {
  navigator.getBattery().then(bat => {
    const pct   = Math.round(bat.level * 100);
    const state = bat.charging ? '⚡ Charging' : '🔋 On Battery';
    document.getElementById('v-battery').textContent = `${pct}% · ${state}`;
  }).catch(() => {
    document.getElementById('v-battery').textContent = 'Unavailable';
  });
} else {
  document.getElementById('v-battery').textContent = 'Unavailable';
}

// ── CPU cores ──────────────────────────────────────────────────
document.getElementById('v-cpu').textContent =
  navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} logical cores` : 'Unavailable';

// ── Device memory ──────────────────────────────────────────────
document.getElementById('v-ram').textContent =
  navigator.deviceMemory ? `≥ ${navigator.deviceMemory} GB` : 'Unavailable';

// ── GPU via WebGL ──────────────────────────────────────────────
try {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (gl) {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      document.getElementById('v-gpu').textContent = renderer;
    } else {
      document.getElementById('v-gpu').textContent = 'WebGL available (renderer masked)';
    }
  } else {
    document.getElementById('v-gpu').textContent = 'WebGL unavailable';
  }
} catch(e) {
  document.getElementById('v-gpu').textContent = 'Unavailable';
}

// ── Scan bar animation (initial load) ──────────────────────────
const scanFill  = document.getElementById('scanFill');
const scanPct   = document.getElementById('scanPct');
const scanLabel = document.getElementById('scanLabel');

function runScan(onComplete) {
  let pct = 0;
  scanFill.style.width = '0%';
  scanFill.style.transition = 'none';
  scanPct.textContent = '0%';
  const t = setInterval(() => {
    pct = Math.min(pct + Math.random() * 2.5, 100);
    scanFill.style.width = pct + '%';
    scanFill.style.transition = 'width 0.06s linear';
    scanPct.textContent = pct >= 100 ? '100% — COMPLETE' : Math.floor(pct) + '%';
    if (pct >= 100) {
      clearInterval(t);
      if (onComplete) onComplete();
    }
  }, 60);
}

runScan();

// ── IP geolocation (runs once on load) ─────────────────────────
function reveal(id, text, delay) {
  setTimeout(() => {
    const el = document.getElementById(id);
    el.textContent = text;
    el.classList.remove('loading');
  }, delay);
}

fetch('https://ipapi.co/json/')
  .then(r => r.json())
  .then(d => {
    reveal('v-ip',  d.ip || '—', 900);
    reveal('v-loc', `${d.city || '—'}, ${d.country_name || '—'}`, 1200);
    reveal('v-reg', `${d.region || '—'} · Postal ${d.postal || '—'}`, 1500);
    reveal('v-isp', d.org || '—', 1800);
  })
  .catch(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => reveal('v-ip', d.ip || '—', 900))
      .catch(() => {});
    ['v-loc','v-reg','v-isp'].forEach(id => reveal(id, 'Unavailable', 2000));
  });

// ── LIVE CLOCK — ticks every second ────────────────────────────
function tickClock() {
  const now = new Date();
  const ts  = formatTime(now);
  document.getElementById('headerClock').textContent = ts;
  document.getElementById('v-liveclock').textContent  = ts;
}
tickClock();
setInterval(tickClock, 1000);

// ── RE-CAPTURE — triggers every 90 seconds ─────────────────────
function triggerRecapture() {
  const panel      = document.getElementById('dataPanel');
  const sessionRow = document.getElementById('sessionRow');
  const headerText = document.getElementById('panelHeaderText');
  const caseEl     = document.getElementById('caseNo');

  panel.classList.add('recapture');
  headerText.textContent = 'NEW SESSION DETECTED — RE-CAPTURING...';
  scanLabel.textContent = 'RE-SCANNING DEVICE & NETWORK';
  scanPct.textContent   = '0%';
  runScan();

  setTimeout(() => {
    caseEl.textContent = genCase();
    document.getElementById('v-session').textContent = formatFull(new Date());

    sessionRow.classList.add('updated');
    setTimeout(() => sessionRow.classList.remove('updated'), 3000);

    headerText.textContent = 'Intercepted Device Intelligence — Live Capture';
    setTimeout(() => panel.classList.remove('recapture'), 3000);
  }, 1800);
}

setInterval(triggerRecapture, 90000);
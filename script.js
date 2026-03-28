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

runScan(); // initial scan, no callback needed

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
// New case number + new session timestamp + flash effect
function triggerRecapture() {
  const panel      = document.getElementById('dataPanel');
  const sessionRow = document.getElementById('sessionRow');
  const headerText = document.getElementById('panelHeaderText');
  const caseEl     = document.getElementById('caseNo');

  // 1. Flash the panel border red
  panel.classList.add('recapture');

  // 2. Update header text briefly
  headerText.textContent = 'NEW SESSION DETECTED — RE-CAPTURING...';

  // 3. Run scan bar again
  scanLabel.textContent = 'RE-SCANNING DEVICE & NETWORK';
  scanPct.textContent   = '0%';
  runScan();

  // 4. After short delay, update case + session timestamp
  setTimeout(() => {
    const newCase = genCase();
    caseEl.textContent = newCase;

    const now = new Date();
    document.getElementById('v-session').textContent = formatFull(now);

    // Briefly highlight session row
    sessionRow.classList.add('updated');
    setTimeout(() => sessionRow.classList.remove('updated'), 3000);

    // Restore header text
    headerText.textContent = 'Intercepted Device Intelligence — Live Capture';

    // Remove flash after a moment
    setTimeout(() => panel.classList.remove('recapture'), 3000);

  }, 1800);
}

// First re-capture after 90 seconds, then every 90 seconds
setInterval(triggerRecapture, 90000);

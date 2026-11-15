const TOTAL_MS = 30 * 1000;

const page = document.getElementById('page');
const timeEl = document.getElementById('time');
const mainBtn = document.getElementById('main-btn');
const resetBtn = document.getElementById('reset-btn');
const restartBtn = document.getElementById('restart-btn');
const infoEl = document.getElementById('info');

let state = 'idle'; // idle, running, paused, done
let remainingMs = TOTAL_MS; // time left when not running
let endTime = 0; // real clock time when the timer ends (while running)
let intervalId = null;

function show(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  timeEl.textContent = m + ':' + s;
}

function setState(next) {
  state = next;
  page.dataset.state = next;
  const done = next === 'done';
  mainBtn.hidden = done;
  resetBtn.hidden = done;
  restartBtn.hidden = !done;
  infoEl.hidden = !done;
  if (next === 'idle') mainBtn.textContent = 'Start';
  if (next === 'running') mainBtn.textContent = 'Pause';
  if (next === 'paused') mainBtn.textContent = 'Resume';
}

// Works out the time left from the real clock, so it stays right
// even if the browser slows this page down in a background tab.
function tick() {
  if (state !== 'running') return;
  const left = endTime - Date.now();
  if (left <= 0) {
    clearInterval(intervalId);
    intervalId = null;
    remainingMs = 0;
    show(0);
    setState('done');
    return;
  }
  show(left);
}

function startRunning() {
  endTime = Date.now() + remainingMs;
  setState('running');
  show(remainingMs);
  clearInterval(intervalId);
  intervalId = setInterval(tick, 250);
}

mainBtn.addEventListener('click', () => {
  if (state === 'idle' || state === 'paused') {
    startRunning();
  } else if (state === 'running') {
    remainingMs = Math.max(0, endTime - Date.now());
    clearInterval(intervalId);
    intervalId = null;
    setState('paused');
    show(remainingMs);
  }
});

function resetTimer() {
  clearInterval(intervalId);
  intervalId = null;
  remainingMs = TOTAL_MS;
  show(remainingMs);
  setState('idle');
}

resetBtn.addEventListener('click', resetTimer);
restartBtn.addEventListener('click', resetTimer);

// Update straight away when coming back to the tab
document.addEventListener('visibilitychange', tick);

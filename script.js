const TOTAL_MS = 30 * 1000;

const page = document.getElementById('page');
const timeEl = document.getElementById('time');
const mainBtn = document.getElementById('main-btn');
const resetBtn = document.getElementById('reset-btn');
const restartBtn = document.getElementById('restart-btn');
const infoEl = document.getElementById('info');
const artEl = document.getElementById('art');
const artImg = document.getElementById('art-img');
const infoTitle = document.getElementById('info-title');
const infoArtist = document.getElementById('info-artist');
const infoYear = document.getElementById('info-year');
const infoLink = document.getElementById('info-link');

let state = 'idle'; // idle, running, paused, done
let remainingMs = TOTAL_MS; // time left when not running
let endTime = 0; // real clock time when the timer ends (while running)
let intervalId = null;

// ---- Bell (temple bell, made with the browser's built-in Web Audio) ----
let audioCtx = null;
let bell = null; // the booked bell: { master, oscs }

// Browsers only allow sound after a click, so this runs when Start or Resume is pressed.
function prepareAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audioCtx = null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

// One ringing tone: starts loud, fades away smoothly.
function tone(out, oscs, freq, start, peak, seconds) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain);
  gain.connect(out);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
  oscs.push(osc);
}

// Books the bell to ring once, in `ms` milliseconds, on the sound clock.
// The sound clock keeps exact time even when the tab is in the background.
function scheduleBell(ms) {
  cancelBell();
  if (!audioCtx) return;
  const master = audioCtx.createGain();
  master.connect(audioCtx.destination);
  const oscs = [];
  const t = audioCtx.currentTime + ms / 1000;
  tone(master, oscs, 220, t, 0.4, 5);
  tone(master, oscs, 440, t, 0.25, 4.5);
  tone(master, oscs, 607, t, 0.15, 3.5);
  tone(master, oscs, 1188, t, 0.08, 2.4);
  tone(master, oscs, 1965, t, 0.04, 1);
  bell = { master, oscs };
}

// Cancels a booked bell, or quickly fades out one that is already ringing.
function cancelBell() {
  if (!bell) return;
  const { master, oscs } = bell;
  bell = null;
  const now = audioCtx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setTargetAtTime(0, now, 0.02);
  oscs.forEach((o) => {
    try {
      o.stop(now + 0.15);
    } catch (e) {}
  });
  setTimeout(() => master.disconnect(), 500);
}

// ---- Painting from the Met Museum's free public API ----
const MET = 'https://collectionapi.metmuseum.org/public/collection';
let painting = null; // details of the painting on screen: { title, artist, year, link }
let loadId = 0; // lets a newer load replace an older one that is still running

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

let totalPaintings = null; // how many paintings with images the Met has

async function getJson(url) {
  return (await fetch(url)).json();
}

async function fetchPaintingRecord() {
  const search = MET + '/v1.1/search?hasImages=true&medium=Paintings';
  if (totalPaintings === null) totalPaintings = (await getJson(search + '&limit=1')).total;
  // Try a random block of 500 paintings. If none of the ones I check
  // is public domain with an image, quietly try another block.
  for (let attempt = 0; attempt < 8; attempt++) {
    const maxOffset = Math.max(0, Math.min(totalPaintings, 10000) - 500);
    const offset = Math.floor(Math.random() * (maxOffset + 1));
    const ids = (await getJson(search + '&limit=500&offset=' + offset)).objectIDs || [];
    const picks = ids.slice().sort(() => Math.random() - 0.5).slice(0, 10);
    const records = await Promise.all(picks.map((id) => getJson(MET + '/v1/objects/' + id).catch(() => null)));
    const good = records.filter((r) => r && r.isPublicDomain && (r.primaryImageSmall || r.primaryImage));
    if (good.length) return pickRandom(good);
  }
  throw new Error('No usable painting found');
}

function loadPainting() {
  const myId = ++loadId;
  painting = null;
  artImg.hidden = true;
  artImg.removeAttribute('src');
  artEl.classList.remove('loaded');
  fetchPaintingRecord()
    .then((rec) => {
      const url = rec.primaryImageSmall || rec.primaryImage;
      const img = new Image();
      img.onload = () => {
        if (myId !== loadId) return; // an older load, ignore it
        painting = {
          title: rec.title,
          artist: rec.artistDisplayName || 'Unknown',
          year: rec.objectDate || 'Unknown',
          link: rec.objectURL
        };
        artImg.src = url;
        artImg.hidden = false;
        artEl.classList.add('loaded');
        if (state === 'done') showDetails();
      };
      img.src = url;
    })
    .catch((e) => console.error(e));
}

// Details are only put on the page when the timer has finished
function showDetails() {
  if (!painting) return;
  infoTitle.textContent = painting.title;
  infoArtist.textContent = painting.artist;
  infoYear.textContent = painting.year;
  infoLink.href = painting.link;
}

function clearDetails() {
  infoTitle.textContent = '';
  infoArtist.textContent = '';
  infoYear.textContent = '';
  infoLink.removeAttribute('href');
}

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
  if (done) showDetails();
  else clearDetails();
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
  prepareAudio();
  scheduleBell(remainingMs);
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
    cancelBell();
    clearInterval(intervalId);
    intervalId = null;
    setState('paused');
    show(remainingMs);
  }
});

function resetTimer() {
  cancelBell();
  clearInterval(intervalId);
  intervalId = null;
  remainingMs = TOTAL_MS;
  show(remainingMs);
  setState('idle');
}

resetBtn.addEventListener('click', resetTimer);
restartBtn.addEventListener('click', () => {
  resetTimer();
  loadPainting(); // Restart session brings a new painting
});

loadPainting();

// Update straight away when coming back to the tab
document.addEventListener('visibilitychange', tick);

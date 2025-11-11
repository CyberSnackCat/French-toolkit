// Simple quiz engine with streaks and A-threshold unlock
let deck = [];
let idx = 0, correct = 0, total = 0, streak = 0, level = 1;
const THRESH = 90;

// Fallback minimal deck in case deck.json can't be fetched
const FALLBACK = [
  { q: "Conjugue AVOIR (je) — présent", a: "j'ai", tag: "present;avoir" },
  { q: "Conjugue ÊTRE (nous) — présent", a: "nous sommes", tag: "present;etre" },
  { q: "Futur proche: (je) + manger", a: "je vais manger", tag: "futur-proche" },
  { q: "Passé récent: (elle) + finir", a: "elle vient de finir", tag: "passe-recent" },
  { q: "Passé composé (AVOIR): (je) + voir", a: "j'ai vu", tag: "passe-compose;avoir" }
];

async function loadDeck() {
  try {
    const res = await fetch('assets/deck.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for assets/deck.json`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('Empty or invalid deck.json');
    deck = data;
  } catch (err) {
    console.error('[CatQuest] Failed to load deck.json:', err);
    deck = FALLBACK; // graceful fallback so the app still works
  }
  // Randomize and keep 10 items per round
  deck = deck.sort(() => Math.random() - 0.5).slice(0, 10);
}

function updateHUD() {
  document.getElementById('streak').textContent = streak;
  const pct = total ? Math.round((100 * correct) / total) : 0;
  document.getElementById('score').textContent = pct;
}

function showItem() {
  const p = deck[idx];
  document.getElementById('prompt').textContent = 'Q: ' + p.q;
  const ans = document.getElementById('answer');
  ans.value = '';
  document.getElementById('feedback').textContent = '';
  ans.focus();
}

async function start() {
  idx = 0; correct = 0; total = 0; streak = 0; updateHUD();
  await loadDeck();
  showItem();
}

function check() {
  const p = deck[idx];
  const ans = document.getElementById('answer').value.trim();
  const ok = ans.toLowerCase() === p.a.toLowerCase();
  total++;
  if (ok) { correct++; streak++; setFeedback('✅ Correct!', 'good'); }
  else { streak = 0; setFeedback('❌ ' + p.a, 'bad'); }
  updateHUD();
}

function nextQ() {
  if (idx < deck.length - 1) { idx++; showItem(); }
  else {
    const pct = total ? Math.round((100 * correct) / total) : 0;
    let badge = 'Bronze Paw';
    if (pct >= 90) { badge = 'Golden Paw'; level++; }
    else if (pct >= 75) { badge = 'Silver Paw'; }
    document.getElementById('badge').textContent = badge;
    document.getElementById('prompt').textContent =
      'Round done — Score ' + pct + '%. ' + (pct >= 90 ? 'Level up!' : 'Retry to reach 90%+ to level up.');
  }
}

function setFeedback(text, style) {
  const el = document.getElementById('feedback');
  el.textContent = text;
  el.style.color = style === 'good' ? '#10b981' : '#f43f5e';
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start').addEventListener('click', start);
  document  document.getElementById('check').addEventListener('click', check);
  document.getElementById('next').addEventListener('click', nextQ);

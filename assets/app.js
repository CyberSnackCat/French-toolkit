// Cat Quest v3: Level-aware with repetition & memory
let deckAll=[];let deck=[];let queue=[];let idx=0,correct=0,total=0,streak=0;
let level=Number(localStorage.getItem('cq.level')||'1');
const MAX_LEVEL=5, ROUND_SIZE=12, NEED_SCORE=90; const KEY='cq.stats';
const $=id=>document.getElementById(id);

function stats(){ try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}} }
function saveStats(s){ localStorage.setItem(KEY, JSON.stringify(s)) }

async function loadAll(){
  try{ const r=await fetch('assets/deck.json',{cache:'no-store'}); if(!r.ok) throw new Error('HTTP '+r.status); deckAll=await r.json(); if(!Array.isArray(deckAll)||deckAll.length===0) throw new Error('empty'); }
  catch(e){ console.warn('[CatQuest] deck.json fail',e); deckAll=[{id:'x',q:'Bonjour → (en)',a:'Hello',tag:'vocab',level:1}] }
}

function poolForLevel(l){ return deckAll.filter(it => (it.level||1)===l) }
function weightOf(it){ const s=stats()[it.id]; if(!s) return it.weight||1; const acc=s.acc||0; return Math.max(1, 3 - Math.floor(acc/3)); }
function buildRound(){
  const pool = poolForLevel(level);
  // bias sampling by weight (more reps for low-accuracy items)
  let expanded=[]; pool.forEach(it=>{const w=weightOf(it); for(let i=0;i<w;i++) expanded.push(it)});
  expanded = expanded.sort(()=>Math.random()-0.5);
  deck = expanded.slice(0, Math.max(ROUND_SIZE, 10));
  queue = [...deck]; idx=0; correct=0; total=0; streak=0; updateHUD(); showItem();
}

function updateHUD(){ const pct=total?Math.round(100*correct/total):0; $('level').textContent=String(level); $('streak').textContent=String(streak); $('score').textContent=String(pct); }
function showItem(){ const it=queue[idx]; $('prompt').textContent='Q: '+it.q; $('answer').value=''; $('feedback').textContent=''; $('answer').focus(); }
function setFB(t,ok){ const el=$('feedback'); el.textContent=t; el.style.color=ok?'#10b981':'#f43f5e' }

function record(it, ok){
  const s=stats(); const cur=s[it.id]||{seen:0,correct:0,acc:0}; cur.seen++; if(ok) cur.correct++; cur.acc=Math.round(100*cur.correct/cur.seen); s[it.id]=cur; saveStats(s);
}

function check(){ const it=queue[idx]; const ans=$('answer').value.trim(); const ok = ans.toLowerCase()===it.a.toLowerCase(); total++; if(ok){correct++; streak++; setFB('✅ Correct!', true);} else {streak=0; setFB('❌ '+it.a, false); // re-queue missed item later in round
    queue.push(it); }
  record(it, ok); updateHUD(); }

function nextQ(){ if(idx<queue.length-1){ idx++; showItem(); } else { endRound(); } }
function endRound(){ const pct=total?Math.round(100*correct/total):0; let badge='Bronze Paw'; if(pct>=NEED_SCORE){ badge='Golden Paw'; level=Math.min(level+1, MAX_LEVEL); localStorage.setItem('cq.level', String(level)); } else if(pct>=75){ badge='Silver Paw'; } $('badge').textContent=badge; $('prompt').textContent='Round done — '+pct+'%. '+(pct>=NEED_SCORE?'Level up!':'Retry for 90%+'); }

function resetLevel(){ level=1; localStorage.setItem('cq.level','1'); localStorage.removeItem(KEY); start(); }
async function start(){ await loadAll(); buildRound(); }

window.addEventListener('DOMContentLoaded',()=>{ $('start').addEventListener('click', start); $('check').addEventListener('click', check); $('next').addEventListener('click', nextQ); $('reset').addEventListener('click', resetLevel); });

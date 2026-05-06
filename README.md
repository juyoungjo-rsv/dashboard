# dashboard
<!DOCTYPE html>

<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>내 인생 대시보드</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
–bg: #f7f6f3;
–surface: #ffffff;
–border: #e8e6e0;
–text: #1a1917;
–muted: #9b9690;
–tag: #f0ede8;
–green: #4a9d6f;
–blue: #5b7fa6;
–orange: #c07a3a;
–purple: #9b6bb5;
}

body {
font-family: ‘Noto Sans KR’, sans-serif;
background: var(–bg);
color: var(–text);
min-height: 100vh;
padding: 28px 16px 80px;
}

/* ── Header ── */
header {
max-width: 720px;
margin: 0 auto 28px;
display: flex;
justify-content: space-between;
align-items: flex-end;
flex-wrap: wrap;
gap: 10px;
}
.title-block h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
.title-block p  { font-size: 12px; color: var(–muted); margin-top: 3px; font-family: ‘DM Mono’, monospace; }

.week-nav { display: flex; align-items: center; gap: 8px; }
.week-nav button {
background: none; border: 1px solid var(–border); border-radius: 6px;
width: 28px; height: 28px; cursor: pointer; font-size: 14px; color: var(–text);
display: flex; align-items: center; justify-content: center;
transition: background .15s;
}
.week-nav button:hover { background: var(–border); }
#week-label { font-family: ‘DM Mono’, monospace; font-size: 12px; min-width: 88px; text-align: center; color: var(–muted); }

/* ── Tab nav ── */
.tabs {
max-width: 720px;
margin: 0 auto 20px;
display: flex;
gap: 6px;
border-bottom: 1px solid var(–border);
padding-bottom: 0;
}
.tab-btn {
background: none; border: none; cursor: pointer;
font-family: ‘Noto Sans KR’, sans-serif;
font-size: 13px; font-weight: 500;
color: var(–muted);
padding: 8px 14px 10px;
border-bottom: 2px solid transparent;
margin-bottom: -1px;
transition: color .15s, border-color .15s;
}
.tab-btn.active { color: var(–text); border-bottom-color: var(–text); }
.tab-btn:hover:not(.active) { color: var(–text); }

/* ── Content ── */
.tab-content { max-width: 720px; margin: 0 auto; display: none; }
.tab-content.active { display: block; animation: fadeUp .3s ease both; }

@keyframes fadeUp {
from { opacity: 0; transform: translateY(10px); }
to   { opacity: 1; transform: translateY(0); }
}

/* ── Card ── */
.card {
background: var(–surface);
border: 1px solid var(–border);
border-radius: 16px;
padding: 22px 22px 24px;
margin-bottom: 14px;
}
.card-header {
display: flex; align-items: center; gap: 10px;
margin-bottom: 18px;
}
.card-icon {
width: 32px; height: 32px; border-radius: 9px;
display: flex; align-items: center; justify-content: center;
font-size: 15px;
}
.card-title { font-size: 14px; font-weight: 600; }
.card-sub   { font-size: 11px; color: var(–muted); margin-top: 2px; }
.divider    { height: 1px; background: var(–border); margin: 16px 0; }

/* ── Checklist ── */
.checklist { display: flex; flex-direction: column; gap: 9px; }
.check-item {
display: flex; align-items: center; gap: 10px;
font-size: 13px; cursor: pointer; user-select: none;
}
.check-box {
width: 18px; height: 18px; border-radius: 5px;
border: 1.5px solid var(–border); flex-shrink: 0;
display: flex; align-items: center; justify-content: center;
transition: all .18s;
}
.check-item.done .check-box { border-color: transparent; color: white; font-size: 11px; }
.check-item.done .check-text { color: var(–muted); text-decoration: line-through; }

/* ── Ring ── */
.score-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.ring-wrap { position: relative; width: 60px; height: 60px; flex-shrink: 0; }
.ring-wrap svg { transform: rotate(-90deg); }
.ring-bg   { fill: none; stroke: var(–border); stroke-width: 5; }
.ring-fill { fill: none; stroke-width: 5; stroke-linecap: round; transition: stroke-dashoffset .7s cubic-bezier(.4,0,.2,1); }
.ring-label {
position: absolute; inset: 0;
display: flex; align-items: center; justify-content: center;
font-family: ‘DM Mono’, monospace; font-size: 13px;
}
.score-info .big  { font-size: 20px; font-weight: 700; letter-spacing: -1px; }
.score-info .desc { font-size: 12px; color: var(–muted); margin-top: 3px; }

/* ── Bar ── */
.bar-row { margin-bottom: 12px; }
.bar-row:last-child { margin-bottom: 0; }
.bar-label { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
.bar-label span:last-child { font-family: ‘DM Mono’, monospace; color: var(–muted); }
.bar-track { height: 6px; background: var(–tag); border-radius: 99px; overflow: hidden; }
.bar-fill  { height: 100%; border-radius: 99px; transition: width .7s cubic-bezier(.4,0,.2,1); }

/* ── Input ── */
.input-row { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }
.input-label { font-size: 12px; color: var(–muted); white-space: nowrap; }
.input-field {
flex: 1; border: 1px solid var(–border); border-radius: 8px;
padding: 7px 10px; font-family: ‘DM Mono’, monospace; font-size: 13px;
background: var(–surface); color: var(–text); outline: none;
transition: border-color .15s;
}
.input-field:focus { border-color: #aaa; }
.note-area {
width: 100%; border: none; background: var(–tag);
border-radius: 10px; padding: 12px 14px;
font-family: ‘Noto Sans KR’, sans-serif; font-size: 13px;
color: var(–text); resize: none; outline: none;
line-height: 1.7; min-height: 80px; transition: background .15s;
}
.note-area:focus { background: #ebe8e2; }
.note-area::placeholder { color: var(–muted); }

/* ── Add button ── */
.add-row { display: flex; gap: 8px; margin-top: 12px; }
.add-input {
flex: 1; border: 1px solid var(–border); border-radius: 8px;
padding: 8px 12px; font-family: ‘Noto Sans KR’, sans-serif; font-size: 13px;
background: var(–surface); color: var(–text); outline: none;
}
.add-input:focus { border-color: #aaa; }
.add-btn {
background: var(–text); color: white; border: none;
border-radius: 8px; padding: 8px 14px; font-size: 13px;
font-family: ‘Noto Sans KR’, sans-serif; cursor: pointer;
white-space: nowrap; transition: opacity .15s;
}
.add-btn:hover { opacity: .8; }
.del-btn {
background: none; border: none; cursor: pointer;
color: var(–muted); font-size: 16px; padding: 0 4px;
line-height: 1; transition: color .15s; margin-left: auto;
}
.del-btn:hover { color: #c0392b; }

/* ── Finance ── */
.stat-row { display: flex; gap: 10px; margin-bottom: 16px; }
.stat-box {
flex: 1; background: var(–tag); border-radius: 10px;
padding: 12px; text-align: center;
}
.stat-box .val { font-size: 15px; font-weight: 700; font-family: ‘DM Mono’, monospace; }
.stat-box .lbl { font-size: 10px; color: var(–muted); margin-top: 2px; }

/* ── Schedule ── */
.schedule-item {
display: flex; align-items: center; gap: 10px;
padding: 10px 12px; background: var(–tag);
border-radius: 10px; margin-bottom: 8px;
font-size: 13px; animation: fadeUp .2s ease;
}
.schedule-time {
font-family: ‘DM Mono’, monospace; font-size: 12px;
color: var(–muted); white-space: nowrap; min-width: 38px;
}
.schedule-text { flex: 1; }

/* ── Diary ── */
.diary-date-nav {
display: flex; align-items: center; gap: 10px;
margin-bottom: 16px;
}
.diary-date-nav button {
background: none; border: 1px solid var(–border); border-radius: 6px;
width: 28px; height: 28px; cursor: pointer; font-size: 14px; color: var(–text);
display: flex; align-items: center; justify-content: center;
transition: background .15s;
}
.diary-date-nav button:hover { background: var(–border); }
#diary-date-label {
font-family: ‘DM Mono’, monospace; font-size: 13px;
flex: 1; text-align: center;
}
.mood-picker { display: flex; gap: 8px; margin-bottom: 14px; }
.mood-opt {
font-size: 20px; cursor: pointer; padding: 4px;
border-radius: 8px; border: 2px solid transparent;
transition: transform .15s, border-color .15s;
}
.mood-opt:hover { transform: scale(1.2); }
.mood-opt.picked { border-color: var(–text); }
.diary-save-btn {
width: 100%; margin-top: 12px;
background: var(–text); color: white; border: none;
border-radius: 10px; padding: 12px; font-size: 13px; font-weight: 600;
font-family: ‘Noto Sans KR’, sans-serif; cursor: pointer; transition: opacity .15s;
}
.diary-save-btn:hover { opacity: .85; }
.diary-saved-list { margin-top: 16px; }
.diary-entry {
background: var(–tag); border-radius: 10px;
padding: 12px 14px; margin-bottom: 8px; font-size: 13px; line-height: 1.7;
animation: fadeUp .2s ease;
}
.diary-entry-header {
display: flex; justify-content: space-between; align-items: center;
margin-bottom: 6px;
}
.diary-entry-date { font-family: ‘DM Mono’, monospace; font-size: 11px; color: var(–muted); }
.diary-entry-mood { font-size: 16px; }

/* ── Toast ── */
.toast {
position: fixed; bottom: 28px; left: 50%;
transform: translateX(-50%) translateY(20px);
background: var(–text); color: white;
padding: 10px 20px; border-radius: 99px; font-size: 13px;
opacity: 0; transition: all .3s; pointer-events: none; white-space: nowrap;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

@media (max-width: 480px) {
.stat-row { flex-wrap: wrap; }
.stat-box { min-width: calc(50% - 5px); }
}
</style>

</head>
<body>

<header>
  <div class="title-block">
    <h1>내 인생 대시보드</h1>
    <p id="today-label"></p>
  </div>
  <div class="week-nav">
    <button id="prev-week">‹</button>
    <span id="week-label"></span>
    <button id="next-week">›</button>
  </div>
</header>

<div class="tabs">
  <button class="tab-btn active" onclick="switchTab('workout')">🏃 운동</button>
  <button class="tab-btn" onclick="switchTab('finance')">💰 재정</button>
  <button class="tab-btn" onclick="switchTab('schedule')">📅 일정</button>
  <button class="tab-btn" onclick="switchTab('diary')">📓 일기</button>
</div>

<!-- ── 운동 ── -->

<div class="tab-content active" id="tab-workout">
  <div class="card">
    <div class="card-header">
      <div class="card-icon" style="background:#edf7f1">🏃</div>
      <div>
        <div class="card-title">이번 주 운동</div>
        <div class="card-sub" id="workout-sub">0 / 0 완료</div>
      </div>
    </div>
    <div class="score-row">
      <div class="ring-wrap">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle class="ring-bg" cx="30" cy="30" r="25"/>
          <circle class="ring-fill" id="workout-ring" cx="30" cy="30" r="25"
            stroke="#4a9d6f" stroke-dasharray="157.1" stroke-dashoffset="157.1"/>
        </svg>
        <div class="ring-label" id="workout-pct">0%</div>
      </div>
      <div class="score-info">
        <div class="big" id="workout-done-big">0 / 0</div>
        <div class="desc">완료한 운동 세션</div>
      </div>
    </div>
    <div class="checklist" id="workout-list"></div>
    <div class="add-row">
      <input class="add-input" id="workout-add-input" placeholder="운동 추가 (예: 금 — 러닝 30분)" onkeydown="if(event.key==='Enter')addWorkout()">
      <button class="add-btn" onclick="addWorkout()">+ 추가</button>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <div class="card-icon" style="background:#edf7f1">😴</div>
      <div>
        <div class="card-title">수면</div>
        <div class="card-sub">어젯밤 수면 시간</div>
      </div>
    </div>
    <div class="bar-row">
      <div class="bar-label"><span>수면 시간</span><span id="sleep-lbl">7.0h</span></div>
      <div class="bar-track"><div class="bar-fill" id="sleep-bar" style="width:70%;background:var(--green)"></div></div>
    </div>
    <div class="input-row">
      <span class="input-label">시간 입력</span>
      <input class="input-field" type="number" id="sleep-input" min="0" max="12" step="0.5" value="7" style="max-width:80px" oninput="updateSleep()">
      <span class="input-label">시간</span>
    </div>
  </div>
</div>

<!-- ── 재정 ── -->

<div class="tab-content" id="tab-finance">
  <div class="card">
    <div class="card-header">
      <div class="card-icon" style="background:#edf2f8">💰</div>
      <div>
        <div class="card-title">이번 달 재정</div>
        <div class="card-sub">직접 입력</div>
      </div>
    </div>
    <div class="stat-row">
      <div class="stat-box">
        <div class="val" id="inc-disp">—</div>
        <div class="lbl">수입 (만원)</div>
      </div>
      <div class="stat-box">
        <div class="val" id="exp-disp">—</div>
        <div class="lbl">지출 (만원)</div>
      </div>
      <div class="stat-box">
        <div class="val" id="save-disp">—</div>
        <div class="lbl">저축률</div>
      </div>
    </div>
    <div class="input-row">
      <span class="input-label">수입</span>
      <input class="input-field" type="number" id="inc-input" placeholder="만원" oninput="calcFinance()">
    </div>
    <div class="input-row">
      <span class="input-label">지출</span>
      <input class="input-field" type="number" id="exp-input" placeholder="만원" oninput="calcFinance()">
    </div>
    <div class="divider"></div>
    <div class="bar-row">
      <div class="bar-label"><span>저축 목표 달성률</span><span id="save-goal-pct">0%</span></div>
      <div class="bar-track"><div class="bar-fill" id="save-bar" style="width:0%;background:var(--blue)"></div></div>
    </div>
    <div class="input-row" style="margin-top:10px">
      <span class="input-label">저축 목표</span>
      <input class="input-field" type="number" id="save-goal-input" placeholder="만원" oninput="calcFinance()">
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <div class="card-icon" style="background:#edf2f8">📝</div>
      <div>
        <div class="card-title">지출 메모</div>
        <div class="card-sub">어디서 얼마 썼는지 기록</div>
      </div>
    </div>
    <div id="expense-list" style="margin-bottom:10px"></div>
    <div class="add-row">
      <input class="add-input" id="expense-place" placeholder="항목 (예: 스타벅스)" style="flex:2">
      <input class="add-input" id="expense-amount" placeholder="금액" type="number" style="flex:1;max-width:90px">
      <button class="add-btn" onclick="addExpense()">+ 추가</button>
    </div>
  </div>
</div>

<!-- ── 일정 ── -->

<div class="tab-content" id="tab-schedule">
  <div class="card">
    <div class="card-header">
      <div class="card-icon" style="background:#fff3e8">📅</div>
      <div>
        <div class="card-title">일정</div>
        <div class="card-sub" id="schedule-date-sub"></div>
      </div>
    </div>
    <div id="schedule-list"></div>
    <div class="add-row" style="flex-wrap:wrap;gap:8px">
      <input class="add-input" id="sch-time" placeholder="시간 (예: 14:00)" style="max-width:110px;flex:none">
      <input class="add-input" id="sch-text" placeholder="일정 내용" style="flex:1" onkeydown="if(event.key==='Enter')addSchedule()">
      <button class="add-btn" onclick="addSchedule()">+ 추가</button>
    </div>
  </div>
</div>

<!-- ── 일기 ── -->

<div class="tab-content" id="tab-diary">
  <div class="card">
    <div class="card-header">
      <div class="card-icon" style="background:#f5f0fb">📓</div>
      <div>
        <div class="card-title">오늘의 일기</div>
        <div class="card-sub">매일 한 줄이라도</div>
      </div>
    </div>
    <div class="diary-date-nav">
      <button onclick="moveDiary(-1)">‹</button>
      <span id="diary-date-label"></span>
      <button onclick="moveDiary(1)">›</button>
    </div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px">오늘 기분</div>
    <div class="mood-picker" id="mood-picker">
      <span class="mood-opt" onclick="pickMood(this,'😞')" title="별로">😞</span>
      <span class="mood-opt" onclick="pickMood(this,'😐')" title="그냥">😐</span>
      <span class="mood-opt" onclick="pickMood(this,'🙂')" title="괜찮아">🙂</span>
      <span class="mood-opt" onclick="pickMood(this,'😄')" title="좋아">😄</span>
      <span class="mood-opt" onclick="pickMood(this,'🤩')" title="최고">🤩</span>
    </div>
    <textarea class="note-area" id="diary-input" placeholder="오늘 하루 어땠나요?..." style="min-height:120px"></textarea>
    <button class="diary-save-btn" onclick="saveDiary()">저장</button>
  </div>

  <div id="diary-history"></div>
</div>

<div class="toast" id="toast"></div>

<script>
// ── 날짜 ──
const KO_DAYS = ['일','월','화','수','목','금','토'];
const now = new Date();
document.getElementById('today-label').textContent =
  `${now.getFullYear()}. ${now.getMonth()+1}. ${now.getDate()}. ${KO_DAYS[now.getDay()]}요일`;

let weekOffset = 0;
function getWeekDates(off) {
  const d = new Date(); const dow = d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate() - (dow===0?6:dow-1) + off*7);
  return Array.from({length:7},(_,i)=>{ const x=new Date(mon); x.setDate(mon.getDate()+i); return x; });
}
function updateWeekLabel() {
  const [s,,,,,,e] = getWeekDates(weekOffset);
  document.getElementById('week-label').textContent = `${s.getMonth()+1}/${s.getDate()} — ${e.getMonth()+1}/${e.getDate()}`;
  const sub = document.getElementById('schedule-date-sub');
  if(sub) sub.textContent = `${s.getMonth()+1}/${s.getDate()} 주간`;
}
document.getElementById('prev-week').onclick = ()=>{ weekOffset--; updateWeekLabel(); };
document.getElementById('next-week').onclick = ()=>{ weekOffset++; updateWeekLabel(); };
updateWeekLabel();

// ── Tab ──
function switchTab(id) {
  document.querySelectorAll('.tab-btn').forEach((b,i)=>{
    b.classList.toggle('active', ['workout','finance','schedule','diary'][i]===id);
  });
  document.querySelectorAll('.tab-content').forEach(c=>{
    c.classList.toggle('active', c.id==='tab-'+id);
  });
}

// ── Toast ──
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

// ── 운동 ──
const defaultWorkouts = [
  { text: '수 — 자유 러닝 30분', done: false },
  { text: '목 — 피티 50분',      done: false },
];
let workouts = [...defaultWorkouts];

function renderWorkouts() {
  const list = document.getElementById('workout-list');
  list.innerHTML = '';
  workouts.forEach((w, i) => {
    const el = document.createElement('label');
    el.className = 'check-item' + (w.done ? ' done' : '');
    el.innerHTML = `
      <div class="check-box" style="${w.done ? 'background:var(--green);border-color:transparent;color:white;font-size:11px' : ''}">
        ${w.done ? '✓' : ''}
      </div>
      <span class="check-text">${w.text}</span>
      <button class="del-btn" onclick="delWorkout(event,${i})">×</button>`;
    el.onclick = (e) => { if(e.target.classList.contains('del-btn')) return; toggleWorkout(i); };
    list.appendChild(el);
  });
  updateWorkoutRing();
}

function toggleWorkout(i) {
  workouts[i].done = !workouts[i].done;
  renderWorkouts();
}
function delWorkout(e, i) {
  e.preventDefault(); e.stopPropagation();
  workouts.splice(i, 1); renderWorkouts();
}
function addWorkout() {
  const inp = document.getElementById('workout-add-input');
  const v = inp.value.trim();
  if (!v) return;
  workouts.push({ text: v, done: false });
  inp.value = '';
  renderWorkouts();
}
function updateWorkoutRing() {
  const done = workouts.filter(w=>w.done).length;
  const total = workouts.length;
  const pct = total ? Math.round(done/total*100) : 0;
  const circ = 157.1;
  document.getElementById('workout-ring').style.strokeDashoffset = circ - circ*pct/100;
  document.getElementById('workout-pct').textContent = pct+'%';
  document.getElementById('workout-done-big').textContent = `${done} / ${total}`;
  document.getElementById('workout-sub').textContent = `${done} / ${total} 완료`;
}
renderWorkouts();

// ── 수면 ──
function updateSleep() {
  const v = Math.min(12, Math.max(0, parseFloat(document.getElementById('sleep-input').value)||0));
  document.getElementById('sleep-lbl').textContent = v.toFixed(1)+'h';
  document.getElementById('sleep-bar').style.width = (v/12*100)+'%';
}

// ── 재정 ──
function calcFinance() {
  const inc = parseFloat(document.getElementById('inc-input').value)||0;
  const exp = parseFloat(document.getElementById('exp-input').value)||0;
  const goal = parseFloat(document.getElementById('save-goal-input').value)||0;
  const saved = Math.max(0, inc-exp);
  const pct = inc ? Math.round(saved/inc*100) : 0;
  document.getElementById('inc-disp').textContent = inc||'—';
  document.getElementById('exp-disp').textContent = exp||'—';
  document.getElementById('save-disp').textContent = inc ? pct+'%' : '—';
  const gp = goal ? Math.min(100, Math.round(saved/goal*100)) : 0;
  document.getElementById('save-goal-pct').textContent = gp+'%';
  document.getElementById('save-bar').style.width = gp+'%';
}

let expenses = [];
function addExpense() {
  const place = document.getElementById('expense-place').value.trim();
  const amt = parseFloat(document.getElementById('expense-amount').value)||0;
  if(!place) return;
  expenses.push({place, amt});
  document.getElementById('expense-place').value='';
  document.getElementById('expense-amount').value='';
  renderExpenses();
}
function renderExpenses() {
  const el = document.getElementById('expense-list');
  if(!expenses.length){ el.innerHTML='<div style="font-size:13px;color:var(--muted);padding:8px 0">아직 지출 내역이 없어요</div>'; return; }
  el.innerHTML = expenses.map((e,i)=>`
    <div class="schedule-item">
      <span class="schedule-text">${e.place}</span>
      <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--muted)">${e.amt ? e.amt.toLocaleString()+'만원' : ''}</span>
      <button class="del-btn" onclick="delExpense(${i})">×</button>
    </div>`).join('');
}
function delExpense(i){ expenses.splice(i,1); renderExpenses(); }
renderExpenses();

// ── 일정 ──
let schedules = [];
function addSchedule() {
  const time = document.getElementById('sch-time').value.trim();
  const text = document.getElementById('sch-text').value.trim();
  if(!text) return;
  schedules.push({time, text});
  schedules.sort((a,b)=>a.time.localeCompare(b.time));
  document.getElementById('sch-time').value='';
  document.getElementById('sch-text').value='';
  renderSchedules();
}
function delSchedule(i){ schedules.splice(i,1); renderSchedules(); }
function renderSchedules() {
  const el = document.getElementById('schedule-list');
  if(!schedules.length){ el.innerHTML='<div style="font-size:13px;color:var(--muted);padding:8px 0">일정이 없어요 — 아래에 추가해보세요</div>'; return; }
  el.innerHTML = schedules.map((s,i)=>`
    <div class="schedule-item">
      <span class="schedule-time">${s.time||'—'}</span>
      <span class="schedule-text">${s.text}</span>
      <button class="del-btn" onclick="delSchedule(${i})">×</button>
    </div>`).join('');
}
renderSchedules();

// ── 일기 ──
let diaryOffset = 0;
let diaries = {};
let pickedMood = '';

function getDiaryDate(off) {
  const d = new Date(); d.setDate(d.getDate()+off); return d;
}
function diaryKey(off) {
  const d = getDiaryDate(off);
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}
function updateDiaryDate() {
  const d = getDiaryDate(diaryOffset);
  document.getElementById('diary-date-label').textContent =
    `${d.getMonth()+1}월 ${d.getDate()}일 (${KO_DAYS[d.getDay()]})`;
  const key = diaryKey(diaryOffset);
  const saved = diaries[key];
  document.getElementById('diary-input').value = saved ? saved.text : '';
  pickedMood = saved ? saved.mood : '';
  document.querySelectorAll('.mood-opt').forEach(el=>{
    el.classList.toggle('picked', el.textContent===pickedMood);
  });
}
function moveDiary(d) { diaryOffset += d; updateDiaryDate(); }
function pickMood(el, m) {
  pickedMood = m;
  document.querySelectorAll('.mood-opt').forEach(e=>e.classList.remove('picked'));
  el.classList.add('picked');
}
function saveDiary() {
  const text = document.getElementById('diary-input').value.trim();
  if(!text) { toast('내용을 입력해주세요'); return; }
  const key = diaryKey(diaryOffset);
  const d = getDiaryDate(diaryOffset);
  diaries[key] = { text, mood: pickedMood,
    dateStr: `${d.getMonth()+1}월 ${d.getDate()}일 (${KO_DAYS[d.getDay()]})` };
  toast('저장됐어요 ✓');
  renderDiaryHistory();
}
function renderDiaryHistory() {
  const el = document.getElementById('diary-history');
  const entries = Object.values(diaries).slice().reverse();
  if(!entries.length){ el.innerHTML=''; return; }
  el.innerHTML = entries.map(e=>`
    <div class="card diary-entry">
      <div class="diary-entry-header">
        <span class="diary-entry-date">${e.dateStr}</span>
        <span class="diary-entry-mood">${e.mood||''}</span>
      </div>
      <div style="font-size:13px;line-height:1.8;white-space:pre-wrap">${e.text}</div>
    </div>`).join('');
}
updateDiaryDate();
</script>

</body>
</html>

/**
 * 학습 타이머
 * 공부 시간과 쉬는 시간을 입력하면 원형 시계 그림으로 진행 상황을 보여준다.
 * 12시 방향부터 시계방향으로 공부시간(빨강) -> 쉬는시간(회색) 순서로 배치하고,
 * 시간이 지날수록 지나간 부분부터 흰색으로 바뀐다.
 */

const CANVAS_SIZE = 280;
const CX = CANVAS_SIZE / 2;
const CY = CANVAS_SIZE / 2;
const R_OUTER = 130;
const R_INNER = 100;

const studyInput = document.getElementById('studyInput');
const breakInput = document.getElementById('breakInput');
const repeatCheck = document.getElementById('repeatCheck');
const toggleBtn = document.getElementById('toggleBtn');
const resetBtn = document.getElementById('resetBtn');
const phaseLabel = document.getElementById('phaseLabel');
const timeLabel = document.getElementById('timeLabel');
const canvas = document.getElementById('timerCanvas');
const ctx = canvas.getContext('2d');

let studySeconds = 50 * 60;
let breakSeconds = 10 * 60;
let totalSeconds = studySeconds + breakSeconds;
let elapsedSeconds = 0;
let timerState = 'idle'; // idle | running | paused | done
let intervalId = null;

/**
 * 값을 최소/최대 범위 안으로 제한한다.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 초를 "mm:ss" 형식 문자열로 바꾼다.
 */
function formatMMSS(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * 입력창의 공부/쉬는 시간, 반복 여부를 읽어 내부 상태(초 단위)로 반영한다.
 */
function readSettings() {
  const studyMin = clamp(Number(studyInput.value) || 50, 1, 999);
  const breakMin = clamp(Number(breakInput.value) || 10, 1, 999);
  studySeconds = studyMin * 60;
  breakSeconds = breakMin * 60;
  totalSeconds = studySeconds + breakSeconds;
}

/**
 * 총 분(minute) 수에 맞춰 눈금 숫자를 몇 분 간격으로 표시할지 정한다.
 */
function pickTickInterval(totalMin) {
  if (totalMin <= 20) return 2;
  if (totalMin <= 60) return 5;
  if (totalMin <= 120) return 10;
  return 15;
}

/**
 * 원 중심 기준 극좌표(각도, 반지름)를 캔버스 xy 좌표로 바꾼다.
 */
function polar(r, angle) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

/**
 * 0~1 사이 비율을 12시 방향(-90도)에서 시작해 시계 반대 방향으로 도는 캔버스 각도(라디안)로 바꾼다.
 */
function toAngle(frac) {
  return -Math.PI / 2 - frac * 2 * Math.PI;
}

/**
 * 안쪽 원판에 부채꼴(파이 조각)을 그린다.
 */
function drawSlice(fracStart, fracEnd, color) {
  if (fracEnd <= fracStart) return;
  ctx.beginPath();
  ctx.moveTo(CX, CY);
  ctx.arc(CX, CY, R_INNER, toAngle(fracStart), toAngle(fracEnd), true);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * 시계 전체(눈금 링 + 색칠된 원판 + 가운데 손잡이)를 다시 그린다.
 */
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 바깥 눈금 링 배경
  ctx.beginPath();
  ctx.arc(CX, CY, R_OUTER, 0, 2 * Math.PI);
  ctx.fillStyle = '#fbf8f2';
  ctx.fill();

  // 분 단위 눈금 + 숫자
  const totalMin = Math.max(1, Math.round(totalSeconds / 60));
  const tickInterval = pickTickInterval(totalMin);
  for (let m = 0; m < totalMin; m++) {
    const angle = toAngle(m / totalMin);
    const isMajor = m % tickInterval === 0;
    const outerP = polar(R_OUTER - 2, angle);
    const innerP = polar(R_OUTER - (isMajor ? 12 : 6), angle);

    ctx.beginPath();
    ctx.moveTo(outerP.x, outerP.y);
    ctx.lineTo(innerP.x, innerP.y);
    ctx.strokeStyle = isMajor ? '#777' : '#ccc';
    ctx.lineWidth = isMajor ? 2 : 1;
    ctx.stroke();

    if (isMajor) {
      const labelP = polar(R_OUTER - 24, angle);
      const label = (totalMin - m) % totalMin; // 눈금 숫자를 역순으로 표시
      ctx.fillStyle = '#666';
      ctx.font = '600 12px "Pretendard", "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(label), labelP.x, labelP.y);
    }
  }

  // 안쪽 원판 바탕(흰색)
  ctx.beginPath();
  ctx.arc(CX, CY, R_INNER, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#e5e0d5';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 남은 시간을 부채꼴로 표시 (지나간 부분은 흰 바탕 그대로 드러남)
  const studyFrac = studySeconds / totalSeconds;
  const elapsedFrac = timerState === 'idle' ? 0 : Math.min(1, elapsedSeconds / totalSeconds);

  if (elapsedFrac < studyFrac) {
    drawSlice(elapsedFrac, studyFrac, '#FF6B6B');
    drawSlice(studyFrac, 1, '#B0B0B0');
  } else {
    drawSlice(Math.max(elapsedFrac, studyFrac), 1, '#B0B0B0');
  }

  // 가운데 손잡이
  ctx.beginPath();
  ctx.arc(CX, CY, 11, 0, 2 * Math.PI);
  ctx.fillStyle = '#efe8d8';
  ctx.fill();
  ctx.strokeStyle = '#cfc6b0';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/**
 * 현재 상태(진행 단계, 남은 시간)에 맞춰 상태 문구를 갱신한다.
 */
function updateStatusText() {
  if (timerState === 'idle') {
    phaseLabel.textContent = '시작을 눌러주세요';
    phaseLabel.className = 'phase-label';
    timeLabel.textContent = formatMMSS(studySeconds);
    return;
  }
  if (timerState === 'done') {
    phaseLabel.textContent = '완료!';
    phaseLabel.className = 'phase-label phase-done';
    timeLabel.textContent = '00:00';
    return;
  }

  const inStudy = elapsedSeconds < studySeconds;
  const remainInPhase = inStudy ? studySeconds - elapsedSeconds : totalSeconds - elapsedSeconds;
  const phaseName = inStudy ? '공부 중' : '쉬는 시간';
  phaseLabel.textContent = timerState === 'paused' ? `일시정지 (${phaseName})` : phaseName;
  phaseLabel.className =
    'phase-label ' + (timerState === 'paused' ? 'phase-paused' : inStudy ? 'phase-study' : 'phase-break');
  timeLabel.textContent = formatMMSS(remainInPhase);
}

/**
 * 1초마다 호출되어 경과 시간을 늘리고, 반복 여부에 따라 종료 또는 순환 처리한다.
 */
function tick() {
  elapsedSeconds++;
  if (elapsedSeconds >= totalSeconds) {
    if (repeatCheck.checked) {
      elapsedSeconds = 0;
    } else {
      elapsedSeconds = totalSeconds;
      clearInterval(intervalId);
      intervalId = null;
      timerState = 'done';
      updateStatusText();
      render();
      return;
    }
  }
  updateStatusText();
  render();
}

/**
 * 타이머를 시작하거나(처음) 일시정지에서 다시 시작한다.
 */
function startTimer() {
  if (timerState === 'idle') {
    readSettings();
    elapsedSeconds = 0;
  }
  timerState = 'running';
  studyInput.disabled = true;
  breakInput.disabled = true;
  repeatCheck.disabled = true;
  toggleBtn.textContent = '일시정지';
  resetBtn.hidden = false;
  intervalId = setInterval(tick, 1000);
  updateStatusText();
  render();
}

/**
 * 타이머를 일시정지한다 (경과 시간은 유지).
 */
function pauseTimer() {
  timerState = 'paused';
  clearInterval(intervalId);
  intervalId = null;
  toggleBtn.textContent = '재개';
  updateStatusText();
}

/**
 * 타이머를 완전히 초기화하고 입력 화면으로 되돌린다.
 */
function resetTimer() {
  clearInterval(intervalId);
  intervalId = null;
  timerState = 'idle';
  elapsedSeconds = 0;
  studyInput.disabled = false;
  breakInput.disabled = false;
  repeatCheck.disabled = false;
  toggleBtn.textContent = '시작';
  resetBtn.hidden = true;
  readSettings();
  updateStatusText();
  render();
}

toggleBtn.addEventListener('click', () => {
  if (timerState === 'idle' || timerState === 'paused') {
    startTimer();
  } else if (timerState === 'running') {
    pauseTimer();
  }
});

resetBtn.addEventListener('click', resetTimer);

[studyInput, breakInput].forEach((el) => {
  el.addEventListener('input', () => {
    if (timerState !== 'idle') return;
    readSettings();
    updateStatusText();
    render();
  });
});

// 초기 화면: 기본값(공부 50분, 쉬는 10분)으로 미리 그려둔다.
readSettings();
updateStatusText();
render();

/**
 * 할 일 목록
 * 텍스트를 입력해 항목을 추가하고, 체크박스로 완료 처리(취소선+회색)하며,
 * 최대 15개까지 담을 수 있다.
 */
const MAX_TODOS = 15;

const todoInput = document.getElementById('todoInput');
const todoAddBtn = document.getElementById('todoAddBtn');
const todoListEl = document.getElementById('todoList');
const todoCountEl = document.getElementById('todoCount');
const todoClearBtn = document.getElementById('todoClearBtn');

let todos = []; // { id, text, done }
let todoIdSeq = 0;
let dragId = null; // 드래그로 순서를 옮기는 중인 항목의 id

const DRAG_HANDLE_SVG = `
  <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
    <circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" />
    <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
    <circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" />
  </svg>`;

/**
 * 할 일 목록 배열을 화면에 다시 그린다.
 */
function renderTodos() {
  todoListEl.innerHTML = '';

  if (todos.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'todo-empty';
    empty.textContent = '할 일을 추가해보세요';
    todoListEl.appendChild(empty);
  } else {
    todos.forEach((todo) => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (todo.done ? ' completed' : '') + (todo.id === dragId ? ' dragging' : '');
      li.innerHTML = `
        <span class="todo-drag" title="순서 변경">${DRAG_HANDLE_SVG}</span>
        <label class="todo-toggle">
          <input type="checkbox" class="todo-check" ${todo.done ? 'checked' : ''} />
          <span class="todo-text"></span>
        </label>
        <button class="todo-remove" title="삭제">✕</button>
      `;
      li.querySelector('.todo-text').textContent = todo.text;
      li.querySelector('.todo-check').addEventListener('change', () => toggleTodo(todo.id));
      li.querySelector('.todo-remove').addEventListener('click', () => removeTodo(todo.id));
      li.querySelector('.todo-drag').addEventListener('pointerdown', (e) => startTodoDrag(todo.id, e));
      todoListEl.appendChild(li);
    });
  }

  const atMax = todos.length >= MAX_TODOS;
  todoCountEl.textContent = `${todos.length}/${MAX_TODOS}`;
  todoInput.disabled = atMax;
  todoAddBtn.disabled = atMax;
}

/**
 * 입력창의 텍스트를 새 할 일로 추가한다. 빈 값이거나 최대 개수에 도달하면 무시한다.
 */
function addTodo() {
  const text = todoInput.value.trim();
  if (!text || todos.length >= MAX_TODOS) return;
  todos.push({ id: todoIdSeq++, text, done: false });
  todoInput.value = '';
  renderTodos();
}

/**
 * 할 일의 완료 상태를 토글한다.
 */
function toggleTodo(id) {
  const todo = todos.find((item) => item.id === id);
  if (todo) todo.done = !todo.done;
  renderTodos();
}

/**
 * 할 일 하나를 목록에서 삭제한다.
 */
function removeTodo(id) {
  todos = todos.filter((item) => item.id !== id);
  renderTodos();
}

/**
 * 드래그 손잡이를 눌렀을 때 순서 변경을 시작한다.
 */
function startTodoDrag(id, e) {
  e.preventDefault();
  dragId = id;
  renderTodos();
  window.addEventListener('pointermove', onTodoDragMove);
  window.addEventListener('pointerup', onTodoDragEnd);
}

/**
 * 드래그 중인 항목이 다른 항목의 세로 중앙선을 넘으면 배열 순서를 맞바꾼다.
 */
function onTodoDragMove(e) {
  if (dragId === null) return;
  const draggedIndex = todos.findIndex((item) => item.id === dragId);
  if (draggedIndex === -1) return;

  const items = Array.from(todoListEl.querySelectorAll('.todo-item'));
  for (let i = 0; i < items.length; i++) {
    if (i === draggedIndex) continue;
    const rect = items[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const crossedUp = i < draggedIndex && e.clientY < midY;
    const crossedDown = i > draggedIndex && e.clientY > midY;
    if (crossedUp || crossedDown) {
      const [moved] = todos.splice(draggedIndex, 1);
      todos.splice(i, 0, moved);
      renderTodos();
      break;
    }
  }
}

/**
 * 드래그를 끝내고 상태를 정리한다.
 */
function onTodoDragEnd() {
  dragId = null;
  window.removeEventListener('pointermove', onTodoDragMove);
  window.removeEventListener('pointerup', onTodoDragEnd);
  renderTodos();
}

todoAddBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});
todoClearBtn.addEventListener('click', () => {
  todos = [];
  renderTodos();
});

renderTodos();

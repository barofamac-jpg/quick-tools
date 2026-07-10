/**
 * Study Timer
 * Enter a study time and a break time to see progress on a circular clock face.
 * Starting at 12 o'clock and sweeping counter-clockwise, study time (red) comes
 * first, then break time (gray); elapsed time reveals white as it passes.
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
 * Clamps a value between min and max.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Formats seconds as an "mm:ss" string.
 */
function formatMMSS(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Reads the study/break minutes and repeat setting from the inputs into internal state (seconds).
 */
function readSettings() {
  const studyMin = clamp(Number(studyInput.value) || 50, 1, 999);
  const breakMin = clamp(Number(breakInput.value) || 10, 1, 999);
  studySeconds = studyMin * 60;
  breakSeconds = breakMin * 60;
  totalSeconds = studySeconds + breakSeconds;
}

/**
 * Picks how many minutes apart the tick labels should be, based on the total minutes.
 */
function pickTickInterval(totalMin) {
  if (totalMin <= 20) return 2;
  if (totalMin <= 60) return 5;
  if (totalMin <= 120) return 10;
  return 15;
}

/**
 * Converts polar coordinates (angle, radius) around the center into canvas x/y.
 */
function polar(r, angle) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

/**
 * Converts a 0-1 fraction into a canvas angle (radians) that starts at 12
 * o'clock (-90°) and sweeps counter-clockwise.
 */
function toAngle(frac) {
  return -Math.PI / 2 - frac * 2 * Math.PI;
}

/**
 * Draws a pie slice on the inner disk.
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
 * Redraws the whole clock face (tick ring + colored disk + center knob).
 */
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Outer tick ring background
  ctx.beginPath();
  ctx.arc(CX, CY, R_OUTER, 0, 2 * Math.PI);
  ctx.fillStyle = '#fbf8f2';
  ctx.fill();

  // Minute ticks + numbers
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
      const label = (totalMin - m) % totalMin; // tick numbers run in reverse
      ctx.fillStyle = '#666';
      ctx.font = '600 12px "Pretendard", "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(label), labelP.x, labelP.y);
    }
  }

  // Inner disk base (white)
  ctx.beginPath();
  ctx.arc(CX, CY, R_INNER, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#e5e0d5';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Show the remaining time as a pie slice (elapsed time shows through as white)
  const studyFrac = studySeconds / totalSeconds;
  const elapsedFrac = timerState === 'idle' ? 0 : Math.min(1, elapsedSeconds / totalSeconds);

  if (elapsedFrac < studyFrac) {
    drawSlice(elapsedFrac, studyFrac, '#FF6B6B');
    drawSlice(studyFrac, 1, '#B0B0B0');
  } else {
    drawSlice(Math.max(elapsedFrac, studyFrac), 1, '#B0B0B0');
  }

  // Center knob
  ctx.beginPath();
  ctx.arc(CX, CY, 11, 0, 2 * Math.PI);
  ctx.fillStyle = '#efe8d8';
  ctx.fill();
  ctx.strokeStyle = '#cfc6b0';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/**
 * Updates the status text to match the current state (phase, time remaining).
 */
function updateStatusText() {
  if (timerState === 'idle') {
    phaseLabel.textContent = 'Press start';
    phaseLabel.className = 'phase-label';
    timeLabel.textContent = formatMMSS(studySeconds);
    return;
  }
  if (timerState === 'done') {
    phaseLabel.textContent = 'Done!';
    phaseLabel.className = 'phase-label phase-done';
    timeLabel.textContent = '00:00';
    return;
  }

  const inStudy = elapsedSeconds < studySeconds;
  const remainInPhase = inStudy ? studySeconds - elapsedSeconds : totalSeconds - elapsedSeconds;
  const phaseName = inStudy ? 'Studying' : 'On break';
  phaseLabel.textContent = timerState === 'paused' ? `Paused (${phaseName})` : phaseName;
  phaseLabel.className =
    'phase-label ' + (timerState === 'paused' ? 'phase-paused' : inStudy ? 'phase-study' : 'phase-break');
  timeLabel.textContent = formatMMSS(remainInPhase);
}

/**
 * Called every second: advances elapsed time, and either finishes or loops
 * depending on the repeat setting.
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
 * Starts the timer (fresh) or resumes it from paused.
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
  toggleBtn.textContent = 'Pause';
  resetBtn.hidden = false;
  intervalId = setInterval(tick, 1000);
  updateStatusText();
  render();
}

/**
 * Pauses the timer (elapsed time is kept).
 */
function pauseTimer() {
  timerState = 'paused';
  clearInterval(intervalId);
  intervalId = null;
  toggleBtn.textContent = 'Resume';
  updateStatusText();
}

/**
 * Fully resets the timer back to the input screen.
 */
function resetTimer() {
  clearInterval(intervalId);
  intervalId = null;
  timerState = 'idle';
  elapsedSeconds = 0;
  studyInput.disabled = false;
  breakInput.disabled = false;
  repeatCheck.disabled = false;
  toggleBtn.textContent = 'Start';
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

// Initial screen: pre-render with the defaults (50 min study, 10 min break).
readSettings();
updateStatusText();
render();

/**
 * To-do list
 * Type text to add a task, tick a checkbox to mark it done (strikethrough +
 * gray), and hold up to 15 items.
 */
const MAX_TODOS = 15;

const todoInput = document.getElementById('todoInput');
const todoAddBtn = document.getElementById('todoAddBtn');
const todoListEl = document.getElementById('todoList');
const todoCountEl = document.getElementById('todoCount');
const todoClearBtn = document.getElementById('todoClearBtn');

let todos = []; // { id, text, done }
let todoIdSeq = 0;
let dragId = null; // id of the item currently being dragged to reorder

const DRAG_HANDLE_SVG = `
  <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
    <circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" />
    <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
    <circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" />
  </svg>`;

/**
 * Redraws the to-do list from the todos array.
 */
function renderTodos() {
  todoListEl.innerHTML = '';

  if (todos.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'todo-empty';
    empty.textContent = 'Add a task to get started';
    todoListEl.appendChild(empty);
  } else {
    todos.forEach((todo) => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (todo.done ? ' completed' : '') + (todo.id === dragId ? ' dragging' : '');
      li.innerHTML = `
        <span class="todo-drag" title="Reorder">${DRAG_HANDLE_SVG}</span>
        <label class="todo-toggle">
          <input type="checkbox" class="todo-check" ${todo.done ? 'checked' : ''} />
          <span class="todo-text"></span>
        </label>
        <button class="todo-remove" title="Remove">✕</button>
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
 * Adds the input text as a new to-do. Ignored if empty or at the max count.
 */
function addTodo() {
  const text = todoInput.value.trim();
  if (!text || todos.length >= MAX_TODOS) return;
  todos.push({ id: todoIdSeq++, text, done: false });
  todoInput.value = '';
  renderTodos();
}

/**
 * Toggles a to-do's completed state.
 */
function toggleTodo(id) {
  const todo = todos.find((item) => item.id === id);
  if (todo) todo.done = !todo.done;
  renderTodos();
}

/**
 * Removes one to-do from the list.
 */
function removeTodo(id) {
  todos = todos.filter((item) => item.id !== id);
  renderTodos();
}

/**
 * Starts reordering when the drag handle is pressed.
 */
function startTodoDrag(id, e) {
  e.preventDefault();
  dragId = id;
  renderTodos();
  window.addEventListener('pointermove', onTodoDragMove);
  window.addEventListener('pointerup', onTodoDragEnd);
}

/**
 * Swaps array order when the dragged item crosses another item's vertical midpoint.
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
 * Ends the drag and cleans up state.
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

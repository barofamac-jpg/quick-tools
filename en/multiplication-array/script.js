/**
 * Multiplication Array Visualizer
 * Enter two numbers to see a dot array, the commutative property (order doesn't
 * change the answer), and skip counting.
 */

const COLORS = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FF9A3C', '#C77DFF', '#FFD93D'];
const BASIC_DOT_COLOR = '#6BCB77';
const MIN_NUM = 1;
const MAX_NUM = 12;

const numAInput = document.getElementById('numA');
const numBInput = document.getElementById('numB');
const resultBadge = document.getElementById('resultBadge');
const errorMsg = document.getElementById('errorMsg');
const resultEl = document.getElementById('result');
const summaryCard = document.getElementById('summaryCard');
const arrayDisplay = document.getElementById('arrayDisplay');
const arrayLegend = document.getElementById('arrayLegend');
const commSection = document.getElementById('commSection');
const multiplesSection = document.getElementById('multiplesSection');

let currentMode = 'basic';
let current = null; // the last successfully visualized { a, b }

/**
 * Clamps a value between min and max.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Checks whether both inputs are integers within 1-12.
 */
function isValid(a, b) {
  return Number.isInteger(a) && Number.isInteger(b) && a >= MIN_NUM && a <= MAX_NUM && b >= MIN_NUM && b <= MAX_NUM;
}

/**
 * Reads the input values and updates the answer badge immediately. Shows a
 * question mark if out of range.
 */
function updateBadge() {
  const a = parseInt(numAInput.value, 10);
  const b = parseInt(numBInput.value, 10);
  resultBadge.textContent = isValid(a, b) ? String(a * b) : '?';
}

/**
 * Renders the multiplication equation card (e.g. 3 × 4 = 12).
 */
function renderSummary(a, b, product) {
  summaryCard.innerHTML = `
    <div class="summary-eq"><span class="num-a">${a}</span> × <span class="num-b">${b}</span> = <span class="num-c">${product}</span></div>
    <div class="summary-desc"><strong>${a} groups of ${b}</strong> makes <strong>${product}</strong> in total!</div>
  `;
}

/**
 * Renders the dot array and legend for the current mode (basic/color/group).
 * @param {number} a number of rows
 * @param {number} b number of columns
 * @param {string} mode "basic" | "color" | "group"
 */
function renderArray(a, b, mode) {
  let colLabels = '<div class="col-labels"><span class="row-label"></span>';
  for (let j = 1; j <= b; j++) colLabels += `<span class="col-label">${j}</span>`;
  colLabels += '</div>';

  let rows = '';
  for (let i = 0; i < a; i++) {
    const rowColor = mode === 'basic' ? BASIC_DOT_COLOR : COLORS[i % COLORS.length];
    let dots = '';
    for (let j = 0; j < b; j++) {
      const delay = (i * b + j) * 0.02;
      dots += `<span class="dot" style="background:${rowColor}; animation-delay:${delay.toFixed(2)}s"></span>`;
    }

    if (mode === 'group') {
      rows += `<div class="dot-row"><span class="row-label">${i + 1}</span><div class="dot-group">${dots}</div><span class="group-tag">${b}</span></div>`;
    } else {
      rows += `<div class="dot-row"><span class="row-label">${i + 1}</span>${dots}</div>`;
    }
  }

  arrayDisplay.innerHTML = `<div class="dot-array-wrap">${colLabels}${rows}</div>`;

  if (mode === 'color') {
    let legend = '';
    for (let i = 0; i < a; i++) {
      const c = COLORS[i % COLORS.length];
      legend += `<div class="legend-item"><span class="legend-dot" style="background:${c}"></span>Row ${i + 1} = ${b}</div>`;
    }
    arrayLegend.innerHTML = legend;
  } else if (mode === 'group') {
    arrayLegend.innerHTML = `<div class="legend-item"><span class="legend-dot" style="background:${BASIC_DOT_COLOR}"></span>Each dashed box = a group of ${b}, ${a} groups in total</div>`;
  } else {
    arrayLegend.innerHTML = `<div class="legend-item"><span class="legend-dot" style="background:${BASIC_DOT_COLOR}"></span>Each dot = 1</div>`;
  }
}

/**
 * Builds mini array (small dot grid) HTML.
 */
function miniArrayHTML(rows, cols, color) {
  let html = '<div class="mini-array">';
  for (let i = 0; i < rows; i++) {
    html += '<div class="mini-row">';
    for (let j = 0; j < cols; j++) {
      html += `<span class="mini-dot" style="background:${color}"></span>`;
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

/**
 * Renders the commutative property section (comparing a×b and b×a side by side).
 */
function renderCommutative(a, b, product) {
  commSection.innerHTML = `
    <h3>🔄 Same answer, different order! (Commutative Property)</h3>
    <div class="comm-visual">
      <div class="comm-box">
        <div class="comm-label" style="color:#FF6B6B">${a} × ${b}</div>
        ${miniArrayHTML(a, b, '#FF6B6B')}
      </div>
      <span class="swap-arrow">⇄</span>
      <div class="comm-box">
        <div class="comm-label" style="color:#4D96FF">${b} × ${a}</div>
        ${miniArrayHTML(b, a, '#4D96FF')}
      </div>
    </div>
    <div class="comm-explain">
      <strong>${a}×${b} = ${b}×${a} = ${product}</strong>! Swapping the order of the two numbers you multiply always gives the same answer. This is called the <strong>commutative property</strong>.
    </div>
  `;
}

/**
 * Renders the skip counting section: add b, a times, to reach the product.
 */
function renderMultiples(a, b, product) {
  let chips = '';
  for (let step = 1; step <= a; step++) {
    const value = b * step;
    const isLast = step === a;
    const delay = (step - 1) * 0.08;
    chips += `
      <span class="mult-chip${isLast ? ' highlight' : ''}" style="animation-delay:${delay.toFixed(2)}s; background:${isLast ? 'linear-gradient(135deg,#6BCB77,#4D96FF)' : '#eef6ff'}; color:${isLast ? '#fff' : '#4D96FF'}; border-color:${isLast ? 'transparent' : '#dbe9ff'}">
        <span class="step-label">×${step}</span>${value}
      </span>`;
  }

  multiplesSection.innerHTML = `
    <h3>🔢 Skip counting</h3>
    <p class="summary-desc" style="text-align:center;margin-bottom:14px">Counting by ${b}s, ${a} times, gets you to ${product}</p>
    <div class="multiples-track">${chips}</div>
    <div class="tip-box" id="tipBox"></div>
  `;

  renderTip(a, b);
}

/**
 * Picks a learning tip based on the input values.
 */
function renderTip(a, b) {
  const tipEl = document.getElementById('tipBox');
  if (!tipEl) return;

  const tips = [];
  if (a === b) {
    tips.push(`💡 Multiplying a number by itself is called <strong>squaring</strong>! ${a}×${a} is read as "${a} squared".`);
  }
  if (a === 1 || b === 1) {
    tips.push(`💡 Multiplying any number by <strong>1</strong> gives you that same number back!`);
  }
  tips.push(`💡 Multiplication is the same as adding a number over and over. ${a}×${b} is the same as adding ${b} together ${a} times!`);

  tipEl.innerHTML = tips.join('<br>');
}

/**
 * Validates the input and, if valid, renders the summary/array/commutative/skip-counting sections.
 * @param {boolean} scrollToResult whether to auto-scroll to the result section
 */
function visualize(scrollToResult = true) {
  const a = parseInt(numAInput.value, 10);
  const b = parseInt(numBInput.value, 10);

  if (!isValid(a, b)) {
    errorMsg.style.display = 'block';
    return;
  }
  errorMsg.style.display = 'none';

  current = { a, b };
  const product = a * b;

  renderSummary(a, b, product);
  renderArray(a, b, currentMode);
  renderCommutative(a, b, product);
  renderMultiples(a, b, product);

  resultEl.style.display = 'block';
  if (scrollToResult) {
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Resets the inputs to the default (3×4) and hides the result.
 */
function resetAll() {
  numAInput.value = 3;
  numBInput.value = 4;
  updateBadge();
  errorMsg.style.display = 'none';
  resultEl.style.display = 'none';
  current = null;
}

numAInput.addEventListener('input', updateBadge);
numBInput.addEventListener('input', updateBadge);

document.getElementById('btnVisualize').addEventListener('click', () => visualize());
document.getElementById('btnReset').addEventListener('click', resetAll);

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    numAInput.value = chip.dataset.a;
    numBInput.value = chip.dataset.b;
    updateBadge();
    visualize();
  });
});

document.querySelectorAll('.mode-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mode-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    currentMode = tab.dataset.mode;
    if (current) renderArray(current.a, current.b, currentMode);
  });
});

updateBadge();

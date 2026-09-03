/**
 * Arithmetic Worksheet Maker - problem generation and grading (English version)
 *
 * Builds random arithmetic problems for 6 difficulty levels (single-digit
 * addition/subtraction through fractions and decimals) and a test type
 * (cumulative / this level only), then renders them as an A4 worksheet.
 * Answers can be graded on screen, and the sheet can be printed or saved as PDF.
 *
 * This is a translated copy of /arithmetic-worksheet/script.js.
 */

/** Problems currently shown on screen. Reused for grading and the answer key. */
let currentProblems = [];

/** Returns a random integer between min and max (inclusive). */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Greatest common divisor. Used to reduce fraction answers. */
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

/* ── Per-level single-problem generators ────────────────
 * Each returns { expr: display HTML string, ans: answer string }.
 * Operators in expr are wrapped in <span class="operator"> for spacing.
 */

/** Level 1: single-digit addition (sum up to 18) */
function makeAdd1() {
  const a = getRandomInt(1, 9);
  const b = getRandomInt(1, 9);
  return { expr: `${a} <span class="operator">+</span> ${b}`, ans: `${a + b}` };
}
/** Level 1: subtraction within 20 */
function makeSub1() {
  const a = getRandomInt(3, 18);
  const b = getRandomInt(1, a - 1);
  return { expr: `${a} <span class="operator">-</span> ${b}`, ans: `${a - b}` };
}

/** Level 2: two-digit addition */
function makeAdd2() {
  const a = getRandomInt(15, 85);
  const b = getRandomInt(15, 85);
  return { expr: `${a} <span class="operator">+</span> ${b}`, ans: `${a + b}` };
}
/** Level 2: two-digit subtraction (kept non-negative) */
function makeSub2() {
  const a = getRandomInt(30, 99);
  const b = getRandomInt(10, a - 5);
  return { expr: `${a} <span class="operator">-</span> ${b}`, ans: `${a - b}` };
}
/** Level 2: addition/subtraction of three numbers */
function makeThreeNum() {
  const a = getRandomInt(12, 35);
  const b = getRandomInt(10, 30);
  const c = getRandomInt(10, 25);
  const type = getRandomInt(1, 3);
  if (type === 1) return { expr: `${a} <span class="operator">+</span> ${b} <span class="operator">+</span> ${c}`, ans: `${a + b + c}` };
  if (type === 2) return { expr: `${a + b} <span class="operator">-</span> ${b} <span class="operator">+</span> ${c}`, ans: `${a + c}` };
  return { expr: `${a + b + c} <span class="operator">-</span> ${b} <span class="operator">-</span> ${c}`, ans: `${a}` };
}

/** Level 3: multiplication within the times tables */
function makeMul1() {
  const a = getRandomInt(2, 9);
  const b = getRandomInt(2, 9);
  return { expr: `${a} <span class="operator">×</span> ${b}`, ans: `${a * b}` };
}
/** Level 3: two-digit × one-digit multiplication */
function makeMul2x1() {
  const a = getRandomInt(12, 89);
  const b = getRandomInt(3, 9);
  return { expr: `${a} <span class="operator">×</span> ${b}`, ans: `${a * b}` };
}

/** Level 4: basic exact division (divisor and quotient are one digit) */
function makeDiv1() {
  const b = getRandomInt(2, 9);
  const ans = getRandomInt(2, 9);
  return { expr: `${b * ans} <span class="operator">÷</span> ${b}`, ans: `${ans}` };
}
/** Level 4: division by a two-digit number (exact) */
function makeDiv2() {
  const b = getRandomInt(12, 35);
  const ans = getRandomInt(3, 15);
  return { expr: `${b * ans} <span class="operator">÷</span> ${b}`, ans: `${ans}` };
}

/** Level 5: mixed calculation with multiplication first */
function makeMixedNatural() {
  const a = getRandomInt(5, 20);
  const b = getRandomInt(2, 6);
  const c = getRandomInt(3, 8);
  return { expr: `${a} <span class="operator">+</span> (${b} <span class="operator">×</span> ${c})`, ans: `${a + b * c}` };
}

/** Level 6: addition of proper fractions with the same denominator */
function makeFracAddSame() {
  const denom = getRandomInt(5, 12);
  const num1 = getRandomInt(1, denom - 2);
  const num2 = getRandomInt(1, denom - num1);
  return { expr: `${num1}/${denom} <span class="operator">+</span> ${num2}/${denom}`, ans: `${num1 + num2}/${denom}` };
}
/** Level 6: addition of one-place decimals */
function makeDecAdd1() {
  const a = (getRandomInt(11, 89) / 10).toFixed(1);
  const b = (getRandomInt(11, 89) / 10).toFixed(1);
  const ans = (parseFloat(a) + parseFloat(b)).toFixed(1);
  return { expr: `${a} <span class="operator">+</span> ${b}`, ans: `${ans}` };
}
/** Level 6: product of two unit fractions */
function makeFracMul() {
  const d1 = getRandomInt(2, 6);
  const d2 = getRandomInt(2, 5);
  return { expr: `1/${d1} <span class="operator">×</span> 1/${d2}`, ans: `1/${d1 * d2}` };
}
/** Level 6: decimal × whole number */
function makeDecMul() {
  const a = (getRandomInt(12, 45) / 10).toFixed(1);
  const b = getRandomInt(2, 8);
  const ans = (parseFloat(a) * b).toFixed(1);
  return { expr: `${a} <span class="operator">×</span> ${b}`, ans: `${ans}` };
}
/** Level 6: proper fraction ÷ whole number (answer reduced) */
function makeFracDiv() {
  const d1 = getRandomInt(3, 9);
  const n1 = getRandomInt(1, d1 - 1);
  const d2 = getRandomInt(2, 5);
  const ansD = d1 * d2;
  const g = gcd(n1, ansD);
  return { expr: `${n1}/${d1} <span class="operator">÷</span> ${d2}`, ans: `${n1 / g}/${ansD / g}` };
}
/** Level 6: decimal ÷ whole number (exact) */
function makeDecDiv() {
  const ans = getRandomInt(2, 15);
  const b = getRandomInt(2, 8);
  const a = (ans * b / 10).toFixed(1);
  return { expr: `${a} <span class="operator">÷</span> ${b}`, ans: `${ans / 10}` };
}

/** Display names per level, used in the worksheet title. */
const LEVEL_NAMES = {
  1: 'Level 1 · Single-digit Addition & Subtraction',
  2: 'Level 2 · Two-digit Addition & Subtraction',
  3: 'Level 3 · Multiplication',
  4: 'Level 4 · Division',
  5: 'Level 5 · Mixed Operations',
  6: 'Level 6 · Fractions & Decimals',
};

/**
 * Builds one problem for the given difficulty level.
 * [level] level number, 1-6
 * Returns: { expr, ans }
 */
function makeOne(level) {
  const r = Math.random();
  if (level === 1) return r < 0.55 ? makeAdd1() : makeSub1();
  if (level === 2) {
    if (r < 0.4) return makeAdd2();
    if (r < 0.8) return makeSub2();
    return makeThreeNum();
  }
  if (level === 3) return r < 0.55 ? makeMul1() : makeMul2x1();
  if (level === 4) return r < 0.55 ? makeDiv1() : makeDiv2();
  if (level === 5) {
    if (r < 0.25) return makeAdd2();
    if (r < 0.45) return makeSub2();
    if (r < 0.6) return makeMul1();
    if (r < 0.75) return makeDiv1();
    return makeMixedNatural();
  }
  // Level 6
  if (r < 0.18) return makeFracAddSame();
  if (r < 0.36) return makeDecAdd1();
  if (r < 0.52) return makeFracMul();
  if (r < 0.68) return makeDecMul();
  if (r < 0.84) return makeFracDiv();
  return makeDecDiv();
}

/**
 * Builds the list of problems.
 * [level] chosen difficulty level (1-6)
 * [mode]  'cumulative' (mixes in earlier levels) or 'current' (this level only)
 * [count] number of problems
 * Returns: [{ expr, ans }, ...]
 */
function generateProblems(level, mode, count) {
  const problems = [];
  for (let i = 0; i < count; i++) {
    let lv = level;
    // In cumulative mode, about half the problems come from earlier levels for review.
    if (mode === 'cumulative' && level > 1 && Math.random() < 0.5) {
      lv = getRandomInt(1, level - 1);
    }
    problems.push(makeOne(lv));
  }
  return problems;
}

/**
 * Reads the current settings and renders the worksheet (problem page + answer key page).
 */
function generateWorkbook() {
  const level = parseInt(document.getElementById('level-select').value, 10);
  const mode = document.getElementById('mode-select').value;
  const count = parseInt(document.getElementById('count-select').value, 10);

  currentProblems = generateProblems(level, mode, count);

  const modeLabel = mode === 'cumulative' ? 'Cumulative Test' : 'Focused Test';
  const title = `✏️ ${LEVEL_NAMES[level]} — ${modeLabel}`;

  let html = `
    <div class="page">
      <div class="workbook-header">
        <h2>${title}</h2>
      </div>
      <div class="info-box">
        <span>Name: __________________</span>
        <span>Date: ____________</span>
        <span>Score: ________ / 100</span>
      </div>
      <div class="problem-grid">
  `;

  currentProblems.forEach((p, idx) => {
    html += `
      <div class="problem-item">
        <span class="problem-num">${idx + 1}.</span>
        <span>${p.expr} = </span>
        <input type="text" class="answer-input" id="input-${idx}" autocomplete="off" inputmode="text">
      </div>
    `;
  });

  html += `</div></div>`;

  // Answer key page (hidden on the web by default; shown on toggle or when printing)
  html += `
    <div class="answer-page-container" id="ans-container">
      <div class="page">
        <div class="workbook-header">
          <h2>🎯 Answer Key</h2>
        </div>
        <table class="answer-table">
          <thead>
            <tr>
              <th>No.</th><th>Answer</th>
              <th>No.</th><th>Answer</th>
              <th>No.</th><th>Answer</th>
            </tr>
          </thead>
          <tbody>
  `;

  const rows = Math.ceil(count / 3);
  for (let r = 0; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < 3; c++) {
      const idx = r + c * rows;
      if (idx < count) {
        html += `<td><b>${idx + 1}</b></td><td>${currentProblems[idx].ans}</td>`;
      } else {
        html += '<td>-</td><td>-</td>';
      }
    }
    html += '</tr>';
  }

  html += `</tbody></table></div></div>`;
  document.getElementById('pdf-area').innerHTML = html;
}

/** Shows or hides the answer key page. When shown, scrolls to it and moves focus there. */
function toggleAnswerPage() {
  const ansContainer = document.getElementById('ans-container');
  if (!ansContainer) return;
  const shown = ansContainer.classList.toggle('show');
  if (shown) {
    ansContainer.setAttribute('tabindex', '-1');
    ansContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    ansContainer.focus({ preventScroll: true });
  }
}

/** Compares typed answers with the key, marks them by color, and reports the score. */
function checkAnswers() {
  let correctCount = 0;
  currentProblems.forEach((p, idx) => {
    const input = document.getElementById(`input-${idx}`);
    if (!input) return;
    // Ignore whitespace differences (helps with fraction answers).
    const userVal = input.value.trim().replace(/\s+/g, '');
    if (userVal === p.ans) {
      input.className = 'answer-input correct';
      correctCount++;
    } else {
      input.className = 'answer-input wrong';
    }
  });
  alert(`Result: ${correctCount} out of ${currentProblems.length} correct!`);
}

/**
 * Opens the browser print dialog. Print and "Save as PDF" share this path.
 * (The @media print CSS strips the site chrome and leaves the two-column worksheet
 *  plus the answer key page; the user picks a printer or "Save as PDF".)
 */
function openPrintDialog() {
  window.print();
}

document.getElementById('btn-generate').addEventListener('click', generateWorkbook);
document.getElementById('btn-check').addEventListener('click', checkAnswers);
document.getElementById('btn-answer').addEventListener('click', toggleAnswerPage);
document.getElementById('btn-print').addEventListener('click', openPrintDialog);
document.getElementById('btn-pdf').addEventListener('click', openPrintDialog);

// Build a default worksheet on first load.
generateWorkbook();

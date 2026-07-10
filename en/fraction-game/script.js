/**
 * Fraction Practice Game
 * Shows two fractions as pie pictures for each level and asks which is bigger.
 * A correct answer shows comparison bars and a common-denominator explanation.
 */

const TOTAL_QUESTIONS = 10;
const MAX_LEVEL = 5;
const LEFT_COLOR = '#4D96FF';
const RIGHT_COLOR = '#FF6B6B';
const QUESTION_PROMPT = 'Pick the correct sign (>, =, <)';

const levelSelect = document.getElementById('levelSelect');
const levelLabel = document.getElementById('levelLabel');
const changeBtn = document.getElementById('changeBtn');
const gameScreen = document.getElementById('gameScreen');
const resultScreen = document.getElementById('resultScreen');
const progressLabel = document.getElementById('progressLabel');
const scoreLabel = document.getElementById('scoreLabel');
const questionPromptEl = document.getElementById('questionPrompt');
const symbolSlotEl = document.getElementById('symbolSlot');
const gtBtn = document.getElementById('gtBtn');
const eqBtn = document.getElementById('eqBtn');
const ltBtn = document.getElementById('ltBtn');
const symbolBtns = [gtBtn, eqBtn, ltBtn];
const leftPieEl = document.getElementById('leftPie');
const rightPieEl = document.getElementById('rightPie');
const leftLabelEl = document.getElementById('leftLabel');
const rightLabelEl = document.getElementById('rightLabel');
const explainEl = document.getElementById('explain');
const explainArrayEl = document.getElementById('explainArray');
const explainTextEl = document.getElementById('explainText');
const nextBtn = document.getElementById('nextBtn');
const resultScoreEl = document.getElementById('resultScore');
const resultMessageEl = document.getElementById('resultMessage');
const retryBtn = document.getElementById('retryBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const changeLevelBtn = document.getElementById('changeLevelBtn');

let currentLevel = 1;
let questionIndex = 0;
let score = 0;
let currentQuestion = null;
let answered = false;

/**
 * Picks a random integer between min and max (inclusive).
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a, b) {
  return (a / gcd(a, b)) * b;
}

/**
 * Generates two fractions { a/b , c/d } for the given level.
 * Level 1: same denominator (compare numerators only)
 * Level 2: same numerator, mostly unit fractions (smaller denominator wins)
 * Level 3: one denominator is a multiple of the other (easy common denominator)
 * Level 4: different denominators (2-9, needs a common denominator)
 * Level 5: wide denominator range (2-12), sometimes equivalent fractions
 * @param {number} level 1-5
 * Returns: { a, b, c, d }
 */
function generateFractionPair(level) {
  switch (level) {
    case 1: {
      const b = randomInt(3, 10);
      let a = randomInt(1, b - 1);
      let c = randomInt(1, b - 1);
      while (c === a) c = randomInt(1, b - 1);
      return { a, b, c, d: b };
    }
    case 2: {
      const a = randomInt(1, 4);
      let b = randomInt(2, 12);
      let d = randomInt(2, 12);
      while (d === b) d = randomInt(2, 12);
      return { a, b, c: a, d };
    }
    case 3: {
      const small = randomInt(2, 6);
      const big = Math.min(24, small * randomInt(2, 4));
      const smallFirst = Math.random() < 0.5;
      const b = smallFirst ? small : big;
      const d = smallFirst ? big : small;
      return { a: randomInt(1, b - 1), b, c: randomInt(1, d - 1), d };
    }
    case 4: {
      const b = randomInt(2, 9);
      let d = randomInt(2, 9);
      while (d === b) d = randomInt(2, 9);
      return { a: randomInt(1, b - 1), b, c: randomInt(1, d - 1), d };
    }
    case 5:
    default: {
      const b = randomInt(2, 12);
      if (Math.random() < 0.2) {
        const a = randomInt(1, b - 1);
        const k = randomInt(2, 3);
        return { a, b, c: a * k, d: b * k };
      }
      let d = randomInt(2, 12);
      return { a: randomInt(1, b - 1), b, c: randomInt(1, d - 1), d };
    }
  }
}

/**
 * Classifies the relationship between the two fractions (used for the explanation text).
 */
function classifyRelation(a, b, c, d) {
  if (b === d) return 'sameDenom';
  if (a === c) return 'sameNum';
  return 'different';
}

/**
 * Darkens a HEX color (used for pie slice borders).
 */
function darkenColor(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const r = Math.max(0, parseInt(c.slice(0, 2), 16) - 55);
  const g = Math.max(0, parseInt(c.slice(2, 4), 16) - 55);
  const bl = Math.max(0, parseInt(c.slice(4, 6), 16) - 55);
  return `rgb(${r},${g},${bl})`;
}

/**
 * Draws a fraction as a pie-slice SVG. Fills in n out of d slices with color.
 */
function drawPie(n, d, color) {
  const r = 40;
  const cx = 42, cy = 42;
  const size = 84;
  let paths = '';
  const sliceAngle = (2 * Math.PI) / d;

  for (let i = 0; i < d; i++) {
    const startAngle = i * sliceAngle - Math.PI / 2;
    const endAngle = startAngle + sliceAngle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = sliceAngle > Math.PI ? 1 : 0;
    const isFilled = i < n;
    const fill = isFilled ? color : '#ececec';
    const stroke = isFilled ? darkenColor(color) : '#bbb';
    paths += `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${fill}" stroke="${stroke}" stroke-width="2.2"/>`;
  }

  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${paths}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${darkenColor(color)}" stroke-width="2.5"/></svg>`;
}

/**
 * Builds the stacked numerator/denominator fraction notation HTML.
 */
function krFrac(n, d, color) {
  return `<span class="kr-frac" style="color:${color}">
    <span class="kf-num">${n}</span>
    <span class="kf-line"></span>
    <span class="kf-den">${d}</span>
  </span>`;
}

/**
 * Generates a new question and displays it.
 */
function generateQuestion() {
  const { a, b, c, d } = generateFractionPair(currentLevel);
  const leftCross = a * d;
  const rightCross = c * b;
  const correct = leftCross === rightCross ? 'equal' : leftCross > rightCross ? 'left' : 'right';
  currentQuestion = { a, b, c, d, correct };
  answered = false;

  progressLabel.textContent = `Question ${questionIndex + 1}/${TOTAL_QUESTIONS}`;
  scoreLabel.textContent = `Score ${score}/${TOTAL_QUESTIONS}`;
  explainEl.hidden = true;
  questionPromptEl.textContent = QUESTION_PROMPT;
  questionPromptEl.classList.remove('prompt-correct', 'prompt-wrong');

  leftLabelEl.innerHTML = krFrac(a, b, '#444');
  rightLabelEl.innerHTML = krFrac(c, d, '#444');
  symbolSlotEl.textContent = '?';
  symbolSlotEl.classList.remove('symbol-correct', 'symbol-reveal');

  symbolBtns.forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove('correct', 'wrong');
  });
}

/**
 * Builds two comparison bars for the fraction values (same style as the fraction visualizer).
 */
function buildCompareBars(a, b, c, d) {
  const rows = [
    { n: a, d: b, color: LEFT_COLOR },
    { n: c, d: d, color: RIGHT_COLOR },
  ];
  return rows
    .map(({ n, d: den, color }) => {
      const val = n / den;
      const fillPct = (val * 100).toFixed(1);
      let dividers = '';
      for (let k = 1; k < den; k++) {
        dividers += `<div style="position:absolute;top:0;bottom:0;left:${((k / den) * 100).toFixed(2)}%;width:2px;background:rgba(180,180,180,0.6);z-index:2;pointer-events:none"></div>`;
      }
      return `
        <div class="comp-row">
          <span class="comp-label">${krFrac(n, den, color)}</span>
          <div class="comp-track" style="position:relative;">
            <div class="comp-fill" style="background:${color}; width:${fillPct}%"></div>
            ${dividers}
          </div>
          <span class="comp-pct">${Math.round(val * 100)}%</span>
        </div>`;
    })
    .join('');
}

/**
 * Builds the sentence explaining why the answer is correct.
 */
function buildReasonText(a, b, c, d) {
  const relation = classifyRelation(a, b, c, d);
  if (relation === 'sameDenom') {
    return 'The denominators are the same, so the bigger numerator wins.';
  }
  if (relation === 'sameNum') {
    return 'The numerators are the same, so the smaller denominator wins. (It was split into fewer pieces!)';
  }
  const g = gcd(b, d);
  const lcd = (b / g) * d;
  const newA = a * (lcd / b);
  const newC = c * (lcd / d);
  return `With a common denominator, ${a}/${b} = ${newA}/${lcd} and ${c}/${d} = ${newC}/${lcd}, so you can compare them directly.`;
}

/**
 * Builds the correct/incorrect headline shown at the top of the result state.
 */
function buildResultHeadline(a, b, c, d, correct, isCorrect) {
  if (isCorrect) return 'Correct!';

  let answerText;
  if (correct === 'left') answerText = `The left fraction (${a}/${b}) is bigger.`;
  else if (correct === 'right') answerText = `The right fraction (${c}/${d}) is bigger.`;
  else answerText = 'The two fractions are equal.';

  return `Not quite. ${answerText}`;
}

/**
 * Grades the selected answer and shows the correct/wrong marks and picture explanation.
 */
function handleAnswer(side) {
  if (answered) return;
  answered = true;

  const { a, b, c, d, correct } = currentQuestion;
  const isCorrect = side === correct;
  if (isCorrect) score++;

  symbolBtns.forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.side === correct) btn.classList.add('correct');
    else if (btn.dataset.side === side) btn.classList.add('wrong');
  });

  const correctSymbol = correct === 'left' ? '>' : correct === 'right' ? '<' : '=';
  symbolSlotEl.textContent = correctSymbol;
  symbolSlotEl.classList.add(isCorrect ? 'symbol-correct' : 'symbol-reveal');

  scoreLabel.textContent = `Score ${score}/${TOTAL_QUESTIONS}`;
  questionPromptEl.textContent = buildResultHeadline(a, b, c, d, correct, isCorrect);
  questionPromptEl.classList.add(isCorrect ? 'prompt-correct' : 'prompt-wrong');
  leftPieEl.innerHTML = drawPie(a, b, LEFT_COLOR);
  rightPieEl.innerHTML = drawPie(c, d, RIGHT_COLOR);
  explainArrayEl.innerHTML = buildCompareBars(a, b, c, d);
  explainTextEl.textContent = buildReasonText(a, b, c, d);
  explainEl.hidden = false;
}

/**
 * Moves to the next question, or shows the result screen once all 10 are done.
 */
function goNext() {
  questionIndex++;
  if (questionIndex >= TOTAL_QUESTIONS) {
    showResult();
  } else {
    generateQuestion();
  }
}

/**
 * Shows the result screen with the score and an encouraging message.
 */
function showResult() {
  gameScreen.hidden = true;
  resultScreen.hidden = false;
  resultScoreEl.textContent = `${score}/${TOTAL_QUESTIONS}`;

  let message;
  if (score >= 9) message = "Perfect! You're a fraction master 🎉";
  else if (score >= 7) message = 'Great job! 👍';
  else if (score >= 4) message = "You're doing well, keep practicing 💪";
  else message = "Give it another try, you've got this! 🌱";
  resultMessageEl.textContent = message;

  nextLevelBtn.hidden = currentLevel >= MAX_LEVEL;
}

/**
 * Starts a new game at the selected level.
 */
function startLevel(level) {
  currentLevel = level;
  questionIndex = 0;
  score = 0;
  levelLabel.textContent = `Level ${level}`;
  levelSelect.hidden = true;
  resultScreen.hidden = true;
  gameScreen.hidden = false;
  generateQuestion();
}

document.querySelectorAll('.level-btn').forEach((btn) => {
  btn.addEventListener('click', () => startLevel(Number(btn.dataset.level)));
});

symbolBtns.forEach((btn) => {
  btn.addEventListener('click', () => handleAnswer(btn.dataset.side));
});
nextBtn.addEventListener('click', goNext);
changeBtn.addEventListener('click', () => {
  gameScreen.hidden = true;
  levelSelect.hidden = false;
});
retryBtn.addEventListener('click', () => startLevel(currentLevel));
nextLevelBtn.addEventListener('click', () => startLevel(Math.min(currentLevel + 1, MAX_LEVEL)));
changeLevelBtn.addEventListener('click', () => {
  resultScreen.hidden = true;
  levelSelect.hidden = false;
});

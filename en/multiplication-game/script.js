/**
 * Multiplication Game
 * Generates 10 multiplication questions from a level-specific number range,
 * explaining each answer with a dot array.
 */

const TOTAL_QUESTIONS = 10;

const levelSelect = document.getElementById('levelSelect');
const levelLabel = document.getElementById('levelLabel');
const changeBtn = document.getElementById('changeBtn');
const gameScreen = document.getElementById('gameScreen');
const resultScreen = document.getElementById('resultScreen');
const progressLabel = document.getElementById('progressLabel');
const scoreLabel = document.getElementById('scoreLabel');
const questionText = document.getElementById('questionText');
const choicesEl = document.getElementById('choices');
const explainEl = document.getElementById('explain');
const explainArrayEl = document.getElementById('explainArray');
const explainTextEl = document.getElementById('explainText');
const nextBtn = document.getElementById('nextBtn');
const resultScoreEl = document.getElementById('resultScore');
const resultMessageEl = document.getElementById('resultMessage');
const retryBtn = document.getElementById('retryBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const changeLevelBtn = document.getElementById('changeLevelBtn');
const MAX_LEVEL = 5;

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

/**
 * Generates two numbers (a, b) for the given level. Multiplying by 1 is
 * excluded at every level since it's too easy.
 * Level 1: 2-4 times table × 2-9
 * Level 2: 2-8 times table × 2-9
 * Level 3: two-digit × one-digit (2-9)
 * Level 4: two-digit × two-digit (one side an easy multiple of 10)
 * Level 5: two-digit × two-digit (no restriction, hardest)
 * @param {number} level 1-5
 * Returns: { a, b }
 */
function generateNumbersForLevel(level) {
  switch (level) {
    case 1:
      return { a: randomInt(2, 4), b: randomInt(2, 9) };
    case 2:
      return { a: randomInt(2, 8), b: randomInt(2, 9) };
    case 3:
      return { a: randomInt(10, 99), b: randomInt(2, 9) };
    case 4:
      return { a: randomInt(1, 9) * 10, b: randomInt(10, 30) };
    case 5:
      return { a: randomInt(10, 99), b: randomInt(10, 99) };
    default:
      return { a: randomInt(1, 9), b: randomInt(1, 9) };
  }
}

/**
 * Builds a 4-choice answer set with 3 plausible wrong answers mixed in.
 * @param {number} a first number
 * @param {number} b second number
 * @param {number} correct the correct answer (a*b)
 */
function buildChoices(a, b, correct) {
  const candidates = new Set([
    a * (b + 1),
    a * Math.max(1, b - 1),
    (a + 1) * b,
    correct + a,
    correct - a,
    correct + b,
    correct + 1,
    correct - 1,
  ]);
  candidates.delete(correct);
  const wrongPool = Array.from(candidates).filter((v) => v > 0);

  // Shuffle, then take 3.
  for (let i = wrongPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wrongPool[i], wrongPool[j]] = [wrongPool[j], wrongPool[i]];
  }
  const wrongs = wrongPool.slice(0, 3);
  while (wrongs.length < 3) {
    const filler = correct + wrongs.length + 2;
    if (!wrongs.includes(filler)) wrongs.push(filler);
  }

  const choices = [correct, ...wrongs];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

/**
 * Generates a new question and displays it.
 */
function generateQuestion() {
  const { a, b } = generateNumbersForLevel(currentLevel);
  const correct = a * b;
  currentQuestion = { a, b, correct };
  answered = false;

  questionText.textContent = `${a} × ${b} = ?`;
  progressLabel.textContent = `Question ${questionIndex + 1}/${TOTAL_QUESTIONS}`;
  scoreLabel.textContent = `Score ${score}/${TOTAL_QUESTIONS}`;
  explainEl.hidden = true;

  const choices = buildChoices(a, b, correct);
  choicesEl.innerHTML = '';
  choices.forEach((value) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = value;
    btn.addEventListener('click', () => handleAnswer(value, btn));
    choicesEl.appendChild(btn);
  });
}

/**
 * Builds a dot array of a rows and b columns. b dots per row, a rows total.
 */
function buildDotGrid(a, b) {
  let rows = '';
  for (let i = 0; i < b; i++) {
    let dots = '';
    for (let j = 0; j < a; j++) dots += '<span class="dot"></span>';
    rows += `<div class="dot-row">${dots}</div>`;
  }
  return rows;
}

/**
 * Splits a two-digit multiplication into "tens + ones" and explains it with
 * the distributive property. E.g. 6 × 14 = 6×10 + 6×4 = 60 + 24 = 84.
 */
function buildBreakdown(a, b) {
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  const tens = big - (big % 10);
  const ones = big % 10;
  const p1 = small * tens;
  const p2 = small * ones;
  const total = p1 + p2;

  let bar = '<div class="breakdown-bar">';
  if (tens > 0) {
    const pct = ((p1 / total) * 100).toFixed(1);
    bar += `<div class="seg seg-a" style="width:${pct}%">${small}×${tens}<br>${p1}</div>`;
  }
  if (ones > 0) {
    const pct = ((p2 / total) * 100).toFixed(1);
    bar += `<div class="seg seg-b" style="width:${pct}%">${small}×${ones}<br>${p2}</div>`;
  }
  bar += '</div>';

  const parts = [];
  if (tens > 0) parts.push(`${small}×${tens}`);
  if (ones > 0) parts.push(`${small}×${ones}`);
  const sums = [];
  if (tens > 0) sums.push(p1);
  if (ones > 0) sums.push(p2);

  const formula = `<div class="breakdown-formula">${small} × ${big} = ${parts.join(' + ')} = ${sums.join(' + ')} = ${total}</div>`;
  return `<div class="breakdown">${bar}${formula}</div>`;
}

/**
 * Picks a dot array (small numbers) or a distributive-property breakdown
 * (two-digit numbers) depending on the size of the numbers.
 */
function buildExplainVisual(a, b) {
  if (a <= 9 && b <= 9) return buildDotGrid(a, b);
  return buildBreakdown(a, b);
}

/**
 * Grades the selected answer and shows the correct/wrong marks and picture explanation.
 */
function handleAnswer(value, btnEl) {
  if (answered) return;
  answered = true;

  const { a, b, correct } = currentQuestion;
  const isCorrect = value === correct;
  if (isCorrect) score++;

  Array.from(choicesEl.children).forEach((btn) => {
    btn.disabled = true;
    const btnValue = Number(btn.textContent);
    if (btnValue === correct) btn.classList.add('correct');
    else if (btn === btnEl) btn.classList.add('wrong');
  });

  scoreLabel.textContent = `Score ${score}/${TOTAL_QUESTIONS}`;
  explainArrayEl.innerHTML = buildExplainVisual(a, b);
  explainTextEl.textContent = isCorrect
    ? `That's correct! ${a} × ${b} = ${correct}`
    : `Not quite. ${a} × ${b} = ${correct}`;
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
  if (score >= 9) message = 'Perfect! Amazing work 🎉';
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

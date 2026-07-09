/**
 * 곱셈 게임
 * 난이도별 숫자 범위에서 곱셈 문제를 10개 출제하고, 정답마다 점 배열로 설명해준다.
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
 * min~max 사이의 정수를 무작위로 뽑는다 (양 끝 포함).
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 난이도에 맞는 두 수(a, b)를 만든다. 1을 곱하는 문제는 너무 쉬워서 모든 레벨에서 제외한다.
 * 레벨1: 2~4단 × 2~9
 * 레벨2: 2~8단 × 2~9
 * 레벨3: 두 자리 수 × 한 자리 수(2~9)
 * 레벨4: 두 자리 수 × 두 자리 수 (한쪽이 10의 배수인 쉬운 조합)
 * 레벨5: 두 자리 수 × 두 자리 수 (제한 없는 어려운 조합)
 * @param {number} level 1~5
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
 * 정답을 포함해 그럴듯한 오답 3개를 섞은 4지선다 보기를 만든다.
 * @param {number} a 첫 번째 수
 * @param {number} b 두 번째 수
 * @param {number} correct 정답(a*b)
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

  // 무작위로 섞은 뒤 3개를 뽑는다.
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
 * 새 문제를 만들어 화면에 표시한다.
 */
function generateQuestion() {
  const { a, b } = generateNumbersForLevel(currentLevel);
  const correct = a * b;
  currentQuestion = { a, b, correct };
  answered = false;

  questionText.textContent = `${a} × ${b} = ?`;
  progressLabel.textContent = `문제 ${questionIndex + 1}/${TOTAL_QUESTIONS}`;
  scoreLabel.textContent = `맞은 개수 ${score}/${TOTAL_QUESTIONS}`;
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
 * a행 b열의 점 배열 그림 HTML을 만든다. 한 줄에 b개씩, 총 a줄이 생긴다.
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
 * 두 자리 수가 섞인 곱셈을 "몇십 + 몇"으로 갈라서 분배법칙으로 설명하는 그림을 만든다.
 * 예: 6 × 14 = 6×10 + 6×4 = 60 + 24 = 84
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
 * 숫자 크기에 따라 점 배열(작은 수) 또는 분배법칙 그림(두 자리 수)을 골라서 만든다.
 */
function buildExplainVisual(a, b) {
  if (a <= 9 && b <= 9) return buildDotGrid(a, b);
  return buildBreakdown(a, b);
}

/**
 * 선택한 답을 채점하고, 정답/오답 표시와 그림 설명을 보여준다.
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

  scoreLabel.textContent = `맞은 개수 ${score}/${TOTAL_QUESTIONS}`;
  explainArrayEl.innerHTML = buildExplainVisual(a, b);
  explainTextEl.textContent = isCorrect
    ? `정답이에요! ${a} × ${b} = ${correct}`
    : `아쉬워요. ${a} × ${b} = ${correct}예요`;
  explainEl.hidden = false;
}

/**
 * 다음 문제로 넘어가거나, 10문제를 다 풀었으면 결과 화면을 보여준다.
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
 * 결과 화면에 점수와 격려 메시지를 보여준다.
 */
function showResult() {
  gameScreen.hidden = true;
  resultScreen.hidden = false;
  resultScoreEl.textContent = `${score}/${TOTAL_QUESTIONS}점`;

  let message;
  if (score >= 9) message = '완벽해요! 정말 대단해요 🎉';
  else if (score >= 7) message = '아주 잘했어요! 👍';
  else if (score >= 4) message = '잘 하고 있어요, 계속 연습해봐요 💪';
  else message = '다시 도전해봐요, 할 수 있어요! 🌱';
  resultMessageEl.textContent = message;

  nextLevelBtn.hidden = currentLevel >= MAX_LEVEL;
}

/**
 * 선택한 난이도로 게임을 새로 시작한다.
 */
function startLevel(level) {
  currentLevel = level;
  questionIndex = 0;
  score = 0;
  levelLabel.textContent = `레벨 ${level}`;
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

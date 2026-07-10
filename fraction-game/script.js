/**
 * 분수 연습게임
 * 난이도별로 분수 두 개를 파이 그림으로 보여주고 어느 쪽이 더 큰지 맞히는 게임.
 * 정답을 맞히면 비교 막대 그림과 통분 설명으로 이유를 알려준다.
 */

const TOTAL_QUESTIONS = 10;
const MAX_LEVEL = 5;
const LEFT_COLOR = '#4D96FF';
const RIGHT_COLOR = '#FF6B6B';
const QUESTION_PROMPT = '알맞은 부호(>, =, <)를 골라보세요';

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
 * min~max 사이의 정수를 무작위로 뽑는다 (양 끝 포함).
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
 * 난이도에 맞는 분수 두 개 { a/b , c/d }를 만든다.
 * 레벨1: 분모가 같음 (분자만 비교)
 * 레벨2: 분자가 같음, 단위분수 위주 (분모가 작을수록 큼)
 * 레벨3: 분모 한쪽이 다른 쪽의 배수 (쉬운 통분)
 * 레벨4: 분모가 서로 다름 (2~9, 통분 필요)
 * 레벨5: 분모 범위가 넓고(2~12) 가끔 동치분수(크기가 같음)도 등장
 * @param {number} level 1~5
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
 * 두 분모/분자 관계를 분류한다 (설명 문구에 사용).
 */
function classifyRelation(a, b, c, d) {
  if (b === d) return 'sameDenom';
  if (a === c) return 'sameNum';
  return 'different';
}

/**
 * HEX 색상을 어둡게 만든다 (파이 조각 테두리에 사용).
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
 * 분수를 파이(원) 조각 SVG로 그린다. 분모 조각 중 분자만큼 색을 채운다.
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
 * 분자/분모를 위아래로 쌓은 세로 분수 표기 HTML을 만든다.
 */
function krFrac(n, d, color) {
  return `<span class="kr-frac" style="color:${color}">
    <span class="kf-num">${n}</span>
    <span class="kf-line"></span>
    <span class="kf-den">${d}</span>
  </span>`;
}

/**
 * 새 문제를 만들어 화면에 표시한다.
 */
function generateQuestion() {
  const { a, b, c, d } = generateFractionPair(currentLevel);
  const leftCross = a * d;
  const rightCross = c * b;
  const correct = leftCross === rightCross ? 'equal' : leftCross > rightCross ? 'left' : 'right';
  currentQuestion = { a, b, c, d, correct };
  answered = false;

  progressLabel.textContent = `문제 ${questionIndex + 1}/${TOTAL_QUESTIONS}`;
  scoreLabel.textContent = `맞은 개수 ${score}/${TOTAL_QUESTIONS}`;
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
 * 분수 값을 비교 막대 그림 2개로 만든다 (분수 시각화 도구와 같은 스타일).
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
 * 왜 그 답이 맞는지 설명하는 문장을 만든다.
 */
function buildReasonText(a, b, c, d) {
  const relation = classifyRelation(a, b, c, d);
  if (relation === 'sameDenom') {
    return '분모가 같으니 분자가 큰 쪽이 더 커요.';
  }
  if (relation === 'sameNum') {
    return '분자가 같으니 분모가 작을수록 더 커요. (더 적은 조각으로 나눴으니까요!)';
  }
  const g = gcd(b, d);
  const lcd = (b / g) * d;
  const newA = a * (lcd / b);
  const newC = c * (lcd / d);
  return `통분하면 ${a}/${b} = ${newA}/${lcd}, ${c}/${d} = ${newC}/${lcd}로 비교할 수 있어요.`;
}

/**
 * 결과 화면 상단에 보여줄 정답/오답 문구를 만든다.
 */
function buildResultHeadline(a, b, c, d, correct, isCorrect) {
  if (isCorrect) return '정답이에요!';

  let answerText;
  if (correct === 'left') answerText = `왼쪽 분수(${a}/${b})가 더 커요.`;
  else if (correct === 'right') answerText = `오른쪽 분수(${c}/${d})가 더 커요.`;
  else answerText = '두 분수는 크기가 같아요.';

  return `아쉬워요. ${answerText}`;
}

/**
 * 선택한 답을 채점하고, 정답/오답 표시와 그림 설명을 보여준다.
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

  scoreLabel.textContent = `맞은 개수 ${score}/${TOTAL_QUESTIONS}`;
  questionPromptEl.textContent = buildResultHeadline(a, b, c, d, correct, isCorrect);
  questionPromptEl.classList.add(isCorrect ? 'prompt-correct' : 'prompt-wrong');
  leftPieEl.innerHTML = drawPie(a, b, LEFT_COLOR);
  rightPieEl.innerHTML = drawPie(c, d, RIGHT_COLOR);
  explainArrayEl.innerHTML = buildCompareBars(a, b, c, d);
  explainTextEl.textContent = buildReasonText(a, b, c, d);
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
  if (score >= 9) message = '완벽해요! 분수 마스터네요 🎉';
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

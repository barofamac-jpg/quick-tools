/**
 * 곱셈 배열 시각화 도구
 * 두 수를 입력하면 점 배열, 교환법칙(순서를 바꿔도 답이 같음), 스킵 카운팅(건너뛰며 세기)을 보여준다.
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
let current = null; // 마지막으로 시각화에 성공한 {a, b}

/**
 * 값을 최소/최대 범위 안으로 제한한다.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 두 입력값이 1~12 범위의 정수인지 확인한다.
 */
function isValid(a, b) {
  return Number.isInteger(a) && Number.isInteger(b) && a >= MIN_NUM && a <= MAX_NUM && b >= MIN_NUM && b <= MAX_NUM;
}

/**
 * 입력창의 값을 읽어 답 배지를 즉시 갱신한다. 범위를 벗어나면 물음표를 보여준다.
 */
function updateBadge() {
  const a = parseInt(numAInput.value, 10);
  const b = parseInt(numBInput.value, 10);
  resultBadge.textContent = isValid(a, b) ? String(a * b) : '?';
}

/**
 * 곱셈식 카드(예: 3 × 4 = 12)를 그린다.
 */
function renderSummary(a, b, product) {
  summaryCard.innerHTML = `
    <div class="summary-eq"><span class="num-a">${a}</span> × <span class="num-b">${b}</span> = <span class="num-c">${product}</span></div>
    <div class="summary-desc"><strong>${b}개씩 ${a}묶음</strong>은 모두 <strong>${product}개</strong>예요!</div>
  `;
}

/**
 * 점 배열과 범례를 현재 모드(기본/행별 색깔/묶음)에 맞춰 그린다.
 * @param {number} a 행 개수
 * @param {number} b 열 개수
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
      rows += `<div class="dot-row"><span class="row-label">${i + 1}</span><div class="dot-group">${dots}</div><span class="group-tag">${b}개</span></div>`;
    } else {
      rows += `<div class="dot-row"><span class="row-label">${i + 1}</span>${dots}</div>`;
    }
  }

  arrayDisplay.innerHTML = `<div class="dot-array-wrap">${colLabels}${rows}</div>`;

  if (mode === 'color') {
    let legend = '';
    for (let i = 0; i < a; i++) {
      const c = COLORS[i % COLORS.length];
      legend += `<div class="legend-item"><span class="legend-dot" style="background:${c}"></span>${i + 1}번째 줄 = ${b}개</div>`;
    }
    arrayLegend.innerHTML = legend;
  } else if (mode === 'group') {
    arrayLegend.innerHTML = `<div class="legend-item"><span class="legend-dot" style="background:${BASIC_DOT_COLOR}"></span>점선 상자 하나 = ${b}개씩 묶은 것, 모두 ${a}묶음</div>`;
  } else {
    arrayLegend.innerHTML = `<div class="legend-item"><span class="legend-dot" style="background:${BASIC_DOT_COLOR}"></span>점 하나 = 1개</div>`;
  }
}

/**
 * 미니 배열(작은 점 그리드) HTML을 만든다.
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
 * 교환법칙 섹션(a×b와 b×a를 나란히 비교)을 그린다.
 */
function renderCommutative(a, b, product) {
  commSection.innerHTML = `
    <h3>🔄 순서를 바꿔도 똑같아요! (교환법칙)</h3>
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
      <strong>${a}×${b} = ${b}×${a} = ${product}</strong>이에요! 곱하는 두 수의 순서를 바꿔도 답은 항상 똑같아요. 이걸 <strong>교환법칙</strong>이라고 해요.
    </div>
  `;
}

/**
 * 스킵 카운팅(건너뛰며 세기) 섹션을 그린다. b를 a번 더해가며 답까지 도달한다.
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
    <h3>🔢 건너뛰며 세어보기 (스킵 카운팅)</h3>
    <p class="summary-desc" style="text-align:center;margin-bottom:14px">${b}씩 ${a}번 건너뛰며 세면 ${product}가 돼요</p>
    <div class="multiples-track">${chips}</div>
    <div class="tip-box" id="tipBox"></div>
  `;

  renderTip(a, b);
}

/**
 * 입력값에 따라 학습 팁을 골라 보여준다.
 */
function renderTip(a, b) {
  const tipEl = document.getElementById('tipBox');
  if (!tipEl) return;

  const tips = [];
  if (a === b) {
    tips.push(`💡 같은 수를 두 번 곱하는 것을 <strong>제곱</strong>이라고 해요! ${a}×${a}는 "${a}의 제곱"이라고 읽어요.`);
  }
  if (a === 1 || b === 1) {
    tips.push(`💡 어떤 수에 <strong>1을 곱하면</strong> 그 수가 그대로 나와요!`);
  }
  tips.push(`💡 곱셈은 같은 수를 여러 번 더하는 것과 같아요. ${a}×${b}는 ${b}를 ${a}번 더한 것과 같아요!`);

  tipEl.innerHTML = tips.join('<br>');
}

/**
 * 입력을 검증하고, 유효하면 요약/배열/교환법칙/스킵 카운팅을 모두 그린다.
 * @param {boolean} scrollToResult 결과 영역으로 자동 스크롤할지 여부
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
 * 입력을 기본값(3×4)으로 되돌리고 결과를 숨긴다.
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

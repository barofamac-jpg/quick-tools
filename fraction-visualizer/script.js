/**
 * 분수 시각화 도구
 * 분수를 입력하면 파이(원)와 막대 그림, 크기 비교 막대, 순위, 통분 설명까지 함께 보여준다.
 * 최대 6개까지 분수를 추가해 서로 비교할 수 있다.
 */

const COLORS = [
  { accent: '#FF6B6B', light: '#ffe5e5' },
  { accent: '#4D96FF', light: '#e5efff' },
  { accent: '#6BCB77', light: '#e5f8e7' },
  { accent: '#FF9A3C', light: '#fff0e0' },
  { accent: '#C77DFF', light: '#f3e5ff' },
  { accent: '#FFD93D', light: '#fffce5' },
];

const MAX_SLOTS = 6;

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

let slotCount = 0;

/**
 * 분수 입력 칸 하나를 만들어 목록에 추가한다.
 * @param {number|string} n 초기 분자값 (빈 값이면 '')
 * @param {number|string} d 초기 분모값 (빈 값이면 '')
 */
function createSlot(n = '', d = '') {
  const id = slotCount++;

  const container = document.getElementById('fracInputs');
  const div = document.createElement('div');
  div.className = 'fraction-slot';
  div.id = `slot-${id}`;
  div.innerHTML = `
    <label>분수</label>
    <div class="fraction-entry">
      <div class="frac-stack">
        <span class="fs-label">분자</span>
        <input type="number" min="0" max="999" placeholder="0" id="n-${id}" value="${n}" onkeydown="handleKey(event)">
        <div class="frac-hline"></div>
        <input type="number" min="1" max="999" placeholder="1" id="d-${id}" value="${d}" onkeydown="handleKey(event)">
        <span class="fs-label">분모</span>
      </div>
      <button class="btn-remove" onclick="removeSlot(${id})" title="삭제">✕</button>
    </div>
  `;

  const addBtn = document.getElementById('addBtn');
  if (addBtn) container.insertBefore(div, addBtn);
  else container.appendChild(div);

  updateLabels();
}

/**
 * 남아있는 분수 칸들의 번호를 다시 매기고, 칸이 1개뿐일 때는 삭제 버튼을 숨긴다.
 */
function updateLabels() {
  const activeSlots = document.querySelectorAll('.fraction-slot');
  activeSlots.forEach((s, i) => {
    const lbl = s.querySelector('label');
    if (lbl) lbl.textContent = `분수 ${i + 1}`;
    const rmBtn = s.querySelector('.btn-remove');
    if (rmBtn) rmBtn.style.display = activeSlots.length > 1 ? 'inline' : 'none';
  });
}

/**
 * 분수 입력 칸 하나를 제거한다.
 */
function removeSlot(id) {
  const el = document.getElementById(`slot-${id}`);
  if (el) el.remove();
  updateLabels();
  ensureAddButton();
}

/**
 * 분수 입력 칸을 추가한다 (최대 개수 도달 시 무시).
 */
function addSlot() {
  const count = document.querySelectorAll('.fraction-slot').length;
  if (count >= MAX_SLOTS) return;
  createSlot();
  ensureAddButton();
}

/**
 * 칸 개수에 따라 "분수 추가" 버튼을 보여주거나 없앤다.
 */
function ensureAddButton() {
  const container = document.getElementById('fracInputs');
  const existing = document.getElementById('addBtn');
  const count = document.querySelectorAll('.fraction-slot').length;

  if (count >= MAX_SLOTS) {
    if (existing) existing.remove();
    return;
  }
  if (!existing) {
    const btn = document.createElement('button');
    btn.className = 'btn-add';
    btn.id = 'addBtn';
    btn.onclick = addSlot;
    btn.innerHTML = '＋ 분수 추가';
    container.appendChild(btn);
  }
}

function handleKey(e) {
  if (e.key === 'Enter') visualize();
}

/**
 * 화면에 남아있는 모든 분수 입력값을 읽어온다. 숫자가 아닌 값은 건너뛴다.
 */
function getSlots() {
  const fracs = [];
  document.querySelectorAll('.fraction-slot').forEach((s) => {
    const id = s.id.replace('slot-', '');
    const n = parseInt(document.getElementById(`n-${id}`)?.value, 10);
    const d = parseInt(document.getElementById(`d-${id}`)?.value, 10);
    if (!isNaN(n) && !isNaN(d)) fracs.push({ n, d });
  });
  return fracs;
}

/**
 * 입력을 기본 상태(1/2, 1/5)로 되돌리고 결과를 숨긴다.
 */
function resetAll() {
  slotCount = 0;
  document.getElementById('fracInputs').innerHTML = '';
  document.getElementById('result').style.display = 'none';
  document.getElementById('errorMsg').style.display = 'none';
  createSlot(1, 2);
  createSlot(1, 5);
  ensureAddButton();
}

/**
 * 미리 정해둔 분수 조합으로 입력을 채우고 바로 시각화한다.
 * @param {{n:number, d:number}[]} examples 채울 분수 목록
 */
function loadExample(examples) {
  slotCount = 0;
  document.getElementById('fracInputs').innerHTML = '';
  document.getElementById('result').style.display = 'none';
  examples.forEach(({ n, d }) => createSlot(n, d));
  ensureAddButton();
  setTimeout(() => visualize(false), 100);
}

/**
 * HEX 색상을 어둡게 만든다 (파이 조각 테두리에 사용).
 */
function darkenColor(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const r = Math.max(0, parseInt(c.slice(0, 2), 16) - 55);
  const g = Math.max(0, parseInt(c.slice(2, 4), 16) - 55);
  const b = Math.max(0, parseInt(c.slice(4, 6), 16) - 55);
  return `rgb(${r},${g},${b})`;
}

/**
 * 분수를 파이(원) 조각 SVG로 그린다. 분모 조각 중 분자만큼 색을 채운다.
 */
function drawPie(n, d, color) {
  const r = 44;
  const cx = 45, cy = 45;
  const size = 90;
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
 * 입력된 모든 분수를 검증하고, 카드/비교 막대/순위/통분 설명을 그린다.
 * @param {boolean} scrollToResult 결과 영역으로 자동 스크롤할지 여부
 */
function visualize(scrollToResult = true) {
  const fracs = getSlots();
  const errEl = document.getElementById('errorMsg');

  if (fracs.length === 0 || fracs.some((f) => f.d < 1 || isNaN(f.n) || isNaN(f.d) || f.n < 0)) {
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';

  const values = fracs.map((f) => f.n / f.d);

  // ---- 분수 카드 ----
  const cardsEl = document.getElementById('fracCards');
  cardsEl.innerHTML = '';
  fracs.forEach(({ n, d }, i) => {
    const c = COLORS[i % COLORS.length];
    const val = n / d;
    const pct = Math.round(val * 100);
    const card = document.createElement('div');
    card.className = 'frac-card';
    card.style.cssText = `--accent:${c.accent}; animation-delay:${i * 0.07}s`;
    const barDividers = Array.from({ length: d - 1 }, (_, k) =>
      `<div style="position:absolute;top:0;bottom:0;left:${(((k + 1) / d) * 100).toFixed(2)}%;width:2px;background:rgba(0,0,0,0.15);z-index:2;pointer-events:none"></div>`
    ).join('');

    let explainText;
    if (n === 0) {
      explainText = `아무것도 없어요 😶`;
    } else if (n === d) {
      explainText = `전부 다! 딱 <strong>1</strong>이에요 🎉`;
    } else if (n === 1) {
      explainText = `피자를 <strong>${d}조각</strong>으로\n잘랐을 때 <strong>1조각</strong>이에요 🍕`;
    } else {
      explainText = `피자를 <strong>${d}조각</strong>으로\n잘라서 <strong>${n}조각</strong> 먹었어요 🍕`;
    }

    card.innerHTML = `
      <div class="frac-label">
        <span>${n}</span>
        <div class="frac-bar"></div>
        <span>${d}</span>
      </div>
      <div class="pie-explain">${explainText}</div>
      <div class="pie-wrap">${drawPie(n, d, c.accent)}</div>
      <div class="bar-track" style="position:relative;overflow:visible;">
        <div class="bar-fill" style="background:${c.accent}; width:${(val * 100).toFixed(1)}%"></div>
        ${barDividers}
      </div>
      <div class="frac-desc">전체를 <strong>${d}등분</strong>했을 때<br><strong>${n}칸</strong>만큼이에요<br><span style="color:${c.accent};font-weight:700">${pct}%</span></div>
    `;
    cardsEl.appendChild(card);
  });

  // ---- 크기 비교 막대 ----
  const barsEl = document.getElementById('compBars');
  barsEl.innerHTML = '';
  fracs.forEach(({ n, d }, i) => {
    const c = COLORS[i % COLORS.length];
    const val = n / d;
    const fillPct = (val * 100).toFixed(1);
    const row = document.createElement('div');
    row.className = 'comp-row';
    row.style.animationDelay = `${i * 0.08}s`;
    let dividers = '';
    for (let k = 1; k < d; k++) {
      dividers += `<div style="position:absolute;top:0;bottom:0;left:${((k / d) * 100).toFixed(2)}%;width:2px;background:rgba(180,180,180,0.6);z-index:2;pointer-events:none"></div>`;
    }
    row.innerHTML = `
      <span class="comp-label">${krFrac(n, d, c.accent)}</span>
      <div class="comp-track" style="position:relative;">
        <div class="comp-fill" style="background:${c.accent}; width:${fillPct}%"></div>
        ${dividers}
      </div>
      <span class="comp-pct">${Math.round(val * 100)}%</span>
    `;
    barsEl.appendChild(row);
  });

  // ---- 크기 순위 ----
  const sorted = fracs.map((f, i) => ({ ...f, val: f.n / f.d, i })).sort((a, b) => a.val - b.val);

  const rankEl = document.getElementById('rankDisplay');
  rankEl.innerHTML = '';
  sorted.forEach((f, si) => {
    const c = COLORS[f.i % COLORS.length];
    const span = document.createElement('span');
    span.className = 'rank-item';
    span.style.cssText = `--accent:${c.accent}; border-color:${c.accent}; color:${c.accent}`;
    span.innerHTML = krFrac(f.n, f.d, c.accent);
    rankEl.appendChild(span);

    if (si < sorted.length - 1) {
      const sig = document.createElement('span');
      sig.className = 'rank-sign';
      const nextVal = sorted[si + 1].val;
      sig.textContent = f.val === nextVal ? ' = ' : ' < ';
      rankEl.appendChild(sig);
    }
  });

  // ---- 학습 팁 ----
  const tipEl = document.getElementById('tipBox');
  const tips = [];

  const allUnit = fracs.every((f) => f.n === 1);
  if (allUnit && fracs.length >= 2) {
    tips.push(`💡 <strong>단위분수(분자가 1인 분수)</strong>는 분모가 클수록 오히려 더 작아요! 피자를 많은 사람이 나눠 먹을수록 한 조각이 작아지는 것과 같아요.`);
  }

  const allSameDenom = fracs.every((f) => f.d === fracs[0].d);
  if (allSameDenom && fracs.length >= 2) {
    tips.push(`💡 분모가 같을 때는 <strong>분자가 클수록 더 큰 분수</strong>예요!`);
  }

  const hasEquivalent = sorted.some((f, i) => i > 0 && f.val === sorted[i - 1].val);
  if (hasEquivalent) {
    tips.push(`✨ 크기가 같은 분수가 있어요! 이런 분수를 <strong>동치분수</strong>라고 해요.`);
  }

  if (tips.length === 0) {
    tips.push(`💡 분수는 전체를 같은 크기로 나눴을 때, 그 중 몇 개인지를 나타내요. 분모는 <em>나눈 칸 수</em>, 분자는 <em>색칠한 칸 수</em>예요!`);
  }

  tipEl.innerHTML = tips.join('<br>');

  // ---- 통분 설명 ----
  const cdBox = document.getElementById('commonDenomBox');
  const allSameNum = fracs.length >= 2 && fracs.every((f) => f.n === fracs[0].n);
  const needCommonDenom = fracs.length >= 2 && !allSameDenom && !allSameNum;

  if (needCommonDenom) {
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const lcm = (a, b) => (a / gcd(a, b)) * b;
    const lcd = fracs.reduce((acc, f) => lcm(acc, f.d), 1);

    const converted = fracs.map((f, i) => ({
      ...f,
      newN: f.n * (lcd / f.d),
      mult: lcd / f.d,
      color: COLORS[i % COLORS.length].accent,
    }));

    const barsHtml = converted
      .map((f) => {
        const fillPct = ((f.newN / lcd) * 100).toFixed(1);
        const divs = Array.from({ length: lcd - 1 }, (_, k) =>
          `<div class="cd-bar-divider" style="left:${(((k + 1) / lcd) * 100).toFixed(2)}%"></div>`
        ).join('');
        return `
          <div class="cd-bar-row">
            <span class="cd-bar-label" style="color:${f.color}">${f.newN}/${lcd}</span>
            <div class="cd-bar-track">
              <div class="cd-bar-fill" style="background:${f.color};width:${fillPct}%"></div>
              ${divs}
            </div>
          </div>`;
      })
      .join('');

    const conversionHtml = converted
      .map(
        (f) => `<span class="cd-highlight" style="border-color:${f.color}">
        <span class="kr-frac" style="color:${f.color};font-size:0.85rem">
          <span class="kf-num" style="font-size:0.9rem">${f.n}</span>
          <span class="kf-line" style="width:18px;height:2px;background:${f.color}"></span>
          <span class="kf-den" style="font-size:0.9rem">${f.d}</span>
        </span>
        <span style="margin:0 4px;color:#aaa">→</span>
        <span class="kr-frac" style="color:${f.color};font-size:0.85rem">
          <span class="kf-num" style="font-size:0.9rem">${f.newN}</span>
          <span class="kf-line" style="width:18px;height:2px;background:${f.color}"></span>
          <span class="kf-den" style="font-size:0.9rem">${lcd}</span>
        </span>
      </span>`
      )
      .join('<span class="cd-arrow" style="margin:0 4px"> , </span>');

    cdBox.innerHTML = `
      <div class="cd-title">🔢 분모를 같게 만들어 비교해 볼까요? (통분)</div>
      <div class="cd-intro">
        분자와 분모가 모두 다른 분수는 크기를 바로 비교하기 어려워요.<br>
        <strong>분모를 똑같이 맞추면</strong> 분자만 보고 크기를 쉽게 알 수 있어요!<br>
        마치 사과와 귤을 같은 접시에 올려야 개수를 비교하기 쉬운 것처럼요. 🍎🍊
      </div>
      <div class="cd-steps">
        <div class="cd-step">
          <span class="cd-step-num">1</span>
          <strong>공통분모 찾기</strong>: 모든 분모의 최소공배수를 구해요.<br>
          분모 ${fracs.map((f) => `<strong>${f.d}</strong>`).join(', ')}의 최소공배수 = <strong>${lcd}</strong>
        </div>
        <div class="cd-step">
          <span class="cd-step-num">2</span>
          <strong>분모를 ${lcd}로 바꾸기</strong>: 분모에 곱한 수를 분자에도 똑같이 곱해요.<br>
          (분자와 분모에 같은 수를 곱해도 크기는 변하지 않아요! ✅)<br>
          <div class="cd-frac-row">${conversionHtml}</div>
        </div>
        <div class="cd-step">
          <span class="cd-step-num">3</span>
          <strong>분모가 같으니 이제 분자만 비교!</strong><br>
          <div class="cd-bars">${barsHtml}</div>
        </div>
      </div>
    `;
    cdBox.style.display = 'block';
  } else {
    cdBox.style.display = 'none';
  }

  const resultEl = document.getElementById('result');
  resultEl.style.display = 'block';
  if (scrollToResult) {
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// 초기 화면: 기본 분수 두 개(1/2, 1/5)를 미리 채워둔다.
createSlot(1, 2);
createSlot(1, 5);
ensureAddButton();

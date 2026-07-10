/**
 * Fraction Visualizer
 * Enter fractions to see pie/bar pictures, size comparison bars, ranking,
 * and a common-denominator explanation. Up to 6 fractions can be compared.
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
 * Builds the stacked numerator/denominator fraction notation HTML.
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
 * Creates one fraction input slot and adds it to the list.
 * @param {number|string} n initial numerator (empty string if blank)
 * @param {number|string} d initial denominator (empty string if blank)
 */
function createSlot(n = '', d = '') {
  const id = slotCount++;

  const container = document.getElementById('fracInputs');
  const div = document.createElement('div');
  div.className = 'fraction-slot';
  div.id = `slot-${id}`;
  div.innerHTML = `
    <label>Fraction</label>
    <div class="fraction-entry">
      <div class="frac-stack">
        <span class="fs-label">Num</span>
        <input type="number" min="0" max="999" placeholder="0" id="n-${id}" value="${n}" onkeydown="handleKey(event)">
        <div class="frac-hline"></div>
        <input type="number" min="1" max="999" placeholder="1" id="d-${id}" value="${d}" onkeydown="handleKey(event)">
        <span class="fs-label">Den</span>
      </div>
      <button class="btn-remove" onclick="removeSlot(${id})" title="Remove">✕</button>
    </div>
  `;

  const addBtn = document.getElementById('addBtn');
  if (addBtn) container.insertBefore(div, addBtn);
  else container.appendChild(div);

  updateLabels();
}

/**
 * Renumbers the remaining fraction slots and hides the remove button when
 * only one slot is left.
 */
function updateLabels() {
  const activeSlots = document.querySelectorAll('.fraction-slot');
  activeSlots.forEach((s, i) => {
    const lbl = s.querySelector('label');
    if (lbl) lbl.textContent = `Fraction ${i + 1}`;
    const rmBtn = s.querySelector('.btn-remove');
    if (rmBtn) rmBtn.style.display = activeSlots.length > 1 ? 'inline' : 'none';
  });
}

/**
 * Removes one fraction input slot.
 */
function removeSlot(id) {
  const el = document.getElementById(`slot-${id}`);
  if (el) el.remove();
  updateLabels();
  ensureAddButton();
}

/**
 * Adds a fraction input slot (ignored once the max is reached).
 */
function addSlot() {
  const count = document.querySelectorAll('.fraction-slot').length;
  if (count >= MAX_SLOTS) return;
  createSlot();
  ensureAddButton();
}

/**
 * Shows or removes the "Add fraction" button depending on the slot count.
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
    btn.innerHTML = '＋ Add fraction';
    container.appendChild(btn);
  }
}

function handleKey(e) {
  if (e.key === 'Enter') visualize();
}

/**
 * Reads all fraction input values still on screen. Skips non-numeric values.
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
 * Resets the inputs to the default state (1/2, 1/5) and hides the result.
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
 * Fills the inputs with a preset combination of fractions and visualizes right away.
 * @param {{n:number, d:number}[]} examples the fractions to fill in
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
 * Darkens a HEX color (used for pie slice borders).
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
 * Draws a fraction as a pie-slice SVG. Fills in n out of d slices with color.
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
 * Validates all entered fractions and renders the cards/comparison bars/ranking/
 * common-denominator explanation.
 * @param {boolean} scrollToResult whether to auto-scroll to the result section
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

  // ---- fraction cards ----
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
      explainText = `There's nothing here 😶`;
    } else if (n === d) {
      explainText = `All of it! That's exactly <strong>1</strong> 🎉`;
    } else if (n === 1) {
      explainText = `Cut into <strong>${d} slices</strong>,\nthis is <strong>1 slice</strong> 🍕`;
    } else {
      explainText = `Cut into <strong>${d} slices</strong>,\nyou ate <strong>${n} of them</strong> 🍕`;
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
      <div class="frac-desc">Split into <strong>${d} equal parts</strong><br>this is <strong>${n} of them</strong><br><span style="color:${c.accent};font-weight:700">${pct}%</span></div>
    `;
    cardsEl.appendChild(card);
  });

  // ---- comparison bars ----
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

  // ---- ranking ----
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

  // ---- learning tips ----
  const tipEl = document.getElementById('tipBox');
  const tips = [];

  const allUnit = fracs.every((f) => f.n === 1);
  if (allUnit && fracs.length >= 2) {
    tips.push(`💡 A <strong>unit fraction</strong> (numerator of 1) actually gets <strong>smaller</strong> as the denominator gets bigger! It's just like how one slice gets smaller the more people share the same pizza.`);
  }

  const allSameDenom = fracs.every((f) => f.d === fracs[0].d);
  if (allSameDenom && fracs.length >= 2) {
    tips.push(`💡 When the denominators are the same, <strong>the bigger numerator wins</strong>!`);
  }

  const hasEquivalent = sorted.some((f, i) => i > 0 && f.val === sorted[i - 1].val);
  if (hasEquivalent) {
    tips.push(`✨ Some of these fractions are equal in size! These are called <strong>equivalent fractions</strong>.`);
  }

  if (tips.length === 0) {
    tips.push(`💡 A fraction shows how many equal parts you have out of a whole. The denominator is <em>how many parts the whole is split into</em>, and the numerator is <em>how many parts are colored in</em>!`);
  }

  tipEl.innerHTML = tips.join('<br>');

  // ---- common denominator explanation ----
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
      <div class="cd-title">🔢 Let's make the denominators match to compare! (Common Denominator)</div>
      <div class="cd-intro">
        Fractions with both different numerators and denominators are hard to compare directly.<br>
        <strong>If you make the denominators match</strong>, you can compare them just by looking at the numerators!<br>
        It's like putting apples and oranges on the same plate so you can count them side by side. 🍎🍊
      </div>
      <div class="cd-steps">
        <div class="cd-step">
          <span class="cd-step-num">1</span>
          <strong>Find a common denominator</strong>: find the least common multiple of all the denominators.<br>
          Least common multiple of ${fracs.map((f) => `<strong>${f.d}</strong>`).join(', ')} = <strong>${lcd}</strong>
        </div>
        <div class="cd-step">
          <span class="cd-step-num">2</span>
          <strong>Change the denominator to ${lcd}</strong>: multiply the numerator by the same number you multiplied the denominator by.<br>
          (Multiplying both the numerator and denominator by the same number doesn't change the fraction's value! ✅)<br>
          <div class="cd-frac-row">${conversionHtml}</div>
        </div>
        <div class="cd-step">
          <span class="cd-step-num">3</span>
          <strong>Now that the denominators match, just compare the numerators!</strong><br>
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

// Initial screen: pre-fill two default fractions (1/2, 1/5).
createSlot(1, 2);
createSlot(1, 5);
ensureAddButton();

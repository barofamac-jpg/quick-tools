/**
 * 분수 시각화 도구
 * 분수를 파이(원)와 막대 두 가지 모양으로 보여주고, 최대 3개까지 나란히 비교한다.
 */

const translations = {
  ko: {
    pageTitle: "분수 시각화 도구",
    appTitle: "분수 시각화 도구",
    appSubtitle: "분수를 눈으로 보고 비교해보세요.",
    metaDescription: "분수를 그림으로 보여주고 최대 3개까지 비교할 수 있는 무료 온라인 도구입니다.",
    addFractionBtn: "+ 분수 추가",
    presetsLabel: "추천 분수",
    removeAria: "분수 삭제",
  },
  en: {
    pageTitle: "Fraction Visualizer",
    appTitle: "Fraction Visualizer",
    appSubtitle: "See and compare fractions visually.",
    metaDescription: "A free online tool that shows fractions as pictures and compares up to 3 at once.",
    addFractionBtn: "+ Add Fraction",
    presetsLabel: "Quick Picks",
    removeAria: "Remove fraction",
  },
};

/**
 * 브라우저 언어를 읽어 지원하는 언어 코드로 매핑한다. 미지원 언어는 영어로 대체한다.
 * Returns: "ko" 또는 "en"
 */
function detectLanguage() {
  const browserLang = (navigator.language || "en").toLowerCase();
  return browserLang.startsWith("ko") ? "ko" : "en";
}

const currentLang = detectLanguage();
const t = translations[currentLang];

/**
 * data-i18n 속성이 붙은 요소와 메타 태그를 현재 언어로 채운다.
 */
function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.title = t.pageTitle;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
  });
  setMetaContent('meta[name="description"]', t.metaDescription);
  setMetaContent('meta[property="og:title"]', t.appTitle);
  setMetaContent('meta[property="og:description"]', t.metaDescription);
  setMetaContent('meta[name="twitter:title"]', t.appTitle);
  setMetaContent('meta[name="twitter:description"]', t.metaDescription);
}

function setMetaContent(selector, content) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute("content", content);
}

applyTranslations();

// ---- 분수 상태 관리 ----

const MAX_FRACTIONS = 3;
const MIN_FRACTIONS = 1;
const DEN_MIN = 1;
const DEN_MAX = 12;
const CARD_COLORS = ["#6c7cff", "#ff8a65", "#4caf50"];

let nextId = 3;
let fractions = [
  { id: 1, numerator: 1, denominator: 2 },
  { id: 2, numerator: 1, denominator: 3 },
];

const cardsContainer = document.getElementById("fractionCards");
const addFractionBtn = document.getElementById("addFractionBtn");

/**
 * 값을 최소/최대 범위 안으로 제한한다.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 분수를 파이(원) 조각 SVG 문자열로 만든다. 분모 조각 중 분자만큼 색을 채운다.
 * @param {number} numerator 분자
 * @param {number} denominator 분모
 * @param {string} color 채울 색상
 */
function pieSVG(numerator, denominator, color) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  if (denominator === 1) {
    const fill = numerator >= 1 ? color : "#f0f0f0";
    return `<svg viewBox="0 0 ${size} ${size}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="#fff" stroke-width="2"/></svg>`;
  }

  let paths = "";
  for (let i = 0; i < denominator; i++) {
    const a0 = (i / denominator) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / denominator) * 2 * Math.PI - Math.PI / 2;
    const x1 = (cx + r * Math.cos(a0)).toFixed(2);
    const y1 = (cy + r * Math.sin(a0)).toFixed(2);
    const x2 = (cx + r * Math.cos(a1)).toFixed(2);
    const y2 = (cy + r * Math.sin(a1)).toFixed(2);
    const fill = i < numerator ? color : "#f0f0f0";
    paths += `<path d="M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0 1 ${x2},${y2} Z" fill="${fill}" stroke="#fff" stroke-width="2"/>`;
  }
  return `<svg viewBox="0 0 ${size} ${size}">${paths}</svg>`;
}

/**
 * 분수를 막대 칸으로 나눈 HTML 문자열을 만든다. 분모 칸 중 분자만큼 색을 채운다.
 */
function barHTML(numerator, denominator, color) {
  let segments = "";
  for (let i = 0; i < denominator; i++) {
    const fill = i < numerator ? color : "#f0f0f0";
    segments += `<div class="bar-segment" style="background:${fill}"></div>`;
  }
  return `<div class="frac-bar">${segments}</div>`;
}

/**
 * 분수 하나의 값(분자 또는 분모)을 갱신하고 다시 그린다.
 * 분모가 줄어들어 분자보다 작아지면 분자도 함께 줄인다.
 * @param {number} id 대상 분수의 id
 * @param {"numerator"|"denominator"} field 바꿀 필드
 * @param {number} rawValue 새 값 (범위를 벗어나면 안쪽으로 보정)
 */
function updateFraction(id, field, rawValue) {
  const fraction = fractions.find((f) => f.id === id);
  if (!fraction) return;

  let value = Math.round(rawValue);
  if (Number.isNaN(value)) {
    value = field === "denominator" ? DEN_MIN : 0;
  }

  if (field === "denominator") {
    fraction.denominator = clamp(value, DEN_MIN, DEN_MAX);
    if (fraction.numerator > fraction.denominator) {
      fraction.numerator = fraction.denominator;
    }
  } else {
    fraction.numerator = clamp(value, 0, fraction.denominator);
  }

  renderFractions();
}

/**
 * 분수 카드를 목록에서 제거한다. 최소 1개는 항상 남긴다.
 */
function removeFraction(id) {
  if (fractions.length <= MIN_FRACTIONS) return;
  fractions = fractions.filter((f) => f.id !== id);
  renderFractions();
}

/**
 * 새 분수 카드를 추가한다. 최대 개수를 넘으면 아무 것도 하지 않는다.
 */
function addFraction(numerator = 1, denominator = 2) {
  if (fractions.length >= MAX_FRACTIONS) return;
  fractions.push({ id: nextId++, numerator, denominator });
  renderFractions();
}

/**
 * 분수 카드 하나의 DOM 요소를 만들고 조작 버튼/입력창에 이벤트를 연결한다.
 */
function buildCard(fraction, index) {
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const card = document.createElement("div");
  card.className = "fraction-card";
  card.style.setProperty("--card-color", color);

  card.innerHTML = `
    ${fractions.length > MIN_FRACTIONS ? `<button class="remove-btn" aria-label="${t.removeAria}">×</button>` : ""}
    <div class="pie-wrap">${pieSVG(fraction.numerator, fraction.denominator, color)}</div>
    <div class="bar-wrap">${barHTML(fraction.numerator, fraction.denominator, color)}</div>
    <div class="frac-editor">
      <div class="frac-row">
        <button class="stepper" data-action="num-minus">−</button>
        <input type="number" class="frac-input" data-action="numerator" value="${fraction.numerator}" min="0" max="${fraction.denominator}" />
        <button class="stepper" data-action="num-plus">+</button>
      </div>
      <div class="frac-divider"></div>
      <div class="frac-row">
        <button class="stepper" data-action="den-minus">−</button>
        <input type="number" class="frac-input" data-action="denominator" value="${fraction.denominator}" min="${DEN_MIN}" max="${DEN_MAX}" />
        <button class="stepper" data-action="den-plus">+</button>
      </div>
    </div>
  `;

  const removeBtn = card.querySelector(".remove-btn");
  if (removeBtn) removeBtn.addEventListener("click", () => removeFraction(fraction.id));

  card.querySelector('[data-action="num-minus"]').addEventListener("click", () =>
    updateFraction(fraction.id, "numerator", fraction.numerator - 1)
  );
  card.querySelector('[data-action="num-plus"]').addEventListener("click", () =>
    updateFraction(fraction.id, "numerator", fraction.numerator + 1)
  );
  card.querySelector('[data-action="den-minus"]').addEventListener("click", () =>
    updateFraction(fraction.id, "denominator", fraction.denominator - 1)
  );
  card.querySelector('[data-action="den-plus"]').addEventListener("click", () =>
    updateFraction(fraction.id, "denominator", fraction.denominator + 1)
  );

  card.querySelector('[data-action="numerator"]').addEventListener("change", (e) =>
    updateFraction(fraction.id, "numerator", Number(e.target.value))
  );
  card.querySelector('[data-action="denominator"]').addEventListener("change", (e) =>
    updateFraction(fraction.id, "denominator", Number(e.target.value))
  );

  return card;
}

/**
 * 전체 분수 카드 목록과 "분수 추가" 버튼 상태를 다시 그린다.
 */
function renderFractions() {
  cardsContainer.innerHTML = "";
  fractions.forEach((fraction, index) => {
    cardsContainer.appendChild(buildCard(fraction, index));
  });
  addFractionBtn.disabled = fractions.length >= MAX_FRACTIONS;
}

addFractionBtn.addEventListener("click", () => addFraction());

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    addFraction(Number(btn.dataset.num), Number(btn.dataset.den));
  });
});

renderFractions();

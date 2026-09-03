/**
 * 초등 연산 문제 만들기 - 문제 생성 및 채점 로직 (한국어판)
 *
 * 2022 개정 교육과정의 학년·학기별 "수와 연산" 지도 내용에 맞춰 계산 문제를 만든다.
 * 테스트 유형은 두 가지다.
 *   - 누적: 2학년 1학기부터 선택한 학기까지 배운 연산을 섞어 낸다(복습용).
 *   - 현재 학기만: 그 학기에 새로 배우는 연산만 낸다.
 * 만든 문제지는 A4 한 장으로 렌더링하며, 화면에서 바로 채점하거나 인쇄·PDF로 저장할 수 있다.
 *
 * 영어판(/en/arithmetic-worksheet/script.js)은 교과과정 개념이 없어
 * 난이도 6단계 방식으로 따로 구성되어 있다.
 */

/** 현재 화면에 표시된 문제 목록. 채점·정답표 렌더링에 재사용한다. */
let currentProblems = [];

/** min~max(포함) 사이의 정수를 무작위로 반환한다. */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 배열에서 무작위 원소 하나를 반환한다. */
function pick(arr) {
  return arr[getRandomInt(0, arr.length - 1)];
}

/** 두 수의 최대공약수. 분수 답을 기약분수로 만들 때 사용한다. */
function gcd(a, b) {
  return b === 0 ? a : gcd(b, Math.abs(a % b));
}

/** 분자/분모를 기약분수 문자열로 만든다. 분모가 1이면 정수로 표시한다. */
function reduceFraction(n, d) {
  const g = gcd(n, d) || 1;
  const rn = n / g;
  const rd = d / g;
  return rd === 1 ? `${rn}` : `${rn}/${rd}`;
}

/* ── 학기별 한 문제 생성기 ──────────────────────────────
 * 각 함수는 { expr: 표시용 식(HTML), ans: 정답 문자열 }을 반환한다.
 * expr 안의 연산 기호는 <span class="operator">로 감싸 간격을 준다.
 * 나눗셈은 모두 나누어떨어지도록 만들어 정답을 하나로 유지한다.
 */

/** 2-1: 받아올림이 있는 두 자리 수의 덧셈 */
function makeAdd2() {
  const a = getRandomInt(15, 85);
  const b = getRandomInt(15, 85);
  return { expr: `${a} <span class="operator">+</span> ${b}`, ans: `${a + b}` };
}
/** 2-1: 받아내림이 있는 두 자리 수의 뺄셈 */
function makeSub2() {
  const a = getRandomInt(31, 99);
  const b = getRandomInt(12, a - 5);
  return { expr: `${a} <span class="operator">-</span> ${b}`, ans: `${a - b}` };
}
/** 2-1: 세 수의 덧셈과 뺄셈 */
function makeThreeNum() {
  const a = getRandomInt(12, 35);
  const b = getRandomInt(10, 30);
  const c = getRandomInt(10, 25);
  const type = getRandomInt(1, 3);
  if (type === 1) return { expr: `${a} <span class="operator">+</span> ${b} <span class="operator">+</span> ${c}`, ans: `${a + b + c}` };
  if (type === 2) return { expr: `${a + b} <span class="operator">-</span> ${b} <span class="operator">+</span> ${c}`, ans: `${a + c}` };
  return { expr: `${a + b + c} <span class="operator">-</span> ${b} <span class="operator">-</span> ${c}`, ans: `${a}` };
}

/** 2-2: 곱셈구구 (2~9단) */
function makeMul1() {
  const a = getRandomInt(2, 9);
  const b = getRandomInt(2, 9);
  return { expr: `${a} <span class="operator">×</span> ${b}`, ans: `${a * b}` };
}

/** 3-1: 세 자리 수의 덧셈 */
function makeAdd3() {
  const a = getRandomInt(115, 780);
  const b = getRandomInt(115, 540);
  return { expr: `${a} <span class="operator">+</span> ${b}`, ans: `${a + b}` };
}
/** 3-1: 세 자리 수의 뺄셈 */
function makeSub3() {
  const a = getRandomInt(350, 980);
  const b = getRandomInt(120, a - 100);
  return { expr: `${a} <span class="operator">-</span> ${b}`, ans: `${a - b}` };
}
/** 3-1: 곱셈구구 범위의 나눗셈 */
function makeDivBasic() {
  const b = getRandomInt(2, 9);
  const q = getRandomInt(2, 9);
  return { expr: `${b * q} <span class="operator">÷</span> ${b}`, ans: `${q}` };
}
/** 3-1: (두 자리 수) × (한 자리 수) */
function makeMul2x1() {
  const a = getRandomInt(12, 89);
  const b = getRandomInt(3, 9);
  return { expr: `${a} <span class="operator">×</span> ${b}`, ans: `${a * b}` };
}

/** 3-2: (세 자리 수) × (한 자리 수) */
function makeMul3x1() {
  const a = getRandomInt(112, 899);
  const b = getRandomInt(3, 9);
  return { expr: `${a} <span class="operator">×</span> ${b}`, ans: `${a * b}` };
}
/** 3-2: (두 자리 수) × (두 자리 수) */
function makeMul2x2() {
  const a = getRandomInt(13, 79);
  const b = getRandomInt(12, 49);
  return { expr: `${a} <span class="operator">×</span> ${b}`, ans: `${a * b}` };
}
/** 3-2: (두 자리 수) ÷ (한 자리 수), 나누어떨어짐 */
function makeDiv2x1() {
  const b = getRandomInt(3, 9);
  const q = getRandomInt(11, Math.floor(98 / b));
  return { expr: `${b * q} <span class="operator">÷</span> ${b}`, ans: `${q}` };
}

/** 4-1: (세 자리 수) × (두 자리 수) */
function makeMul3x2() {
  const a = getRandomInt(105, 899);
  const b = getRandomInt(12, 79);
  return { expr: `${a} <span class="operator">×</span> ${b}`, ans: `${a * b}` };
}
/** 4-1: (세 자리 수) ÷ (두 자리 수), 나누어떨어짐 */
function makeDiv3x2() {
  const b = getRandomInt(13, 29);
  const q = getRandomInt(8, 34);
  return { expr: `${b * q} <span class="operator">÷</span> ${b}`, ans: `${q}` };
}

/** 4-2: 분모가 같은 (진)분수의 덧셈 */
function makeFracAddSame() {
  const d = getRandomInt(5, 12);
  const n1 = getRandomInt(1, d - 2);
  const n2 = getRandomInt(1, d - 1 - n1);
  return { expr: `${n1}/${d} <span class="operator">+</span> ${n2}/${d}`, ans: `${n1 + n2}/${d}` };
}
/** 4-2: 분모가 같은 분수의 뺄셈 */
function makeFracSubSame() {
  const d = getRandomInt(5, 12);
  const n1 = getRandomInt(2, d - 1);
  const n2 = getRandomInt(1, n1 - 1);
  return { expr: `${n1}/${d} <span class="operator">-</span> ${n2}/${d}`, ans: `${n1 - n2}/${d}` };
}
/** 4-2: 소수 한 자리 수의 덧셈 */
function makeDecAdd() {
  const a = getRandomInt(12, 98) / 10;
  const b = getRandomInt(12, 98) / 10;
  return { expr: `${a.toFixed(1)} <span class="operator">+</span> ${b.toFixed(1)}`, ans: (a + b).toFixed(1) };
}
/** 4-2: 소수 한 자리 수의 뺄셈 */
function makeDecSub() {
  const a = getRandomInt(30, 98) / 10;
  const b = getRandomInt(11, Math.round(a * 10) - 5) / 10;
  return { expr: `${a.toFixed(1)} <span class="operator">-</span> ${b.toFixed(1)}`, ans: (a - b).toFixed(1) };
}

/** 5-1: 자연수의 혼합 계산 (곱셈·나눗셈을 먼저, 괄호 우선) */
function makeMixedNatural() {
  const type = getRandomInt(1, 3);
  if (type === 1) {
    const a = getRandomInt(5, 20), b = getRandomInt(2, 6), c = getRandomInt(3, 8);
    return { expr: `${a} <span class="operator">+</span> ${b} <span class="operator">×</span> ${c}`, ans: `${a + b * c}` };
  }
  if (type === 2) {
    const a = getRandomInt(3, 9), b = getRandomInt(3, 9), c = getRandomInt(2, 20);
    return { expr: `${a} <span class="operator">×</span> ${b} <span class="operator">-</span> ${c}`, ans: `${a * b - c}` };
  }
  // (a + b) ÷ c : 나누어떨어지도록 a+b를 c의 배수로 만든다
  const c = getRandomInt(2, 6);
  const q = getRandomInt(3, 12);
  const a = getRandomInt(1, c * q - 1);
  const b = c * q - a;
  return { expr: `(${a} <span class="operator">+</span> ${b}) <span class="operator">÷</span> ${c}`, ans: `${q}` };
}
/** 5-1: 분모가 다른 분수의 덧셈 (기약분수로 정리) */
function makeFracAddDiff() {
  const d1 = getRandomInt(2, 6);
  let d2 = getRandomInt(2, 6);
  if (d2 === d1) d2 = d1 === 6 ? 3 : d1 + 1;
  const n1 = getRandomInt(1, d1 - 1);
  const n2 = getRandomInt(1, d2 - 1);
  return { expr: `${n1}/${d1} <span class="operator">+</span> ${n2}/${d2}`, ans: reduceFraction(n1 * d2 + n2 * d1, d1 * d2) };
}
/** 5-1: 분모가 다른 분수의 뺄셈 (큰 분수가 앞에 오도록 정렬해 결과가 0 이상) */
function makeFracSubDiff() {
  let d1 = getRandomInt(2, 6);
  let d2 = getRandomInt(2, 6);
  if (d2 === d1) d2 = d1 === 6 ? 3 : d1 + 1;
  let n1 = getRandomInt(1, d1 - 1);
  let n2 = getRandomInt(1, d2 - 1);
  if (n1 * d2 < n2 * d1) { [n1, n2] = [n2, n1]; [d1, d2] = [d2, d1]; }
  return { expr: `${n1}/${d1} <span class="operator">-</span> ${n2}/${d2}`, ans: reduceFraction(n1 * d2 - n2 * d1, d1 * d2) };
}

/** 5-2: 분수의 곱셈 (기약분수로 정리) */
function makeFracMul() {
  const d1 = getRandomInt(2, 6);
  const n1 = getRandomInt(1, d1 - 1);
  const d2 = getRandomInt(2, 6);
  const n2 = getRandomInt(1, d2 - 1);
  return { expr: `${n1}/${d1} <span class="operator">×</span> ${n2}/${d2}`, ans: reduceFraction(n1 * n2, d1 * d2) };
}
/** 5-2: (소수) × (자연수) */
function makeDecMul() {
  const a = getRandomInt(12, 49) / 10;
  const b = getRandomInt(2, 9);
  return { expr: `${a.toFixed(1)} <span class="operator">×</span> ${b}`, ans: (a * b).toFixed(1) };
}

/** 6-1: (분수) ÷ (자연수), 기약분수로 정리 */
function makeFracDivNat() {
  const d = getRandomInt(2, 7);
  const n = getRandomInt(1, d - 1);
  const k = getRandomInt(2, 5);
  return { expr: `${n}/${d} <span class="operator">÷</span> ${k}`, ans: reduceFraction(n, d * k) };
}
/** 6-1: (소수) ÷ (자연수), 나누어떨어짐 (나뉘는 수가 소수가 되도록) */
function makeDecDivNat() {
  let ansTenths, k;
  do {
    ansTenths = getRandomInt(12, 89);
    k = getRandomInt(2, 6);
  } while ((ansTenths * k) % 10 === 0);
  return { expr: `${(ansTenths * k / 10).toFixed(1)} <span class="operator">÷</span> ${k}`, ans: (ansTenths / 10).toFixed(1) };
}

/** 6-2: (분수) ÷ (분수), 기약분수로 정리 */
function makeFracDivFrac() {
  const b = getRandomInt(2, 5);
  const a = getRandomInt(1, b);
  const d = getRandomInt(2, 5);
  const c = getRandomInt(1, d);
  return { expr: `${a}/${b} <span class="operator">÷</span> ${c}/${d}`, ans: reduceFraction(a * d, b * c) };
}
/** 6-2: (소수) ÷ (소수), 나누어떨어짐 (나뉘는 수가 소수가 되도록) */
function makeDecDivDec() {
  let divisorTenths, q;
  do {
    divisorTenths = getRandomInt(2, 9);
    q = getRandomInt(2, 19);
  } while ((divisorTenths * q) % 10 === 0);
  return { expr: `${(divisorTenths * q / 10).toFixed(1)} <span class="operator">÷</span> ${(divisorTenths / 10).toFixed(1)}`, ans: `${q}` };
}

/* ── 학기 구성 ────────────────────────────────────────── */

/** 학기 진행 순서 */
const SEMESTER_ORDER = ['2-1', '2-2', '3-1', '3-2', '4-1', '4-2', '5-1', '5-2', '6-1', '6-2'];

/** 학기별 짧은 이름. 문제지 제목에 쓴다. */
const GRADE_NAMES = {
  '2-1': '2학년 1학기', '2-2': '2학년 2학기',
  '3-1': '3학년 1학기', '3-2': '3학년 2학기',
  '4-1': '4학년 1학기', '4-2': '4학년 2학기',
  '5-1': '5학년 1학기', '5-2': '5학년 2학기',
  '6-1': '6학년 1학기', '6-2': '6학년 2학기',
};

/** 학기별로 그 학기에 '새로 배우는' 연산 유형 생성기 목록 */
const SEMESTER_NEW = {
  '2-1': [makeAdd2, makeSub2, makeThreeNum],
  '2-2': [makeMul1],
  '3-1': [makeAdd3, makeSub3, makeDivBasic, makeMul2x1],
  '3-2': [makeMul3x1, makeMul2x2, makeDiv2x1],
  '4-1': [makeMul3x2, makeDiv3x2],
  '4-2': [makeFracAddSame, makeFracSubSame, makeDecAdd, makeDecSub],
  '5-1': [makeMixedNatural, makeFracAddDiff, makeFracSubDiff],
  '5-2': [makeFracMul, makeDecMul],
  '6-1': [makeFracDivNat, makeDecDivNat],
  '6-2': [makeFracDivFrac, makeDecDivDec],
};

/**
 * 선택한 학기까지의 누적 생성기 목록을 만든다.
 * [semester] '2-1' ~ '6-2'
 * Returns: 생성기 함수 배열
 */
function cumulativePool(semester) {
  const last = SEMESTER_ORDER.indexOf(semester);
  let pool = [];
  for (let i = 0; i <= last; i++) pool = pool.concat(SEMESTER_NEW[SEMESTER_ORDER[i]]);
  return pool;
}

/**
 * 문제 목록을 만든다.
 * [semester] 선택한 학년·학기
 * [mode]     'cumulative'(누적) 또는 'current'(현재 학기만)
 * [count]    문제 수
 * Returns: [{ expr, ans }, ...]
 */
function generateProblems(semester, mode, count) {
  const currentGens = SEMESTER_NEW[semester];
  const pool = mode === 'current' ? currentGens : cumulativePool(semester);
  const problems = [];
  for (let i = 0; i < count; i++) {
    // 누적 모드에서도 현재 학기 내용이 최소 40%는 나오도록 한다.
    const gen = mode === 'cumulative' && Math.random() < 0.4 ? pick(currentGens) : pick(pool);
    problems.push(gen());
  }
  return problems;
}

/**
 * 현재 설정값을 읽어 문제지(문제 페이지 + 정답표 페이지) HTML을 만들어 화면에 그린다.
 */
function generateWorkbook() {
  const semester = document.getElementById('grade-select').value;
  const mode = document.getElementById('mode-select').value;
  const count = parseInt(document.getElementById('count-select').value, 10);

  currentProblems = generateProblems(semester, mode, count);

  const modeLabel = mode === 'cumulative' ? '누적 ' : '';
  const title = `✏️ ${GRADE_NAMES[semester]} ${modeLabel}연산 문제`;

  let html = `
    <div class="page">
      <div class="workbook-header">
        <h2>${title}</h2>
      </div>
      <div class="info-box">
        <span>이름: __________________</span>
        <span>날짜: ____________</span>
        <span>점수: ________ / 100점</span>
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

  // 정답표 페이지 (웹에서는 기본 숨김, 토글 또는 인쇄 시 표시)
  html += `
    <div class="answer-page-container" id="ans-container">
      <div class="page">
        <div class="workbook-header">
          <h2>🎯 정답표</h2>
        </div>
        <table class="answer-table">
          <thead>
            <tr>
              <th>번호</th><th>정답</th>
              <th>번호</th><th>정답</th>
              <th>번호</th><th>정답</th>
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

/** 정답표 페이지를 보이거나 숨긴다. 보일 때는 그쪽으로 스크롤하고 포커스를 옮긴다. */
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

/** 입력값이 정답과 같은지 판단한다. 공백은 무시하고, 소수는 값이 같으면 정답으로 본다. */
function isCorrect(userVal, ans) {
  const u = userVal.trim().replace(/\s+/g, '');
  if (u === ans) return true;
  if (!ans.includes('/') && u !== '' && !isNaN(Number(u)) && !isNaN(Number(ans))) {
    return Number(u) === Number(ans);
  }
  return false;
}

/** 화면에 입력된 답을 정답과 비교해 색으로 표시하고 맞힌 개수를 알린다. */
function checkAnswers() {
  let correctCount = 0;
  currentProblems.forEach((p, idx) => {
    const input = document.getElementById(`input-${idx}`);
    if (!input) return;
    if (isCorrect(input.value, p.ans)) {
      input.className = 'answer-input correct';
      correctCount++;
    } else {
      input.className = 'answer-input wrong';
    }
  });
  alert(`채점 결과: ${currentProblems.length}문제 중 ${correctCount}문제를 맞혔어요!`);
}

/**
 * 브라우저 인쇄 창을 연다. 인쇄와 PDF 저장이 같은 경로를 쓴다.
 * (인쇄용 CSS(@media print)가 사이트 틀을 걷어내고 문제지 2단 + 정답표 페이지만 남긴다.
 *  사용자가 인쇄 창에서 프린터 또는 'PDF로 저장'을 고른다.)
 */
function openPrintDialog() {
  window.print();
}

document.getElementById('btn-generate').addEventListener('click', generateWorkbook);
document.getElementById('btn-check').addEventListener('click', checkAnswers);
document.getElementById('btn-answer').addEventListener('click', toggleAnswerPage);
document.getElementById('btn-print').addEventListener('click', openPrintDialog);
document.getElementById('btn-pdf').addEventListener('click', openPrintDialog);

// 첫 진입 시 기본 문제지를 한 장 만들어 둔다.
generateWorkbook();

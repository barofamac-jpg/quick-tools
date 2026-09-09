/**
 * Grovii 소개 페이지 전용 Google Analytics 4 (앱 소개 웹).
 *
 * ── 설정 방법 ──────────────────────────────────────────────
 * 아래 GA_ID 를 "Grovii 웹" 데이터 스트림의 측정 ID(G-XXXXXXXXXX)로 바꾸세요.
 * 권장: 앱(Firebase)과 "같은 GA4 속성"에 웹 데이터 스트림을 추가하면
 *       웹 방문 → 설치 → 인앱까지 한 속성에서 볼 수 있습니다.
 *       단, quick-tools 사이트 공용 속성(G-HWJFB82RCG)과는 분리하세요.
 * GA_ID 가 비어 있으면(placeholder) 아무 것도 로드하지 않습니다.
 * ──────────────────────────────────────────────────────────
 *
 * EU/영국 방문자에게만 동의 배너를 띄우고, 그 외 지역은 바로 통계를 시작합니다.
 * (quick-tools 공용 cookie-consent.js 와 동일한 정책, GA 속성만 다름)
 */

const GA_ID = 'G-XXXXXXXXXX'; // TODO: Grovii 웹 데이터 스트림 측정 ID 로 교체
const CONSENT_KEY = 'groviiCookieConsent';
const REGION_KEY = 'groviiRegionCheck';
const GEO_TIMEOUT_MS = 3000;

const CONSENT_REQUIRED_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE', 'GB', 'IS', 'LI', 'NO',
]);

// 언어별 동의 배너 문구
const BANNER_TEXT = {
  ko: ['이 페이지는 방문자 통계를 위해 쿠키를 사용해요.', '자세히 보기', '동의', '거부'],
  en: ['This page uses cookies for visitor analytics.', 'Learn more', 'Accept', 'Decline'],
  ja: ['このページは訪問者の統計のためにCookieを使用します。', '詳しく見る', '同意する', '拒否'],
  zh: ['本页面使用 Cookie 进行访问统计。', '了解更多', '同意', '拒绝'],
  id: ['Halaman ini memakai cookie untuk analitik pengunjung.', 'Selengkapnya', 'Setuju', 'Tolak'],
  ar: ['تستخدم هذه الصفحة ملفات تعريف الارتباط لإحصاءات الزوّار.', 'اعرف المزيد', 'موافق', 'رفض'],
  es: ['Esta página usa cookies para analítica de visitas.', 'Más información', 'Aceptar', 'Rechazar'],
};

function pageLang() {
  const l = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
  return BANNER_TEXT[l] ? l : 'en';
}

function loadGA() {
  if (window.groviiGaLoaded || GA_ID.indexOf('XXXX') !== -1) return;
  window.groviiGaLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);
}

function showBanner() {
  const t = BANNER_TEXT[pageLang()];
  const privacy = '/grovii/privacy-policy.html';
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
    background: #222; color: #fff; padding: 14px 18px;
    display: flex; align-items: center; justify-content: center;
    gap: 14px; flex-wrap: wrap; font: 13px/1.5 system-ui, sans-serif;
    box-shadow: 0 -2px 12px rgba(0,0,0,0.2);`;
  el.innerHTML = `
    <span>${t[0]} <a href="${privacy}" style="color:#9ecbff">${t[1]}</a></span>
    <span style="display:flex;gap:8px">
      <button id="gvOk" style="background:#6c7cff;color:#fff;border:0;border-radius:8px;padding:8px 16px;cursor:pointer;font-weight:700">${t[2]}</button>
      <button id="gvNo" style="background:#444;color:#fff;border:0;border-radius:8px;padding:8px 16px;cursor:pointer">${t[3]}</button>
    </span>`;
  document.body.appendChild(el);
  el.querySelector('#gvOk').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'granted'); el.remove(); loadGA();
  });
  el.querySelector('#gvNo').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'denied'); el.remove();
  });
}

async function consentRequired() {
  const cached = localStorage.getItem(REGION_KEY);
  if (cached === 'required' || cached === 'not-required') return cached === 'required';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), GEO_TIMEOUT_MS);
  try {
    const r = await fetch('https://ipapi.co/json/', { signal: ctrl.signal });
    const d = await r.json();
    const req = CONSENT_REQUIRED_COUNTRIES.has(d.country_code);
    localStorage.setItem(REGION_KEY, req ? 'required' : 'not-required');
    return req;
  } catch (e) {
    return true; // 조회 실패 시 안전하게 배너
  } finally {
    clearTimeout(timer);
  }
}

(async function () {
  if (GA_ID.indexOf('XXXX') !== -1) return; // 아직 미설정
  const c = localStorage.getItem(CONSENT_KEY);
  if (c === 'granted') return loadGA();
  if (c === 'denied') return;
  (await consentRequired()) ? showBanner() : loadGA();
})();

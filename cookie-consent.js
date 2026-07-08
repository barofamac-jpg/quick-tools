/**
 * 쿠키 동의 배너 + 구글 애널리틱스 지연 로딩
 * EU/영국 방문자에게만 동의 배너를 띄우고, 그 외 지역은 바로 통계를 시작한다.
 * 지역 판별이 실패하면 안전하게 배너를 띄우는 쪽을 택한다.
 * quick-tools.barofam.com의 모든 페이지가 이 파일 하나를 공통으로 사용한다.
 */

const GA_ID = 'G-HWJFB82RCG';
const CONSENT_KEY = 'cookieConsent';
const REGION_KEY = 'cookieRegionCheck';
const GEO_TIMEOUT_MS = 3000;

// GDPR 적용 대상: EU 회원국 + 영국 + EEA(아이슬란드, 리히텐슈타인, 노르웨이)
const CONSENT_REQUIRED_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE', 'GB', 'IS', 'LI', 'NO',
]);

/**
 * 구글 애널리틱스 스크립트를 실제로 불러와 초기화한다. 동의한 경우에만 호출된다.
 */
function loadGoogleAnalytics() {
  if (window.gaLoaded) return;
  window.gaLoaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);
}

/**
 * 화면 하단에 쿠키 동의 배너를 띄운다. 동의/거부 선택을 localStorage에 저장한다.
 */
function showCookieBanner() {
  const banner = document.createElement('div');
  banner.id = 'cookieBanner';
  banner.style.cssText = `
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
    background: #222; color: #fff; padding: 16px 20px;
    display: flex; align-items: center; justify-content: center;
    gap: 16px; flex-wrap: wrap; font-size: 14px; line-height: 1.5;
    font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
    box-shadow: 0 -2px 12px rgba(0,0,0,0.2);
  `;
  banner.innerHTML = `
    <span>이 사이트는 방문자 통계를 위해 쿠키를 사용해요. <a href="/privacy-policy.html" style="color:#9ecbff;text-decoration:underline">자세히 보기</a></span>
    <span style="display:flex;gap:8px">
      <button id="cookieAccept" style="background:#6c7cff;color:#fff;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-weight:700">동의</button>
      <button id="cookieDecline" style="background:#444;color:#fff;border:none;border-radius:8px;padding:8px 16px;cursor:pointer">거부</button>
    </span>
  `;
  document.body.appendChild(banner);

  document.getElementById('cookieAccept').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'granted');
    banner.remove();
    loadGoogleAnalytics();
  });
  document.getElementById('cookieDecline').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'denied');
    banner.remove();
  });
}

/**
 * 방문자의 IP로 국가를 조회해 EU/영국 여부를 판별한다. 실패하거나 시간 초과되면
 * 안전하게 동의가 필요한 것으로 간주한다. 결과는 재조회를 피하기 위해 캐시한다.
 */
async function checkIfConsentRequired() {
  const cached = localStorage.getItem(REGION_KEY);
  if (cached === 'required' || cached === 'not-required') {
    return cached === 'required';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);

  try {
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    const data = await res.json();
    const required = CONSENT_REQUIRED_COUNTRIES.has(data.country_code);
    localStorage.setItem(REGION_KEY, required ? 'required' : 'not-required');
    return required;
  } catch (err) {
    // 조회 실패: 캐시하지 않고(다음 방문에 재시도) 이번엔 안전하게 배너를 띄운다.
    return true;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 저장된 동의 여부에 따라 배너를 띄우거나 애널리틱스를 바로 시작한다.
 */
async function init() {
  const existingConsent = localStorage.getItem(CONSENT_KEY);
  if (existingConsent === 'granted') {
    loadGoogleAnalytics();
    return;
  }
  if (existingConsent === 'denied') {
    return;
  }

  const required = await checkIfConsentRequired();
  if (required) {
    showCookieBanner();
  } else {
    loadGoogleAnalytics();
  }
}

init();

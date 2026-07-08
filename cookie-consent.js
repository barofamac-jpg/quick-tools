/**
 * 쿠키 동의 배너 + 구글 애널리틱스 지연 로딩
 * 사용자가 동의를 눌러야만 추적 스크립트(GA)를 불러온다.
 * quick-tools.barofam.com의 모든 페이지가 이 파일 하나를 공통으로 사용한다.
 */

const GA_ID = 'G-HWJFB82RCG';
const CONSENT_KEY = 'cookieConsent';

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

const existingConsent = localStorage.getItem(CONSENT_KEY);
if (existingConsent === 'granted') {
  loadGoogleAnalytics();
} else if (existingConsent !== 'denied') {
  showCookieBanner();
}

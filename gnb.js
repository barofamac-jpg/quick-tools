/**
 * 전역 내비게이션(GNB)
 * 모든 페이지 상단에 공통 헤더(브랜드 + 메뉴 그룹 + 언어 전환)를 삽입한다.
 * <html lang="ko"|"en">을 보고 언어를 판단해 메뉴 내용과 링크를 자동으로 고른다.
 * 사용법: 각 페이지 <body> 맨 앞에 <script src="/gnb.js"></script> 한 줄만 추가하면 된다.
 * 메뉴 항목을 바꾸거나 도구를 추가/삭제할 때는 이 파일 하나만 고치면 모든 페이지에 반영된다.
 */
(function () {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'ko';

  const content = {
    ko: {
      brand: 'Quick-Tools',
      home: '/',
      langLabel: 'EN',
      groups: [
        {
          label: '초등 학습 도구',
          items: [
            ['/multiplication-array/', '곱셈 배열 시각화'],
            ['/multiplication-game/', '곱셈 연습게임'],
            ['/fraction-visualizer/', '분수 시각화 도구'],
            ['/fraction-game/', '분수 연습게임'],
            ['/study-timer/', '학습 타이머'],
          ],
        },
        {
          label: '이미지 컨버터',
          items: [
            ['/pixel-art-converter/', '이미지 → 픽셀아트 변환기'],
            ['/image-format-converter/', '이미지 포맷/용량 변환기'],
            ['/image-resizer/', '이미지 리사이즈/크롭 도구'],
          ],
        },
      ],
    },
    en: {
      brand: 'Quick-Tools',
      home: '/en/',
      langLabel: '한국어',
      groups: [
        {
          label: 'Elementary Learning Tools',
          items: [
            ['/en/multiplication-array/', 'Multiplication Array Visualizer'],
            ['/en/multiplication-game/', 'Multiplication Practice Game'],
            ['/en/fraction-visualizer/', 'Fraction Visualizer'],
            ['/en/fraction-game/', 'Fraction Practice Game'],
            ['/en/study-timer/', 'Study Timer'],
          ],
        },
        {
          label: 'Image Converters',
          items: [
            ['/en/pixel-art-converter/', 'Image → Pixel Art Converter'],
            ['/en/image-format-converter/', 'Image Format & Size Converter'],
            ['/en/image-resizer/', 'Image Resize & Crop Tool'],
          ],
        },
      ],
    },
  };

  const c = content[lang];

  /**
   * 현재 주소를 기반으로 반대 언어 버전의 주소를 계산한다.
   * 예: /fraction-game/ <-> /en/fraction-game/,  / <-> /en/
   */
  function siblingLangHref() {
    const path = location.pathname;
    if (lang === 'en') {
      const stripped = path.replace(/^\/en\/?/, '/');
      return stripped === '' ? '/' : stripped;
    }
    return path === '/' ? '/en/' : '/en' + path;
  }

  const groupsHtml = c.groups
    .map(
      (g) => `
      <details class="menu-group">
        <summary>${g.label}</summary>
        <div class="dropdown">
          ${g.items.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}
        </div>
      </details>`
    )
    .join('');

  const gnbHtml = `
    <header class="gnb">
      <a href="${c.home}" class="gnb-brand">${c.brand}</a>
      <nav class="gnb-menu">${groupsHtml}</nav>
      <a href="${siblingLangHref()}" class="gnb-lang">${c.langLabel}</a>
    </header>`;

  document.body.insertAdjacentHTML('afterbegin', gnbHtml);
})();

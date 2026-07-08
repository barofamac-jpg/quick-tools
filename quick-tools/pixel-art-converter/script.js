/**
 * 이미지 → 픽셀아트 변환기
 * 업로드된 이미지를 Canvas API로 축소 후 재확대하는 방식으로 픽셀아트를 만든다.
 * 서버 없이 브라우저 안에서만 처리되므로 이미지가 외부로 전송되지 않는다.
 */

// 언어별 번역 사전. 언어를 추가하려면 이 객체에 블록 하나만 더 추가하면 된다.
const translations = {
  ko: {
    pageTitle: "픽셀아트 변환기",
    appTitle: "이미지 → 픽셀아트 변환기",
    appSubtitle: "이미지를 올리면 자동으로 픽셀아트를 만들어드려요. 슬라이더로 느낌을 직접 조절해보세요.",
    metaDescription: "이미지를 업로드하면 무료로 즉시 픽셀아트로 변환해주는 온라인 도구입니다.",
    uploadText: "여기를 클릭하거나 이미지를 끌어다 놓으세요",
    uploadHint: "PNG, JPG 등 이미지 파일",
    originalLabel: "원본",
    resultLabel: "픽셀아트 결과",
    pixelSizeLabel: "픽셀 크기 (도트 굵기)",
    outputScaleLabel: "출력 크기 (배율)",
    simplifyLabel: "색상 단순화 (비슷한 색 합치기)",
    downloadBtn: "PNG로 다운로드",
    resetBtn: "다른 이미지 올리기",
    gridUnit: "칸",
  },
  en: {
    pageTitle: "Pixel Art Converter",
    appTitle: "Image → Pixel Art Converter",
    appSubtitle: "Upload an image and it turns into pixel art automatically. Fine-tune the look with the sliders.",
    metaDescription: "Upload an image and instantly turn it into pixel art online, for free.",
    uploadText: "Click here or drag and drop an image",
    uploadHint: "PNG, JPG, and other image files",
    originalLabel: "Original",
    resultLabel: "Pixel Art Result",
    pixelSizeLabel: "Pixel Size (dot thickness)",
    outputScaleLabel: "Output Size (scale)",
    simplifyLabel: "Color Simplify (merge similar colors)",
    downloadBtn: "Download PNG",
    resetBtn: "Upload another image",
    gridUnit: "cells",
  },
  ja: {
    pageTitle: "ピクセルアート変換ツール",
    appTitle: "画像 → ピクセルアート変換ツール",
    appSubtitle: "画像をアップロードすると自動でピクセルアートに変換されます。スライダーで質感を調整できます。",
    metaDescription: "画像をアップロードするだけで自動的にピクセルアートに変換する無料オンラインツールです。",
    uploadText: "ここをクリックするか、画像をドラッグ＆ドロップしてください",
    uploadHint: "PNG、JPGなどの画像ファイル",
    originalLabel: "元の画像",
    resultLabel: "ピクセルアート結果",
    pixelSizeLabel: "ピクセルサイズ（ドットの粗さ）",
    outputScaleLabel: "出力サイズ（拡大率）",
    simplifyLabel: "色の単純化（似た色をまとめる）",
    downloadBtn: "PNGでダウンロード",
    resetBtn: "別の画像をアップロード",
    gridUnit: "マス",
  },
  zh: {
    pageTitle: "像素画转换工具",
    appTitle: "图片 → 像素画转换工具",
    appSubtitle: "上传图片即可自动转换为像素画，还可以用滑块调整效果。",
    metaDescription: "上传图片，即可免费在线自动转换为像素画。",
    uploadText: "点击此处或拖放图片",
    uploadHint: "支持 PNG、JPG 等图片格式",
    originalLabel: "原图",
    resultLabel: "像素画结果",
    pixelSizeLabel: "像素大小（颗粒粗细）",
    outputScaleLabel: "输出尺寸（放大倍数）",
    simplifyLabel: "颜色简化（合并相近颜色）",
    downloadBtn: "下载 PNG",
    resetBtn: "上传其他图片",
    gridUnit: "格",
  },
  es: {
    pageTitle: "Convertidor de Pixel Art",
    appTitle: "Imagen → Convertidor de Pixel Art",
    appSubtitle: "Sube una imagen y la convertimos automáticamente en pixel art. Ajusta el resultado con los controles deslizantes.",
    metaDescription: "Sube una imagen y conviértela automáticamente en pixel art de forma gratuita y en línea.",
    uploadText: "Haz clic aquí o arrastra una imagen",
    uploadHint: "Archivos PNG, JPG y otros formatos de imagen",
    originalLabel: "Original",
    resultLabel: "Resultado en Pixel Art",
    pixelSizeLabel: "Tamaño de píxel (grosor del punto)",
    outputScaleLabel: "Tamaño de salida (escala)",
    simplifyLabel: "Simplificar colores (unir colores similares)",
    downloadBtn: "Descargar PNG",
    resetBtn: "Subir otra imagen",
    gridUnit: "celdas",
  },
};

/**
 * 브라우저에 설정된 언어를 읽어 지원하는 언어 코드로 매핑한다.
 * 지원하지 않는 언어는 영어로 대체한다.
 * Returns: "ko" | "en" | "ja" | "zh" | "es"
 */
function detectLanguage() {
  const browserLang = (navigator.language || "en").toLowerCase();
  const supported = ["ko", "ja", "zh", "es"];
  const matched = supported.find((code) => browserLang.startsWith(code));
  return matched || "en";
}

const currentLang = detectLanguage();
const t = translations[currentLang];

/**
 * data-i18n 속성이 붙은 모든 요소의 텍스트를 현재 언어로 채운다.
 * 문서 제목과 html lang 속성도 함께 갱신한다.
 */
function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.title = t.pageTitle;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
  });

  // 검색엔진/소셜 공유용 메타 태그도 같은 언어로 맞춘다.
  setMetaContent('meta[name="description"]', t.metaDescription);
  setMetaContent('meta[property="og:title"]', t.appTitle);
  setMetaContent('meta[property="og:description"]', t.metaDescription);
  setMetaContent('meta[name="twitter:title"]', t.appTitle);
  setMetaContent('meta[name="twitter:description"]', t.metaDescription);
}

/**
 * 지정한 선택자의 메타 태그 content 속성을 갱신한다. 태그가 없으면 아무것도 하지 않는다.
 * @param {string} selector 메타 태그를 찾을 CSS 선택자
 * @param {string} content 새로 채울 content 값
 */
function setMetaContent(selector, content) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute("content", content);
}

applyTranslations();

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const workspace = document.getElementById("workspace");
const originalCanvas = document.getElementById("originalCanvas");
const resultCanvas = document.getElementById("resultCanvas");
const pixelRange = document.getElementById("pixelRange");
const pixelValue = document.getElementById("pixelValue");
const scaleRange = document.getElementById("scaleRange");
const scaleValue = document.getElementById("scaleValue");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const gridInfo = document.getElementById("gridInfo");
const simplifyRange = document.getElementById("simplifyRange");
const simplifyValue = document.getElementById("simplifyValue");

let currentImage = null; // 현재 업로드된 이미지(HTMLImageElement)

/**
 * 이미지 크기를 기반으로 슬라이더의 기본값과 범위를 계산한다.
 * @param {number} width 원본 이미지 가로 픽셀 수
 * @param {number} height 원본 이미지 세로 픽셀 수
 * Returns: { pixelMin, pixelMax, pixelDefault } 픽셀 크기 슬라이더 설정값
 */
function computePixelDefaults(width, height) {
  const longerSide = Math.max(width, height);
  const pixelDefault = clamp(Math.round(longerSide / 64), 1, 100);
  const pixelMax = clamp(Math.round(longerSide / 4), pixelDefault + 1, 100);
  return { pixelMin: 1, pixelMax, pixelDefault };
}

/**
 * 값을 최소/최대 범위 안으로 제한한다.
 * @param {number} value 원본 값
 * @param {number} min 최솟값
 * @param {number} max 최댓값
 * Returns: 범위 안으로 제한된 값
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 캔버스의 색상을 일정 단위로 반올림해 비슷한 색끼리 같은 색으로 합친다.
 * 합쳐지는 정도가 클수록 경계가 또렷해 보이는 효과가 생긴다.
 * @param {HTMLCanvasElement} canvas 색을 단순화할 캔버스 (내부 픽셀을 직접 수정)
 * @param {number} amount 단순화 강도, 0(원본 색 유지) ~ 1(강하게 합침)
 */
function applyColorSimplify(canvas, amount) {
  if (amount <= 0) return;

  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const step = 1 + Math.round(amount * 63); // 1(원본) ~ 64(강하게 합침)

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / step) * step;
    data[i + 1] = Math.round(data[i + 1] / step) * step;
    data[i + 2] = Math.round(data[i + 2] / step) * step;
    // 투명도(data[i + 3])는 그대로 둔다
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * 파일 선택/드롭 이벤트로 전달된 이미지 파일을 읽어 화면에 로드한다.
 * 로드가 끝나면 슬라이더 기본값을 계산하고 변환을 실행한다.
 * @param {File} file 사용자가 선택한 이미지 파일
 */
function loadImage(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      setupControlsForImage(img.naturalWidth, img.naturalHeight);
      workspace.hidden = false;
      renderAll();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * 새 이미지에 맞춰 픽셀 크기 슬라이더의 범위와 기본값을 설정한다.
 * 출력 배율 슬라이더는 최종 이미지가 대략 512px 폭이 되도록 기본값을 잡는다.
 * @param {number} width 원본 이미지 가로 픽셀 수
 * @param {number} height 원본 이미지 세로 픽셀 수
 */
function setupControlsForImage(width, height) {
  const { pixelMin, pixelMax, pixelDefault } = computePixelDefaults(width, height);
  pixelRange.min = pixelMin;
  pixelRange.max = pixelMax;
  pixelRange.value = pixelDefault;
  pixelValue.textContent = pixelDefault;

  const gridWidth = Math.max(1, Math.round(width / pixelDefault));
  const scaleDefault = clamp(Math.round(512 / gridWidth), 1, 20);
  scaleRange.value = scaleDefault;
  scaleValue.textContent = scaleDefault + "x";
}

/**
 * 원본 미리보기와 픽셀아트 결과를 현재 슬라이더 값 기준으로 다시 그린다.
 */
function renderAll() {
  if (!currentImage) return;

  const width = currentImage.naturalWidth;
  const height = currentImage.naturalHeight;

  // 원본 미리보기
  originalCanvas.width = width;
  originalCanvas.height = height;
  originalCanvas.getContext("2d").drawImage(currentImage, 0, 0);

  // 1단계: 원본을 작은 격자(gridWidth x gridHeight)로 축소해 색을 뭉뚱그린다.
  const pixelSize = Number(pixelRange.value);
  const gridWidth = Math.max(1, Math.round(width / pixelSize));
  const gridHeight = Math.max(1, Math.round(height / pixelSize));

  const smallCanvas = document.createElement("canvas");
  smallCanvas.width = gridWidth;
  smallCanvas.height = gridHeight;
  const smallCtx = smallCanvas.getContext("2d");
  smallCtx.imageSmoothingEnabled = true;
  smallCtx.drawImage(currentImage, 0, 0, gridWidth, gridHeight);
  applyColorSimplify(smallCanvas, Number(simplifyRange.value) / 100);

  // 2단계: 축소된 이미지를 다시 확대한다. 이때 스무딩을 꺼서 경계를 또렷하게 만든다.
  const outputScale = Number(scaleRange.value);
  resultCanvas.width = gridWidth * outputScale;
  resultCanvas.height = gridHeight * outputScale;
  const resultCtx = resultCanvas.getContext("2d");
  resultCtx.imageSmoothingEnabled = false;
  resultCtx.drawImage(smallCanvas, 0, 0, resultCanvas.width, resultCanvas.height);

  gridInfo.textContent = `${gridWidth} x ${gridHeight} ${t.gridUnit}`;
}

/**
 * 완성된 픽셀아트 결과(resultCanvas)를 PNG 파일로 다운로드한다.
 */
function downloadResult() {
  if (!currentImage) return;
  const link = document.createElement("a");
  link.download = "pixel-art.png";
  link.href = resultCanvas.toDataURL("image/png");
  link.click();
}

/**
 * 업로드 화면으로 되돌리고 상태를 초기화한다.
 */
function resetWorkspace() {
  currentImage = null;
  fileInput.value = "";
  workspace.hidden = true;
}

// 업로드 영역 클릭 시 파일 선택창 열기
dropZone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  if (e.target.files[0]) loadImage(e.target.files[0]);
});

// 드래그앤드롭 처리
["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
  });
});

dropZone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) loadImage(file);
});

// 슬라이더 조작 시 실시간 반영
pixelRange.addEventListener("input", () => {
  pixelValue.textContent = pixelRange.value;
  renderAll();
});

scaleRange.addEventListener("input", () => {
  scaleValue.textContent = scaleRange.value + "x";
  renderAll();
});

simplifyRange.addEventListener("input", () => {
  simplifyValue.textContent = simplifyRange.value + "%";
  renderAll();
});

downloadBtn.addEventListener("click", downloadResult);
resetBtn.addEventListener("click", resetWorkspace);

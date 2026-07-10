/**
 * 이미지 포맷/용량 변환기
 * 업로드된 이미지를 Canvas API로 다시 그려 PNG/JPG/WebP 포맷으로 바꾸고,
 * JPG/WebP는 화질 슬라이더로 용량을 조절한다. 서버 없이 브라우저 안에서만 처리된다.
 */

// 언어별 번역 사전. 언어를 추가하려면 이 객체에 블록 하나만 더 추가하면 된다.
const translations = {
  ko: {
    pageTitle: "이미지 포맷/용량 변환기",
    appTitle: "이미지 포맷/용량 변환기",
    appSubtitle: "이미지를 올리고 원하는 포맷으로 바꾼 뒤, 화질을 조절해 용량도 줄여보세요.",
    metaDescription: "이미지를 PNG, JPG, WebP로 변환하고 화질을 조절해 용량을 줄여주는 무료 온라인 도구입니다.",
    uploadText: "여기를 클릭하거나 이미지를 끌어다 놓으세요",
    uploadHint: "PNG, JPG, WebP 등 이미지 파일",
    originalLabel: "원본",
    resultLabel: "변환 결과",
    formatLabel: "출력 포맷",
    qualityLabel: "화질 (용량)",
    downloadBtn: "다운로드",
    resetBtn: "다른 이미지 올리기",
  },
  en: {
    pageTitle: "Image Format & Size Converter",
    appTitle: "Image Format & Size Converter",
    appSubtitle: "Upload an image, pick a format, and adjust quality to shrink the file size.",
    metaDescription: "Convert images to PNG, JPG, or WebP and reduce file size with a quality slider, free and online.",
    uploadText: "Click here or drag and drop an image",
    uploadHint: "PNG, JPG, WebP, and other image files",
    originalLabel: "Original",
    resultLabel: "Result",
    formatLabel: "Output format",
    qualityLabel: "Quality (size)",
    downloadBtn: "Download",
    resetBtn: "Upload another image",
  },
};

/**
 * 브라우저에 설정된 언어를 읽어 지원하는 언어 코드로 매핑한다.
 * 지원하지 않는 언어는 영어로 대체한다.
 * Returns: "ko" | "en"
 */
function detectLanguage() {
  const browserLang = (navigator.language || "en").toLowerCase();
  return browserLang.startsWith("ko") ? "ko" : "en";
}

const currentLang = detectLanguage();
const t = translations[currentLang];

/**
 * data-i18n 속성이 붙은 모든 요소의 텍스트를 현재 언어로 채운다.
 * 문서 제목과 html lang 속성, 검색엔진/소셜 공유용 메타 태그도 함께 갱신한다.
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

/**
 * 지정한 선택자의 메타 태그 content 속성을 갱신한다. 태그가 없으면 아무것도 하지 않는다.
 */
function setMetaContent(selector, content) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute("content", content);
}

applyTranslations();

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const workspace = document.getElementById("workspace");
const originalPreview = document.getElementById("originalPreview");
const resultPreview = document.getElementById("resultPreview");
const originalInfo = document.getElementById("originalInfo");
const resultInfo = document.getElementById("resultInfo");
const formatBtns = document.querySelectorAll(".format-btn");
const qualityRow = document.getElementById("qualityRow");
const qualityRange = document.getElementById("qualityRange");
const qualityValue = document.getElementById("qualityValue");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");

const EXT_BY_FORMAT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

let currentImage = null; // 현재 업로드된 이미지(HTMLImageElement)
let currentImageBytes = 0; // 원본 파일 용량(바이트)
let selectedFormat = "image/png";
let resultBlob = null; // 변환된 결과(Blob)

/**
 * 바이트 수를 사람이 읽기 좋은 KB/MB 단위 문자열로 바꾼다.
 * @param {number} bytes 바이트 수
 * Returns: "12.3 KB" 같은 표시용 문자열
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 파일 선택/드롭 이벤트로 전달된 이미지 파일을 읽어 화면에 로드한다.
 * @param {File} file 사용자가 선택한 이미지 파일
 */
function loadImage(file) {
  if (!file || !file.type.startsWith("image/")) return;
  currentImageBytes = file.size;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      originalPreview.src = img.src;
      originalInfo.textContent = `${img.naturalWidth} x ${img.naturalHeight} · ${formatBytes(currentImageBytes)}`;
      workspace.hidden = false;
      renderResult();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * 선택된 포맷/화질로 이미지를 다시 인코딩하고 결과 미리보기를 갱신한다.
 */
function renderResult() {
  if (!currentImage) return;

  const canvas = document.createElement("canvas");
  canvas.width = currentImage.naturalWidth;
  canvas.height = currentImage.naturalHeight;
  const ctx = canvas.getContext("2d");

  // JPG는 투명 배경을 지원하지 않으므로 흰 배경을 먼저 채운 뒤 그린다.
  if (selectedFormat === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(currentImage, 0, 0);

  const quality = Number(qualityRange.value) / 100;
  canvas.toBlob(
    (blob) => {
      resultBlob = blob;
      resultPreview.src = URL.createObjectURL(blob);
      resultInfo.textContent = `${canvas.width} x ${canvas.height} · ${formatBytes(blob.size)}`;
    },
    selectedFormat,
    selectedFormat === "image/png" ? undefined : quality
  );
}

/**
 * 변환된 결과(resultBlob)를 선택한 포맷의 파일로 다운로드한다.
 */
function downloadResult() {
  if (!resultBlob) return;
  const link = document.createElement("a");
  link.download = `converted.${EXT_BY_FORMAT[selectedFormat]}`;
  link.href = URL.createObjectURL(resultBlob);
  link.click();
}

/**
 * 업로드 화면으로 되돌리고 상태를 초기화한다.
 */
function resetWorkspace() {
  currentImage = null;
  resultBlob = null;
  fileInput.value = "";
  workspace.hidden = true;
}

dropZone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  if (e.target.files[0]) loadImage(e.target.files[0]);
});

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

formatBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    formatBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedFormat = btn.dataset.format;
    qualityRow.hidden = selectedFormat === "image/png";
    renderResult();
  });
});

qualityRange.addEventListener("input", () => {
  qualityValue.textContent = qualityRange.value + "%";
  renderResult();
});

downloadBtn.addEventListener("click", downloadResult);
resetBtn.addEventListener("click", resetWorkspace);

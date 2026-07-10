/**
 * 이미지 리사이즈/크롭 도구
 * 1단계: 원본 이미지 위에서 드래그로 자를 영역을 고른다 (비율 고정 버튼 지원).
 * 2단계: 잘라낸 이미지를 원하는 가로/세로 크기로 조절해 PNG로 다운로드한다.
 * 서버 없이 브라우저 안에서만 처리된다.
 */

const translations = {
  ko: {
    pageTitle: "이미지 리사이즈/크롭 도구",
    appTitle: "이미지 리사이즈/크롭 도구",
    appSubtitle: "자를 영역을 직접 드래그로 고른 뒤, 원하는 크기로 조절해서 다운로드하세요.",
    metaDescription: "이미지를 원하는 영역만큼 자르고, 원하는 크기로 조절해서 다운로드하는 무료 온라인 도구입니다.",
    uploadText: "여기를 클릭하거나 이미지를 끌어다 놓으세요",
    uploadHint: "PNG, JPG 등 이미지 파일",
    cropStepTitle: "① 자를 영역을 선택하세요",
    ratioFree: "자유롭게",
    resizeStepTitle: "② 크기를 조절하고 다운로드하세요",
    widthLabel: "가로(px)",
    heightLabel: "세로(px)",
    lockAspectLabel: "가로세로 비율 유지",
    applyCropBtn: "자르기 적용",
    backToCropBtn: "다시 자르기",
    downloadBtn: "다운로드",
    resetBtn: "다른 이미지 올리기",
    cropInfoText: (w, h) => `${w} x ${h}px 선택됨`,
  },
  en: {
    pageTitle: "Image Resize & Crop Tool",
    appTitle: "Image Resize & Crop Tool",
    appSubtitle: "Drag to pick the area you want, then resize it to any size and download.",
    metaDescription: "Crop an image to any area and resize it to any dimensions, free and online.",
    uploadText: "Click here or drag and drop an image",
    uploadHint: "PNG, JPG, and other image files",
    cropStepTitle: "① Select the area to crop",
    ratioFree: "Free",
    resizeStepTitle: "② Resize and download",
    widthLabel: "Width (px)",
    heightLabel: "Height (px)",
    lockAspectLabel: "Lock aspect ratio",
    applyCropBtn: "Apply Crop",
    backToCropBtn: "Crop again",
    downloadBtn: "Download",
    resetBtn: "Upload another image",
    cropInfoText: (w, h) => `${w} x ${h}px selected`,
  },
};

/**
 * 페이지가 특정 언어로 고정되어 있으면(window.FORCE_LANG) 그 언어를 쓰고,
 * 아니면 브라우저에 설정된 언어를 읽어 지원하는 언어 코드로 매핑한다.
 * Returns: "ko" | "en"
 */
function detectLanguage() {
  if (window.FORCE_LANG) return window.FORCE_LANG;
  const browserLang = (navigator.language || "en").toLowerCase();
  return browserLang.startsWith("ko") ? "ko" : "en";
}

const currentLang = detectLanguage();
const t = translations[currentLang];

/**
 * data-i18n 속성이 붙은 요소의 텍스트와 문서 메타 정보를 현재 언어로 채운다.
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

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const cropWorkspace = document.getElementById("cropWorkspace");
const resizeWorkspace = document.getElementById("resizeWorkspace");
const ratioButtons = document.querySelectorAll(".ratio-btn");
const cropStage = document.getElementById("cropStage");
const sourceImage = document.getElementById("sourceImage");
const cropBox = document.getElementById("cropBox");
const cropHandles = document.querySelectorAll(".crop-handle");
const cropInfo = document.getElementById("cropInfo");
const applyCropBtn = document.getElementById("applyCropBtn");
const resetBtn = document.getElementById("resetBtn");
const resetBtn2 = document.getElementById("resetBtn2");
const backToCropBtn = document.getElementById("backToCropBtn");
const resultPreview = document.getElementById("resultPreview");
const resultInfo = document.getElementById("resultInfo");
const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const lockAspect = document.getElementById("lockAspect");
const downloadBtn = document.getElementById("downloadBtn");

const MIN_BOX_SIZE = 24; // 자르기 박스의 최소 크기(px, 화면 표시 기준)

let currentImage = null; // 업로드된 원본 이미지(HTMLImageElement)
let box = { left: 0, top: 0, width: 0, height: 0 }; // 자르기 박스 (화면 표시 기준 px)
let lockedRatio = null; // 고정된 가로/세로 비율, null이면 자유롭게
let dragState = null; // 드래그 중인 상태
let croppedCanvas = null; // 잘라낸 결과(자연 해상도)
let resultBlob = null; // 최종 리사이즈 결과(Blob)

/**
 * 값을 최소/최대 범위 안으로 제한한다.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 바이트 수를 사람이 읽기 좋은 KB/MB 단위 문자열로 바꾼다.
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 파일 선택/드롭 이벤트로 전달된 이미지 파일을 읽어 자르기 화면에 로드한다.
 */
function loadImage(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      sourceImage.src = img.src;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// 화면에 보이는 sourceImage의 렌더링이 끝나면 자르기 박스를 초기 위치로 배치한다.
sourceImage.addEventListener("load", () => {
  lockedRatio = null;
  ratioButtons.forEach((b) => b.classList.toggle("active", b.dataset.ratio === "free"));
  cropWorkspace.hidden = false;
  resizeWorkspace.hidden = true;
  setDefaultBox();
});

/**
 * 자르기 박스를 이미지 가운데에 기본 크기(80%)로 배치한다.
 */
function setDefaultBox() {
  const rect = cropStage.getBoundingClientRect();
  const width = rect.width * 0.8;
  const height = rect.height * 0.8;
  box = { left: (rect.width - width) / 2, top: (rect.height - height) / 2, width, height };
  renderBox();
}

/**
 * 현재 box 상태를 실제 화면(cropBox 엘리먼트)에 반영한다.
 */
function renderBox() {
  cropBox.style.left = `${box.left}px`;
  cropBox.style.top = `${box.top}px`;
  cropBox.style.width = `${box.width}px`;
  cropBox.style.height = `${box.height}px`;
  updateCropInfo();
}

/**
 * 자르기 박스 크기를 원본 이미지의 실제 픽셀 단위로 환산해 안내 문구로 보여준다.
 */
function updateCropInfo() {
  if (!currentImage) return;
  const rect = cropStage.getBoundingClientRect();
  const scaleX = currentImage.naturalWidth / rect.width;
  const scaleY = currentImage.naturalHeight / rect.height;
  const w = Math.round(box.width * scaleX);
  const h = Math.round(box.height * scaleY);
  cropInfo.textContent = t.cropInfoText(w, h);
}

/**
 * 비율 고정 버튼에 맞춰 자르기 박스를 가운데 정렬로 다시 만든다.
 */
function applyRatioToBox() {
  if (!lockedRatio) return; // 자유롭게: 잠금만 해제하고 현재 박스는 그대로 둔다
  const rect = cropStage.getBoundingClientRect();
  let width = rect.width * 0.8;
  let height = width / lockedRatio;
  if (height > rect.height * 0.9) {
    height = rect.height * 0.9;
    width = height * lockedRatio;
  }
  box = { left: (rect.width - width) / 2, top: (rect.height - height) / 2, width, height };
  renderBox();
}

ratioButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    ratioButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    lockedRatio = btn.dataset.ratio === "free" ? null : Number(btn.dataset.ratio);
    applyRatioToBox();
  });
});

/**
 * 드래그(이동 또는 모서리 크기조절)를 시작한다.
 * @param {string} mode "move" 또는 모서리 이름("nw"|"ne"|"se"|"sw")
 * @param {PointerEvent} e
 */
function startDrag(mode, e) {
  e.preventDefault();
  dragState = { mode, startX: e.clientX, startY: e.clientY, startBox: { ...box } };
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd);
}

function onDragMove(e) {
  if (!dragState) return;
  const dx = e.clientX - dragState.startX;
  const dy = e.clientY - dragState.startY;
  const rect = cropStage.getBoundingClientRect();
  const { mode, startBox } = dragState;

  if (mode === "move") {
    box = {
      left: clamp(startBox.left + dx, 0, rect.width - startBox.width),
      top: clamp(startBox.top + dy, 0, rect.height - startBox.height),
      width: startBox.width,
      height: startBox.height,
    };
  } else {
    box = resizeFromHandle(mode, startBox, dx, dy, rect);
  }
  renderBox();
}

function onDragEnd() {
  dragState = null;
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
}

/**
 * 모서리를 드래그했을 때 새 자르기 박스를 계산한다. 비율이 고정되어 있으면 그 비율을 유지한다.
 * @param {string} corner "nw"|"ne"|"se"|"sw"
 * @param {{left:number, top:number, width:number, height:number}} startBox 드래그 시작 시점의 박스
 * @param {number} dx 가로 이동량(px)
 * @param {number} dy 세로 이동량(px)
 * @param {DOMRect} rect 자르기 무대(cropStage)의 경계
 */
function resizeFromHandle(corner, startBox, dx, dy, rect) {
  let left = startBox.left;
  let top = startBox.top;
  let right = startBox.left + startBox.width;
  let bottom = startBox.top + startBox.height;

  if (corner.includes("w")) left = clamp(startBox.left + dx, 0, right - MIN_BOX_SIZE);
  if (corner.includes("e")) right = clamp(right + dx, left + MIN_BOX_SIZE, rect.width);
  if (corner.includes("n")) top = clamp(startBox.top + dy, 0, bottom - MIN_BOX_SIZE);
  if (corner.includes("s")) bottom = clamp(bottom + dy, top + MIN_BOX_SIZE, rect.height);

  if (lockedRatio) {
    let width = right - left;
    let height = width / lockedRatio;
    if (corner.includes("n")) top = bottom - height;
    else bottom = top + height;

    // 비율을 유지한 채로 화면 밖으로 나가면 반대쪽 기준으로 다시 맞춘다.
    if (top < 0 || bottom > rect.height) {
      top = clamp(top, 0, rect.height - height);
      bottom = top + height;
    }
  }

  return { left, top, width: right - left, height: bottom - top };
}

cropBox.addEventListener("pointerdown", (e) => {
  if (e.target.classList.contains("crop-handle")) return;
  startDrag("move", e);
});

cropHandles.forEach((handle) => {
  handle.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    startDrag(handle.dataset.handle, e);
  });
});

/**
 * 자르기 박스 영역을 원본 이미지의 실제 픽셀로 잘라내 croppedCanvas에 저장하고,
 * 크기 조절 화면으로 넘어간다.
 */
function applyCrop() {
  if (!currentImage) return;
  const rect = cropStage.getBoundingClientRect();
  const scaleX = currentImage.naturalWidth / rect.width;
  const scaleY = currentImage.naturalHeight / rect.height;

  const sx = Math.round(box.left * scaleX);
  const sy = Math.round(box.top * scaleY);
  const sw = Math.max(1, Math.round(box.width * scaleX));
  const sh = Math.max(1, Math.round(box.height * scaleY));

  croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = sw;
  croppedCanvas.height = sh;
  croppedCanvas.getContext("2d").drawImage(currentImage, sx, sy, sw, sh, 0, 0, sw, sh);

  widthInput.value = sw;
  heightInput.value = sh;
  lockAspect.checked = true;

  cropWorkspace.hidden = true;
  resizeWorkspace.hidden = false;
  renderResize();
}

/**
 * 잘라낸 이미지를 입력한 가로/세로 크기로 다시 그려 미리보기와 다운로드용 결과를 만든다.
 */
function renderResize() {
  if (!croppedCanvas) return;
  const w = Math.max(1, Number(widthInput.value) || croppedCanvas.width);
  const h = Math.max(1, Number(heightInput.value) || croppedCanvas.height);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = w;
  outCanvas.height = h;
  outCanvas.getContext("2d").drawImage(croppedCanvas, 0, 0, w, h);

  outCanvas.toBlob((blob) => {
    resultBlob = blob;
    resultPreview.src = URL.createObjectURL(blob);
    resultInfo.textContent = `${w} x ${h} · ${formatBytes(blob.size)}`;
  }, "image/png");
}

widthInput.addEventListener("input", () => {
  if (lockAspect.checked && croppedCanvas) {
    const ratio = croppedCanvas.height / croppedCanvas.width;
    heightInput.value = Math.max(1, Math.round(Number(widthInput.value) * ratio));
  }
  renderResize();
});

heightInput.addEventListener("input", () => {
  if (lockAspect.checked && croppedCanvas) {
    const ratio = croppedCanvas.width / croppedCanvas.height;
    widthInput.value = Math.max(1, Math.round(Number(heightInput.value) * ratio));
  }
  renderResize();
});

/**
 * 최종 리사이즈 결과를 PNG 파일로 다운로드한다.
 */
function downloadResult() {
  if (!resultBlob) return;
  const link = document.createElement("a");
  link.download = "resized.png";
  link.href = URL.createObjectURL(resultBlob);
  link.click();
}

/**
 * 업로드 화면으로 되돌리고 모든 상태를 초기화한다.
 */
function resetAll() {
  currentImage = null;
  croppedCanvas = null;
  resultBlob = null;
  fileInput.value = "";
  cropWorkspace.hidden = true;
  resizeWorkspace.hidden = true;
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

applyCropBtn.addEventListener("click", applyCrop);
downloadBtn.addEventListener("click", downloadResult);
resetBtn.addEventListener("click", resetAll);
resetBtn2.addEventListener("click", resetAll);
backToCropBtn.addEventListener("click", () => {
  resizeWorkspace.hidden = true;
  cropWorkspace.hidden = false;
});

(() => {
  "use strict";

  const MAIN_IDS = ["s1","s2","s3","s4","s5","s6","s7","s8","s9"];
  const BACKUP_IDS = ["q1","q2","q3","q4","q5","q6","q6b","q7","q8","q9","q10"];
  const ALL_IDS = [...MAIN_IDS, ...BACKUP_IDS];
  const stage = document.getElementById("stage");
  const viewport = document.getElementById("viewport");
  const slides = [...document.querySelectorAll(".slide")];
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const counter = document.getElementById("counter");
  const sectionLabel = document.getElementById("section-label");
  const progressFill = document.getElementById("progress-fill");
  const lightbox = document.getElementById("lightbox");
  const toast = document.getElementById("toast");
  let currentId = "s1";
  let touchStartX = 0;
  let touchStartY = 0;
  let toastTimer;
  const demoBase = document.querySelector('meta[name="class-on-demo-url"]')?.content || "../web-demo/dist/?mode=present";

  function scaleStage() {
    const scale = Math.min(viewport.clientWidth / 1920, viewport.clientHeight / 1080);
    document.documentElement.style.setProperty("--scale", String(scale));
  }

  function parseHash() {
    const requested = location.hash.replace(/^#/, "");
    return ALL_IDS.includes(requested) ? requested : "s1";
  }

  function currentList() {
    return MAIN_IDS.includes(currentId) ? MAIN_IDS : BACKUP_IDS;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
  }

  function showSlide(id, {updateHash = true} = {}) {
    if (!ALL_IDS.includes(id)) id = "s1";
    currentId = id;
    slides.forEach(slide => {
      const active = slide.dataset.id === id;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    const list = currentList();
    const index = list.indexOf(id);
    const main = list === MAIN_IDS;
    sectionLabel.textContent = main ? "본편" : "Q&A BACKUP";
    counter.textContent = `${index + 1} / ${list.length}`;
    progressFill.style.width = `${((index + 1) / list.length) * 100}%`;
    progressFill.style.background = main ? "#2F6FED" : "#6956C9";
    prevButton.disabled = index === 0;
    nextButton.disabled = index === list.length - 1;
    if (updateHash && location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
    document.title = `${document.querySelector(`[data-id="${id}"]`).dataset.title} · CLASS:ON`;
  }

  function move(delta) {
    const list = currentList();
    const index = list.indexOf(currentId);
    const next = index + delta;
    if (next < 0 || next >= list.length) {
      if (currentId === "s9" && delta > 0) showToast("본편 끝입니다. Q&A는 결론 슬라이드의 버튼으로 여세요.");
      return;
    }
    showSlide(list[next]);
  }

  function closeOverlays() {
    lightbox.hidden = true;
  }

  function openLightbox(src, caption) {
    const image = document.getElementById("lightbox-image");
    document.getElementById("lightbox-caption").textContent = caption || "백업 화면";
    image.src = src;
    image.alt = caption || "백업 화면";
    lightbox.hidden = false;
    lightbox.querySelector("button")?.focus();
  }

  function openGallery(name) {
    const first = name === "demo2"
      ? ["../web-demo/screenshots/05-debug-1-0.png", "시연 2 · CLASS:ON 1.0 문제"]
      : ["../web-demo/screenshots/01-home.png", "시연 1 · 김민준 홈"];
    openLightbox(first[0], first[1]);
  }

  function demoUrl(route = "") {
    const url = new URL(demoBase, location.href);
    if (route) url.hash = route.replace(/^#/, "");
    return url;
  }

  function openDemo(route = "") {
    const url = demoUrl(route);
    const opened = window.open(url.href, "class-on-demo");
    if (!opened) showToast("팝업이 차단됐습니다. 옆의 일반 링크를 사용하세요.");
  }

  function toggleFullscreen() {
    if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) {
      showToast("이 브라우저는 웹 전체화면을 지원하지 않습니다. 브라우저 전체화면을 사용하세요.");
      return;
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => showToast("브라우저 메뉴에서 전체화면을 허용해 주세요."));
    } else {
      document.exitFullscreen?.();
    }
  }

  function isTypingTarget(target) {
    return target instanceof HTMLElement && (target.closest("button,a,input,textarea,select,[contenteditable='true']") || target.closest(".overlay:not([hidden])"));
  }

  prevButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));
  document.getElementById("fullscreen").addEventListener("click", toggleFullscreen);

  document.addEventListener("click", event => {
    const target = event.target.closest("[data-goto],[data-overlay-close],[data-lightbox],[data-gallery],[data-demo-open]");
    if (!target) return;
    if (target.dataset.goto) {
      showSlide(target.dataset.goto);
      closeOverlays();
    } else if (target.hasAttribute("data-overlay-close")) {
      closeOverlays();
    } else if (target.dataset.lightbox) {
      openLightbox(target.dataset.lightbox, target.dataset.caption);
    } else if (target.dataset.gallery) {
      openGallery(target.dataset.gallery);
    } else if (target.hasAttribute("data-demo-open")) {
      openDemo(target.dataset.demoRoute || "");
    }
  });

  window.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (!lightbox.hidden) closeOverlays();
      return;
    }
    if (isTypingTarget(event.target)) return;
    if (["ArrowRight","PageDown"," "].includes(event.key)) { event.preventDefault(); move(1); }
    else if (["ArrowLeft","PageUp"].includes(event.key)) { event.preventDefault(); move(-1); }
    else if (event.key === "Home") { event.preventDefault(); showSlide("s1"); }
    else if (event.key === "End") { event.preventDefault(); showSlide("s9"); }
    else if (event.key.toLowerCase() === "f") { event.preventDefault(); toggleFullscreen(); }
  });

  viewport.addEventListener("touchstart", event => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, {passive: true});
  viewport.addEventListener("touchend", event => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) move(dx < 0 ? 1 : -1);
  }, {passive: true});

  window.addEventListener("hashchange", () => showSlide(parseHash(), {updateHash: false}));
  window.addEventListener("resize", scaleStage);
  document.addEventListener("fullscreenchange", scaleStage);

  document.querySelectorAll("[data-demo-link]").forEach(link => {
    link.href = demoUrl(link.dataset.demoRoute || "").href;
  });
  scaleStage();
  showSlide(parseHash(), {updateHash: false});
})();

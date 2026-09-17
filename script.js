document.documentElement.classList.add("js-enabled");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const boot = document.querySelector("[data-boot]");
const bootCount = document.querySelector("[data-boot-count]");
let hasBooted = false;

try {
  hasBooted = sessionStorage.getItem("samiel-booted") === "1";
  sessionStorage.setItem("samiel-booted", "1");
} catch (_) {
  hasBooted = false;
}

function finishBoot() {
  document.body.classList.add("is-ready");
  boot?.classList.add("is-done");
  if (window.location.hash) {
    const scrollToDeepLink = () => document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "auto", block: "start" });
    scrollToDeepLink();
    requestAnimationFrame(scrollToDeepLink);
    window.addEventListener("load", scrollToDeepLink, { once: true });
    document.fonts?.ready.then(scrollToDeepLink);
    window.setTimeout(scrollToDeepLink, 1200);
  }
  window.setTimeout(() => boot?.remove(), 650);
}

if (boot && bootCount && !prefersReducedMotion && !hasBooted && !window.location.hash) {
  const startedAt = Date.now();
  const duration = 1150;

  const tick = () => {
    const progress = Math.min((Date.now() - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    bootCount.textContent = String(Math.floor(eased * 100)).padStart(3, "0");

    if (progress >= 1) {
      window.clearInterval(timer);
      window.setTimeout(finishBoot, 180);
    }
  };

  const timer = window.setInterval(tick, 24);
  tick();
} else {
  finishBoot();
}

const header = document.querySelector("[data-header]");
const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 32);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const revealItems = [...document.querySelectorAll(".reveal")];
if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

if (window.location.hash) {
  const deepLinkedSection = document.querySelector(window.location.hash);
  deepLinkedSection?.classList.add("is-visible");
  deepLinkedSection?.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
}

const themeMeta = document.querySelector('meta[name="theme-color"]');
const invertButton = document.querySelector("[data-invert]");
const gridButton = document.querySelector("[data-grid]");

function setInvert(enabled) {
  document.body.classList.toggle("is-inverted", enabled);
  invertButton?.setAttribute("aria-pressed", String(enabled));
  if (themeMeta) themeMeta.content = enabled ? "#eeede7" : "#050505";
  try {
    sessionStorage.setItem("samiel-invert", enabled ? "1" : "0");
  } catch (_) {
    // Storage can be unavailable in private browser contexts.
  }
}

function setGrid(enabled) {
  document.body.classList.toggle("grid-off", !enabled);
  gridButton?.setAttribute("aria-pressed", String(enabled));
}

let savedInvert = false;
try {
  savedInvert = sessionStorage.getItem("samiel-invert") === "1";
} catch (_) {
  savedInvert = false;
}
setInvert(savedInvert);
setGrid(true);

invertButton?.addEventListener("click", () => setInvert(!document.body.classList.contains("is-inverted")));
gridButton?.addEventListener("click", () => setGrid(document.body.classList.contains("grid-off")));

const parallaxStage = document.querySelector("[data-parallax-stage]");
const parallaxObject = document.querySelector("[data-parallax-object]");

if (parallaxStage && parallaxObject && !prefersReducedMotion) {
  parallaxStage.addEventListener("pointermove", (event) => {
    const bounds = parallaxStage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    parallaxObject.style.transform = `translate(calc(-50% + ${x * 18}px), calc(-42% + ${y * 15}px)) rotate(${x * 4 - 4}deg)`;
  });

  parallaxStage.addEventListener("pointerleave", () => {
    parallaxObject.style.transform = "translate(-50%, -42%) rotate(-4deg)";
  });
}

const projectViewer = document.querySelector("[data-project-viewer]");
if (projectViewer) {
  const buttons = [...projectViewer.querySelectorAll("[data-project-button]")];
  const previousButtons = [...projectViewer.querySelectorAll("[data-project-prev]")];
  const nextButtons = [...projectViewer.querySelectorAll("[data-project-next]")];
  const openButtons = [...projectViewer.querySelectorAll("[data-project-open]")];
  const video = projectViewer.querySelector("[data-project-video]");
  const number = projectViewer.querySelector("[data-project-number]");
  const railNumber = projectViewer.querySelector("[data-project-number-rail]");
  const title = projectViewer.querySelector("[data-project-title]");
  const status = projectViewer.querySelector("[data-project-status]");
  const category = projectViewer.querySelector("[data-project-category]");
  const screenLink = projectViewer.querySelector("[data-project-link]");
  const description = projectViewer.querySelector("[data-project-description]");
  const readoutLink = projectViewer.querySelector("[data-project-readout-link]");
  const deckScene = projectViewer.querySelector("[data-deck-scene]");
  const deckShell = projectViewer.querySelector("[data-deck-shell]");
  let activeIndex = 0;
  let switchToken = 0;
  let modelInteractive = false;

  const showProject = (index, focusButton = false) => {
    activeIndex = (index + buttons.length) % buttons.length;
    const selected = buttons[activeIndex];
    const selectedNumber = String(activeIndex + 1).padStart(2, "0");

    buttons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === activeIndex;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    if (number) number.textContent = selectedNumber;
    if (railNumber) railNumber.textContent = selectedNumber;
    if (title) title.textContent = selected.dataset.title || "Project";
    if (status) status.textContent = selected.dataset.status || "SELECTED PROJECT";
    if (category) category.textContent = selected.dataset.category || "SYSTEM";
    if (description) description.textContent = selected.dataset.description || "";

    [screenLink, readoutLink].forEach((link) => {
      if (!link) return;
      link.href = selected.dataset.url || "#";
      link.setAttribute("aria-label", `Open ${selected.dataset.title || "project"}`);
    });

    if (video && video.getAttribute("src") !== selected.dataset.video) {
      const token = ++switchToken;
      video.classList.add("is-switching");

      window.setTimeout(() => {
        if (token !== switchToken) return;
        video.pause();
        video.poster = selected.dataset.poster || "";
        video.src = selected.dataset.video || "";
        video.load();

        const revealVideo = () => {
          if (token !== switchToken) return;
          video.classList.remove("is-switching");
          if (!prefersReducedMotion && modelInteractive) video.play().catch(() => {});
        };

        video.addEventListener("loadeddata", revealVideo, { once: true });
        window.setTimeout(revealVideo, 900);
      }, 190);
    } else if (video && !prefersReducedMotion && modelInteractive) {
      video.play().catch(() => {});
    }

    if (focusButton) selected.focus();
    projectViewer.classList.remove("is-channel-switching");
    requestAnimationFrame(() => projectViewer.classList.add("is-channel-switching"));
  };

  buttons.forEach((button, index) => button.addEventListener("click", () => showProject(index)));
  previousButtons.forEach((button) => button.addEventListener("click", () => showProject(activeIndex - 1)));
  nextButtons.forEach((button) => button.addEventListener("click", () => showProject(activeIndex + 1)));
  openButtons.forEach((button) => button.addEventListener("click", () => screenLink?.click()));

  projectViewer.addEventListener("project-control", (event) => {
    const action = event.detail?.action;
    if (action === "previous") showProject(activeIndex - 1);
    if (action === "next") showProject(activeIndex + 1);
    if (action === "open" && screenLink?.href) {
      const openedProject = window.open(screenLink.href, "_blank", "noopener,noreferrer");
      if (openedProject) openedProject.opener = null;
    }
  });

  projectViewer.addEventListener("psp-ready", () => {
    modelInteractive = true;
    if (!prefersReducedMotion) video?.play().catch(() => {});
  }, { once: true });

  projectViewer.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    showProject(activeIndex + (event.key === "ArrowRight" ? 1 : -1), true);
  });

  if (deckScene && deckShell && !prefersReducedMotion) {
    deckScene.addEventListener("pointermove", (event) => {
      const bounds = deckScene.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      deckShell.style.setProperty("--deck-ry", `${x * 15 - 5}deg`);
      deckShell.style.setProperty("--deck-rx", `${7 - y * 11}deg`);
    });

    deckScene.addEventListener("pointerleave", () => {
      deckShell.style.removeProperty("--deck-ry");
      deckShell.style.removeProperty("--deck-rx");
    });
  }

  const requestedProject = Number.parseInt(new URLSearchParams(window.location.search).get("project") || "0", 10);
  showProject(Number.isFinite(requestedProject) ? requestedProject : 0);
  if (prefersReducedMotion) video?.pause();
}

const pointerCanvas = document.querySelector("[data-pointer-trail]");
const pointerCursor = document.querySelector("[data-pointer-cursor]");
const pointerLabel = document.querySelector("[data-pointer-label]");
const pointerReadout = document.querySelector("[data-telemetry-pointer]");
const telemetryView = document.querySelector("[data-telemetry-view]");
const telemetryCpu = document.querySelector("[data-telemetry-cpu]");
const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (pointerCanvas && pointerCursor && hasFinePointer && !prefersReducedMotion) {
  const context = pointerCanvas.getContext("2d");
  const points = [];
  let cursorX = -100;
  let cursorY = -100;
  let previousX = cursorX;
  let previousY = cursorY;
  let frame = 0;

  const resizePointerCanvas = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    pointerCanvas.width = Math.round(window.innerWidth * ratio);
    pointerCanvas.height = Math.round(window.innerHeight * ratio);
    pointerCanvas.style.width = `${window.innerWidth}px`;
    pointerCanvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const addTrail = (x, y) => {
    const distance = Math.hypot(x - previousX, y - previousY);
    const segments = Math.max(1, Math.min(10, Math.ceil(distance / 12)));
    for (let index = 0; index < segments; index += 1) {
      const progress = index / segments;
      points.push({
        x: previousX + (x - previousX) * progress,
        y: previousY + (y - previousY) * progress,
        life: 1,
        size: index % 3 === 0 ? 4 : 2,
      });
    }
    previousX = x;
    previousY = y;
    if (points.length > 140) points.splice(0, points.length - 140);
  };

  window.addEventListener("pointermove", (event) => {
    cursorX = event.clientX;
    cursorY = event.clientY;
    if (previousX < 0) {
      previousX = cursorX;
      previousY = cursorY;
    }
    addTrail(cursorX, cursorY);
    pointerCursor.classList.add("is-visible");
    pointerCursor.style.transform = `translate3d(${cursorX + 8}px, ${cursorY - 9}px, 0)`;
    if (pointerReadout) {
      pointerReadout.textContent = `${String(Math.round(cursorX)).padStart(4, "0")}:${String(Math.round(cursorY)).padStart(4, "0")}`;
    }

    const interactive = event.target.closest("a, button, [data-cursor]");
    pointerCursor.classList.toggle("is-active", Boolean(interactive));
    if (pointerLabel) {
      pointerLabel.textContent = interactive?.dataset.cursor || (interactive?.tagName === "A" ? "OPEN" : interactive ? "EXEC" : "PTR");
    }
  }, { passive: true });

  document.documentElement.addEventListener("mouseleave", () => pointerCursor.classList.remove("is-visible"));
  window.addEventListener("resize", resizePointerCanvas, { passive: true });

  const drawTrail = () => {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    frame += 1;
    for (let index = points.length - 1; index >= 0; index -= 1) {
      const point = points[index];
      point.life -= 0.028;
      if (point.life <= 0) {
        points.splice(index, 1);
        continue;
      }
      const gridX = Math.round(point.x / 4) * 4;
      const gridY = Math.round(point.y / 4) * 4;
      context.fillStyle = `rgba(223, 255, 0, ${point.life * 0.55})`;
      context.fillRect(gridX, gridY, point.size, point.size);
      if ((index + frame) % 6 === 0) {
        context.fillStyle = `rgba(255, 255, 255, ${point.life * 0.22})`;
        context.fillRect(gridX + 5, gridY, 1, 1);
      }
    }
    requestAnimationFrame(drawTrail);
  };

  resizePointerCanvas();
  drawTrail();
}

if (telemetryView) {
  const telemetrySections = [...document.querySelectorAll("main section[id]")];
  const viewObserver = new IntersectionObserver((entries) => {
    const active = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (active?.target.id) telemetryView.textContent = active.target.id.toUpperCase();
  }, { threshold: [0.2, 0.45, 0.7] });
  telemetrySections.forEach((section) => viewObserver.observe(section));
}

if (telemetryCpu && !prefersReducedMotion) {
  window.setInterval(() => {
    const value = 1.8 + Math.random() * 4.7;
    telemetryCpu.textContent = `${value.toFixed(1).padStart(4, "0")}%`;
  }, 1200);
}

const sessionOptions = [...document.querySelectorAll(".session-option")];
const sessionTitle = document.querySelector("[data-session-title]");
const sessionDescription = document.querySelector("[data-session-description]");
const sessionPrice = document.querySelector("[data-session-price]");
const sessionDuration = document.querySelector("[data-session-duration]");
const bookingLink = document.querySelector("[data-booking-link]");

function selectSession(option, focus = false) {
  sessionOptions.forEach((item) => {
    const isActive = item === option;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
    item.tabIndex = isActive ? 0 : -1;
  });

  if (sessionTitle) sessionTitle.textContent = option.dataset.title || "Session";
  if (sessionDescription) sessionDescription.textContent = option.dataset.description || "";
  if (sessionPrice) sessionPrice.textContent = option.dataset.price || "";
  if (sessionDuration) sessionDuration.textContent = `/ ${option.dataset.duration || ""}`;
  if (bookingLink) bookingLink.href = option.dataset.url || "#";
  if (focus) option.focus();
}

sessionOptions.forEach((option, index) => {
  option.addEventListener("click", () => selectSession(option));
  option.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const direction = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
    const nextIndex = (index + direction + sessionOptions.length) % sessionOptions.length;
    selectSession(sessionOptions[nextIndex], true);
  });
});

const activeSession = document.querySelector(".session-option.is-active");
if (activeSession) selectSession(activeSession);

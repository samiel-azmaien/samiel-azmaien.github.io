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

const caseFiles = [...document.querySelectorAll(".case-study")];
let openCaseFile = () => {};

if (caseFiles.length) {
  const transitionDuration = 600;

  const setCaseFileState = (article, shouldOpen, options = {}) => {
    const { animate = true, focus = false } = options;
    const trigger = article.querySelector(".case-study__trigger");
    const panel = article.querySelector(".case-study__panel");
    if (!trigger || !panel || article.classList.contains("is-open") === shouldOpen) return;

    window.clearTimeout(article.caseFileTimer);
    const startHeight = panel.getBoundingClientRect().height;
    article.classList.toggle("is-open", shouldOpen);
    article.classList.remove("is-transitioning");
    trigger.setAttribute("aria-expanded", String(shouldOpen));
    panel.setAttribute("aria-hidden", String(!shouldOpen));

    if (!animate || prefersReducedMotion) {
      panel.style.height = shouldOpen ? "auto" : "0px";
      if (focus) trigger.focus();
      return;
    }

    panel.style.height = `${startHeight}px`;
    panel.getBoundingClientRect();
    article.classList.add("is-transitioning");
    requestAnimationFrame(() => {
      panel.style.height = shouldOpen ? `${panel.scrollHeight}px` : "0px";
    });

    article.caseFileTimer = window.setTimeout(() => {
      panel.style.height = shouldOpen ? "auto" : "0px";
      article.classList.remove("is-transitioning");
    }, transitionDuration);

    if (focus) trigger.focus();
  };

  caseFiles.forEach((article, index) => {
    const header = article.querySelector(".case-study__header");
    const identity = header?.firstElementChild;
    const numberText = identity?.querySelector(".case-study__number")?.textContent.trim() || String(index + 1).padStart(2, "0");
    const eyebrowText = identity?.querySelector(".case-study__eyebrow")?.textContent.trim() || "CASE FILE";
    const titleText = identity?.querySelector("h3")?.textContent.trim() || "Project";
    const panelId = `${article.id || `case-file-${index + 1}`}-panel`;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "case-study__trigger";
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", panelId);
    trigger.setAttribute("aria-label", `Expand ${titleText} case file`);

    const number = document.createElement("span");
    number.className = "case-study__number";
    number.textContent = numberText;

    const copy = document.createElement("span");
    copy.className = "case-study__trigger-copy";
    const eyebrow = document.createElement("span");
    eyebrow.className = "case-study__eyebrow";
    eyebrow.textContent = eyebrowText;
    const title = document.createElement("h3");
    title.textContent = titleText;
    copy.append(eyebrow, title);

    const toggle = document.createElement("span");
    toggle.className = "case-study__toggle";
    toggle.setAttribute("aria-hidden", "true");
    const openLabel = document.createElement("span");
    openLabel.className = "case-study__toggle-open";
    openLabel.textContent = "OPEN CASE";
    const closeLabel = document.createElement("span");
    closeLabel.className = "case-study__toggle-close";
    closeLabel.textContent = "CLOSE CASE";
    const toggleMark = document.createElement("i");
    toggle.append(openLabel, closeLabel, toggleMark);
    trigger.append(number, copy, toggle);

    const panel = document.createElement("div");
    panel.className = "case-study__panel";
    panel.id = panelId;
    panel.setAttribute("aria-hidden", "true");
    const panelInner = document.createElement("div");
    panelInner.className = "case-study__panel-inner";
    [...article.childNodes].forEach((child) => panelInner.append(child));
    panel.append(panelInner);
    article.append(trigger, panel);

    trigger.addEventListener("click", () => {
      const shouldOpen = !article.classList.contains("is-open");
      if (shouldOpen) {
        caseFiles.forEach((other) => {
          if (other !== article) setCaseFileState(other, false);
        });
      }
      setCaseFileState(article, shouldOpen);
      trigger.setAttribute("aria-label", `${shouldOpen ? "Collapse" : "Expand"} ${titleText} case file`);
    });
  });

  openCaseFile = (article, options = {}) => {
    if (!article?.classList.contains("case-study")) return;
    caseFiles.forEach((other) => {
      if (other !== article) setCaseFileState(other, false, options);
    });
    setCaseFileState(article, true, options);
    article.querySelector(".case-study__trigger")?.setAttribute("aria-label", `Collapse ${article.querySelector(".case-study__trigger h3")?.textContent || "project"} case file`);
  };

  const openHashCaseFile = (animate = false) => {
    const target = window.location.hash ? document.querySelector(window.location.hash) : null;
    if (!target?.classList.contains("case-study")) return;
    openCaseFile(target, { animate });
    requestAnimationFrame(() => target.scrollIntoView({ behavior: "auto", block: "start" }));
  };

  openHashCaseFile(false);
  window.addEventListener("hashchange", () => openHashCaseFile(!prefersReducedMotion));
}

const themeMeta = document.querySelector('meta[name="theme-color"]');
const invertButton = document.querySelector("[data-invert]");
const gridButton = document.querySelector("[data-grid]");

function applyInvertState(enabled) {
  document.body.classList.toggle("is-inverted", enabled);
  invertButton?.setAttribute("aria-pressed", String(enabled));
  if (themeMeta) themeMeta.content = enabled ? "#eeede7" : "#050505";
  try {
    sessionStorage.setItem("samiel-invert", enabled ? "1" : "0");
  } catch (_) {
    // Storage can be unavailable in private browser contexts.
  }
  window.dispatchEvent(new CustomEvent("samiel-themechange", { detail: { inverted: enabled } }));
}

let themeRainOverlay = null;
let themeRainTimers = [];

function clearThemeRain() {
  themeRainTimers.forEach((timer) => window.clearTimeout(timer));
  themeRainTimers = [];
  themeRainOverlay?.remove();
  themeRainOverlay = null;
  delete document.documentElement.dataset.themeTransition;
}

function buildThemeRain(enabled) {
  clearThemeRain();
  const overlay = document.createElement("div");
  overlay.className = "theme-rain";
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.setProperty("--rain-color", enabled ? "#eeede7" : "#050505");

  const drops = document.createElement("div");
  drops.className = "theme-rain__drops";
  for (let index = 0; index < 72; index += 1) {
    const drop = document.createElement("i");
    const lane = ((index * 37) % 101) + (((index % 4) - 1.5) * 0.7);
    const delay = (index % 12) * 24 + Math.floor(index / 12) * 18;
    const duration = 430 + ((index * 53) % 240);
    const length = 12 + ((index * 11) % 38);
    const width = 2 + (index % 3);
    drop.style.setProperty("--drop-x", `${lane}%`);
    drop.style.setProperty("--drop-delay", `${delay}ms`);
    drop.style.setProperty("--drop-duration", `${duration}ms`);
    drop.style.setProperty("--drop-length", `${length}px`);
    drop.style.setProperty("--drop-width", `${width}px`);
    drops.append(drop);
  }

  const wash = document.createElement("div");
  wash.className = "theme-rain__wash";
  overlay.append(drops, wash);
  document.body.append(overlay);
  themeRainOverlay = overlay;
  requestAnimationFrame(() => overlay.classList.add("is-raining"));
  return overlay;
}

function setInvert(enabled, options = {}) {
  const { animate = false } = options;
  let hasApplied = false;
  const apply = () => {
    if (hasApplied) return;
    hasApplied = true;
    applyInvertState(enabled);
  };

  if (!animate || prefersReducedMotion) {
    apply();
    return;
  }

  const root = document.documentElement;
  const overlay = buildThemeRain(enabled);
  root.dataset.themeTransition = enabled ? "to-light" : "to-dark";
  themeRainTimers.push(window.setTimeout(apply, 790));
  themeRainTimers.push(window.setTimeout(() => overlay.classList.add("is-clearing"), 900));
  themeRainTimers.push(window.setTimeout(() => {
    apply();
    clearThemeRain();
  }, 1320));
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

const fieldVideo = document.querySelector("[data-field-video]");
const fieldToggle = document.querySelector("[data-field-toggle]");
let fieldVideoPausedByUser = false;
let fieldVideoInView = false;

function updateFieldVideoControl() {
  if (!fieldVideo || !fieldToggle) return;
  const isPlaying = !fieldVideo.paused;
  fieldToggle.textContent = isPlaying ? "PAUSE" : "PLAY";
  fieldToggle.setAttribute("aria-label", `${isPlaying ? "Pause" : "Play"} childhood field note video`);
}

async function playFieldVideo() {
  if (!fieldVideo || prefersReducedMotion || fieldVideoPausedByUser) return;
  try {
    await fieldVideo.play();
  } catch (_) {
    // Autoplay can be blocked; the visible play control remains available.
  }
  updateFieldVideoControl();
}

if (fieldVideo && fieldToggle) {
  fieldToggle.addEventListener("click", async () => {
    if (fieldVideo.paused) {
      fieldVideoPausedByUser = false;
      try {
        await fieldVideo.play();
      } catch (_) {
        // The browser may still block playback until another interaction.
      }
    } else {
      fieldVideoPausedByUser = true;
      fieldVideo.pause();
    }
    updateFieldVideoControl();
  });

  fieldVideo.addEventListener("play", updateFieldVideoControl);
  fieldVideo.addEventListener("pause", updateFieldVideoControl);
  updateFieldVideoControl();

  if ("IntersectionObserver" in window) {
    const fieldVideoObserver = new IntersectionObserver(
      ([entry]) => {
        fieldVideoInView = entry.isIntersecting && entry.intersectionRatio >= 0.45;
        if (fieldVideoInView) {
          playFieldVideo();
        } else {
          fieldVideo.pause();
          updateFieldVideoControl();
        }
      },
      { threshold: [0, 0.45] }
    );
    fieldVideoObserver.observe(fieldVideo);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      fieldVideo.pause();
      updateFieldVideoControl();
    } else if (fieldVideoInView) {
      playFieldVideo();
    }
  });
}

invertButton?.addEventListener("click", (event) => {
  const bounds = invertButton.getBoundingClientRect();
  setInvert(!document.body.classList.contains("is-inverted"), {
    animate: true,
    x: event.clientX || bounds.left + bounds.width / 2,
    y: event.clientY || bounds.top + bounds.height / 2,
  });
});
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
    const directions = {
      ArrowLeft: -1,
      ArrowUp: -1,
      ArrowRight: 1,
      ArrowDown: 1,
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    showProject(activeIndex + direction, true);
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

const capabilitiesCanvas = document.querySelector("[data-capabilities-field]");
const capabilitiesStage = capabilitiesCanvas?.closest(".capabilities__visual");

if (capabilitiesCanvas && capabilitiesStage && hasFinePointer && !prefersReducedMotion) {
  const context = capabilitiesCanvas.getContext("2d", { alpha: true });
  const pointer = { x: 0, y: 0, active: false };
  let width = 0;
  let height = 0;
  let ratio = 1;
  let points = [];
  let frame = 0;
  let lastMove = 0;
  let isVisible = true;
  let foreground = "#f2f0e9";
  let accent = "#dfff00";

  const readFieldColors = () => {
    const styles = getComputedStyle(document.body);
    foreground = styles.getPropertyValue("--fg").trim() || "#f2f0e9";
    accent = styles.getPropertyValue("--acid").trim() || "#dfff00";
  };

  const queueFieldFrame = () => {
    if (frame || !isVisible || document.hidden) return;
    frame = requestAnimationFrame(drawField);
  };

  const rebuildField = () => {
    const bounds = capabilitiesStage.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    capabilitiesCanvas.width = Math.round(width * ratio);
    capabilitiesCanvas.height = Math.round(height * ratio);
    capabilitiesCanvas.style.width = `${width}px`;
    capabilitiesCanvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const spacing = Math.max(6, Math.min(9, width / 70));
    const fields = [...capabilitiesStage.querySelectorAll(".disc")].map((disc, index) => {
      const discBounds = disc.getBoundingClientRect();
      return {
        x: discBounds.left - bounds.left + discBounds.width / 2,
        y: discBounds.top - bounds.top + discBounds.height / 2,
        radius: Math.min(discBounds.width, discBounds.height) / 2,
        opacity: index === 0 ? 0.95 : 0.42,
      };
    });
    points = [];

    fields.forEach((field, fieldIndex) => {
      const startX = Math.max(0, field.x - field.radius);
      const endX = Math.min(width, field.x + field.radius);
      const startY = Math.max(0, field.y - field.radius);
      const endY = Math.min(height, field.y + field.radius);
      for (let y = startY; y <= endY; y += spacing) {
        for (let x = startX; x <= endX; x += spacing) {
          const dx = x - field.x;
          const dy = y - field.y;
          if (dx * dx + dy * dy > field.radius * field.radius) continue;
          points.push({
            x,
            y,
            opacity: field.opacity * (0.68 + ((Math.round(x / spacing) + Math.round(y / spacing)) % 3) * 0.12),
            phase: (x * 0.031 + y * 0.017 + fieldIndex) % (Math.PI * 2),
          });
        }
      }
    });

    capabilitiesStage.classList.add("is-fragment-ready");
    readFieldColors();
    queueFieldFrame();
  };

  function drawField(time = 0) {
    frame = 0;
    if (!isVisible || document.hidden) return;
    context.clearRect(0, 0, width, height);
    const elapsed = performance.now() - lastMove;
    const radius = Math.max(120, Math.min(190, width * 0.34));
    const shouldAnimate = pointer.active && elapsed < 720;

    points.forEach((point) => {
      let drawX = point.x;
      let drawY = point.y;
      let influence = 0;
      let tangentX = 0;
      let tangentY = 0;

      if (pointer.active) {
        const dx = point.x - pointer.x;
        const dy = point.y - pointer.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        if (distance < radius) {
          influence = Math.pow(1 - distance / radius, 2);
          const pulse = Math.sin(distance * 0.075 - time * 0.012 + point.phase) * 14 * influence;
          const twist = 58 * influence;
          tangentX = (-dy / distance) * twist + (dx / distance) * pulse;
          tangentY = (dx / distance) * twist + (dy / distance) * pulse;
          drawX += tangentX;
          drawY += tangentY;
        }
      }

      context.globalAlpha = Math.min(1, point.opacity + influence * 0.22);
      if (influence > 0.045) {
        context.strokeStyle = influence > 0.55 ? accent : foreground;
        context.lineWidth = influence > 0.55 ? 1.35 : 0.8;
        context.beginPath();
        context.moveTo(drawX - tangentX * 0.12, drawY - tangentY * 0.12);
        context.lineTo(drawX + tangentX * 0.08, drawY + tangentY * 0.08);
        context.stroke();
      } else {
        context.fillStyle = foreground;
        const size = point.opacity > 0.7 ? 1.8 : 1.35;
        context.fillRect(drawX - size / 2, drawY - size / 2, size, size);
      }
    });

    context.globalAlpha = 1;
    if (shouldAnimate) queueFieldFrame();
  }

  capabilitiesStage.addEventListener("pointerenter", (event) => {
    pointer.active = true;
    capabilitiesStage.classList.add("is-distorting");
    lastMove = performance.now();
    const bounds = capabilitiesStage.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    queueFieldFrame();
  });

  capabilitiesStage.addEventListener("pointermove", (event) => {
    const bounds = capabilitiesStage.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    lastMove = performance.now();
    capabilitiesStage.style.setProperty("--fragment-x", `${pointer.x}px`);
    capabilitiesStage.style.setProperty("--fragment-y", `${pointer.y}px`);
    queueFieldFrame();
  }, { passive: true });

  capabilitiesStage.addEventListener("pointerleave", () => {
    pointer.active = false;
    capabilitiesStage.classList.remove("is-distorting");
    capabilitiesStage.style.removeProperty("--fragment-x");
    capabilitiesStage.style.removeProperty("--fragment-y");
    queueFieldFrame();
  });

  const fieldObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) queueFieldFrame();
        else if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      }, { rootMargin: "120px" })
    : null;
  fieldObserver?.observe(capabilitiesStage);

  if ("ResizeObserver" in window) {
    new ResizeObserver(rebuildField).observe(capabilitiesStage);
  } else {
    window.addEventListener("resize", rebuildField, { passive: true });
  }

  window.addEventListener("samiel-themechange", () => {
    readFieldColors();
    queueFieldFrame();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      queueFieldFrame();
    }
  });

  rebuildField();
}

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

const commandPalette = document.querySelector("[data-command-palette]");
const commandOpenButton = document.querySelector("[data-command-open]");
const commandCloseButton = document.querySelector("[data-command-close]");
const commandInput = document.querySelector("[data-command-input]");
const commandList = document.querySelector("[data-command-list]");
const commandCount = document.querySelector("[data-command-count]");

if (commandPalette && commandOpenButton && commandInput && commandList) {
  let filteredCommands = [];
  let activeCommandIndex = 0;
  let commandReturnFocus = null;

  const goToSection = (selector) => {
    const target = document.querySelector(selector);
    if (!target) return;
    if (target.classList.contains("case-study")) openCaseFile(target, { animate: !prefersReducedMotion });
    try {
      history.pushState(null, "", selector);
    } catch (_) {
      // Hash navigation still works when History API access is unavailable.
    }
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  };

  const openExternal = (url) => {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (opened) opened.opener = null;
  };

  const commands = [
    { label: "Go to featured projects", meta: "NAV", keywords: "work psp portfolio", run: () => goToSection("#work") },
    { label: "Go to work log", meta: "NAV", keywords: "projects experience build stories", run: () => goToSection("#case-studies") },
    { label: "Go to field log", meta: "NAV", keywords: "photos origin now collage", run: () => goToSection("#field-log") },
    { label: "Go to technical toolkit", meta: "NAV", keywords: "skills stack aws python pytorch java", run: () => goToSection("#skills") },
    { label: "Go to office hours", meta: "NAV", keywords: "book meeting calendly session", run: () => goToSection("#book") },
    { label: "Go to contact", meta: "NAV", keywords: "email social links", run: () => goToSection("#contact") },
    { label: "Open Totem case study", meta: "PROJECT", keywords: "ceo agent identity startup", run: () => goToSection("#project-totem") },
    { label: "Open GPU–HBM case study", meta: "PROJECT", keywords: "patent research caching markov", run: () => goToSection("#project-gpu") },
    { label: "Open FND MRI case study", meta: "PROJECT", keywords: "research medical machine learning", run: () => goToSection("#project-fnd") },
    { label: "Open swing-state case study", meta: "PROJECT", keywords: "data election geospatial", run: () => goToSection("#project-data") },
    { label: "Open Andromeda case study", meta: "PROJECT", keywords: "hacklanta prediction markets", run: () => goToSection("#project-andromeda") },
    { label: "Open GitHub", meta: "EXTERNAL ↗", keywords: "code repositories", run: () => openExternal("https://github.com/samiel-azmaien") },
    { label: "Open LinkedIn", meta: "EXTERNAL ↗", keywords: "professional social", run: () => openExternal("https://www.linkedin.com/in/samiel-azmaien/") },
    { label: "Open ORCID", meta: "EXTERNAL ↗", keywords: "research papers publications", run: () => openExternal("https://orcid.org/0009-0008-3724-7310") },
    {
      label: "Invert interface",
      meta: "SETTING",
      keywords: "theme dark light contrast ripple",
      run: () => setInvert(!document.body.classList.contains("is-inverted"), {
        animate: true,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }),
    },
    {
      label: "Toggle grid texture",
      meta: "SETTING",
      keywords: "scanlines grain display overlay",
      run: () => setGrid(document.body.classList.contains("grid-off")),
    },
  ];

  const setActiveCommand = (index, scroll = true) => {
    if (!filteredCommands.length) {
      activeCommandIndex = 0;
      commandInput.removeAttribute("aria-activedescendant");
      return;
    }
    activeCommandIndex = (index + filteredCommands.length) % filteredCommands.length;
    const options = [...commandList.querySelectorAll("[role='option']")];
    options.forEach((option, optionIndex) => {
      const isActive = optionIndex === activeCommandIndex;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-selected", String(isActive));
      if (isActive) {
        commandInput.setAttribute("aria-activedescendant", option.id);
        if (scroll) option.scrollIntoView({ block: "nearest" });
      }
    });
  };

  const renderCommands = (query = "") => {
    const normalized = query.trim().toLowerCase();
    filteredCommands = commands.filter((command) =>
      `${command.label} ${command.meta} ${command.keywords}`.toLowerCase().includes(normalized)
    );
    activeCommandIndex = 0;
    commandList.replaceChildren();

    if (!filteredCommands.length) {
      const empty = document.createElement("li");
      empty.className = "command-palette__empty";
      empty.textContent = "NO MATCHING COMMANDS";
      empty.setAttribute("role", "presentation");
      commandList.append(empty);
      commandInput.removeAttribute("aria-activedescendant");
    } else {
      filteredCommands.forEach((command, index) => {
        const option = document.createElement("li");
        option.id = `command-option-${index}`;
        option.className = "command-palette__option";
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", String(index === 0));
        option.dataset.commandIndex = String(index);

        const label = document.createElement("span");
        label.textContent = command.label;
        const meta = document.createElement("small");
        meta.textContent = command.meta;
        option.append(label, meta);
        commandList.append(option);
      });
      setActiveCommand(0, false);
    }

    if (commandCount) {
      commandCount.textContent = `${String(filteredCommands.length).padStart(2, "0")} ${filteredCommands.length === 1 ? "COMMAND" : "COMMANDS"}`;
    }
  };

  const closeCommandPalette = () => {
    if (!commandPalette.open) return;
    commandPalette.close();
  };

  const executeCommand = (index = activeCommandIndex) => {
    const command = filteredCommands[index];
    if (!command) return;
    closeCommandPalette();
    if (command.meta.startsWith("EXTERNAL")) command.run();
    else requestAnimationFrame(() => command.run());
  };

  const openCommandPalette = () => {
    if (commandPalette.open) {
      commandInput.focus();
      return;
    }
    commandReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : commandOpenButton;
    commandInput.value = "";
    renderCommands();
    commandOpenButton.setAttribute("aria-expanded", "true");
    commandInput.setAttribute("aria-expanded", "true");
    if (typeof commandPalette.showModal === "function") commandPalette.showModal();
    else commandPalette.setAttribute("open", "");
    const focusCommandInput = () => commandInput.focus({ preventScroll: true });
    focusCommandInput();
    requestAnimationFrame(focusCommandInput);
    window.setTimeout(focusCommandInput, 0);
  };

  commandOpenButton.setAttribute("aria-expanded", "false");
  commandOpenButton.addEventListener("click", openCommandPalette);
  commandCloseButton?.addEventListener("click", closeCommandPalette);

  commandPalette.addEventListener("click", (event) => {
    if (event.target === commandPalette) closeCommandPalette();
  });

  commandPalette.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeCommandPalette();
  });

  commandPalette.addEventListener("close", () => {
    commandOpenButton.setAttribute("aria-expanded", "false");
    commandInput.setAttribute("aria-expanded", "false");
    commandInput.removeAttribute("aria-activedescendant");
    commandReturnFocus?.focus();
  });

  commandInput.addEventListener("input", () => renderCommands(commandInput.value));
  commandInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActiveCommand(activeCommandIndex + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      executeCommand();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeCommandPalette();
    }
  });

  commandList.addEventListener("pointermove", (event) => {
    const option = event.target.closest("[data-command-index]");
    if (!option) return;
    setActiveCommand(Number(option.dataset.commandIndex), false);
  });

  commandList.addEventListener("click", (event) => {
    const option = event.target.closest("[data-command-index]");
    if (!option) return;
    executeCommand(Number(option.dataset.commandIndex));
  });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommandPalette();
    }
  });
}

document.body.classList.add("js-enabled");

const header = document.querySelector("[data-header]");

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 10);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const sessionOptions = [...document.querySelectorAll(".session-option")];
const sessionTitle = document.querySelector("[data-session-title]");
const sessionDescription = document.querySelector("[data-session-description]");
const sessionPrice = document.querySelector("[data-session-price]");
const sessionDuration = document.querySelector("[data-session-duration]");
const bookingLink = document.querySelector("[data-booking-link]");

function selectSession(option, moveFocus = false) {
  for (const item of sessionOptions) {
    const isSelected = item === option;
    item.classList.toggle("is-active", isSelected);
    item.setAttribute("aria-selected", String(isSelected));
    item.tabIndex = isSelected ? 0 : -1;
  }

  if (sessionTitle) sessionTitle.textContent = option.dataset.title;
  if (sessionDescription) sessionDescription.textContent = option.dataset.description;
  if (sessionPrice) sessionPrice.textContent = option.dataset.price;
  if (sessionDuration) sessionDuration.textContent = `/ ${option.dataset.duration}`;
  if (bookingLink) {
    bookingLink.href = option.dataset.url;
    bookingLink.setAttribute("aria-label", `Pay and book the ${option.dataset.title} session`);
  }

  if (moveFocus) option.focus();
}

sessionOptions.forEach((option, index) => {
  option.addEventListener("click", () => selectSession(option));
  option.addEventListener("keydown", (event) => {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    let nextIndex = index;

    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = sessionOptions.length - 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + sessionOptions.length) % sessionOptions.length;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % sessionOptions.length;
    }

    selectSession(sessionOptions[nextIndex], true);
  });
});

const glow = document.querySelector(".cursor-glow");
const hero = document.querySelector("[data-parallax]");
const cards = [...document.querySelectorAll(".photo-card")];
const filters = [...document.querySelectorAll(".filter")];
const lightbox = document.querySelector(".lightbox");
const lightboxImg = lightbox.querySelector("img");
const lightboxTitle = lightbox.querySelector("strong");
const lightboxPlace = lightbox.querySelector("span");

let mouseX = innerWidth / 2;
let mouseY = innerHeight / 2;
let glowX = mouseX;
let glowY = mouseY;

function animateGlow() {
  glowX += (mouseX - glowX) * 0.12;
  glowY += (mouseY - glowY) * 0.12;
  if (glow) glow.style.transform = `translate3d(${glowX - 136}px, ${glowY - 136}px, 0)`;
  requestAnimationFrame(animateGlow);
}

addEventListener("pointermove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

addEventListener("scroll", () => {
  if (hero) hero.style.setProperty("--shift", scrollY.toFixed(0));
}, { passive: true });

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle("active", item === button));
    cards.forEach((card, index) => {
      const show = filter === "all" || card.dataset.category === filter;
      card.style.transitionDelay = `${index * 35}ms`;
      card.classList.toggle("hidden", !show);
    });
  });
});

cards.forEach((card) => {
  const button = card.querySelector(".photo-button");

  button.addEventListener("pointermove", (event) => {
    const rect = button.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    button.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
    button.style.setProperty("--ry", `${(x * 5).toFixed(2)}deg`);
  });

  button.addEventListener("pointerleave", () => {
    button.style.setProperty("--rx", "0deg");
    button.style.setProperty("--ry", "0deg");
  });

  button.addEventListener("click", () => {
    const image = button.querySelector("img");
    lightboxImg.src = image.src.replace(/w=\d+/, "w=1600");
    lightboxImg.alt = image.alt;
    lightboxTitle.textContent = button.dataset.title;
    lightboxPlace.textContent = button.dataset.place;
    lightbox.showModal();
  });
});

lightbox.querySelector(".close").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});

addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox.open) lightbox.close();
});

animateGlow();

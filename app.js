const data = window.SITE_DATA;
const page = document.body.dataset.page;
const glow = document.querySelector(".cursor-glow");
const hero = document.querySelector("[data-parallax]");
const lightbox = document.querySelector(".lightbox");
const state = { filter: new URLSearchParams(location.search).get("roll") || "all", page: 1, loop: 0 };
const pageSizes = { works: 8, journal: 6 };

let mouseX = innerWidth / 2;
let mouseY = innerHeight / 2;
let glowX = mouseX;
let glowY = mouseY;

function text(value) {
  return value || "";
}

function slugLabel(category) {
  return { travel: "旅行", portrait: "人像", city: "城市" }[category] || "作品";
}

function rollLabel(roll) {
  return data.rolls?.find((item) => item.id === roll)?.name || slugLabel(roll);
}

function fillProfile() {
  document.querySelectorAll("[data-profile]").forEach((node) => {
    node.textContent = text(data.profile[node.dataset.profile]);
  });
  document.querySelectorAll("[data-profile-image]").forEach((node) => {
    node.src = data.profile[node.dataset.profileImage];
  });
  document.querySelectorAll("[data-contact='email']").forEach((node) => {
    node.textContent = data.profile.email;
    node.href = `mailto:${data.profile.email}`;
  });
  document.querySelectorAll("[data-contact='phone']").forEach((node) => {
    node.textContent = data.profile.phone;
  });
  document.querySelectorAll("[data-contact='city']").forEach((node) => {
    node.textContent = data.profile.city;
  });
  const stats = {
    works: data.works.length,
    categories: new Set(data.works.map((item) => item.category)).size,
    rolls: data.rolls?.length || 0,
    notes: data.notes.length
  };
  document.querySelectorAll("[data-stat]").forEach((node) => {
    node.textContent = stats[node.dataset.stat] || 0;
  });
}

function workCard(item) {
  const article = document.createElement("article");
  article.className = `photo-card ${item.layout || ""}`.trim();
  article.dataset.category = item.category;
  article.innerHTML = `
    <button class="photo-button" type="button" data-title="${text(item.title)}" data-place="${text(item.place)}">
      <img src="${item.image}" alt="${text(item.alt || item.title)}" loading="lazy">
      <span class="photo-meta">
        <b>${text(item.title)}</b>
        <small>${text(item.place)} · ${rollLabel(item.roll || item.category)}</small>
      </span>
    </button>
  `;
  return article;
}

function renderHeroLoop() {
  const stage = document.querySelector("[data-loop-stage]");
  if (!stage || !data.heroLoops?.length) return;
  const image = stage.querySelector("img");
  const setFrame = () => {
    image.style.opacity = "0";
    setTimeout(() => {
      image.src = data.heroLoops[state.loop % data.heroLoops.length];
      image.style.opacity = "1";
      state.loop += 1;
    }, 260);
  };
  setFrame();
  setInterval(setFrame, 3200);
}

function renderRolls() {
  const container = document.querySelector("[data-rolls]");
  const preview = document.querySelector("[data-roll-preview]");
  if (!container || !preview || !data.rolls?.length) return;
  let active = data.rolls[0].id;
  const paint = () => {
    container.innerHTML = "";
    data.rolls.forEach((roll) => {
      const count = data.works.filter((work) => work.roll === roll.id).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `roll-card ${roll.id === active ? "active" : ""}`;
      button.innerHTML = `
        <span>${roll.name}</span>
        <strong>${roll.stock}</strong>
        <small>${count} frames</small>
      `;
      button.addEventListener("click", () => {
        active = roll.id;
        paint();
      });
      container.append(button);
    });
    const roll = data.rolls.find((item) => item.id === active);
    const works = data.works.filter((work) => work.roll === active).slice(0, 3);
    preview.innerHTML = `
      <div class="roll-copy">
        <p class="eyebrow">${roll.stock}</p>
        <h3>${roll.name}</h3>
        <p>${roll.summary}</p>
        <a class="btn ghost" href="./works.html?roll=${roll.id}">打开这一卷</a>
      </div>
      <div class="roll-frames"></div>
    `;
    const frames = preview.querySelector(".roll-frames");
    works.forEach((work) => frames.append(workCard(work)));
    bindCards(frames);
  };
  paint();
}

function noteCard(item, index) {
  const article = document.createElement("article");
  article.innerHTML = `
    <span>${String(index + 1).padStart(2, "0")}</span>
    <h3>${text(item.title)}</h3>
    <time>${text(item.date)}</time>
    <p>${text(item.body)}</p>
  `;
  return article;
}

function paginate(items, size) {
  const total = Math.max(1, Math.ceil(items.length / size));
  state.page = Math.min(state.page, total);
  const start = (state.page - 1) * size;
  return { total, items: items.slice(start, start + size) };
}

function renderPager(total, onChange) {
  const pager = document.querySelector("[data-pager]");
  if (!pager) return;
  pager.innerHTML = "";
  if (total <= 1) return;
  for (let index = 1; index <= total; index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `page-btn ${index === state.page ? "active" : ""}`;
    button.textContent = index;
    button.addEventListener("click", () => {
      state.page = index;
      onChange();
      scrollTo({ top: 0, behavior: "smooth" });
    });
    pager.append(button);
  }
}

function bindCards(root = document) {
  root.querySelectorAll(".photo-button").forEach((button) => {
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
    button.addEventListener("click", () => openLightbox(button));
  });
}

function openLightbox(button) {
  if (!lightbox) return;
  const image = button.querySelector("img");
  lightbox.querySelector("img").src = image.src.replace(/w=\d+/, "w=1800");
  lightbox.querySelector("img").alt = image.alt;
  lightbox.querySelector("strong").textContent = button.dataset.title;
  lightbox.querySelector("span").textContent = button.dataset.place;
  lightbox.showModal();
}

function renderGallery() {
  const gallery = document.querySelector("[data-gallery]");
  if (!gallery) return;
  const mode = gallery.dataset.gallery;
  let items = mode === "featured" ? data.works.filter((item) => item.featured).slice(0, 6) : data.works;
  if (mode === "all" && state.filter !== "all") {
    items = items.filter((item) => (item.roll || item.category) === state.filter);
  }
  const pageData = mode === "all" ? paginate(items, pageSizes.works) : { total: 1, items };
  gallery.innerHTML = "";
  pageData.items.forEach((item) => gallery.append(workCard(item)));
  bindCards(gallery);
  if (mode === "all") renderPager(pageData.total, renderGallery);
}

function renderNotes() {
  const track = document.querySelector("[data-notes]");
  if (!track) return;
  const mode = track.dataset.notes;
  const items = mode === "featured" ? data.notes.filter((item) => item.featured).slice(0, 3) : data.notes;
  const pageData = mode === "all" ? paginate(items, pageSizes.journal) : { total: 1, items };
  track.innerHTML = "";
  pageData.items.forEach((item, index) => track.append(noteCard(item, index + (state.page - 1) * pageSizes.journal)));
  if (mode === "all") renderPager(pageData.total, renderNotes);
}

function bindFilters() {
  document.querySelectorAll(".filter").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.filter);
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      state.page = 1;
      document.querySelectorAll(".filter").forEach((item) => item.classList.toggle("active", item === button));
      renderGallery();
    });
  });
}

function bindChrome() {
  addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  });
  addEventListener("scroll", () => {
    if (hero) hero.style.setProperty("--shift", scrollY.toFixed(0));
  }, { passive: true });
  if (lightbox) {
    lightbox.querySelector(".close").addEventListener("click", () => lightbox.close());
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) lightbox.close();
    });
  }
  addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox?.open) lightbox.close();
  });
}

function animateGlow() {
  glowX += (mouseX - glowX) * 0.12;
  glowY += (mouseY - glowY) * 0.12;
  if (glow) glow.style.transform = `translate3d(${glowX - 136}px, ${glowY - 136}px, 0)`;
  requestAnimationFrame(animateGlow);
}

fillProfile();
bindChrome();
bindFilters();
renderGallery();
renderNotes();
renderHeroLoop();
renderRolls();
if (glow) animateGlow();

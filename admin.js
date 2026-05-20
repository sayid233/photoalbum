const DATA_PATH = "data/site-data.js";
const logNode = document.querySelector("[data-admin-log]");
let config = JSON.parse(localStorage.getItem("photoAdminConfig") || "{}");
let siteData = structuredClone(window.SITE_DATA);

function log(message) {
  logNode.textContent = message;
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "") || `item-${Date.now()}`;
}

function fillForms() {
  const settings = document.querySelector("[data-admin='settings']");
  settings.owner.value = config.owner || "sayid233";
  settings.repo.value = config.repo || "photoalbum";
  settings.branch.value = config.branch || "main";
  settings.token.value = config.token || "";
  settings.remember.checked = Boolean(config.token);

  const profile = document.querySelector("[data-admin='profile']");
  profile.email.value = siteData.profile.email || "";
  profile.phone.value = siteData.profile.phone || "";
  profile.city.value = siteData.profile.city || "";
  profile.intro.value = siteData.profile.intro || "";
}

function saveConfig(form) {
  config = {
    owner: form.owner.value.trim(),
    repo: form.repo.value.trim(),
    branch: form.branch.value.trim() || "main",
    token: form.token.value.trim()
  };
  if (form.remember.checked) {
    localStorage.setItem("photoAdminConfig", JSON.stringify(config));
  } else {
    localStorage.removeItem("photoAdminConfig");
  }
  log("连接信息已保存。");
}

function assertConfig() {
  if (!config.owner || !config.repo || !config.branch || !config.token) {
    throw new Error("请先保存 GitHub 连接信息，并填写 token。");
  }
}

async function github(path, options = {}) {
  assertConfig();
  const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {})
    }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || `GitHub 请求失败：${response.status}`);
  return result;
}

async function getSha(path) {
  const result = await github(`${path}?ref=${config.branch}`);
  return result.sha;
}

function toBase64(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function putFile(path, content, message, sha) {
  return github(path, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content,
      sha,
      branch: config.branch
    })
  });
}

function serializeData() {
  return `window.SITE_DATA = ${JSON.stringify(siteData, null, 2)};\n`;
}

async function publishData(message) {
  const sha = await getSha(DATA_PATH);
  await putFile(DATA_PATH, toBase64(serializeData()), message, sha);
}

async function uploadWork(form) {
  const file = form.image.files[0];
  if (!file) throw new Error("请选择图片。");
  const id = `${Date.now()}-${slugify(form.title.value)}`;
  const ext = file.name.split(".").pop().toLowerCase();
  const imagePath = `assets/uploads/${id}.${ext}`;

  log("正在上传图片...");
  await putFile(imagePath, await fileToBase64(file), `Upload work image: ${form.title.value}`);

  siteData.works.unshift({
    id,
    title: form.title.value.trim(),
    place: form.place.value.trim(),
    category: form.category.value,
    layout: form.layout.value,
    featured: form.featured.checked,
    image: `./${imagePath}`,
    alt: form.title.value.trim()
  });

  log("图片已上传，正在更新作品数据...");
  await publishData(`Add work: ${form.title.value}`);
  form.reset();
  log("作品已发布。GitHub Pages 通常会在 1 分钟左右更新。");
}

async function addNote(form) {
  const title = form.title.value.trim();
  siteData.notes.unshift({
    id: `${Date.now()}-${slugify(title)}`,
    title,
    date: form.date.value || new Date().toISOString().slice(0, 10),
    featured: form.featured.checked,
    body: form.body.value.trim()
  });
  log("正在发布手记...");
  await publishData(`Add note: ${title}`);
  form.reset();
  log("手记已发布。");
}

async function updateProfile(form) {
  siteData.profile.email = form.email.value.trim();
  siteData.profile.phone = form.phone.value.trim();
  siteData.profile.city = form.city.value.trim();
  siteData.profile.intro = form.intro.value.trim();
  log("正在更新联系信息...");
  await publishData("Update profile information");
  log("联系信息已更新。");
}

document.querySelector("[data-admin='settings']").addEventListener("submit", (event) => {
  event.preventDefault();
  saveConfig(event.currentTarget);
});

document.querySelector("[data-admin='work']").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await uploadWork(event.currentTarget);
  } catch (error) {
    log(`上传失败：${error.message}`);
  }
});

document.querySelector("[data-admin='note']").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await addNote(event.currentTarget);
  } catch (error) {
    log(`发布失败：${error.message}`);
  }
});

document.querySelector("[data-admin='profile']").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await updateProfile(event.currentTarget);
  } catch (error) {
    log(`更新失败：${error.message}`);
  }
});

fillForms();

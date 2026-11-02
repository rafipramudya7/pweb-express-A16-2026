/* ============================================================
   MLBB Store — logika frontend (Kelompok A16, bagian A)
   Sumber data : GET /api/heroes & GET /api/skins (bagian A)
   Pembelian   : POST /api/players/:id/heroes (bagian B — dibungkus
                 try/catch agar UI tetap jalan sebelum integrasi)
   ============================================================ */

const state = {
  tab: "hero",        // hero | premium | rare
  page: 1,
  limit: 10,
  search: "",
  role: "",
  rarity: "",
  images: {},         // { "1": "https://..." } — potret resmi dari CDN MLBB
  player: null,       // player terpilih (butuh endpoint bagian B)
};

const grid = document.getElementById("grid");
const pageinfo = document.getElementById("pageinfo");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const searchInput = document.getElementById("search");
const roleFilter = document.getElementById("role-filter");
const rarityFilter = document.getElementById("rarity-filter");
const playerSelect = document.getElementById("player-select");
const modal = document.getElementById("modal");
const toast = document.getElementById("toast");

let toastTimer = null;
let modalHero = null;

/* ---------------- Utilitas ---------------- */

function showToast(message, type = "ok") {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 3200);
}

async function api(path) {
  const res = await fetch(path);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.message || `HTTP ${res.status}`);
    err.statusCode = res.status;
    throw err;
  }
  return json;
}

function initials(name) {
  return name
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function imageFor(heroId, heroName) {
  return state.images[String(heroId)] || null;
}

function heroCardImage(hero) {
  const url = imageFor(hero.id, hero.name);
  return url
    ? `<img class="card-img" src="${url}" alt="${hero.name}" loading="lazy"
         onerror="this.outerHTML='<div class=&quot;card-fallback&quot;>${initials(hero.name)}</div>'">`
    : `<div class="card-fallback">${initials(hero.name)}</div>`;
}

/* ---------------- Loader utama ---------------- */

async function loadGrid() {
  grid.innerHTML = `<div class="loading">◇ ◈ ◇</div>`;

  try {
    if (state.tab === "hero") {
      await loadHeroes();
    } else {
      await loadSkins();
    }
  } catch (err) {
    grid.innerHTML = `<div class="error-box">⚠️ ${err.message}</div>`;
  }
  updatePager();
}

async function loadHeroes() {
  const params = new URLSearchParams({ page: state.page, limit: state.limit });
  if (state.search) params.set("search", state.search);
  if (state.role) params.set("role", state.role);

  const json = await api(`/api/heroes?${params}`);
  const meta = json.metadata || {};
  pageinfo.textContent = `${meta.page ?? state.page} / ${meta.totalPages ?? 1}`;
  prevBtn.disabled = (meta.page ?? 1) <= 1;
  nextBtn.disabled = (meta.page ?? 1) >= (meta.totalPages ?? 1);

  if (!json.data.length) {
    grid.innerHTML = `<div class="empty">Tidak ada hero yang cocok 🥲</div>`;
    return;
  }

  grid.innerHTML = json.data
    .map(
      (hero) => `
      <article class="card">
        ${heroCardImage(hero)}
        <div class="card-shade"></div>
        ${
          hero.priceDiamond != null
            ? `<span class="price-badge">💎 ${hero.priceDiamond}</span>`
            : `<span class="price-badge gold">🪙 ${hero.priceBP ?? "-"}</span>`
        }
        <div class="card-body">
          <div class="card-name">${hero.name}</div>
          <div class="card-sub">${hero.role}${hero.secondaryRole ? " / " + hero.secondaryRole : ""}</div>
          <button class="buy-btn" data-hero='${JSON.stringify(hero).replaceAll("'", "&apos;")}'>Purchase</button>
        </div>
      </article>`,
    )
    .join("");

  bindBuyButtons();
}

async function loadSkins() {
  const params = new URLSearchParams({ page: state.page, limit: state.limit });
  if (state.rarity) params.set("rarity", state.rarity);

  const json = await api(`/api/skins?${params}`);
  const meta = json.metadata || {};
  pageinfo.textContent = `${meta.page ?? state.page} / ${meta.totalPages ?? 1}`;
  prevBtn.disabled = (meta.page ?? 1) <= 1;
  nextBtn.disabled = (meta.page ?? 1) >= (meta.totalPages ?? 1);

  if (!json.data.length) {
    grid.innerHTML = `<div class="empty">Tidak ada skin yang cocok 🥲</div>`;
    return;
  }

  grid.innerHTML = json.data
    .map(
      (skin) => `
      <article class="card b-${skin.rarity}">
        ${heroCardImage({ id: skin.hero?.id, name: skin.name })}
        <div class="card-shade"></div>
        <span class="rarity-ribbon rr-${skin.rarity}">${skin.rarity}</span>
        ${
          skin.priceDiamond != null
            ? `<span class="price-badge">💎 ${skin.priceDiamond}</span>`
            : `<span class="price-badge free">${skin.acquisition || skin.series || "Event"}</span>`
        }
        <div class="card-body">
          <div class="card-name">${skin.name}</div>
          <div class="card-sub">Hero: ${skin.hero?.name ?? "-"}</div>
        </div>
      </article>`,
    )
    .join("");
}

function updatePager() {
  // fallback jika metadata tak tersedia (mis. error)
  if (!pageinfo.textContent.includes("/")) pageinfo.textContent = `${state.page} / 1`;
}

/* ---------------- Pembelian hero ---------------- */

function bindBuyButtons() {
  grid.querySelectorAll(".buy-btn").forEach((btn) => {
    btn.addEventListener("click", () => openPurchaseModal(JSON.parse(btn.dataset.hero)));
  });
}

function openPurchaseModal(hero) {
  if (!state.player) {
    showToast("Pilih player dulu di pojok atas (endpoint Player = bagian B).", "err");
    return;
  }
  modalHero = hero;
  document.getElementById("modal-title").textContent = `Beli ${hero.name}?`;
  document.getElementById("modal-sub").textContent =
    `🪙 ${hero.priceBP ?? "tidak dijual via BP"}   |   💎 ${hero.priceDiamond ?? "tidak dijual via Diamond"}`;
  const img = document.getElementById("modal-img");
  const url = imageFor(hero.id, hero.name);
  img.src = url || "";
  img.hidden = !url;

  document.getElementById("pay-bp").disabled = hero.priceBP == null;
  document.getElementById("pay-diamond").disabled = hero.priceDiamond == null;
  modal.hidden = false;
}

async function purchase(currency) {
  if (!modalHero || !state.player) return;
  try {
    const res = await fetch(`/api/players/${state.player.id}/heroes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heroId: modalHero.id, currency }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      showToast(`🎉 ${modalHero.name} berhasil dibeli dengan ${currency}!`);
      modal.hidden = true;
      refreshBalances();
    } else {
      showToast(json.message || `Gagal membeli (${res.status})`, "err");
    }
  } catch {
    showToast("Endpoint Player (bagian B) belum tersedia — tunggu integrasi.", "err");
  }
}

/* ---------------- Player & saldo (butuh endpoint bagian B) ---------------- */

async function loadPlayers() {
  try {
    const json = await api("/api/players");
    const players = json.data || [];
    if (!players.length) throw new Error("kosong");

    playerSelect.disabled = false;
    playerSelect.innerHTML = players
      .map((p) => `<option value="${p.id}">${p.nickname}</option>`)
      .join("");
    state.player = players[0];
    refreshBalances();
  } catch {
    playerSelect.disabled = true;
    playerSelect.innerHTML = `<option>Player (menunggu bagian B)</option>`;
    document.getElementById("cur-bp").textContent = "—";
    document.getElementById("cur-diamond").textContent = "—";
    document.getElementById("cur-ticket").textContent = "—";
  }
}

async function refreshBalances() {
  if (!state.player) return;
  try {
    const json = await api(`/api/players/${state.player.id}`);
    const p = json.data;
    document.getElementById("cur-bp").textContent = (p.bp ?? 0).toLocaleString("id-ID");
    document.getElementById("cur-diamond").textContent = (p.diamond ?? 0).toLocaleString("id-ID");
    document.getElementById("cur-ticket").textContent = "0";
  } catch {
    document.getElementById("cur-bp").textContent = "—";
    document.getElementById("cur-diamond").textContent = "—";
  }
}

/* ---------------- Event listeners ---------------- */

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.tab = btn.dataset.tab;
    state.page = 1;

    const isHero = state.tab === "hero";
    roleFilter.hidden = !isHero;
    rarityFilter.hidden = isHero;
    loadGrid();
  });
});

let searchDebounce = null;
searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    state.search = searchInput.value.trim();
    state.page = 1;
    if (state.tab === "hero") loadGrid();
  }, 350);
});

roleFilter.addEventListener("change", () => {
  state.role = roleFilter.value;
  state.page = 1;
  loadGrid();
});

rarityFilter.addEventListener("change", () => {
  state.rarity = rarityFilter.value;
  state.page = 1;
  loadGrid();
});

prevBtn.addEventListener("click", () => {
  if (state.page > 1) {
    state.page--;
    loadGrid();
  }
});

nextBtn.addEventListener("click", () => {
  state.page++;
  loadGrid();
});

playerSelect.addEventListener("change", () => {
  state.player = { id: Number(playerSelect.value) };
  refreshBalances();
});

document.getElementById("pay-bp").addEventListener("click", () => purchase("BP"));
document.getElementById("pay-diamond").addEventListener("click", () => purchase("DIAMOND"));
document.getElementById("modal-close").addEventListener("click", () => (modal.hidden = true));
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) modal.hidden = true;
});

/* Sidebar dekoratif */
document.querySelectorAll(".side-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".side-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

/* ---------------- Init ---------------- */

(async function init() {
  try {
    state.images = await fetch("/hero-images.json").then((r) => r.json());
  } catch {
    state.images = {};
  }
  loadPlayers();
  loadGrid();
})();

import { loadData } from "./data.js";
import { store } from "./store.js";
import {
  esc,
  focusMain,
  footer,
  getRoute,
  routeHref,
  setDocumentTitle,
} from "./utils.js";
import { renderHome } from "./views/home.js";
import { bindExplore, renderExplore } from "./views/explore.js";
import { renderProgramme } from "./views/programme.js";
import { bindCompare, renderCompare, selectedIdsFromQuery } from "./views/compare.js";
import { renderRankings } from "./views/rankings.js";
import { bindCommunity, renderCommunity } from "./views/community.js";
import { bindMethodology, renderMethodology } from "./views/methodology.js";

const main = document.getElementById("main-content");
const tray = document.getElementById("compare-tray");
const compareCount = document.getElementById("compare-count");
const toastRegion = document.getElementById("toast-region");
const nav = document.getElementById("primary-nav");
const navToggle = document.getElementById("nav-toggle");
const skipLink = document.getElementById("skip-link");

const context = {
  data: null,
  store,
  pageState: null,
  compareSelection: [],
  closeMobilePanel: null,
};

function toast(message) {
  toastRegion.innerHTML = `<div class="toast">${esc(message)}</div>`;
  window.setTimeout(() => {
    toastRegion.innerHTML = "";
  }, 2400);
}

function renderCompareTray() {
  const selected = store.compare
    .map((id) => context.data?.programmeById.get(id))
    .filter(Boolean);
  compareCount.textContent = String(selected.length);
  compareCount.hidden = selected.length === 0;
  if (!selected.length) {
    tray.hidden = true;
    tray.innerHTML = "";
    return;
  }
  tray.hidden = false;
  tray.innerHTML = `<div class="compare-tray-inner">
    <div>
      <strong>Compare ${selected.length}/3</strong>
      <div class="compare-pills">${selected.map((programme) => `
        <span class="compare-pill">
          <span>${esc(programme.institution)}</span>
          <button type="button" data-tray-remove="${esc(programme.id)}" aria-label="Remove ${esc(programme.institution)} from comparison">×</button>
        </span>
      `).join("")}</div>
    </div>
    <a class="button" href="${routeHref("/compare", { ids: selected.map((programme) => programme.id).join(",") })}">Open comparison</a>
  </div>`;
  tray.querySelectorAll("[data-tray-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      store.removeCompare(button.dataset.trayRemove);
      toast("Removed from comparison.");
      if (getRoute().path === "/compare") {
        location.hash = routeHref("/compare", { ids: store.compare.join(",") }).slice(1);
      }
    });
  });
}

function updateCompareButtons() {
  document.querySelectorAll("[data-compare-toggle]").forEach((button) => {
    const selected = store.compare.includes(button.dataset.compareToggle);
    button.textContent = selected
      ? button.closest(".detail-actions") ? "Remove from compare" : "Remove"
      : button.closest(".detail-actions") ? "Add to compare" : "Compare";
    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("danger", selected);
    button.classList.toggle("ghost", !selected && !button.closest(".detail-actions"));
    button.classList.toggle("secondary", !selected && Boolean(button.closest(".detail-actions")));
  });
}

function bindGlobalActions() {
  document.querySelectorAll("[data-compare-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const result = store.toggleCompare(button.dataset.compareToggle);
      toast(result.message);
    });
  });
}

function activeNav(path) {
  if (path === "/") return "home";
  if (path === "/explore" || path === "/programme") return "explore";
  if (path.startsWith("/rankings/")) return "rankings";
  if (path === "/compare") return "compare";
  if (path === "/community") return "community";
  if (path === "/methodology") return "methodology";
  return "";
}

function setActiveNav(path) {
  const active = activeNav(path);
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function notFound() {
  setDocumentTitle("Page not found");
  return `<div class="page page-narrow">
    <div class="error-state">
      <div>
        <p class="eyebrow">Invalid route</p>
        <h1>Page not found</h1>
        <p class="muted">The requested page is not part of the current prototype.</p>
        <a class="button" href="${routeHref("/")}">Return home</a>
      </div>
    </div>
    ${footer(context.data.metadata)}
  </div>`;
}

function render() {
  const previousFocusId = document.activeElement?.id || "";
  const { path, query } = getRoute();
  context.pageState = null;
  context.closeMobilePanel = null;

  let html;
  let bind = null;
  if (path === "/") {
    setDocumentTitle("");
    html = renderHome(context);
  } else if (path === "/explore") {
    html = renderExplore(context, query);
    bind = () => bindExplore(context);
  } else if (path === "/programme") {
    html = renderProgramme(context, query);
  } else if (path === "/compare") {
    const selection = selectedIdsFromQuery(query, context);
    if (query.has("ids")) store.replaceCompare(selection.ids);
    html = renderCompare(context, query);
    bind = () => bindCompare(context);
  } else if (path === "/rankings/research") {
    html = renderRankings(context, "research");
  } else if (path === "/rankings/taught") {
    html = renderRankings(context, "taught");
  } else if (path === "/community") {
    html = renderCommunity(context, query);
    bind = bindCommunity;
  } else if (path === "/methodology") {
    html = renderMethodology(context);
    bind = bindMethodology;
  } else {
    html = notFound();
  }

  main.innerHTML = html;
  setActiveNav(path);
  nav.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("drawer-open");
  bind?.();
  bindGlobalActions();
  updateCompareButtons();
  renderCompareTray();
  window.scrollTo({ top: 0, behavior: "instant" });
  if (path === "/explore" && previousFocusId === "programme-search") {
    const search = document.getElementById("programme-search");
    search?.focus();
    search?.setSelectionRange(search.value.length, search.value.length);
  } else {
    focusMain();
  }
}

async function initialize() {
  try {
    context.data = await loadData();
    store.initialize(context.data.programmes);
    store.subscribe(() => {
      renderCompareTray();
      updateCompareButtons();
    });
    render();
  } catch (error) {
    console.error(error);
    setDocumentTitle("Data loading error");
    main.innerHTML = `<div class="page page-narrow">
      <div class="error-state">
        <div>
          <p class="eyebrow">Data loading error</p>
          <h1>The programme evidence could not be loaded.</h1>
          <p class="muted">${esc(error.message)}</p>
          <button class="button" type="button" id="retry-load">Try again</button>
        </div>
      </div>
    </div>`;
    document.getElementById("retry-load")?.addEventListener("click", () => location.reload());
  }
}

navToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

skipLink.addEventListener("click", (event) => {
  event.preventDefault();
  focusMain();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (context.closeMobilePanel && document.getElementById("filter-panel")?.classList.contains("open")) {
    context.closeMobilePanel();
    return;
  }
  if (nav.classList.contains("open")) {
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.focus();
  }
});

window.addEventListener("hashchange", render);
initialize();

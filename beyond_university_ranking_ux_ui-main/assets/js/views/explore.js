import { programmeCard, programmeTable } from "../components.js";
import {
  esc,
  footer,
  notice,
  routeHref,
  setDocumentTitle,
  STATE_LABELS,
  titleCase,
} from "../utils.js";

const PARAMS = {
  country: "country",
  cohort: "cohort",
  type: "type",
  verification: "status",
  mode: "mode",
  duration: "duration",
  thesis: "thesis",
  aashe: "aashe",
  prme: "prme",
  openAlex: "openalex",
  reddit: "reddit",
};

function optionSets(programmes) {
  const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return {
    country: unique(programmes.map((programme) => programme.country)),
    cohort: ["QS", "THE"],
    type: unique(programmes.map((programme) => programme.programmeType.value)),
    verification: ["verified", "manual-review", "unverified"],
    mode: [...unique(programmes.flatMap((programme) => programme.details.studyMode.values)), "Not stated or review"],
    duration: ["≤12 months", "13–18 months", "19–24 months", ">24 months", "Not stated", "Manual review required"],
    thesis: ["Yes", "No"],
    aashe: unique(programmes.map((programme) => programme.signals.aashe.state)),
    prme: unique(programmes.map((programme) => programme.signals.prme.state)),
    openAlex: unique(programmes.map((programme) => programme.signals.openAlex.state)),
    reddit: unique(programmes.map((programme) => programme.community.coverageLevel)),
  };
}

function parseState(query, programmes, storedView) {
  const options = optionSets(programmes);
  const filters = {};
  let ignored = 0;
  const recognizedParams = new Set(["q", "sort", "view", ...Object.values(PARAMS)]);
  [...query.keys()].forEach((key) => {
    if (!recognizedParams.has(key)) ignored += 1;
  });
  Object.entries(PARAMS).forEach(([key, parameter]) => {
    const requested = query.getAll(parameter);
    filters[key] = requested.filter((value) => options[key].includes(value));
    ignored += requested.length - filters[key].length;
  });
  const allowedSort = [
    "institution",
    "programme",
    "qs-sustainability",
    "the-impact",
    "qs-university",
    "the-university",
    "duration",
    "provisional-rank",
  ];
  const sort = allowedSort.includes(query.get("sort")) ? query.get("sort") : "institution";
  if (query.get("sort") && !allowedSort.includes(query.get("sort"))) ignored += 1;
  const requestedView = query.get("view");
  const view = ["cards", "table"].includes(requestedView) ? requestedView : storedView;
  if (requestedView && !["cards", "table"].includes(requestedView)) ignored += 1;
  return {
    q: (query.get("q") || "").slice(0, 120),
    filters,
    sort,
    view,
    options,
    ignored,
  };
}

function rankingSort(item) {
  if (!item?.rank) return 99999;
  if (item.rank.state === "ranked") return item.rank.numeric ?? 99998;
  if (item.rank.state === "not-ranked") return 99997;
  return 99999;
}

function applyFilters(programmes, state) {
  const f = state.filters;
  const query = state.q.trim().toLocaleLowerCase();
  const items = programmes.filter((programme) => {
    if (query && !`${programme.institution} ${programme.programme} ${programme.country}`.toLocaleLowerCase().includes(query)) return false;
    if (f.country.length && !f.country.includes(programme.country)) return false;
    if (f.cohort.length && !f.cohort.includes(programme.selectionCohort)) return false;
    if (f.type.length && !f.type.includes(programme.programmeType.value)) return false;
    if (f.verification.length && !f.verification.includes(programme.verification.state)) return false;
    const modes = programme.details.studyMode.values.length
      ? programme.details.studyMode.values
      : ["Not stated or review"];
    if (f.mode.length && !f.mode.some((mode) => modes.includes(mode))) return false;
    if (f.duration.length && !f.duration.includes(programme.details.duration.band)) return false;
    if (f.thesis.length && !f.thesis.includes(programme.details.thesis.value)) return false;
    if (f.aashe.length && !f.aashe.includes(programme.signals.aashe.state)) return false;
    if (f.prme.length && !f.prme.includes(programme.signals.prme.state)) return false;
    if (f.openAlex.length && !f.openAlex.includes(programme.signals.openAlex.state)) return false;
    if (f.reddit.length && !f.reddit.includes(programme.community.coverageLevel)) return false;
    return true;
  });
  const sorters = {
    institution: (a, b) => a.institution.localeCompare(b.institution),
    programme: (a, b) => a.programme.localeCompare(b.programme),
    "qs-sustainability": (a, b) => rankingSort(a.latestRankings.qsSustainability) - rankingSort(b.latestRankings.qsSustainability),
    "the-impact": (a, b) => rankingSort(a.latestRankings.theImpact) - rankingSort(b.latestRankings.theImpact),
    "qs-university": (a, b) => rankingSort(a.latestRankings.qsUniversity) - rankingSort(b.latestRankings.qsUniversity),
    "the-university": (a, b) => rankingSort(a.latestRankings.theUniversity) - rankingSort(b.latestRankings.theUniversity),
    duration: (a, b) => (a.details.duration.minMonths ?? 9999) - (b.details.duration.minMonths ?? 9999),
    "provisional-rank": (a, b) => {
      const trackOrder = { research: 0, taught: 1 };
      const trackDifference = (trackOrder[a.scoring?.track] ?? 2) - (trackOrder[b.scoring?.track] ?? 2);
      if (trackDifference) return trackDifference;
      const rankDifference = (a.scoring?.provisionalRank ?? 9999) - (b.scoring?.provisionalRank ?? 9999);
      return rankDifference || a.institution.localeCompare(b.institution);
    },
  };
  return items.sort(sorters[state.sort]);
}

function optionLabel(key, value) {
  if (["verification", "aashe", "prme", "openAlex"].includes(key)) {
    return STATE_LABELS[value] || titleCase(value);
  }
  return value;
}

function checkboxOptions(key, values, selected) {
  return values.map((value) => `<label class="check-row">
    <input type="checkbox" data-explore-filter="${esc(key)}" value="${esc(value)}" ${selected.includes(value) ? "checked" : ""}>
    <span>${esc(optionLabel(key, value))}</span>
  </label>`).join("");
}

function filterGroup(key, label, values, selected, open = false) {
  return `<details class="filter-group" ${open ? "open" : ""}>
    <summary>${esc(label)}</summary>
    <div class="filter-options">${checkboxOptions(key, values, selected)}</div>
  </details>`;
}

function filterPanel(state) {
  return `<aside class="filter-panel" id="filter-panel" aria-label="Programme filters">
    <div class="filter-header">
      <h2>Refine results</h2>
      <div>
        <button class="button small ghost" type="button" data-reset-filters>Reset</button>
        <button class="button small ghost filter-drawer-close" id="close-filter-drawer" type="button">Close</button>
      </div>
    </div>
    ${filterGroup("country", "Country", state.options.country, state.filters.country, true)}
    ${filterGroup("cohort", "QS / THE selection cohort", state.options.cohort, state.filters.cohort, true)}
    ${filterGroup("type", "Programme type", state.options.type, state.filters.type, true)}
    ${filterGroup("verification", "Verification status", state.options.verification, state.filters.verification, true)}
    ${filterGroup("mode", "Study mode", state.options.mode, state.filters.mode)}
    ${filterGroup("duration", "Duration", state.options.duration, state.filters.duration)}
    ${filterGroup("thesis", "Thesis availability", state.options.thesis, state.filters.thesis)}
    ${filterGroup("aashe", "AASHE evidence", state.options.aashe, state.filters.aashe)}
    ${filterGroup("prme", "UN PRME evidence", state.options.prme, state.filters.prme)}
    ${filterGroup("openAlex", "OpenAlex coverage", state.options.openAlex, state.filters.openAlex)}
    ${filterGroup("reddit", "Reddit coverage", state.options.reddit, state.filters.reddit)}
  </aside>`;
}

function activeChips(state) {
  const chips = [];
  if (state.q) chips.push({ key: "q", value: state.q, label: `Search: ${state.q}` });
  Object.entries(state.filters).forEach(([key, values]) => {
    values.forEach((value) => chips.push({ key, value, label: optionLabel(key, value) }));
  });
  return chips.map((chip) => `<span class="filter-chip">
    ${esc(chip.label)}
    <button type="button" data-remove-filter="${esc(chip.key)}" data-remove-value="${esc(chip.value)}" aria-label="Remove ${esc(chip.label)}">×</button>
  </span>`).join("");
}

function stateToHref(state, overrides = {}) {
  const next = {
    q: state.q,
    sort: state.sort === "institution" ? "" : state.sort,
    view: state.view === "cards" ? "" : state.view,
    ...Object.fromEntries(Object.entries(PARAMS).map(([key, parameter]) => [parameter, state.filters[key]])),
    ...overrides,
  };
  return routeHref("/explore", next);
}

export function renderExplore(context, query) {
  setDocumentTitle("Explore programmes");
  const { programmes, metadata } = context.data;
  const state = parseState(query, programmes, context.store.view);
  const items = applyFilters(programmes, state);
  context.pageState = state;

  return `<div class="page">
    <header class="page-header">
      <p class="eyebrow">Explore programmes</p>
      <h1>Find the evidence that matters to you.</h1>
      <p class="lede">Search the synchronized 60-programme sample. Approved method 1.1 provisional routes, results, evidence coverage, and review states remain visible so uncertainty is not hidden.</p>
    </header>
    ${state.ignored ? notice("warning", "Some URL filters were ignored", `${state.ignored} unsupported or invalid parameter value${state.ignored === 1 ? " was" : "s were"} removed safely.`, "!") : ""}
    <div class="explorer-layout">
      ${filterPanel(state)}
      <section class="results-area" aria-label="Programme results">
        <div class="toolbar">
          <div class="search-field">
            <label class="visually-hidden" for="programme-search">Search programmes</label>
            <input id="programme-search" type="search" value="${esc(state.q)}" placeholder="Search programme, institution, or country" autocomplete="off">
          </div>
          <button class="button ghost mobile-filter-open" id="open-filter-drawer" type="button">
            Filters${Object.values(state.filters).flat().length ? ` (${Object.values(state.filters).flat().length})` : ""}
          </button>
          <label class="visually-hidden" for="programme-sort">Sort programmes</label>
          <select id="programme-sort">
            <option value="institution" ${state.sort === "institution" ? "selected" : ""}>Institution A–Z</option>
            <option value="programme" ${state.sort === "programme" ? "selected" : ""}>Programme A–Z</option>
            <option value="qs-sustainability" ${state.sort === "qs-sustainability" ? "selected" : ""}>Latest QS sustainability rank</option>
            <option value="the-impact" ${state.sort === "the-impact" ? "selected" : ""}>Latest THE impact rank</option>
            <option value="qs-university" ${state.sort === "qs-university" ? "selected" : ""}>Latest QS university rank</option>
            <option value="the-university" ${state.sort === "the-university" ? "selected" : ""}>Latest THE university rank</option>
            <option value="duration" ${state.sort === "duration" ? "selected" : ""}>Shortest normalized duration</option>
            <option value="provisional-rank" ${state.sort === "provisional-rank" ? "selected" : ""}>Provisional route, then rank</option>
          </select>
          <div class="view-toggle" aria-label="Result view">
            <button type="button" data-result-view="cards" aria-pressed="${state.view === "cards"}">Cards</button>
            <button type="button" data-result-view="table" aria-pressed="${state.view === "table"}">Table</button>
          </div>
        </div>
        <div class="result-meta">
          <div><strong>${items.length}</strong> of ${metadata.programmeCount} programmes</div>
          <div class="active-filters">${activeChips(state)}</div>
        </div>
        <div id="programme-results">
          ${items.length
            ? state.view === "cards"
              ? `<div class="programme-grid">${items.map((programme) => programmeCard(programme, context.store.compare.includes(programme.id))).join("")}</div>`
              : programmeTable(items, context.store.compare)
            : `<div class="empty-state">
                <div>
                  <p class="eyebrow">No matching evidence</p>
                  <h2>No programmes match these filters.</h2>
                  <p class="muted">Remove one or more filters to widen the result set.</p>
                  <button class="button secondary" type="button" data-reset-filters>Reset filters</button>
                </div>
              </div>`
          }
        </div>
      </section>
    </div>
    ${footer(metadata)}
  </div>`;
}

export function bindExplore(context) {
  const state = context.pageState;
  let timer;
  const navigate = (nextState, overrides = {}) => {
    location.hash = stateToHref(nextState, overrides).slice(1);
  };

  document.querySelectorAll("[data-explore-filter]").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.exploreFilter;
      const values = [...document.querySelectorAll(`[data-explore-filter="${CSS.escape(key)}"]:checked`)].map((item) => item.value);
      navigate({ ...state, filters: { ...state.filters, [key]: values } });
    });
  });

  document.getElementById("programme-search")?.addEventListener("input", (event) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      navigate({ ...state, q: event.target.value.slice(0, 120) });
    }, 220);
  });

  document.getElementById("programme-sort")?.addEventListener("change", (event) => {
    navigate({ ...state, sort: event.target.value });
  });

  document.querySelectorAll("[data-result-view]").forEach((button) => {
    button.addEventListener("click", () => {
      context.store.setView(button.dataset.resultView);
      navigate({ ...state, view: button.dataset.resultView });
    });
  });

  document.querySelectorAll("[data-reset-filters]").forEach((button) => {
    button.addEventListener("click", () => {
      location.hash = "/explore";
    });
  });

  document.querySelectorAll("[data-remove-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.removeFilter;
      if (key === "q") {
        navigate({ ...state, q: "" });
      } else {
        navigate({
          ...state,
          filters: {
            ...state.filters,
            [key]: state.filters[key].filter((value) => value !== button.dataset.removeValue),
          },
        });
      }
    });
  });

  const panel = document.getElementById("filter-panel");
  const opener = document.getElementById("open-filter-drawer");
  const close = () => {
    panel?.classList.remove("open");
    document.body.classList.remove("drawer-open");
    opener?.focus();
  };
  opener?.addEventListener("click", () => {
    panel?.classList.add("open");
    document.body.classList.add("drawer-open");
    document.getElementById("close-filter-drawer")?.focus();
  });
  document.getElementById("close-filter-drawer")?.addEventListener("click", close);
  context.closeMobilePanel = close;
}

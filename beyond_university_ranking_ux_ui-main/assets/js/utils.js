export const STATE_LABELS = {
  verified: "Verified",
  "manual-review": "Manual review required",
  unverified: "Unverified",
  "not-stated": "Not stated",
  "not-applicable": "Not applicable",
  "not-ranked": "Not ranked",
  "not-published": "Ranking not published",
  "not-collected": "Not collected",
  "insufficient-evidence": "Insufficient evidence",
  "project-rule": "Project rule",
  provisional: "Provisional",
  "scope-review": "Scope review",
  "no-exact-record": "No exact record",
  "no-verified-match": "No verified match",
  collected: "Collected",
  "api-quota": "API quota reached",
  "no-reliable-match": "No reliable match",
  partial: "Partial",
  available: "Available",
  missing: "Missing",
};

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function nl2br(value) {
  return esc(value).replace(/\n/g, "<br>");
}

export function fmtNumber(value) {
  if (value === null || value === undefined || value === "") return "Not collected";
  return new Intl.NumberFormat("en-CA").format(value);
}

export function fmtPercent(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "Not collected";
  return `${(Number(value) * 100).toFixed(digits)}%`;
}

export function titleCase(value) {
  return String(value ?? "")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function stateClass(state) {
  if (["verified", "collected", "available"].includes(state)) return "verified";
  if (["manual-review", "provisional", "partial", "project-rule", "scope-review", "api-quota"].includes(state)) {
    return "manual-review";
  }
  if (["unverified", "no-reliable-match"].includes(state)) return "unverified";
  if (["info", "no-exact-record", "no-verified-match"].includes(state)) return "info";
  return "";
}

export function badge(state, label = null) {
  const display = label || STATE_LABELS[state] || titleCase(state);
  const icon =
    ["verified", "collected", "available"].includes(state) ? "✓" :
      ["manual-review", "provisional", "partial", "project-rule", "scope-review", "api-quota"].includes(state) ? "!" :
        ["unverified", "no-reliable-match"].includes(state) ? "⚠" : "—";
  return `<span class="badge ${stateClass(state)}"><span aria-hidden="true">${icon}</span>${esc(display)}</span>`;
}

export function tooltip(term, definition) {
  const id = `tip-${Math.random().toString(36).slice(2, 10)}`;
  return `<span class="term">${esc(term)}
    <button class="info-tip" type="button" aria-describedby="${id}" aria-label="Define ${esc(term)}">?</button>
    <span class="tooltip" id="${id}" role="tooltip">${esc(definition)}</span>
  </span>`;
}

export function getRoute() {
  const raw = location.hash.slice(1) || "/";
  const queryIndex = raw.indexOf("?");
  const pathPart = queryIndex >= 0 ? raw.slice(0, queryIndex) : raw;
  const queryPart = queryIndex >= 0 ? raw.slice(queryIndex + 1) : "";
  const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  return { path: path.replace(/\/+$/, "") || "/", query: new URLSearchParams(queryPart) };
}

export function routeHref(path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else query.set(key, value);
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return `#${path}${suffix}`;
}

export function setDocumentTitle(title) {
  document.title = title
    ? `${title} · Beyond University Rankings`
    : "Beyond University Rankings";
}

export function notice(kind, title, copy, icon = "i") {
  return `<div class="notice ${esc(kind)}">
    <span class="notice-icon" aria-hidden="true">${esc(icon)}</span>
    <div><strong>${esc(title)}</strong><span class="small">${esc(copy)}</span></div>
  </div>`;
}

export function fieldState(field) {
  return field?.state || "not-collected";
}

export function fieldDisplay(field, fallback = "Not collected") {
  if (!field) return fallback;
  return field.display ?? field.value ?? fallback;
}

export function latestRankDisplay(item) {
  if (!item?.rank) return { display: "Not collected", year: null, state: "not-collected" };
  return {
    display: item.rank.display,
    year: item.year,
    state: item.rank.state,
  };
}

export function safeUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

export function externalLink(url, label, className = "") {
  const safe = safeUrl(url);
  if (!safe) return `<span class="button ghost ${esc(className)}" aria-disabled="true">${esc(label)} unavailable</span>`;
  return `<a class="button ${esc(className)}" href="${esc(safe)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
}

export function footer(metadata) {
  return `<footer class="site-footer">
    <div class="site-footer-inner">
      <div><strong>Beyond University Rankings</strong><br>Evidence-aware exploration for prospective graduate students.</div>
      <div>July 2026 research snapshot · Method ${esc(metadata.methodVersion)}<br>Institution rankings are context, not programme rankings.</div>
    </div>
  </footer>`;
}

export function focusMain() {
  const main = document.getElementById("main-content");
  main?.focus({ preventScroll: true });
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

import { clamp, esc, fmtNumber } from "./utils.js";

export function rankLineChart(title, series) {
  const width = 600;
  const height = 260;
  const left = 54;
  const right = 20;
  const top = 22;
  const bottom = 44;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const ranked = series.filter((item) => item.rank?.state === "ranked" && Number.isFinite(item.rank.numeric));
  const numeric = ranked.map((item) => item.rank.numeric);
  const maximum = Math.max(200, ...numeric, 1);
  const years = series.map((item) => item.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const x = (year) => left + ((year - minYear) / Math.max(1, maxYear - minYear)) * plotWidth;
  const y = (rank) => top + ((clamp(rank, 1, maximum) - 1) / Math.max(1, maximum - 1)) * plotHeight;
  const path = ranked.map((item, index) => `${index ? "L" : "M"}${x(item.year).toFixed(1)},${y(item.rank.numeric).toFixed(1)}`).join(" ");
  const ticks = [1, 50, 100, 150, 200].filter((tick) => tick <= maximum);
  const description = ranked.length
    ? `${title} history from ${minYear} to ${maxYear}. Lower rank numbers indicate a higher published position.`
    : `${title} has no numeric rank in the collected editions.`;

  return `<figure class="chart-card">
    <figcaption>
      <h3>${esc(title)}</h3>
      <div class="small muted">Institution-level context · lower published rank numbers are higher positions.</div>
    </figcaption>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(description)}">
      <rect x="${left}" y="${top}" width="${plotWidth}" height="${plotHeight}" fill="#f7faf8" stroke="#d3ddd8"/>
      ${ticks.map((tick) => `
        <line x1="${left}" x2="${left + plotWidth}" y1="${y(tick)}" y2="${y(tick)}" stroke="#dce4e0"/>
        <text x="${left - 8}" y="${y(tick) + 4}" text-anchor="end" font-size="11" fill="#60706b">${tick}</text>
      `).join("")}
      ${series.map((item) => `<text x="${x(item.year)}" y="${height - 15}" text-anchor="middle" font-size="11" fill="#60706b">${item.year}</text>`).join("")}
      ${path ? `<path d="${path}" fill="none" stroke="#23675d" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>` : ""}
      ${ranked.map((item) => `
        <circle cx="${x(item.year)}" cy="${y(item.rank.numeric)}" r="5" fill="#fff" stroke="#23675d" stroke-width="3">
          <title>${item.year}: ${esc(item.rank.display)}</title>
        </circle>
      `).join("")}
      ${!ranked.length ? `<text x="${left + plotWidth / 2}" y="${top + plotHeight / 2}" text-anchor="middle" font-size="13" fill="#60706b">No numeric rank available</text>` : ""}
    </svg>
    <table class="chart-table">
      <thead><tr><th>Edition</th><th>Display</th><th>Status</th></tr></thead>
      <tbody>${series.map((item) => `<tr>
        <td>${item.year}</td>
        <td>${esc(item.rank.display)}</td>
        <td>${esc(item.statusText || item.rank.state)}</td>
      </tr>`).join("")}</tbody>
    </table>
  </figure>`;
}

export function stackedDistribution(items, labels, options = {}) {
  const total = items.reduce((sum, value) => sum + Number(value || 0), 0);
  const classes = options.classes || ["tone-positive", "tone-neutral", "tone-negative"];
  const safeTotal = total || 1;
  return `<div class="distribution" aria-label="${esc(options.ariaLabel || "Distribution")}">
    <div class="stacked-bar" role="img" aria-label="${esc(labels.map((label, index) => `${label}: ${items[index] || 0}`).join(", "))}">
      ${items.map((value, index) => `<span class="${classes[index] || ""}" style="width:${Number(value || 0) / safeTotal * 100}%"></span>`).join("")}
    </div>
    <div class="bar-legend">${labels.map((label, index) => `
      <span><span class="legend-swatch ${classes[index] || ""}"></span>${esc(label)}: ${fmtNumber(items[index] || 0)} (${total ? ((items[index] || 0) / total * 100).toFixed(1) : "0.0"}%)</span>
    `).join("")}</div>
  </div>`;
}

export function horizontalBars(items, labelKey, valueKey, limit = 8) {
  const selected = [...items]
    .sort((a, b) => Number(b[valueKey]) - Number(a[valueKey]))
    .slice(0, limit);
  const maximum = Math.max(1, ...selected.map((item) => Number(item[valueKey]) || 0));
  return `<div class="horizontal-bars">${selected.map((item) => `
    <div class="horizontal-bar-row">
      <span>${esc(item[labelKey])}</span>
      <span class="horizontal-bar-track" aria-hidden="true"><span class="horizontal-bar-fill" style="width:${(Number(item[valueKey]) || 0) / maximum * 100}%"></span></span>
      <strong class="numeric">${fmtNumber(item[valueKey])}</strong>
    </div>
  `).join("")}</div>`;
}

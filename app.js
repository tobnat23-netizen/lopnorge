let races = [];
const el = (id) => document.getElementById(id);

function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function inRange(dateStr, fromStr, toStr) {
  const d = parseDate(dateStr).getTime();
  if (fromStr) {
    const from = parseDate(fromStr).getTime();
    if (d < from) return false;
  }
  if (toStr) {
    const to = parseDate(toStr).getTime();
    if (d > to) return false;
  }
  return true;
}

function matchesQuery(r, q) {
  if (!q) return true;
  const hay = `${r.name} ${r.place} ${r.county} ${r.type} ${r.organizer} ${r.distance_km}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

function formatKm(km) {
  const rounded = Math.abs(km - Math.round(km)) < 1e-9 ? String(Math.round(km)) : km.toFixed(1);
  return `${rounded} km`;
}

/* NEW: avoid broken HTML if data contains &, <, >, quotes */
function escapeHtml(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* NEW: normalize type for data-type attribute */
function typeKey(t) {
  const s = String(t ?? "").trim();
  if (!s) return "Ukjent";
  // keep exact labels you already use, but collapse extra whitespace
  return s.replace(/\s+/g, " ");
}

function render(list) {
  el("count").textContent = `${list.length} løp`;

  el("list").innerHTML = list.map(r => {
    const name = escapeHtml(r.name);
    const date = escapeHtml(r.date);
    const type = escapeHtml(r.type);
    const place = escapeHtml(r.place);
    const county = escapeHtml(r.county);
    const url = r.url ? escapeHtml(r.url) : "";
    const pop = escapeHtml(r.popularity ?? 1);

    const dataType = escapeHtml(typeKey(r.type));

    return `
      <article class="card" data-type="${dataType}">
        <h3>${name}</h3>
        <div class="sub">
          <span class="badge">${date}</span>
          <span class="badge">${escapeHtml(formatKm(r.distance_km))}</span>
          <span class="badge">${type}</span>
          <span>${place}, ${county}</span>
          <span class="badge">★ ${pop}</span>
          ${r.url
            ? `<span>• <a href="${url}" target="_blank" rel="noopener">Påmelding/info</a></span>`
            : `<span>• (lenke kommer)</span>`
          }
        </div>
      </article>
    `;
  }).join("");
}

function apply() {
  const fromDate = el("fromDate").value;
  const toDate = el("toDate").value;
  const type = el("type").value;
  const maxKm = el("maxKm").value ? Number(el("maxKm").value) : null;
  const q = el("q").value.trim();
  const sort = el("sort").value;

  let filtered = races
    .filter(r => inRange(r.date, fromDate, toDate))
    .filter(r => (type ? r.type === type : true))
    .filter(r => (maxKm !== null ? r.distance_km <= maxKm : true))
    .filter(r => matchesQuery(r, q));

  if (sort === "featured") {
    filtered.sort((a, b) =>
      (b.popularity ?? 1) - (a.popularity ?? 1) ||
      a.date.localeCompare(b.date) ||
      a.name.localeCompare(b.name)
    );
  }
  if (sort === "date") filtered.sort((a,b) => a.date.localeCompare(b.date));
  if (sort === "distance") filtered.sort((a,b) => a.distance_km - b.distance_km || a.date.localeCompare(b.date));
  if (sort === "name") filtered.sort((a,b) => a.name.localeCompare(b.name));

  render(filtered);
}

async function init() {
  const res = await fetch("./races.json");
  races = await res.json();

  el("fromDate").value = "2026-01-01";
  el("toDate").value = "2026-12-31";

  ["fromDate","toDate","type","maxKm","q","sort"].forEach(id =>
    el(id).addEventListener("input", apply)
  );

  el("reset").addEventListener("click", () => {
    el("fromDate").value = "2026-01-01";
    el("toDate").value = "2026-12-31";
    el("type").value = "";
    el("maxKm").value = "";
    el("q").value = "";
    el("sort").value = "featured";
    apply();
  });

  apply();
}

init().catch(err => {
  el("count").textContent = "Kunne ikke laste races.json";
  console.error(err);
});

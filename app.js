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

function render(list) {
  el("count").textContent = `${list.length} løp`;
  el("list").innerHTML = list.map(r => `
    <article class="card">
      <h3>${r.name}</h3>
      <div class="sub">
        <span class="badge">${r.date}</span>
        <span class="badge">${formatKm(r.distance_km)}</span>
        <span class="badge">${r.type}</span>
        <span>${r.place}, ${r.county}</span>
        <span class="badge">★ ${r.popularity ?? 1}</span>
        ${r.url ? `<span>• <a href="${r.url}" target="_blank" rel="noopener">Påmelding/info</a></span>` : `<span>• (lenke kommer)</span>`}
      </div>
    </article>
  `).join("");
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

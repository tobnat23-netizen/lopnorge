import csv, json
from urllib.request import urlopen

SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTX6nQRTM-XRTNpslw0G_xJHR2aoprcQyDRKyqEajaJwXdRT6JxhkpI-WLRKZxKoS_jXAGYPo2iC0pq/pub?output=csv"

with urlopen(SHEET_CSV_URL) as resp:
    text = resp.read().decode("utf-8")

reader = csv.DictReader(text.splitlines())
races = []

for row in reader:
    if not (row.get("name") or "").strip():
        continue

    races.append({
        "name": row["name"].strip(),
        "date": row["date"].strip(),
        "distance_km": float(row["distance_km"].replace(",", ".")),
        "type": row["type"].strip(),
        "place": row["place"].strip(),
        "county": row["county"].strip(),
        "organizer": row["organizer"].strip(),
        "url": (row.get("url") or "").strip(),
        "popularity": int(float((row.get("popularity") or "1").strip()))
    })

races.sort(key=lambda r: (-(r["popularity"]), r["date"], r["name"]))

with open("races.json", "w", encoding="utf-8") as f:
    json.dump(races, f, ensure_ascii=False, indent=2)

print(f"Oppdatert races.json med {len(races)} løp ✅")

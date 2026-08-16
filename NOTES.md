# Weather Apps — Project Notes

**Versioning (house standard):** `vYYYY.MM.DD.NNN` — date of the shipped change, NNN increments per shipped change within that day. Same scheme as SetList69; every release gets a changelog line in the file's header comment and the version shows in the app footer.

Two single-file, offline-first weather apps in the SKYWAVE style. No build step, no API keys, no libraries. Each is one HTML file you can open locally or drop on GitHub Pages.

| App | File | Size | Philosophy |
|-----|------|------|------------|
| SQUALL | squall.html | ~50 KB | Full console — everything on one page |
| WX | wx.html | ~21 KB | One answer — decides what matters and says it plainly |

---

## Data sources (shared by both)

All free, no keys, CORS-enabled, work from `file://` or GitHub Pages:

- **Forecast:** `https://api.open-meteo.com/v1/forecast` — CC BY 4.0, attribution required (both apps carry it in the footer). Free non-commercial up to 10,000 calls/day.
- **Geocoding:** `https://geocoding-api.open-meteo.com/v1/search` — city/ZIP search.
- **US alerts:** `https://api.weather.gov/alerts/active?point=lat,lon` — NWS watches/warnings.
- **Radar (SQUALL only):** `https://api.rainviewer.com/public/weather-maps.json` — past frames + ~30 min nowcast. Third-party composite, not raw NEXRAD; fine for "is that cell coming at me," not authoritative for storm-mode work.
- **Basemap (SQUALL only):** CARTO dark tiles (`basemaps.cartocdn.com/dark_all`) — attribution: © OpenStreetMap contributors, © CARTO.
- **Reverse geocode (WX only):** `api.bigdatacloud.net/data/reverse-geocode-client` — names the town after "use my location."

## Shared architecture decisions

- **Metric in, convert client-side.** Everything is fetched in metric; the °F/°C toggle is pure math, so it never refetches and works offline.
- **Cache-first offline.** Last good payload saved to localStorage. On fetch failure, render from cache and flag staleness ("OFFLINE · 20 MIN OLD"). localStorage is wrapped in a try/catch shim with in-memory fallback so sandboxed previews don't crash it.
- **Default location:** Loranger, LA (30.6013, -90.3573).
- **Refresh:** every 15 min while visible, plus on tab-return if data >10 min old.
- **Time handling:** Open-Meteo returns local ISO strings; all comparisons are done in a shared "as-if-UTC" frame using `utc_offset_seconds`.

---

## SQUALL — the console

Dark/amber panadapter aesthetic (FeedPoint family). Sections top to bottom:

1. **NWS alerts** — expandable, severity-colored, above the fold on purpose (Gulf Coast).
2. **Current conditions** — big temp, feels-like, wind w/ gusts, 9-cell metrics grid (humidity, dewpoint, pressure, UV, visibility, cloud, rain today, rain chance).
3. **Radar** — hand-rolled slippy-map on canvas (no Leaflet). CARTO base + RainViewer overlay. Drag to pan, wheel/+− to zoom (z4–z11), crosshair recenters. 8 past frames + nowcast loop; forecast frames dimmer, timestamp flips to FORECAST in cyan. Loop pauses when tab hidden. Tiles refresh every 5 min. LRU-ish tile cache capped at 600.
4. **48-hour scope** — canvas temp trace w/ night bands, cyan precip-probability bars, day dividers, NOW marker. Drag to scrub; readout row shows that hour's temp/feels/condition/precip/wind/RH/dewpoint.
5. **7-day outlook** — rows with proportional hi/lo range bar; tap to expand (precip total, dominant wind, max gust, UV, sun times).
6. **Sun & moon** — sun arc w/ live position; moon phase computed from synodic age (29.530588853 d, epoch 2000-01-06 18:14 UTC) — no data call.

## WX — the one answer

Cave-wall aesthetic: stone/bone/ochre palette, SVG-noise grain, hand-scratched pictographs. One screen, no scrolling. Reading level ~5th grade.

**Screen:** pictograph → temperature → ONE WORD verdict → one plain sentence → 12 hourly bars (taller = warmer, blue = rain likely) → status stamp.

**Three taps total:** temperature = °F/°C · place name = change location · pictograph = refresh.

**Verdict engine** (priority order — first match wins):

1. Active NWS alert (severity ≥ moderate) → event name + "Get somewhere safe."
2. Happening now: storm / snow / rain (rain includes "eases up by X PM" scan).
3. Dangerous air: feels ≥103°F "Dangerous heat" · ≥95°F "Hot" · ≤20°F "Bitter cold" · tonight's low ≤32°F "Freeze tonight — pipes, plants, pets."
4. Incoming (next 12 h): storms ≥40% pop → time; rain ≥45% pop → "Rain soon/later" + time; max gust ≥30 mph → "Windy."
5. Nothing wrong: "Cold" (≤45°F) / "Warm" (≥80°F) / "Good — go outside."

**Tunable constants** (top of the engine): heat thresholds 95/103°F, cold 20°F, freeze 32°F, gust 30 mph, rain pop 45%, storm pop 40%. WMO code sets: WET {51-67, 80-82}, SNOW {71-77, 85-86}, STORM {95, 96, 99}.

**Sample-data fallback:** if fetch fails AND no cache exists (chat preview, iOS Quick Look, Pi-hole), WX renders a baked-in plausible LA August day and stamps **SAMPLE · OPEN IN A BROWSER FOR LIVE DATA**. It can never show sample data once a real forecast has been cached.

---

## Why "No signal" in previews

The Claude chat preview and iOS Files Quick Look block outbound fetches. The app is fine; the network is sandboxed. Real browsers and GitHub Pages work. Other suspects if it fails when hosted: ad blocker / Pi-hole eating `api.open-meteo.com`.

## Deploying to GitHub Pages

```bash
# one-time
gh repo create weather --public --clone
cd weather
cp ~/Downloads/wx.html index.html         # WX at the root URL
cp ~/Downloads/squall.html squall.html    # console at /squall.html
git add . && git commit -m "SQUALL + WX v2026.08.16"
git push -u origin main
gh api repos/{owner}/weather/pages -X POST -f 'source[branch]=main' -f 'source[path]=/'
```

URLs: `https://<user>.github.io/weather/` (WX) and `.../squall.html` (SQUALL). Add both to the phone home screen via Safari Share → Add to Home Screen.

## Testing done

- JS syntax-checked; all `getElementById` targets verified present.
- jsdom smoke tests: boot with network cut → SQUALL degrades to OFFLINE badge, STONE to sample mode; no exceptions.
- WX verdict engine run against 10 synthetic scenarios (heat 106, storms in 4 h, rain in 2 h, raining now, tornado warning, hard freeze, 38 mph gusts, nice day, clear night, cold-dry) — all verdicts and phrasing correct.

## Changelog

**SQUALL**

- v2026.08.16.001 — initial build: alerts, hero, 48h scope, 7-day, sun/moon
- v2026.08.16.002 — radar: canvas slippy map, RainViewer + CARTO, nowcast loop

**WX**

- v2026.08.16.001 — initial build: verdict engine, 12h bars, search, cache (as STONE)
- v2026.08.16.002 — sample-data fallback for blocked-network previews
- v2026.08.16.003 — renamed STONE → WX

## Backlog / ideas

- SQUALL: hourly precip accumulation as second trace; NWS RIDGE radar toggle (authoritative vs RainViewer); propagation/solar panel (shares data needs with SKYWAVE's planned Propagation tab).
- WX: threshold tuning for Louisiana summers; maybe a "tomorrow" second line.
- Both: PWA manifest + service worker for true installable offline (adds a second file or inline hack — breaks the pure single-file rule; decide if worth it).

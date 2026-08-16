# Weather Apps — Project Notes

**Versioning (house standard):** `vYYYY.MM.DD.NNN` — date of the shipped change, NNN increments per shipped change within that day. Same scheme as SetList69; every release gets a changelog line in the file's header comment and the version shows in the app footer.

Two single-file, offline-first weather apps in the SKYWAVE style. No build step, no API keys, no libraries. Each is one HTML file you can open locally or drop on GitHub Pages.

| App | File | Size | Philosophy |
|-----|------|------|------------|
| WX Console | console.html | ~50 KB | Full console — everything on one page |
| WX | index.html | ~21 KB | One answer — decides what matters and says it plainly |

---

## Data sources (shared by both)

All free, no keys, CORS-enabled, work from `file://` or GitHub Pages:

- **Forecast:** `https://api.open-meteo.com/v1/forecast` — CC BY 4.0, attribution required (both apps carry it in the footer). Free non-commercial up to 10,000 calls/day.
- **Geocoding:** `https://geocoding-api.open-meteo.com/v1/search` — city/ZIP search.
- **US alerts:** `https://api.weather.gov/alerts/active?point=lat,lon` — NWS watches/warnings.
- **Radar (WX Console only):** `https://api.rainviewer.com/public/weather-maps.json` — past frames + ~30 min nowcast. Third-party composite, not raw NEXRAD; fine for "is that cell coming at me," not authoritative for storm-mode work.
- **Basemap (WX Console only):** CARTO dark tiles (`basemaps.cartocdn.com/dark_all`) — attribution: © OpenStreetMap contributors, © CARTO.
- **Reverse geocode (WX only):** `api.bigdatacloud.net/data/reverse-geocode-client` — names the town after "use my location."
- **Air quality (WX only):** `https://air-quality-api.open-meteo.com/v1/air-quality` — current US AQI, same free/no-key terms as the forecast API.
- **15-minute nowcast (WX only):** the forecast call also requests `minutely_15=precipitation` — Dark-Sky-style "rain in about 20 minutes," free from the same endpoint.

## Shared architecture decisions

- **Metric in, convert client-side.** Everything is fetched in metric; the °F/°C toggle is pure math, so it never refetches and works offline.
- **Cache-first offline.** Last good payload saved to localStorage. On fetch failure, render from cache and flag staleness ("OFFLINE · 20 MIN OLD"). localStorage is wrapped in a try/catch shim with in-memory fallback so sandboxed previews don't crash it.
- **Location is GPS-first (WX):** on launch WX quietly asks where you are; a GPS-chosen spot follows you on later opens (re-checked each launch, updated only if you've moved ~2 km). A town picked by hand always wins until you tap "Use where I am" again. Loranger, LA (30.6013, -90.3573) is the fallback while waiting and when permission is denied — and remains WX Console's default.
- **Separate storage namespaces.** WX uses `wx.*`, WX Console uses `wxc.*`. Both apps are served from the same GitHub Pages origin and therefore share one localStorage, so the prefixes must never converge — collapsing them onto a single `wx.*` prefix would make each app overwrite the other's saved location and unit preference.
- **Refresh:** every 15 min while visible, plus on tab-return if data >10 min old.
- **Time handling:** Open-Meteo returns local ISO strings; all comparisons are done in a shared "as-if-UTC" frame using `utc_offset_seconds`.

---

## WX Console — the console

Dark/amber panadapter aesthetic (FeedPoint family). Sections top to bottom:

1. **NWS alerts** — expandable, severity-colored, above the fold on purpose (Gulf Coast).
2. **Current conditions** — big temp, feels-like, wind w/ gusts, 9-cell metrics grid (humidity, dewpoint, pressure, UV, visibility, cloud, rain today, rain chance).
3. **Radar** — hand-rolled slippy-map on canvas (no Leaflet). CARTO base + RainViewer overlay. Drag to pan, wheel/+− to zoom (z4–z11), crosshair recenters. 8 past frames + nowcast loop; forecast frames dimmer, timestamp flips to FORECAST in cyan. Loop pauses when tab hidden. Tiles refresh every 5 min. LRU-ish tile cache capped at 600.
4. **48-hour scope** — canvas temp trace w/ night bands, cyan precip-probability bars, day dividers, NOW marker. Drag to scrub; readout row shows that hour's temp/feels/condition/precip/wind/RH/dewpoint.
5. **7-day outlook** — rows with proportional hi/lo range bar; tap to expand (precip total, dominant wind, max gust, UV, sun times).
6. **Sun & moon** — sun arc w/ live position; moon phase computed from synodic age (29.530588853 d, epoch 2000-01-06 18:14 UTC) — no data call.

## WX — the one answer

Sun-shower aesthetic (matches the app icon): pastel sky gradient, slate ink, sun-gold and water-blue accents, rounded pictographs. Was cave-wall stone/ochre through v2026.08.16.005. One screen, no scrolling. Reading level ~5th grade.

**The sky follows the clock:** three skins driven by daily sunrise/sunset — day (solid pastel sky), dusk (solid warm cream, ~70 min before sunset through ~40 min after sunrise), night (solid deep blue-black, light ink). Flat color on purpose — gradients read as murk on OLED phones. The favicon re-renders to the current verdict's pictograph, so even the tab shows the weather.

**Screen:** pictograph → temperature → ONE WORD verdict → one plain sentence → TOMORROW hi/lo + first-rain line → 12 hourly bars (taller = warmer, blue = rain likely) → status stamp.

**The taps:** temperature = °F/°C · place name = change location · pictograph or the UPDATED stamp = refresh · the verdict when an alert is up = full NWS text in plain language · any hour bar = that hour's numbers for a few seconds · sun/moon (top right) = light/dark override (the clock decides until you pick) · share (top right) = system share sheet · the version number in the footer = this changelog on GitHub. A gold pill appears when a newer version is deployed; tapping it reloads.

**Verdict engine** (priority order — first match wins):

1. Active NWS alert (severity ≥ moderate) → event name; severe/extreme are coral, moderate is amber; tropical events (hurricane/tropical/surge) get their own wording; the verdict is tappable and opens the full alert text. Long event names render at a smaller size.
2. Happening now: storm / snow / rain — the rain "eases up around X:XX" line uses the 15-minute nowcast when available, hourly as fallback.
3. Dangerous air: feels ≥103°F "Dangerous heat" · ≥95°F "Hot" · ≤20°F "Bitter cold" · lowest hourly temp in the next 12 h ≤32°F "Freeze tonight" · US AQI ≥151 "Bad air" (≥201 gets the stronger line).
4. Incoming: the 15-minute nowcast first ("Rain in about N minutes," N ≤ 90); then hourly — storms ≥40% pop → time; rain ≥45% pop → "Rain soon/later"; max gust ≥30 mph → "Windy."
5. Nothing wrong: "Cold" (≤45°F) / "Warm" (≥80°F) / "Good." On a clear day with UV ≥8 in the next 12 h, the closing line becomes "Strong sun — wear sunscreen."

Most verdicts carry two or three phrasings, rotated by day of month — deterministic, so the app never disagrees with itself on refresh, but tomorrow reads a little differently than today.

**Tunable constants** (top of the engine): heat thresholds 95/103°F, cold 20°F, freeze 32°F, gust 30 mph, rain pop 45%, storm pop 40%. WMO code sets: WET {51-67, 80-82}, SNOW {71-77, 85-86}, STORM {95, 96, 99}.

**Sample-data fallback:** if fetch fails AND no cache exists (chat preview, iOS Quick Look, Pi-hole), WX renders a baked-in plausible LA August day and stamps **SAMPLE · OPEN IN A BROWSER FOR LIVE DATA**. It can never show sample data once a real forecast has been cached.

---

## App icon

"Sun shower" — gold sun upper-right, four water-blue drops falling lower-left on a
pastel sky gradient (picked over five other drafted directions; friendly was the
brief). Source of truth is `icon.svg`; `apple-touch-icon.png` (180) and
`icon-512.png` are renders of it. The favicon is the same SVG inlined as a data
URI in each app's `<head>`, so the pages themselves stay single-file — the PNGs
exist only because iOS ignores data URIs for `apple-touch-icon`. Both apps share
the icon for now; a console-specific variant is in the backlog.

## Why "No signal" in previews

The Claude chat preview and iOS Files Quick Look block outbound fetches. The app is fine; the network is sandboxed. Real browsers and GitHub Pages work. Other suspects if it fails when hosted: ad blocker / Pi-hole eating `api.open-meteo.com`.

## Deploying to GitHub Pages

The repo *is* the deploy — Pages serves `main` from the root, so the files are
already laid out the way they are served. No build step, no copy step.

| Repo file | Served at |
|-----------|-----------|
| `index.html` | `/WX/` — WX at the root URL |
| `console.html` | `/WX/console.html` |

That is why the one-answer app is named `index.html` rather than `wx.html`:
Pages serves `index.html` for the bare directory URL, so WX is what you get
when you tap the bookmark, and the console is one level deeper on purpose.

Deployment runs through `.github/workflows/pages.yml`, which publishes the repo
root on every push to `main`. The apps themselves still have no build step —
the workflow exists only because the branch-based Pages deploy never fired for
this repo; `configure-pages` with `enablement: true` sets the Pages source
itself, so there is nothing to configure in the repo settings.

URLs: `https://cdburgess75.github.io/WX/` (WX) and `.../WX/console.html` (WX Console).
Add both to the phone home screen via Safari Share → Add to Home Screen.

Pages takes a minute or two to build on first enable, and serves over HTTPS —
which matters, because `navigator.geolocation` ("use my location") is blocked
on plain HTTP in every current browser.

## Testing done

- JS syntax-checked (`node --check` on the extracted script); HTML parses clean; all `getElementById` targets verified present in the markup — 13 in WX, 36 in WX Console.
- Stub-DOM smoke tests: boot with network cut → WX Console degrades to the OFFLINE badge, WX to sample mode; no exceptions. WX Console additionally re-rendered end to end in both unit modes, with and without an active alert.
- WX verdict engine run against 10 synthetic scenarios (heat 106, storms in 4 h, rain in 2 h, raining now, tornado warning, hard freeze, 38 mph gusts, nice day, clear night, cold-dry) — all verdicts and phrasing correct.
- Freeze regression (added in v2026.08.16.004, both directions):
  - 9 PM, this morning was 45°F, tonight drops to 25°F → was "Cold", now "Freeze tonight."
  - 6 PM, dawn hit 28°F but the night stays 49°F → was "Freeze tonight", now "Good."
  - 6 AM with a 38°F low and no freeze coming → correctly stays quiet in both versions.

## Changelog

**WX Console**

- v2026.08.16.001 — initial build: alerts, hero, 48h scope, 7-day, sun/moon (as SQUALL)
- v2026.08.16.002 — radar: canvas slippy map, RainViewer + CARTO, nowcast loop
- v2026.08.16.003 — renamed SQUALL → WX Console; storage keys `sq.*` → `wxc.*`
- v2026.08.16.004 — sun-shower app icon (shared with WX for now)
- v2026.08.16.005 — opens full-screen from the home screen (web-app metas); offline shell via the shared service worker

**WX**

- v2026.08.16.001 — initial build: verdict engine, 12h bars, search, cache (as STONE)
- v2026.08.16.002 — sample-data fallback for blocked-network previews
- v2026.08.16.003 — renamed STONE → WX
- v2026.08.16.004 — freeze verdict scans the 12 h ahead instead of today's daily min; sample mode carries the real UTC offset
- v2026.08.16.005 — sun-shower app icon
- v2026.08.16.006 — sun-shower skin: pastel palette matching the icon; amber for moderate alerts, red only for severe/extreme; long alert names sized to fit
- v2026.08.16.007 — 15-minute rain nowcast; tappable alert verdict (full NWS text); tappable hour bars; day/dusk/night skins; AQI verdict; UV sunscreen line; tropical alert wording; per-day phrase variety; verdict favicon; PWA manifest + service worker
- v2026.08.16.008 — share + sun/moon theme buttons top right; tap the UPDATED stamp to refresh; version number links to this changelog; update pill when a newer version is deployed
- v2026.08.16.009 — GPS-first location: automatic on launch, follows a GPS-chosen spot, never overrides a hand-picked town; local time and skins ride along
- v2026.08.16.010 — solid calm backgrounds (gradients out; night is deep blue-black, not purple); refresh stamp is a bordered ↻ button; version link styled as a link; TOMORROW hi/lo + first-rain line under the sentence
- v2026.08.16.011 — reverse geocode digs past the parish: mines BigDataCloud's localityInfo for the nearest named town (Loranger, not Tangipahoa Parish)
- v2026.08.16.012 — saved GPS locations still named after a parish/county re-resolve on next open, so the v011 fix reaches existing installs

## Backlog / ideas

- WX Console: hourly precip accumulation as second trace; NWS RIDGE radar toggle (authoritative vs RainViewer); propagation/solar panel (shares data needs with SKYWAVE's planned Propagation tab).
- WX: threshold tuning for Louisiana summers; maybe a "tomorrow" second line.
- **Icon candidate (saved for later):** a Flaticon piece by "Paul J. Flat" (flaticon.com) — flat friendly style: orange sun upper-left with rounded rays, blue storm cloud behind it carrying two bolts (one gold, one white), white puffy rain cloud in front with five blue teardrops in two rows. Busier than our sun-shower mark but the same language. **License note:** Flaticon's free tier requires attribution and limits redistribution — if we adopt it, either credit properly or (better) draw our own variant in-house with the icon pipeline, same composition, our palette.
- ~~Both: PWA manifest + service worker~~ — done in WX v2026.08.16.007. Decided: the icon PNGs had already broken single-file purity, so the shell may as well work offline. `manifest.webmanifest` + `sw.js` at the root; the worker caches pages per-URL (console too) and never touches API calls.

# Weather Apps — Project Notes

**Versioning (house standard):** `vYYYY.MM.DD.NNN` — date of the shipped change, NNN increments per shipped change within that day. Same scheme as SetList69; every release gets a changelog line in the file's header comment and the version shows in the app footer.

A single-file, offline-first weather app in the SKYWAVE style. (Was two apps — WX and WX Console — through v2026.08.16.013.) No build step, no API keys, no libraries. Each is one HTML file you can open locally or drop on GitHub Pages.

| App | File | Size | Philosophy |
|-----|------|------|------------|
| WX | index.html | ~76 KB | One answer first; the full console below the fold |

One page since v2026.08.16.014; screen one went dense in v2026.08.16.015; Big Sky repaint in v2026.08.20.001.
The first screen now carries a compact hero row (pictograph · temperature ·
verdict word side by side), the sentence, the TOMORROW line, four snapshot
chips (feels · wind · humidity · UV), the 12 hourly bars, and the 7-day
outlook folded to three rows — ALL 7 DAYS unfolds it in place, and tapping a
row opens that day's details. Scrolling (or the CONSOLE ⌄ tab) reveals the
details grid, radar (RV/NX), the 48-hour scope, and sun & moon. `console.html`
survives only as a redirect stub for old bookmarks, forwarding to `/#console`.

---

## Data sources (shared by both)

All free, no keys, CORS-enabled, work from `file://` or GitHub Pages:

- **Forecast:** `https://api.open-meteo.com/v1/forecast` — CC BY 4.0, attribution required (both apps carry it in the footer). Free non-commercial up to 10,000 calls/day.
- **Geocoding:** `https://geocoding-api.open-meteo.com/v1/search` — city/ZIP search.
- **US alerts:** `https://api.weather.gov/alerts/active` queried two ways and merged — `?point=lat,lon` for alerts whose polygon covers this exact spot, and `?zone=<id>` for the county and forecast zones from `/points/{lat},{lon}` (cached in `wx.zones`). The county query is the important one: **NOAA Weather Radio alerts by county SAME code**, so a warning can be broadcast to the whole parish while its polygon misses your GPS point — point-only was silent in exactly that case. Merged results dedupe by alert `id` then `event|severity`, point-scoped wins ties, and county-only arrivals carry `_scope:"area"` so the screen says "out for your county" and the console tags them NEARBY.
- **Radar (WX Console only):** `https://api.rainviewer.com/public/weather-maps.json` — past frames + ~30 min nowcast (default). Third-party composite, not raw NEXRAD.
- **NEXRAD (WX Console only):** raw N0Q reflectivity tiles from the Iowa Environmental Mesonet (`mesonet.agron.iastate.edu/cache/tile.py`) — the RV/NX button on the radar bar switches sources; NEXRAD is observed-only (no nowcast), ~50 min of history in 5-minute steps.
- **Basemap:** OpenStreetMap standard tiles (`tile.openstreetmap.org`) since v2026.09.17.002 — attribution: © OpenStreetMap contributors. (Was CARTO Voyager, until CARTO started stamping API KEY REQUIRED across the free tiles.)
- **Reverse geocode (WX only):** `api.bigdatacloud.net/data/reverse-geocode-client` — names the town after "use my location."
- **Air quality (WX only):** `https://air-quality-api.open-meteo.com/v1/air-quality` — current US AQI, same free/no-key terms as the forecast API.
- **15-minute nowcast (WX only):** the forecast call also requests `minutely_15=precipitation` — Dark-Sky-style "rain in about 20 minutes," free from the same endpoint.

## Shared architecture decisions

- **Metric in, convert client-side.** Everything is fetched in metric; the °F/°C toggle is pure math, so it never refetches and works offline.
- **Cache-first offline.** Last good payload saved to localStorage. On fetch failure, render from cache and flag staleness ("OFFLINE · 20 MIN OLD"). localStorage is wrapped in a try/catch shim with in-memory fallback so sandboxed previews don't crash it.
- **Location is GPS-first (WX):** on launch WX quietly asks where you are; a GPS-chosen spot follows you on later opens (re-checked each launch, updated only if you've moved ~2 km). A town picked by hand always wins until you tap "Use where I am" again. Loranger, LA (30.6013, -90.3573) is the fallback while waiting and when permission is denied — and remains WX Console's default.
- **One settings namespace.** Everything lives under `wx.*` (location, units, theme, radar source). The old console's `wxc.*` keys are read once as migration fallbacks (location, radar source) and otherwise retired.
- **Refresh:** every 15 min while visible, plus on tab-return if data >10 min old.
- **Time handling:** Open-Meteo returns local ISO strings; all comparisons are done in a shared "as-if-UTC" frame using `utc_offset_seconds`.

---

## WX Console — the console

Wears the same Big Sky as the answer screen since v2026.08.20.001: translucent panels over the verdict color, white ink (dark ink on the ice sky), CARTO dark basemap under the radar (light tiles on ice). (Was the shared light/dark theme v008–v015, and the dark/amber FeedPoint panadapter through v007.) Sections top to bottom:

1. **NWS alerts** — expandable, severity-colored, above the fold on purpose (Gulf Coast).
2. **Current conditions** — big temp, feels-like, wind w/ gusts, 9-cell metrics grid (humidity, dewpoint, pressure, UV, visibility, cloud, rain today, rain chance).
3. **Radar** — hand-rolled slippy-map on canvas (no Leaflet). CARTO base + RainViewer overlay. Drag to pan, pinch or wheel/+− to zoom (z4–z11), crosshair recenters, fourth button goes full screen. 8 past frames + nowcast loop; forecast frames dimmer, timestamp flips to FORECAST in cyan. Loop pauses when tab hidden. Tiles refresh every 5 min. LRU-ish tile cache capped at 600.
4. **48-hour scope** — canvas temp trace w/ night bands, cyan precip-probability bars, day dividers, NOW marker. Drag to scrub; readout row shows that hour's temp/feels/condition/precip/wind/RH/dewpoint.
5. **7-day outlook** — rows with proportional hi/lo range bar; tap to expand (precip total, dominant wind, max gust, UV, sun times).
6. **Sun & moon** — sun arc w/ live position; moon phase computed from synodic age (29.530588853 d, epoch 2000-01-06 18:14 UTC) — no data call.

## WX — the one answer

Big Sky aesthetic since v2026.08.20.001: the whole background is one saturated color chosen by the verdict, with white type drawn straight on it — no cards on screen one. Was the sun-shower pastel through v2026.08.16.015, cave-wall stone/ochre through v2026.08.16.005. One screen, no scrolling. Reading level ~5th grade.

**The sky IS the verdict:** one flat color, cross-fading when conditions change —
- **blue** `#256EB6` — FINE, the everyday sky
- **amber** `#AD510A` — heat verdicts and moderate alerts
- **slate** `#414E63` — thunderstorms, wind, bad air
- **teal** `#1E7688` — rain and snow
- **deep navy** `#182236` — after sunset when nothing's wrong (night mode happens by itself; the sun/moon toggle retired with it)
- **red** `#B23A31` — severe/extreme warnings only, so red always means danger
- **ice** `#C9D9E6` — dangerous cold; the one sky with dark ink instead of white

Every sky is held dark enough (ice: light enough) that the ink and the 13px labels clear WCAG 4.5:1 — blue, amber and teal went a shade deeper in v2026.09.17.001 for exactly that, and the sun/rain accent tints are set per sky. Change a sky and re-measure.

Flat color on purpose — gradients read as murk on OLED phones. The console panels are translucent white (or ink, on ice) over the same sky, and the canvases (scope, radar basemap, sun arc, moon) carry white-on-color palettes with a dark-on-ice variant. The favicon re-renders to the current verdict's pictograph, so even the tab shows the weather.

**Screen:** place → big thin temperature → ONE WORD verdict under it → one plain sentence → TOMORROW hi/lo + first-rain line → one line of vitals (feels · wind · humidity · UV) with sunrise · sunset under it → 12 hourly bars (taller = warmer, water-blue = rain likely) → 7-day outlook as white hairline rows, folded to three → status stamp. Long alert names drop to a smaller size so they never swallow the screen. The hero pictograph retired with the repaint — the color and the word carry it now (the pictographs live on in the week rows and the favicon).

**The taps:** temperature = °F/°C · place name = change location · the UPDATED stamp (or a pull down from the top) = refresh · the boxed advisory when an alert is up (the whole panel, not just the words) = full NWS text in plain language · any hour bar = that hour's numbers for a few seconds · share (top right) = system share sheet · the version number in the footer = this changelog on GitHub. A white pill appears when a newer version is deployed; tapping it reloads.

**Alert ranking:** `alertRank()` scores every active alert 0–5 from its NWS `severity` *and* its event name, whichever is louder (tornado/flash-flood/hurricane/storm-surge/tsunami warnings = 5, any Warning = 3, Watch/Advisory/Statement = 2). Anything scoring 2+ is kept, deduped by event|severity, and sorted worst-first, so `ALERTS[0]` — the one the answer screen shows — is always the most dangerous. Rank ≥ 3 is "grave": red sky, warn pictograph.

**Is it raining on ME?** Four independent witnesses, because each has a blind spot (v2026.09.14.001):
1. `current.precipitation` / `rain` / `showers` — millimetres from the same payload. The app had never asked for these; `weather_code` alone is a categorical summary that lags light or patchy rain.
2. the `minutely_15` bucket we are standing in — already downloaded, previously only read *forwards* for the nowcast.
3. the nearest NWS station's `textDescription` / `precipitationLastHour`.
4. **radar**, the only source that looks at your actual roof: one RainViewer tile at z8 (~500 m/px), the ±1.6 km box of pixels over your coordinates read off a canvas, ≥12% coverage = rain, red-dominant pixels = heavy. The tile is **fetched as a blob** and decoded via `createImageBitmap` (falling back to an object URL), not loaded through `<img crossOrigin>`: the console map draws these very same URLs at the very same default zoom without CORS, and the browser will serve that cached CORS-less response to a crossOrigin request and then refuse the pixels — which is exactly how v2026.09.14.001 shipped a radar check that never read a pixel. A blob is same-origin, so nothing can taint the canvas. Failures are recorded in `ECHO_WHY` and shown in the console's **Radar overhead** row rather than vanishing.

Any of the four puts RAINING (or HEAVY RAIN) on the screen. When radar is the *only* witness the sentence says so, because the forecast will be insisting it is dry.

**Live conditions beat the model.** Open-Meteo is a forecast; it routinely misses pop-up convection. Since v2026.09.07.004 the app also reads the nearest NWS station's latest observation (`/stations/{id}/observations/latest`, station discovered once via `/points` and cached in `wx.site`, ignored if older than 75 min) — `textDescription`, measured `windGust`, `precipitationLastHour`. A station reporting Thunderstorm makes the verdict STORMS even when the model says clear, and the sentence names the station.

**Alerts do not outrank a storm on top of you.** Only warnings (rank ≥ 3) win the screen outright. An advisory or watch (rank 2) yields to a live storm or a damaging gust and moves to a tappable line beneath the verdict — this is the bug that left HEAT ADVISORY on screen through thunder, lightning and 60 mph gusts.

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

The WX wordmark (v2026.09.17.003): "WX" heavy and tracked, like the verdict
word on screen one, white on the FINE sky blue `#256EB6`. It is drawn as
geometric strokes (beveled joins, clipped to a flat cap-height box) rather
than font text, so it renders identically everywhere and stays crisp at
29px. Source of truth is `icon.svg`; `apple-touch-icon.png` (180) and
`icon-512.png` are renders of it (Quick Look at 1024, `sips` down). The
favicon is a data URI in the `<head>`; in-app it re-renders the same mark
on a tile of the current sky color (dark ink on ice), so the tab still
carries the verdict. Replaced the sun-shower clip art (v2026.09.06.001 to
v2026.09.17.002), which said "weather app" but nothing about this one.

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
- v2026.08.16.006 — new shared app icon (in-house sun/storm/rain variant)
- v2026.08.16.007 — RV/NX radar source toggle (RainViewer composite vs raw NEXRAD via Iowa Mesonet); GPS-first location ported from WX, with the same parish-skipping reverse geocode
- v2026.08.16.008 — the WX theme throughout: light/dark palettes, sun/moon toggle + share in the header, theme-aware canvases and basemap; duplicate alerts deduped; place line ellipsizes
- v2026.08.16.009 — merged into WX; console.html is now a redirect stub to /#console

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
- v2026.08.16.013 — in-house sun/storm/rain icon replaces the sun-shower mark; palette re-tuned to it (richer orange and blue); long place names ellipsize instead of running under the corner buttons
- v2026.08.16.014 — the merge: console lives below the fold of the one page; one fetch carries every field for both halves (7 days); one settings set with wxc.* migration; console.html becomes a redirect stub
- v2026.08.16.015 — dense screen one (layouts C+B): compact hero row, snapshot chips, and the 7-day outlook folded to three rows on the first screen with ALL 7 DAYS / FEWER DAYS toggle and tap-for-detail rows; console keeps radar, scope, details, sun & moon
- v2026.08.20.001 — Big Sky: the background is one saturated color chosen by the verdict (blue FINE, amber heat/moderate alerts, slate storms/wind/bad air, teal rain/snow, navy night, red severe warnings only, ice for dangerous cold with dark ink); white type, no cards on screen one, vitals as one line, week as hairline rows; console panels translucent over the sky, canvases on white-on-color palettes; sun/moon theme toggle retired — night is just another sky
- v2026.08.20.002 — first-day-on-a-real-phone fixes: week rows said "undefined NaN" on iPhones (Safari refuses date-only strings with a Z suffix; daily dates now parse as explicit midnight UTC); sunrise & sunset added to screen one under the vitals line; census-designated places (Loranger is one) now count as towns in the reverse-geocode mining so the parish shouldn't win
- v2026.08.20.003 — sunrise/sunset labels go sun-yellow with sun-orange times; NWS gridpoint lookup names the nearest real town when the geocoder answers with a parish; radar basemap swaps to CARTO Voyager (roads, water, names) with a red location pin and light controls; console panels/labels get more contrast
- v2026.08.20.004 — radar showed "Not Supported" tiles: RainViewer's free tier stops at zoom 7 and the map starts at 8; radar layers now overzoom (fetch the deepest supported tile, scale the right quadrant) so every zoom shows weather
- v2026.08.20.005 — radar moves to the top of the console (alerts still first); console panels switch from a white wash to smoked glass (a dark tint over the sky) so Details reads clean; radar gets pinch-to-zoom
- v2026.08.20.006 — place naming round three: ZIP decides. Nearest-town gazetteers skip unincorporated places (answered Folsom); now the reverse geocode's postcode goes through Zippopotam and the postal name (70446 → Loranger) wins; GPS locations carry a resolver version so saved names re-resolve after upgrades
- v2026.08.20.007 — rain never goes unsaid: water-blue RAIN/STORMS AROUND line under the sentence when rain is inside the 12 hours but heat or an advisory owns the big word; rain-likely hour bars water-blue again; alert window gets a top-right ✕ and sheets pad for the iPhone home bar
- v2026.08.20.008 — week icons grow 22→32px; alert window's ✕ bigger and brighter; advisory cards show a + that rotates to ✕ while open
- v2026.08.21.001 — bigger type everywhere the letters were small: labels, tickers, week rows, footer, details grid, radar bar, scope readout and canvas labels, sun & moon, page foot
- v2026.08.21.002 — sunrise/sunset line bumped a little bigger too
- v2026.09.06.001 — new home-screen icon (Big Sky blue, white cloud, gold sun, three drops) plus a speed/ease pass: cache-first shell so the app opens instantly offline or on bad signal (the update pill now clears caches before reloading); preconnect to the data APIs and dns-prefetch for the tile hosts; radar defers until scrolled into view (IntersectionObserver, no pre-margin — the console starts just below the fold); status bar goes black-translucent so the sky runs edge to edge; pull down to refresh; HUM label on the humidity; › affordance on week rows; ✕ on the location sheet; one-time tip naming the two invisible gestures
- v2026.09.06.002 — the advisory is a box: when an alert is up the verdict and its sentence sit in a bordered, tinted panel with a READ THE FULL ALERT › row, and the whole panel opens the NWS text (keyboard-reachable, role=button). The alert sentences stop saying "tap" — the button says it
- v2026.09.06.003 — full-screen radar: a fourth map button fills the screen with it and back again. CSS, not the Fullscreen API (iOS won't grant it to a div), so it works in the home-screen app; canvas is re-measured on toggle, Escape exits, sheets moved to z-index 30 so they stay on top
- v2026.09.07.001 — the advisory box slims down: inside the box the alert name drops to a heading size with narrow tracking (so "Heat Advisory" and even "Severe Thunderstorm Warning" fit one line), the sentence and READ THE ALERT row tighten, padding comes in — roughly half the height for the same information
- v2026.09.07.002 — **the worst alert wins the screen** (safety fix). Alerts were used in whatever order api.weather.gov returned them, so a Heat Advisory could stand in front of a Severe Thunderstorm Warning and be the only one the answer screen showed. Alerts are now ranked and sorted worst-first; the rank reads the event name as well as the `severity` field, because real warnings have shipped tagged Minor/Unknown and the old moderate-and-up filter dropped them outright. Grave (red sky) follows the rank, the box reads READ ALL N ALERTS when several are active, and the sheet shows every one
- v2026.09.07.003 — **what the weather radio hears, the app hears** (reported from the field: a severe warning came over NOAA Weather Radio while the app showed only a Heat Advisory). Alerts were only ever requested for one GPS point; the app now also asks for the county and forecast zone, merges and dedupes, marks county-only alerts NEARBY, and the sentence says "Out for your county now" so the scope is honest
- v2026.09.07.004 — **live severe weather can no longer hide behind an advisory** (reported: thunder, lightning, rain and heavy wind passed through while the screen read HEAT ADVISORY). Any active alert used to win outright; now only warnings do, a storm or damaging gust takes the word and the advisory moves to a tappable line. Damaging gusts (45+ mph) become their own verdict instead of sitting below the heat check, where a Louisiana summer buried them forever. And the app now asks the nearest NWS station what is actually being observed, so a real thunderstorm reaches the screen even when the forecast model shows a clear afternoon
- v2026.09.14.001 — **the app looks out of the window** (reported: raining, app said HOT, no alert, station dry). Adds four rain-now witnesses: current precipitation/rain/showers (never requested until now), the current 15-minute bucket (downloaded all along, only ever read forwards), station observation, and the radar pixel directly over your coordinates from the same RainViewer tiles the console map draws. Console gains Radar overhead and Reported now readings
- v2026.09.14.002 — the radar probe from .001 never read a pixel: the map loads the same tiles at the same default zoom without CORS, so the browser answered the probe's crossOrigin request from that cached copy and refused the pixels. Tiles are now fetched as blobs with `cache:"reload"`, the coverage threshold drops to 12% so light rain counts, and the console's Radar overhead row reports the reading or the reason there isn't one
- v2026.09.17.001 — **the everyone-can-use-it pass** (full interface review). Skies deepen so white type clears 4.5:1 everywhere, accents re-tinted per sky; screen readers now hear the temperature, the town and the week's conditions (aria-labels were replacing them); hour bars are buttons walked with the arrow keys, and rain-likely hours carry a drop as well as a color (they vanished on the ice sky); the "also in effect" line, refresh stamp and town list are real buttons; scope and radar take arrow keys; both sheets are native `<dialog>`s; radar autoplay and smooth scroll respect reduced motion; a blocked location is explained inside the sheet; sample data says NO SIGNAL in the headline; `<main>`, an `<h1>`, a status live region; one nine-step type scale with a 12px floor; tip no longer covers the refresh button; hover and press feedback; dead `.dayrow` CSS removed
- v2026.09.17.002 — radar basemap switches from CARTO Voyager to OpenStreetMap standard tiles: CARTO began watermarking its free tiles with API KEY REQUIRED, on the live site too
- v2026.09.17.003 — new app icon: the WX wordmark, geometric paths, white on the FINE sky; favicon re-tints per sky

## Backlog / ideas

- WX Console: hourly precip accumulation as second trace; propagation/solar panel (shares data needs with SKYWAVE's planned Propagation tab). ~~NWS RIDGE radar toggle~~ — done in v2026.08.16.007 as the RV/NX switch (raw NEXRAD via Iowa Mesonet rather than RIDGE's ArcGIS service; same authoritative reflectivity, far simpler tiles).
- WX: threshold tuning for Louisiana summers; maybe a "tomorrow" second line.
- ~~Icon candidate~~ — done in v2026.08.16.013: drew the in-house variant (sun/storm/rain, our own artwork) and tuned the app palette to it.
- ~~Both: PWA manifest + service worker~~ — done in WX v2026.08.16.007. Decided: the icon PNGs had already broken single-file purity, so the shell may as well work offline. `manifest.webmanifest` + `sw.js` at the root; the worker caches pages per-URL (console too) and never touches API calls.

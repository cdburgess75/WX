# WX

A single-file, offline-first weather app. No build step, no API keys, no libraries — one HTML file you can open locally or drop on GitHub Pages.

| App | File | Philosophy |
|-----|------|------------|
| WX | `index.html` | One answer first — decides what matters and says it plainly; the full console (radar, 48-hour scope, details, sun & moon) sits below the fold |

`console.html` is only a redirect stub for old bookmarks. WX pulls from Open-Meteo (forecast + geocoding) and api.weather.gov (US alerts), with RainViewer / NEXRAD radar over OpenStreetMap tiles. Everything is fetched in metric and converted client-side, and the last good payload is cached in localStorage so the app still renders — flagged stale — with the network down.

## Live

- **WX** — <https://cdburgess75.github.io/WX/>

Served by GitHub Pages from `main`. Add it to a phone home screen via Safari Share → Add to Home Screen.

See **[NOTES.md](NOTES.md)** for the full design record: data sources, architecture decisions, the WX verdict engine and its tunable thresholds, deployment steps, testing, changelog, and backlog.

## Versioning

`vYYYY.MM.DD.NNN` — date of the shipped change, `NNN` incrementing per shipped change within that day. Every release gets a changelog line in the file's header comment, and the version shows in the app footer.

## Attribution

Weather data by [Open-Meteo](https://open-meteo.com/) (CC BY 4.0). Alerts from the US National Weather Service. Radar tiles from RainViewer; basemap © OpenStreetMap contributors.

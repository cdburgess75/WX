# WX

Two single-file, offline-first weather apps. No build step, no API keys, no libraries — each app is one HTML file you can open locally or drop on GitHub Pages.

| App | File | Size | Philosophy |
|-----|------|------|------------|
| WX Console | `console.html` | ~50 KB | Full console — everything on one page |
| WX | `index.html` | ~21 KB | One answer — decides what matters and says it plainly |

Both pull from Open-Meteo (forecast + geocoding) and api.weather.gov (US alerts); WX Console adds RainViewer radar over CARTO dark tiles. Everything is fetched in metric and converted client-side, and the last good payload is cached in localStorage so the apps still render — flagged stale — with the network down.

## Live

- **WX** — <https://cdburgess75.github.io/WX/>
- **WX Console** — <https://cdburgess75.github.io/WX/console.html>

Served by GitHub Pages from `main`. Add either to a phone home screen via Safari Share → Add to Home Screen.

See **[NOTES.md](NOTES.md)** for the full design record: data sources, architecture decisions, the WX verdict engine and its tunable thresholds, deployment steps, testing, changelog, and backlog.

## Versioning

`vYYYY.MM.DD.NNN` — date of the shipped change, `NNN` incrementing per shipped change within that day. Every release gets a changelog line in the file's header comment, and the version shows in the app footer.

## Attribution

Weather data by [Open-Meteo](https://open-meteo.com/) (CC BY 4.0). Alerts from the US National Weather Service. Radar tiles from RainViewer; basemap © OpenStreetMap contributors, © CARTO.

# hammadi.dev — free Instagram tools

The marketing site for the [Instagram Scraper API][listing]: free, keyless web
tools for public Instagram data, built to be found in search and to hand the
visitor the API when they outgrow them.

Each tool is a page (`/tools/<slug>`) with a form, a live result table and CSV
/ JSON export. The data comes from the API's free endpoints
(`/public/v1/run/<slug>`), which are rate limited per IP and capped well below
the paid routes.

[listing]: https://rapidapi.com/goodstobkal-goodstobkal-default/api/instagram-scraper57

## Why it's prerendered

Search traffic is the point, so a blank SPA shell would defeat it. `vite-ssg`
renders every route to its own `index.html` at build time — real content,
titles, canonicals and JSON-LD in the HTML — then hydrates for the interactive
parts.

## The tool catalog

The API owns what each tool takes and returns (`app/public_tools.py` in the API
repo). `npm run catalog` pulls `/public/v1/tools` into `src/catalog.json`, which
drives the forms, the tables, the CSV columns and the list of pages to
prerender. It runs automatically as part of `npm run build`; the committed
snapshot is the fallback when the API is unreachable.

**Adding a tool is a change in the API repo, then a rebuild here.**

## Develop

```bash
npm install
npm run dev           # http://localhost:5173, calls the live API
```

`VITE_API_BASE` points at the API (default `https://api.akamisushiwok.com`) and
`VITE_SITE_URL` sets the canonical origin (default `https://hammadi.dev`). The
API allows CORS from `localhost:*`, so local dev works against production data.

## Build and deploy

```bash
docker compose up -d --build          # serves on 127.0.0.1:8090
```

Caddy on the host terminates TLS for `hammadi.dev`, serves this container, and
proxies `/spotlights`, `/sitemap.xml` and `/robots.txt` to the API (the guides
are rendered there, and sitemap/robots need to know every tool and guide).

## Layout

```
src/
  catalog.json        snapshot of the API's tool registry (refreshed at build)
  main.ts             vite-ssg entry + which routes get prerendered
  pages/              Home, Tools index, Tool page, 404
  components/         header, footer, ToolRunner (form + table + export)
  lib/                api client, CSV/JSON export, SEO helpers
```

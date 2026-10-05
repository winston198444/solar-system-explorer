# Solar System Explorer

A web app that exposes **every datum** offered by the
[Solar System openData API](https://api.le-systeme-solaire.net):
all 554 catalogued bodies (planets, dwarf planets, moons, asteroids,
comets, the Sun), the official known-object counts, and live sky
positions for any observer on Earth.

![stack](https://img.shields.io/badge/stack-React%2018%20%2B%20Vite%20%2B%20TypeScript-4da6ff)

## Features

- **Dashboard** — official known-object counts (1.55 M asteroids,
  4,643 comets…), explore-by-type cards, the Sun & planets.
- **Catalog** — the full list with text search, type filter,
  multi-column sorting and pagination.
- **Body detail** — physical characteristics, orbit & rotation
  elements, discovery info, parent body and moon navigation.
- **Sky positions** — RA/Dec and Az/Alt for the Sun, Moon, planets
  and Pluto from any lat/lon/elevation/date, plus Julian day,
  J2000 and sidereal time.
- **Languages** — English and Spanish, auto-detected from the
  browser, switchable in the header.

## Data notes (API quirks handled by the app)

| Quirk | Handling |
|---|---|
| API key required (`Authorization: Bearer …`) | injected by a proxy, never shipped to the browser |
| CORS preflight fails from browsers with the auth header | all requests go through the proxy |
| `avgTemp` is in **Kelvin** | converted to °C for display |
| Many fields use `0` / `""` for *unknown* | rendered as "—" (per-field allow-list of true zeros) |
| Names are stored in French (`Pluton`, `La Terre`) | only the English name is displayed |
| Negative `sideralRotation` | labelled *retrograde* |
| Default pagination is 20/page | `fetchAllBodies()` requests the full list in one call (~500 KB) |
| Ceres is classified as `Asteroid` although it is a dwarf planet | shown with its API type |

## Project structure

```
├── index.html                  # SPA shell
├── vite.config.ts              # dev server + /rest proxy (injects the key)
├── .env                        # SOLAR_API_KEY (git-ignored)
├── src/
│   ├── config.ts               # API base URL / key (direct mode)
│   ├── i18n/                   # en + es dictionaries, browser detection
│   ├── lib/
│   │   ├── api.ts              # typed fetch client + fetchAllBodies()
│   │   ├── model.ts            # Body type, normalization helpers
│   │   └── format.ts           # units: km, AU, K→°C, ×10ⁿ, retrograde…
│   ├── components/             # Layout, Badge, Field, Pagination, …
│   └── pages/                  # Dashboard, Catalog, BodyDetail, Positions
└── proxy/
    ├── worker.js               # Cloudflare Worker (production proxy)
    └── server.js               # Express alternative (self-hosted)
```

## Setup

```bash
npm install
cp .env.example .env   # then put your key in SOLAR_API_KEY
npm run dev            # http://localhost:5173
```

Get a free API key at
https://api.le-systeme-solaire.net/generatekey.html.

## Deploy

> **A server-side proxy is mandatory — but you can choose
> which one.** The API requires the key even on CORS preflight
> (`OPTIONS`) requests, and browsers cannot send the key during
> preflight — so the API **cannot be called directly from a
> browser**. Any component that injects the key server-side
> works:
>
> - **Cloudflare Worker** (`proxy/worker.js`) — the option this
>   deployment uses (free tier, runs at the edge)
> - **Express server** (`proxy/server.js`) — self-hosted
>   alternative, included in the repo
> - Any other serverless function (Netlify, Vercel, Deno
>   Deploy…) or reverse proxy (nginx, Caddy, Apache) that adds
>   the `Authorization` header

### 1. Deploy the proxy (Cloudflare Workers, free tier)

The repo already contains `wrangler.toml` pointing at
`proxy/worker.js`, so Wrangler deploys the plain worker and
ignores the Vite app in the same repo.

**From your PC:**

```bash
npm i -g wrangler
wrangler login
wrangler deploy                     # reads wrangler.toml
wrangler secret put SOLAR_API_KEY   # paste your API key
```

**From the Cloudflare dashboard** (Workers & Pages → Create
application → Workers with Git integration → connect the
repo), set:

- **Build command:** (leave empty — the worker needs no build)
- **Deploy command:** `npx wrangler deploy`
- **Secret:** Workers → solar-system-explorer → Settings →
  Variables → Secrets → add `SOLAR_API_KEY` with your API key

Copy the worker URL:
`https://solar-system-explorer.<account>.workers.dev`.

Alternative: self-host `proxy/server.js` (Express) on any VPS/container.

### 2. Deploy the SPA to GitHub Pages

1. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Repo → **Settings → Secrets and variables → Actions → New repository
   secret**: `VITE_API_BASE_URL` = your proxy URL.
3. Push to `main`: `.github/workflows/deploy.yml` builds and
   publishes `dist/` automatically (the workflow also writes a
   `CNAME` file into `dist/`).

**Custom domain (optional):** set the domain in repo →
**Settings → Pages → Custom domain** and point DNS at GitHub
(CNAME to `<user>.github.io` for a subdomain, or the four
`185.199.108-111.153` A records for the apex). Assets use a
relative base (`base: './'` in `vite.config.ts`), so the same
build works at a domain root or under any path.

Do **not** publish the repo root as-is — that serves the source
`index.html` (which imports `/src/main.tsx` and 404s). GitHub
Pages must serve the built `dist/` folder.

## API reference

The OpenAPI spec lives at https://api.le-systeme-solaire.net/rest/.
Useful query parameters on `/rest/bodies`: `filter[]=field,op,value`
(eq, cs, gt, lt, bt…), `order=field,asc|desc`, `page=n,size`,
`data=field,field` (projection) and `exclude`.

---

Data: Solar System openData API (CC BY 4.0).

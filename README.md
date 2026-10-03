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

## Data notes (API quirks handled by the app)

| Quirk | Handling |
|---|---|
| API key required (`Authorization: Bearer …`) | injected by a proxy, never shipped to the browser |
| CORS preflight fails from browsers with the auth header | all requests go through the proxy |
| `avgTemp` is in **Kelvin** | converted to °C for display |
| Many fields use `0` / `""` for *unknown* | rendered as "—" (per-field allow-list of true zeros) |
| Names are stored in French (`Pluton`, `La Terre`) | English name is primary, native name secondary |
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

> **A proxy is mandatory.** The API requires the API key even on
> CORS preflight (`OPTIONS`) requests, and browsers never send the
> key during preflight — so the API **cannot be called directly
> from a browser**. All traffic must go through a server-side proxy
> that injects the key.

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
- **Secret:** Workers → solar-api-proxy → Settings → Variables
  → Secrets → add `SOLAR_API_KEY` with your API key

Copy the worker URL: `https://solar-api-proxy.<account>.workers.dev`.

Alternative: self-host `proxy/server.js` (Express) on any VPS/container.

### 2. Deploy the SPA to GitHub Pages

1. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Repo → **Settings → Secrets and variables → Actions → New repository
   secret**: `VITE_API_BASE_URL` = your worker URL.
3. Push to `main`: `.github/workflows/deploy.yml` builds and
   publishes `dist/` automatically.

The site lives at `https://winston198444.github.io` (user site,
asset base `/`). For a project site (`…/repo-name/`), set
`base: '/repo-name/'` in `vite.config.ts`.

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

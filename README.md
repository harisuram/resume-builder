# Free Resume Builder

A resume builder with every section available and none required — skip what
doesn't belong, then pick a template. Next.js (App Router) + TypeScript +
Tailwind CSS + Zustand. No backend, no database — everything lives in client
state plus `localStorage`.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## ATS rewrite (Groq)

The Experience “Make ATS-friendly” button calls `/api/optimize`. The Groq API
key stays on the server (`GROQ_API_KEY`, never `NEXT_PUBLIC_`).

1. Copy `.env.example` to `.env.local`.
2. Paste a key from [console.groq.com/keys](https://console.groq.com/keys).
3. Restart `npm run dev`.

Production: set `GROQ_API_KEY` as a **secret** (`npx wrangler secret put GROQ_API_KEY`).
The static export does not include the Next.js route; the Worker at
`workers/index.ts` serves `/api/optimize` instead.

## Testing

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with a coverage report
```

Jest + React Testing Library, colocated as `*.test.ts(x)` next to the code
they cover: every `lib/` module, every form and store action, all 21
templates (rendered with both a fully populated and an empty resume), the
builder shell → export flow end to end, and the AdSense slot's
enabled/disabled/no-fill states.

## Architecture notes

- **Static export.** `next build` sets `output: "export"` (via `scripts/build.mjs`).
  The app ships as static HTML/CSS/JS on Cloudflare Workers assets. The one
  exception is `/api/optimize` (Groq ATS rewrite): a Worker in production
  (`run_worker_first`: `/api/*` only, so page views stay on the free CDN),
  and a Next.js POST route under `next dev` only.
- **State** lives in a single Zustand store (`lib/store.ts`) shared by every
  form and the live preview, so edits reflect instantly with no prop drilling.
- **Templates** (`components/templates/`) are config-driven: three layout
  shells (single column, sidebar, asymmetric two-column) plus a per-template
  `TemplateTheme` object (accent color, heading style, density, font
  pairing...) cover all 21 templates. Adding a 22nd is a new theme entry, not
  new layout code.
- **Preview = export.** `ResumePreviewFrame` is the one component that renders
  a resume; it's used for the live preview and, tagged with an id, as the
  print target — so a download can never visually drift from what was
  previewed. PDF goes through the browser's print pipeline against the
  actual selected template, laid out on the same A4 box (`lib/page.ts`:
  760px wide, zero-margin A4 height).

## Ads (Google AdSense)

Off by default — copy `.env.example` to `.env.local` and fill in
`NEXT_PUBLIC_ADSENSE_CLIENT_ID` (plus the slot ids) to turn ads on. Until
then, the loader script isn't injected, `/ads.txt` ships empty, and every
`AdSlot` stays out of the layout until Google actually fills it.

Six slots:
- **Landing page** — between the feature grid and the footer, well below the
  primary "Build my resume" CTA.
- **Builder nav** — bottom of the left section sidebar, below "Template &
  export", desktop only.
- **Builder preview top** — top of the right preview column, above the live
  résumé, desktop only, hidden on the export step.
- **Builder preview** — under the live preview, desktop only, hidden on the
  export step (the export step has its own slot instead — see below).
- **Export page** — between the save/download card and the preview, on the
  Template & export step only.
- **Section footer** — below the Back/Next/Skip row, on Photo, Summary,
  Key achievements, Skills, Certifications, Patents, Languages, Hobbies, Soft skills, and
  Additional (one shared slot id — only ever one of these is on screen at
  a time).

Each `AdSlot` stays collapsed — no label, no reserved space — until Google
reports a fill (`data-ad-status="filled"`). An unfilled or blocked request
never leaves a blank box behind; the `ins` tag remains in the DOM so
AdSense's crawler can still see the unit. `/ads.txt` is generated from the same client id
so Google can verify the site as an authorized seller. Note that a brand-new
AdSense account still needs Google's manual site review before any ad
actually serves — this wiring is necessary but not sufficient for that.

## Deploying to Cloudflare (free plan)

This app is a **static export** plus one tiny Worker for `/api/optimize`. That
split is what makes the free plan fit: HTML/CSS/JS is served from the CDN
(unlimited) and only the Groq ATS-rewrite calls count as Worker requests
(100,000/day on the free plan).

**Build variables** (`NEXT_PUBLIC_*`) are baked in at `next build`. **Secrets**
(`GROQ_API_KEY`) are Worker secrets at runtime.

### Dashboard (recommended)

1. [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages) → Create → connect this GitHub repo.
2. Framework preset: **None**. Build command: `npm run build`. Deploy command: leave default (`npx wrangler deploy`).
3. Set **build** environment variables:
   - `NEXT_PUBLIC_SITE_URL` — your real domain (`https://example.com`)
   - AdSense `NEXT_PUBLIC_ADSENSE_*` vars if you want ads on
4. After the first deploy, set the Groq secret (Settings → Variables and Secrets):
   - `GROQ_API_KEY` — encrypt / secret (never a plain text var)
   - `GROQ_MODEL` is already defaulted in `wrangler.jsonc`

Free-plan notes:
- Static assets do **not** invoke the Worker (`run_worker_first` is only `/api/*`).
- Groq is I/O-bound, so it stays under the free 10 ms CPU budget.
- Skip extra products (KV, D1, R2, Workers AI) — they are unused and would
  add quota you do not need.

### CLI

```bash
npx wrangler login
npx wrangler secret put GROQ_API_KEY
npm run deploy
```

`npm run deploy` runs `next build` then `wrangler deploy`. Dry-run without
uploading: `npm run deploy:dry-run`.

`public/_headers` sets security headers and a one-year immutable cache on
`_next/static/*`, so repeat visits barely touch the network.

If the site is already a **Pages** project, you can keep using it: build
command `npm run build`, output directory `out`. `functions/api/optimize.ts`
still serves Groq there. New projects should use Workers (above) — Cloudflare
is not adding features to Pages.

## Project structure

```
app/                   Routes: landing, how-to, private, templates, ATS, privacy, about; /builder (noindex); sitemap, robots, ads.txt
components/ads/        AdSlot — the one place that knows how to render (or skip) an ad
components/site/       Marketing chrome (header, footer) shared by indexable pages
components/builder/    The wizard: section nav, forms, preview, export
components/templates/  Template registry, layout shells, shared render atoms
components/ui/         Small shared UI primitives (Button, Field, Switch, ...)
lib/                   Data model, Zustand store, section config, localStorage/ads config
workers/               Cloudflare Worker for POST /api/optimize (free-plan CDN for the rest)
functions/             Pages Function adapter if the site is still on Pages
test-utils/            Shared fixtures for tests (not part of the app bundle)
```

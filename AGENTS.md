# CLAUDE.md — The Wandering Bunny

## What this is

A static photo portfolio for **thewanderingbunny.com**. Next.js App Router
compiled to plain HTML/CSS/JS via `output: "export"`, deployed to GitHub Pages.

**There is no server, no database, and no admin panel.** Photos are files on
disk; their metadata lives in a JSON file committed to the repo. Adding a photo
means adding files and editing JSON, then pushing.

> An earlier version of this project had a Prisma/SQLite backend, an admin UI,
> likes, comments and a journal. None of it exists any more. If you find a
> reference to it, it is stale — say so rather than building around it.

---

## Routes

Three pages, and the URL structure is deliberate:

| URL | What it is |
|---|---|
| `/` | **The portfolio.** The masonry grid of all 94 photos. |
| `/about/` | About page. |
| `/portfolio/` | **A redirect to `/`.** Not a real page. |

`/portfolio/` used to hold the content while `/` was a meta-refresh stub — so
the site's own domain resolved to a 9KB page reading "Continue to Portfolio".
That is now reversed. The stub survives only so the old URL doesn't 404, and
its canonical points at `/` so search engines fold it in rather than indexing a
second copy. **It can be deleted once it drops out of Google's index** — check
Search Console's Pages report for "Alternate page with proper canonical tag".

`RedirectTo.tsx` does the redirecting: a meta refresh for crawlers and no-JS
visitors, plus `router.replace` for everyone else. There is no server here, so
a real 301 is not available.

---

## Layout on disk

```
PhotoBook/
├── CLAUDE.md, AGENTS.md         # pointers to the real ones in the repo
├── Design/                      # design notes + the .dc.html canvas
├── Photo/                       # 2.1GB source photo library, by trip.
│                                #   NOT what the site serves. Never delete.
└── thewanderingbunny-photobook/ # ← git repo; paths below are relative to here
    ├── CLAUDE.md, AGENTS.md     # this file (identical copies, version controlled)
    ├── .github/workflows/deploy.yml
    ├── public/
    │   ├── CNAME                # thewanderingbunny.com
    │   ├── .nojekyll            # stops Pages running Jekyll over the output
    │   ├── google887…html       # Search Console verification — DO NOT DELETE
    │   ├── data/photos.json     # 94 photos — the entire content model
    │   └── uploads/{originals,thumbnails,about}/
    ├── scripts/backfill-photo-metadata.mjs
    └── src/
        ├── app/
        │   ├── layout.tsx       # <html>, fonts, all shared metadata
        │   ├── page.tsx         # "/" — the portfolio
        │   ├── portfolio/page.tsx  # redirect stub
        │   ├── about/page.tsx
        │   ├── sitemap.ts       # → /sitemap.xml
        │   └── robots.ts        # → /robots.txt
        ├── components/
        │   ├── layout/{SiteShell,Sidebar,PublicShell,RedirectTo}.tsx
        │   ├── portfolio/{PortfolioClient,Lightbox}.tsx
        │   └── debug/ViewportProbe.tsx
        ├── lib/{data,photoMedia,photoDisplay,imageLoader,useScrollLock}.ts
        └── styles/globals.css   # every style in the site lives here
```

There are **two `.claude/launch.json` files** — one in `PhotoBook/` that runs
npm with `--prefix`, one here that runs it directly. Which applies depends on
which folder the session opens in. Both are needed; deleting either breaks the
dev preview from that location.

---

## Content model

`public/data/photos.json` is an array of photo objects. `src/lib/data.ts` reads
it with `fs.readFileSync` at build time — which only works because the page is
statically prerendered. **`data.ts` must stay server-side**; importing it from a
client component produces "Can't resolve 'fs'".

```jsonc
{
  "id": "leo-capri-001",
  "filename": "leo-capri-001.jpg",
  "originalUrl": "/uploads/originals/leo-capri-001.jpg",
  "thumbUrl": "/uploads/thumbnails/thumb-leo-capri-001.jpg",
  "width": 2400, "height": 1600,
  "thumbWidth": 1200, "thumbHeight": 800,
  "camera": "FUJIFILM X-T30 II",
  "lens": "37mm",                          // focal length, shown in the lightbox
  "lensModel": "XF16-55mmF2.8 R LM WR II", // full name, shown as equipment
  "aperture": "f/3.2", "shutter": "1/140", "iso": "320",
  "filmSim": "Classic Negative",
  "title": null, "caption": "", "location": "Leo & Capri",
  "category": "leo-capri", "theme": "pets",
  "featured": false, "sortOrder": 1,
  "createdAt": "2026-08-21T00:00:00.000Z",
  "sourceFile": "DSCF4839.JPG"
}
```

`blurhash`, `featured`, `sortOrder` and `journalEntryId` survive in the data but
nothing reads them. **Array order determines display order.**

### Adding photos

1. Full-size file into `public/uploads/originals/`.
2. Append an entry to `photos.json`. `width`/`height` must be the real pixel
   dimensions — the masonry balances columns by aspect ratio, so wrong numbers
   produce lopsided columns. `thumbUrl` is `/uploads/thumbnails/thumb-<filename>`
   even though that file does not exist yet.
3. `npm run optimise:images` — generates every thumbnail variant and fills in
   `thumbWidth`/`thumbHeight`. **Don't hand-make thumbnails.**
4. Commit and push. CI rebuilds and deploys.

`npm run backfill:photos` re-reads EXIF via `exiftool` and applies a hardcoded
`STORY_PATCHES` table. One-off maintenance, not part of the build.

### Image sizes — why the grid is fast

The grid renders each photo about **341 CSS px** wide, so it never needs a large
file. `scripts/optimise-thumbnails.mjs` regenerates three variants per photo
from the original:

| File | Width | Who gets it |
|---|---|---|
| `thumb-<name>-600.webp` | 600px | Phones, 1x displays — ~42KB each |
| `thumb-<name>.webp` | 900px | 2x laptops and wide screens — ~96KB each |
| `thumb-<name>.jpg` | 900px | Browsers without WebP |

Served through `<picture>` in `PortfolioClient`, with `buildThumbSources()`
deriving the WebP paths from `thumbUrl` by filename convention.

Two things here are load-bearing:

- **The original is deliberately absent from the grid srcset.** It used to sit
  there at 2400w, and on a wide retina screen the browser would correctly pick
  it — an 872KB file for a 341px slot. The original is for the lightbox only.
- **`GRID_SIZES` in `PortfolioClient` must match the real column widths.** It is
  what tells the browser which candidate to take; a wrong value silently over-
  or under-fetches every image on the page. Change the grid padding or gap and
  you must revisit it — the same warning as `computeLayoutMetrics()`.

Before this, thumbnails were stored at a very high JPEG quality: 800x1200
frames at 400KB, 23.9MB for the 94-photo grid. Now a phone pulls 5.4MB for the
whole grid and 42KB per visible photo.

---

## Styling — read this before touching CSS

**Every style is hand-written in `src/styles/globals.css` with semantic class
names** (`.portfolio-frame`, `.sidebar-topbar`).

Tailwind is installed and `@tailwind base` is pulled in for its reset, but
**there is not a single Tailwind utility class anywhere in `src/`.** Don't start
mixing them in — match the existing CSS.

`tailwind.config.ts` is stale: it names `Libre Caslon Display` and
`Crimson Pro`, neither of which is loaded. The fonts actually loaded in
`layout.tsx`:

| Token | Family | Used for |
|---|---|---|
| `--font-title` | `Rock 3D` | The wordmark, and only that |
| `--font-mono` | `Inconsolata` | Body copy, EXIF, nav — most visible text |
| `--font-text` | `DM Sans` | Fallback / UI |

```css
--bg: #ffffff;        --bg-off: #f6f7f8;
--text: #111111;      --text-mid: #555555;
--text-light: #999999; --text-faint: #c8c8c8;
--border: #e8e8e8;    --accent: #7a9aad;   /* Fujifilm cool blue */
--sidebar-width: 260px; --topbar-height: 56px;
```

---

## ⚠️ iOS Safari: the rule that cost seven commits

**Any full-viewport `position: fixed` overlay must either not exist, or be
paired with `useScrollLock`.** Re-adding a bare one will reintroduce a bug that
took seven commits and a screen recording to find.

### Why

When Safari's toolbars retract, the *visual* viewport grows but the *layout*
viewport does not. Measured on an iPhone with `?debug=1`:

```
innerHeight / visualViewport.height   850   ← what you can see
documentElement.clientHeight          742   ← what 100vh and sticky top:0 use
```

A sticky header pinned to `top: 0` therefore sits **108px below the top of the
visible area**. Safari normally paints the page background into that band — but
a full-viewport fixed layer suppresses that, and raw page content shows through
instead. That band is the "seam".

### How each case is handled

- **Film grain** (`body::after`) is `position: absolute`, not fixed. It covers
  the document against the already-relative `body` and scrolls with the content.
  At a 300px noise tile and `opacity: 0.35` the difference is imperceptible.
  **Do not change it back to fixed.**
- **Lightbox and nav drawer** genuinely need to be fixed, so both call
  `useScrollLock`. Pinning `body` takes the document out of flow, so it
  collapses to viewport height; with nothing to scroll, Safari restores its
  toolbars and the two viewports line up again.

`mix-blend-mode` was removed from the grain along the way, but **that was not
the cause** — the seam persisted with `mix-blend-mode: normal` and only went
away when the layer stopped being fixed. Keep it off regardless: `multiply`
against white returns the source unchanged and `--bg` is `#ffffff`.

### Also load-bearing

- **No `viewport-fit=cover`** in `layout.tsx`. In normal browser mode Safari's
  own chrome already covers the status bar and home indicator; `cover` only
  widened the mismatch.
- `--topbar-pad-top` is plain `env(safe-area-inset-top, 0px)` with **no
  hardcoded floor**. It is 0 in browser mode and non-zero only when launched
  standalone from the Home Screen — exactly when the padding is wanted.
- `.site-main` / `.site-shell` use `min-height: 100dvh` with a `100vh` fallback
  above. `.site-content` deliberately has **no** `min-height` — as a stretch
  flex child it already fills `.site-shell`, and its own copy double-counted the
  mobile header.

### The mobile nav drawer

Full-height, slides in from the **right** to match the side the menu button
sits on. The base `.sidebar` rule pins `top`/`left`/`bottom` for the desktop
rail, so the mobile override has to reset **both** sides — `right: 0` alone
leaves it anchored left as well and stretches it across the screen. If you ever
want a content-height dropdown instead, `bottom: auto` is the property that
does it; `height: auto` alone will not.

### Debugging iOS layout

`ViewportProbe` renders an on-screen readout of live viewport geometry, keeping
the worst value seen for each metric so a screenshot taken afterwards still
carries the peak. It mounts **only** with `?debug=1`:

```
https://thewanderingbunny.com/?debug=1
```

Bump its `BUILD` constant on each debug deploy — a screenshot then proves which
build the phone loaded, ruling out Safari cache.

**Know its blind spot.** It reads `getBoundingClientRect()`, measured against
the *layout* viewport. A header correctly pinned inside a layout viewport that
is itself inset from the visible area reads exactly `0`. Its zeros are not
evidence that nothing is wrong — that is precisely what misled the first few
attempts at the seam. Correct layout numbers plus a visibly wrong screen means
look at painting, not layout.

---

## Portfolio layout

`PortfolioClient.tsx` builds its own masonry:

1. **Column count** — 3 at ≥1201px, otherwise 2. Mobile breakpoint is 760px.
2. **Greedy placement** — each photo to the shortest column, height estimated as
   `height / width + gapRatio`.
3. **Rebalancing** — up to `columnCount * 6` passes move a trailing photo from
   the tallest column to the shortest whenever that narrows the gap.
4. **`ATTACH_AFTER`** — pins frames 093/094 after 092/091 so the tail stays
   spread. Pinned frames are excluded from rebalancing.
5. **`MOBILE_SWAP_PAIRS`** — swaps 003↔004 and 083↔084, only in 2-column layout.

`computeLayoutMetrics()` duplicates the padding and gap values from
`globals.css`. **Change `.portfolio-page` padding or `.portfolio-columns` gap
and you must change them here too**, or the balancing estimate drifts.

Images are plain `<img>` with a `srcSet` from `buildPhotoSrcSet()`,
`sizes="(max-width: 640px) 46vw, (max-width: 1100px) 30vw, 22vw"`, and
`loading="eager"` for the first 6. `next/image` has a custom loader
(`src/lib/imageLoader.ts`) but nothing uses `next/image`.

**Lightbox** — click a frame → shutter flash (170ms delay / 540ms total) →
full-screen with EXIF. Closes on click or Escape. Strings are formatted by
`photoDisplay.ts`, which holds `LIGHTBOX_TITLES`, a hardcoded id→title map for
photos with no `title`; fallback is "Quiet Frame".

**Intro overlay** — `SiteShell` shows "Photographs shot on Fujifilm." for 1800ms
on first visit, fades over 1.1s, and sets a `sessionStorage` flag so it doesn't
replay. It defaults to visible so the prerendered first paint is covered.

---

## SEO and metadata

All of it is in `layout.tsx` as two constants (`SITE_TITLE`,
`SITE_DESCRIPTION`) feeding the document title, meta description, OpenGraph and
Twitter card — so they cannot drift apart.

- **Title template** — pages set a short `title` and get
  `"About · The Wandering Bunny"`. The home page uses `default`.
- **Description** — keep it around 150 characters. The old one was 38, and
  Google padded the snippet with the page's own title and wordmark to fill the
  space.
- **Canonical** — every page declares one. `/portfolio/` points at `/`.
- **`og:url`** is relative so it resolves per page against `metadataBase`. It
  was hardcoded to the root, which made `/about/` share as the home page.

`sitemap.ts` and `robots.ts` **both need `export const dynamic = "force-static"`**
or the build fails collecting the route under `output: "export"`. The sitemap
lists only `/` and `/about/` — listing the redirect would invite indexing the
page we want folded away. No `lastModified`: it resolves at build time, so every
deploy would claim the content changed when only the CSS had.

Search Console is already verified via `public/google887…html`. **Do not delete
that file** — verification breaks with it.

---

## Deployment

Push to `main` → `.github/workflows/deploy.yml` → `npm ci` → `npm run build` →
`upload-pages-artifact` from `./out` → GitHub Pages → **thewanderingbunny.com**.
About two minutes.

`out/` is gitignored; CI rebuilds it. A local `npm run build` is for checking
only — it is never what ships.

**Pushing to `main` deploys to the live public site. There is no staging.**
`git revert` + push is the rollback, also about two minutes.

```bash
npm install              # node_modules is not kept on disk between sessions
npm run dev              # :3000
npm run build            # static export to out/
npm start                # npx serve out — preview the built output
npm run backfill:photos  # one-off EXIF/metadata maintenance
```

**`dev` deliberately does not pass `--webpack`.** It used to, which meant dev
ran webpack while `next build` ran Turbopack. Once the data-loading page moved
to the root, webpack dev reported "Can't resolve 'fs'" for `src/lib/data.ts`
while the Turbopack build was perfectly clean. Keep them on the same bundler.

The site needs **no environment variables**. The only one the code reads is
`NEXT_PUBLIC_BASE_PATH` (in `imageLoader.ts`), and it is empty for a site served
from the root.

---

## Testing on a real iPhone

The LAN address (`http://<mac-ip>:3000`) has never worked reliably from the
phone here. What does work:

1. **Deploy and test on production.** Two minutes, and HTTPS matches real
   conditions better than a LAN dev server anyway.
2. **`?debug=1`** for the numbers, screenshot them back.

Chromium-based preview tools cannot reproduce Safari's toolbar transitions —
they will show a clean layout while the phone shows a seam. The iOS Simulator
reproduces this class of bug poorly too: desktop hardware, mouse-driven
scrolling, different compositor timing.

**When measuring animations in a headless/background browser pane, suppress the
transition and read the resting position.** A throttled tab often has not
started the animation yet, so a single sample returns a misleading mid-flight
value.

---

## Known cruft (deliberately left)

- **36 orphaned photo pairs** in `public/uploads/` (~37MB). Whole trips — Oslo,
  Stockholm, Taiwan, Thailand, some Random and Tokyo — culled from the gallery
  but still in the repo and still deployed. Deleting them will not shrink `.git`
  (history keeps them) but would cut 37MB from every deploy.
- **`tailwind.config.ts`** names fonts that are not loaded (see Styling).

---

## Conventions

- Comments explain **why**, especially where a value is load-bearing for an iOS
  workaround. Several of those comments are the only record of a bug that cost
  days — don't strip them as noise.
- Client components are marked `"use client"`; `data.ts` uses `fs` and must stay
  server-side.
- Interfaces live next to the code that owns them: `PhotoAsset` in
  `photoMedia.ts`, `Photo` extends it in `data.ts`, `DisplayPhoto` extends that
  in `photoDisplay.ts`.
- This file and `AGENTS.md` are identical copies. **Update both.**

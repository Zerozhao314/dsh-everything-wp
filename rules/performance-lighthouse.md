# Web Performance — Lighthouse High-Score Principles

**Apply to any `/todo` task that produces or changes front-end output**: templates
(`templates/*.html` or PHP templates), `wp_enqueue_*`, `<head>` output, fonts, images,
CSS/JS. `task-executor` loads this whenever the **Project Type Gate** marks the task as
touching front-end code.

**Core mental model — fix the metric that is actually failing.** TBT / CLS are often
already fine; the usual WordPress bottleneck is **FCP / LCP** caused by render-blocking
CSS and late web-fonts. Do not blanket-optimize — read the report, find the failing
metric, target it.

## 1. Kill render-blocking resources (biggest FCP/LCP win)

The single most common killer. In the reference case, Google Fonts CSS alone blocked
first paint by **12.2 s**.

- Nothing in `<head>` may block first paint unless it is truly critical.
- Load non-critical CSS **non-blocking**:
  ```php
  // ✅ media=print swap — CSS applies after load, does not block first paint.
  echo '<link rel="stylesheet" href="' . esc_url( $href ) . '" media="print" onload="this.media=\'all\'">';
  ```
  (or `rel="preload"` → `onload` swap to `rel="stylesheet"`).
- **Do not chain enqueue dependencies that force a blocking waterfall** — e.g. the main
  stylesheet declaring a font stylesheet in its `deps`. Decouple them so the font CSS
  never blocks the theme CSS.
- For the strongest fix — extract + inline the above-the-fold CSS and defer the rest —
  use the **`critical-css` skill** (`@everything-wp/skills/critical-css/SKILL.md`).

## 2. Web fonts — the #1 hidden WP killer

- `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com` (the latter `crossorigin`).
- `font-display: swap`.
- **Beware the non-blocking-font side effect on LCP**: making font CSS non-blocking fixes
  FCP, but the LCP text repaints late when the web-font finally arrives (shows up as LCP
  *Render Delay*). In the reference case this pushed LCP to 4.3 s.
- **Fix: `preload` the specific font the LCP element uses.** Self-host the small
  above-the-fold latin fonts (a single weight is ~30–40 KB) and preload them with a
  **stable local URL** — Google's hashed font-file URLs change and make hardcoded
  `preload` fragile.

## 3. Images

- Serve next-gen formats (WebP / AVIF) for content images.
- `loading="lazy"` below the fold — but **never lazy-load the LCP image**.
- Always set `width`/`height` (or `aspect-ratio`) to avoid CLS.

## 4. Third-party / JS

- `async` / `defer` all non-critical JS; consider delay-until-interaction for analytics
  (`gtag`) — typically the sole source of TBT.
- **Be honest about limits**: third-party scripts served from the vendor's own domain
  (Google's `gtag`, Google Fonts CSS) cannot be minified or fixed by us. Low CP value —
  do not burn time there.

---

Origin: distilled from `miffy` / justgirl.me Lighthouse tuning — FCP 13.8s→1.3s,
LCP 17.4s→~1.5s, render-blocking eliminated (2026-08).

# Changelog

## 1.1.1

### Patch Changes

- Replaced Overcast and Pocket Casts with Fountain and Hopp on the homepage subscribe band, added Fountain and Hopp pills above Overcast and Pocket Casts on the /subscribe/ page, and dropped the footer's Overcast line.

  Fork-side change, not for an upstream PR.

- Runs the fork as its own theme: the package name, the packaged zip and its single top-level directory (`pod-alles-okai/…`), the CI artifact, and the release title carry the fork name so Upload lands as a separate theme in the Ghost admin, next to upstream's `pod`.

  Fork-side change, not for an upstream PR.

## 1.1.0

### Minor Changes

- e57b76c: Pod now declares Ghost 6.5.3 as its minimum version. The podcast feed, footer and subscribe links use Ghost's `{{split}}` helper, and Ghost only accepts themes that use it from 6.5.3 on. Older versions reject the theme upload, so `engines.ghost` said `>=5.93.0` without it being true.

### Patch Changes

- 7c1addb: Fixed the podcast RSS feed emitting localized dates on non-English sites. Ghost's `date` helper defaults to the site locale, so German sites rendered `<pubDate>` as "Mo., 26 Okt. 2026 …" instead of the RFC 822 form "Mon, 26 Oct 2026 …", which breaks feed validation and podcatcher parsing. `lastBuildDate` and `pubDate` now pin `locale="en"` so the feed always emits RFC 822-compliant dates regardless of the site's language.
- 25c55bb: Pages no longer scroll sideways. The header menu now switches to the drawer below 1024px instead of 640px, so a full menu no longer pushes past the edge on tablets, and menu labels stay on one line. Long unbroken words in titles wrap, and wide tables scroll inside the column. Wide and full-width cards in episodes fill the article column next to the sidebar instead of sticking out past the right edge.
- 194b9fe: Accessibility fixes. Text in the accent colour (eyebrow labels, tag names, the current menu item, links and inline code) uses a darker shade of the accent in light mode, so it stays readable against the light background. Bookmark, file and product cards follow the color scheme instead of staying white in dark mode, and their faded metadata is readable. The paywall's sign-in link keeps Ghost's colours. The player's speed button announces its visible value ("1× playback speed"), and code blocks and tables that scroll sideways can be focused with the keyboard.
- 8dbb81d: Fixed the podcast RSS feed dropping show notes. The `content:encoded` whitelist only emitted `<p>` blocks and relied on `{{#unless @first}}` after a `split` — which Ghost 6.7 (empty-result filter in the split helper) turned into a first-paragraph drop, and which cut `<ul>`/`<ol>` list content entirely. Passes now select chunks by closer-matching and emit matched `<ul>…</ul>` / `<ol>…</ol>` pairs in document order, including a document that opens with a list. Every emission point rewrites `]]>` to `]]&gt;` so a literal terminator can't invalidate the feed's CDATA sections. Nested-list content outside the innermost matched pair is dropped (apps render nested lists badly anyway); mixed-type nesting lets the inner list's own pass emit its items exactly once; markdown cards with blank lines between items keep coming out as clean paragraphs.
- 0a2be04: The podcast RSS feed keeps lists written in a markdown card. Ghost puts a line break between the markdown card's `<ul>`/`<ol>` and its first `<li>`, so the feed dropped those lists from the show notes.

## 1.0.5

### Patch Changes

- 80c3f91: Subscribe surface cleanup:

  - **New `subscribe_apple_url` custom setting.** When set, Pod's Apple Podcasts button uses the publisher's Apple show URL (`podcasts.apple.com/…`) instead of the iOS-only `podcast://` URL scheme — one working button for listeners on every OS + browser. When unset, the pill falls back to `podcast://` so day-one installs still get an Apple pill that works for iOS listeners.
  - **Dropped `subscribe_iheart_url` + `subscribe_pandora_url`.** Both platforms are US-only and account for a small and shrinking share of podcast listeners; YouTube Music (which we keep) has overtaken Pandora in the US, and iHeart skews heavily toward its own owned-and-operated shows. Publishers who need those buttons can add them via a theme edit.
  - Custom-setting count goes from 20 to 19 (freeing one slot for future use).

- ea53182: Chapter titles in the episode sidebar are now rendered as text rather than markup. A title containing `<`, `&` or a quote used to be parsed as HTML — so `Q&A` could come out mangled, and a title crafted to open an HTML tag could get that tag built into the page, because the surrounding template supplied the `>` needed to close it. Chapter titles now display verbatim, whatever characters they contain.
- 2e9130c: Fixed unstyled sites when Pod is installed straight from GitHub rather than from a release zip. Ghost's install-from-GitHub flow unpacks the repository's tracked files, and Pod's compiled CSS and JS were excluded from Git as build output — so those installs served templates that requested `assets/built/styles.css` and `assets/built/main.js` and got 404s for both. The compiled assets are now committed, matching how Ghost's own Casper and Source themes ship, and a new CI check rebuilds them on every pull request so they can't fall behind their sources. Release-zip installs were never affected and don't change.
- 18144e4: The header and footer now show the publication logo (Settings → Design → Brand) when one is set, falling back to the waveform mark and site title otherwise. In the footer the site title sits next to the logo inside the home link, and the description renders below as before.
- feefb94: The "With" card on episode pages now lists every author on the post, not just the primary one. Before, an episode with a host and a guest showed both names in the byline under the title, but only the host in the sidebar card. Single-author episodes look the same as before.

## 1.0.4

### Patch Changes

- d0a9da4: Ship a full, upload-as-is `routes.yaml` instead of the previous "merge these two entries into whatever's already there" partial file. On a fresh Ghost site, publishers can now click a single link on the GitHub Release page, download `routes.yaml`, and upload it via **Settings → Labs → Upload routes.yaml** — one file, no merging. The file is Ghost's default `routes.yaml` (root collection + tag/author taxonomies) plus Pod's two `/podcast/rss/` and `/subscribe/` entries. Publishers with existing route customisations merge instead of overwrite; the getting-started doc calls that out. `routes.yaml` also ships alongside `pod.zip` as a separate release asset via `scripts/release.mjs` so it can be grabbed without unpacking the theme.

## 1.0.3

### Patch Changes

- 74a5918: Fix the auto-deploy trigger. The `on: release: published` trigger on `deploy.yml` didn't fire because GitHub's anti-loop rule silently drops that event when the release was created by `GITHUB_TOKEN` (which `scripts/release.mjs` does via `gh release create`). Switched to `on: workflow_run: workflows: [Release]`, which is officially blessed for this. The deploy job now guards on whether a `vX.Y.Z` tag matching `package.json`'s current version exists on origin — most Release runs are no-op replays and shouldn't trigger a redeploy. Also added `workflow_dispatch` for one-off manual kicks.

## 1.0.2

### Patch Changes

- 91e5691: Two release-plumbing fixes:

  - **Auto-deploy to the demo.** New `.github/workflows/deploy.yml` uses the official [`TryGhost/action-deploy-theme@v2`](https://github.com/TryGhost/action-deploy-theme) to upload + activate the theme on `pod.magicpages.co` whenever a stable release is published. Requires the `POD_GHOST_ADMIN_API_KEY` repository secret.
  - **Release notes now populate the GitHub Release body.** `scripts/release.mjs`'s CHANGELOG extract regex now matches both `## [1.0.0]` (Keep-a-Changelog, hand-written) and `## 1.0.1` (Changesets output), so `## 1.0.1`'s section lands in the Release body instead of the "See CHANGELOG.md for details" fallback.

## 1.0.1

### Patch Changes

- 8e2482c: Docs + positioning polish for the first release:

  - **README** — fresh demo screenshots (home hero, episode page, /subscribe/) from the live [pod.magicpages.co](https://pod.magicpages.co), plus a leading paragraph explaining the theme's actual differentiator: no separate podcast host needed — your Ghost site _is_ the host.
  - **AGENTS.md** — full contributor + agent guidance file at the repo root, adapted from the kalotyp pattern. Covers setup, tech stack, architecture, the Ghost integration contract, `pod:*` marker parsing, quality bar, release flow, Ghost trademark boundaries.
  - **Release workflow** — set `createGithubReleases: false` on `changesets/action` so it stops trying to re-create the Release that `scripts/release.mjs` has already created (previously threw `422 tag_name already_exists` after a successful publish).
  - **Accessibility** — verified WCAG 2.2 AA conformant via axe-core across 5 pages × 2 viewports × 2 color schemes (20 scans, 0 violations). Only automated-detection incompletes are the CSS-rendered cover-art tiles' contrast against gradient backgrounds, which axe can't measure but which manually clear 5.2:1 at the lightest stop.

All notable changes to Pod will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-06-24

First public release.

### Editorial audio home page

- Hero card with the latest episode: cover art, title, custom excerpt, audio
  player, "Read the full show notes" affordance.
- Full archive grid below, with tag chips (excluding internal tags) and
  paginated collection.
- Optional newsletter signup for non-members with Portal-powered submission,
  inline validation and success feedback.
- Optional Ghost recommendations block, gated on `@site.recommendations_enabled`.

### Episode page

- Sticky-column layout on wide viewports: cover + host + audio player on the
  left, show notes on the right.
- Podcast-native audio player (Pod player) with skip ±30s, playback speed
  toggle, waveform scrubber, keyboard-accessible seek.
- Client-rendered chapter list from `pod:chapter=HH:MM:SS|Title` markers in
  the post's code injection.
- End-of-episode "Keep Listening" CTA with the same dynamic subscribe pills
  as the homepage band; can be turned off via the `show_post_cta` custom
  setting.
- Prev / next episode navigation, powered by Ghost's `prev_post` /
  `next_post` helpers.
- Comments block honouring `@site.comments_enabled`.

### /subscribe/ landing page

- One-link-to-rule-them-all page hosted on the publisher's own domain.
- Full 11-15 platform grid, dynamic per publisher configuration:
  - **Always shown** (URL derived from the RSS feed): Apple Podcasts,
    Overcast, Pocket Casts, Castro, Podcast Addict, AntennaPod, Podverse,
    Player FM, gPodder, RSS.
  - **Apple Podcasts URL override** (optional): if the publisher pastes
    their `podcasts.apple.com/…` show URL into `subscribe_apple_url`, the
    Apple pill uses that instead of the iOS-only `podcast://` URL scheme
    — one working button for listeners on every OS + browser.
  - **Conditional** (renders only when publisher supplies the show URL via
    theme settings): Spotify, Amazon Music, YouTube Music, Castbox.
- Copy-RSS-URL card for power users, with clipboard integration.
- URL patterns validated against Nathan Gathright's podcast platform catalog
  and each platform's own documentation.

### Homepage subscribe band + episode CTA

- Top-5 pills (Apple, Spotify when configured, Overcast, Pocket Casts, RSS)
  plus a "More ways to subscribe →" link routing to /subscribe/.
- Same partial (`partials/subscribe-pills.hbs`) used by both surfaces to keep
  the two-tier system in lockstep.

### Podcast RSS feed

- Full iTunes-spec RSS 2.0 at `/podcast/rss/`.
- Channel-level: title, description, category, explicit flag, owner, author,
  copyright, cover artwork.
- Per-episode: audio enclosure (from `pod:audio=` marker or first `<audio>`
  in the post body) with byte length from `pod:audioLength=` marker
  (validators + download-progress UIs want the exact size — falls back to
  `length="0"` when the marker isn't set), duration, episode / season /
  type, explicit override.
- Podlove Simple Chapters (PSC) emitted from repeatable
  `pod:chapter=HH:MM:SS|Title` markers.
- `content:encoded` uses a strict `<p>`-block whitelist so Ghost card
  artefacts (audio player, bookmark cards, buttons, callouts, galleries)
  don't leak into show notes in Apple, Overcast and Pocket Casts.
- Per-episode iTunes:image at `size="xxl"` (2000px) — satisfies Apple's
  1400px minimum. Falls back cleanly when a post has no feature image.
- Theme ships a default cover at `assets/img/default-cover.jpg` (3000×3000,
  ~360 KB — Ghost's own `publication-cover.jpg` cropped square and
  re-compressed under Apple's 512 KB recommendation). Used as fallback for
  both channel-level `<itunes:image>` (when the site cover is still
  Ghost's default placeholder) and per-episode `<itunes:image>` (when a
  post has no `feature_image`). Every generated feed carries valid
  artwork out of the box.

### Podcasting 2.0 support

Full [podcastindex.org namespace](https://podcasting2.org) coverage, emitted
alongside the iTunes tags:

- **Channel-level** (from custom theme settings):
  - `<podcast:guid>` (publisher-provided UUIDv5), `<podcast:medium>podcast`
  - `<podcast:locked>` with owner email
  - `<podcast:funding url=... />` for donation/support links — falls back
    to Ghost's built-in tipjar (`{site_url}/#/portal/support`) when
    `@site.donations_enabled` is on and no explicit URL is set
  - `<podcast:value type="lightning">` + `<podcast:valueRecipient>` for
    Value 4 Value micro-payments (keysend by default)
- **Per-episode** (from `pod:*` markers in code-injection foot):
  - `<podcast:episode>` and `<podcast:season>` — emitted alongside their
    iTunes equivalents so both 2.0 and legacy clients get the values
  - `<podcast:chapters>` — pointer to a publisher-hosted `chapters.json`
    (`pod:chapters=URL`). Emitted alongside PSC so 2.0-aware apps prefer
    the JSON while legacy clients continue to use inline PSC.
  - `<podcast:transcript>` (repeatable) — VTT/SRT link with MIME + language
    (`pod:transcript=URL|text/vtt|en`). Rendered by Podverse, Fountain,
    CurioCaster and the Podcast Index website.
  - `<podcast:person>` (repeatable) — hosts, guests, credits with role,
    href and image URL (`pod:person=Name|Role|Href|Img`). Role defaults
    to `host`.
  - `<podcast:socialInteract>` — fediverse comment root for the episode
    (`pod:socialinteract=URL`; protocol defaults to `activitypub`).

### Theme system

- Light / dark / system color-scheme with a header toggle; default set via
  the `color_scheme_default` custom setting.
- Site accent driven from `@site.accent_color` — pill borders, links, focus
  outlines, subscribe-band accent all inherit from a single CSS custom
  property, so a Ghost admin change to the accent color re-skins the site.
- Two typography surfaces: Inter (sans, UI + display) and Source Serif Pro
  (serif, body copy), with JetBrains Mono for eyebrow labels. Self-hosted
  woff2 in `assets/built/`.
- Cover art fallback: gradient tile with waveform bars + episode number when
  a post has no feature image.

### Accessibility

- Skip-to-main-content link at the top of every page.
- `role="main"` on the primary content region, `aria-label` on the mobile
  menu and audio player controls.
- Audio scrubber is a proper `role="slider"` with `aria-valuemin` /
  `aria-valuenow` / `aria-valuemax`, and reachable by keyboard.
- Focus outlines use the theme accent for high-contrast visibility across
  both light and dark schemes.

### Internationalization

- Locale files for English, German, French, Spanish, Ukrainian and Italian.
- All user-facing UI strings routed through the `{{t}}` helper.

### Build & tooling

- Vite build (`npm run build` / `npm run dev`).
- Tailwind + PostCSS for styles.
- `npm run zip` produces a Ghost-ready release archive including the theme
  templates, built assets, source CSS/JS, locales, README, CHANGELOG,
  CONTRIBUTING, LICENSE, THIRD-PARTY-NOTICES and the SIL OFL font license.
- gscan-validated against Ghost 6.x.

### Third-party licensing

- Bundled fonts (Inter, Source Serif Pro, JetBrains Mono) are all under
  [SIL OFL 1.1](./licenses/OFL-1.1.txt). Per-font attribution recorded in
  [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).

[1.0.0]: https://github.com/magicpages/pod/releases/tag/v1.0.0

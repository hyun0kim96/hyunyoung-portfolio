# Portfolio website — project notes

## Video embeds (IMPORTANT)
For every Vimeo hero video, the container's `padding-top` % MUST equal the video's true file aspect ratio (height/width × 100), otherwise black bars appear.
- Look it up: `fetch('https://vimeo.com/api/oembed.json?url=https://vimeo.com/VIDEO_ID')` → `thumbnail_height / thumbnail_width * 100`.
- Use the exact % as `padding: <PCT>% 0 0 0` on the wrapper div.
- Known ratios: Petal Terrarium 1077150204 = 37.089% · Greenery Waterfall 1206205944 = 33.220% · Bloomy Sanctuary 1206115951 = 33.220%.
- Embed params: `?autoplay=1&loop=1&muted=1&controls=0&background=1&autopause=0`.

## Home / project list
- Home file: `home.dc.html` (root `index.html` redirects to it for Vercel). All home-button links point to `home.dc.html`.
- All page filenames are lowercase-hyphen (e.g. `blooming-cherry-blossom.dc.html`) for clean hosting URLs.
- Projects auto-sort by year (newest first; same year → alphabetical); numbers auto-assigned. Edit `projectList()` — order there doesn't matter; last 4-digit number in the title is the year.
- Per-project thumbnail via `thumb`; optional `zoom` (default 1.25); optional `gif` plays (fades in) after the pixelate settles.
- Point color removed from hover (text stays #111/#999).
- Tag legend: CM Commercial · MA Media Art · EX Exhibition · PW Personal Work.

## Type / fonts
- Base font Suisse Intl (local woff2). Home-button "HYUNYOUNG KIM" uses Roboto 500 (crisp) with per-letter pixelate glitch that swaps to Ballet; engine in `pixel-text.js`.
- Copyright fixed bottom-left, 8pt, transparent bg, z-index 9999, on every page.

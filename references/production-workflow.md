# Production Workflow

## Recommended Folder Shape

Create a task folder under `local-tests/` by default:

```text
local-tests/<slug>/
  index.html
  assets/
  output/        ← written by scripts/render.mjs
```

Use descriptive slugs:

- `local-tests/social-card-doubao-input`
- `local-tests/social-card-hiking-outfit`
- `local-tests/wechat-ai-card-skill-cover`

If the user explicitly names another output folder, use that folder instead. Do not create generated task folders or rendered assets in the skill root next to `SKILL.md`. Root-level folders such as `social-card-*`, `livephoto-*`, `wechat-*`, `output/`, and loose `.png` / `.jpg` / `.mov` / `.pvt` artifacts are not allowed for new work.

## HTML/CSS Rendering Pattern

Build one HTML file containing all frames:

```html
<main class="sheet">
  <section class="poster xhs" id="xhs-01">...</section>
  <section class="poster xhs" id="xhs-02">...</section>
  <section class="cover wechat wide" id="wechat-21x9">...</section>
  <section class="cover wechat square" id="wechat-1x1">...</section>
  <section class="wechat-pair-preview" id="wechat-pair-preview">
    <div class="preview-wide">...</div>
    <div class="preview-square">...</div>
  </section>
</main>
```

Each frame must have stable dimensions:

```css
.xhs {
  width: 1080px;
  height: 1440px;
}

.wechat.wide {
  width: 2100px;
  height: 900px;
}

.wechat.square {
  width: 1080px;
  height: 1080px;
}

.pair-preview {
  width: max-content;   /* 2100 + 1080 + gaps; the renderer widens its window to fit */
}
```

Use `box-sizing:border-box`, fixed safe margins, and `overflow:hidden`.

For WeChat covers:

- Compose `wechat-21x9` and `wechat-1x1` as separate source frames.
- Also include `wechat-pair-preview` in the same HTML so the pair can be inspected together.
- Export the two real deliverables separately.
- Export the pair preview only when helpful for review.
- The `1:1` cover should use a simplified title derived from the long title, not a crop or text squeeze from the `21:9` frame.

For electronic-magazine pages, place background canvases inside each `.poster` instead of relying only on CSS color:

```html
<section class="poster magazine hero" id="xhs-01">
  <canvas class="mag-bg" data-bg="ink-flow"></canvas>
  <div class="grain"></div>
  <div class="content">...</div>
</section>
```

The Editorial seed template already includes the ink-flow background (`<canvas class="mag-bg">`, see background-systems.md); nothing to copy.

## Rendering

Run the bundled renderer (install dependencies once with `npm install` in the skill root):

```bash
node <SKILL_ROOT>/scripts/render.mjs local-tests/<slug>
```

It embeds the fonts the page actually uses (subset, written into the HTML, so rendering is offline and repeatable), waits for fonts, the frozen background and Lucide icons, screenshots every `.poster` by id into `output/<id>.png` plus `wechat-cover-pair-preview.png`, and fails if any image is not the board size (1080×1440 / 1080×1080 / 2100×900). Options: `--only xhs-01,wechat-1x1`, `--out <dir>`, `--no-embed` (use online fonts).

If using WebGL or procedural canvas backgrounds:

- Wait at least 500-900ms before screenshots so the canvas has rendered.
- Use deterministic seeds or a fixed time when repeatability matters.
- On normal content pages, keep background opacity subtle.
- On cover, divider, pull-quote, and sparse pages, let the atmosphere show more strongly.

Example render logic:

```js
const targets = [
  ["#xhs-01", "xhs-01-cover.png"],
  ["#xhs-02", "xhs-02-point.png"],
  ["#wechat-21x9", "wechat-21x9-cover.png"],
  ["#wechat-1x1", "wechat-1x1-cover.png"],
  ["#wechat-pair-preview", "wechat-cover-pair-preview.png"],
];
```

If a local dev server is needed for assets or font loading, start it and tell the user the URL. If `file://` rendering works, no server is required.

## Verification Commands

Useful checks on macOS:

```bash
sips -g pixelWidth -g pixelHeight output/*.png
```

For visual inspection in Codex:

- Use image viewing tools for local PNGs.
- Show final PNGs inline with absolute paths.

## Screenshot Treatment

Programmatic framing is preferred for user-provided screenshots:

- Create a clean target-ratio frame.
- Add plain white, refined grey, or paper background. Do not add page-wide grid/dot backgrounds unless the user explicitly asks for a technical blueprint look.
- If the capture contains a floating window/card over unrelated UI, crop to the foreground subject before placing it.
- Place screenshot inside with safe padding.
- Preserve readable text.
- Do not redraw the screenshot unless the user asked for redesign.
- Do not add perspective, skew, rotation, or mockup tilt unless the user explicitly asks for a scene mockup.

For Swiss:

- Straight corners.
- No shadow by default.
- Hairline only if the screenshot edge disappears.

For editorial magazine:

- Small radius or subtle shadow is allowed, but avoid SaaS marketing-card styling.

## Generated Images

When generating missing visuals:

- Generate only the raw visual asset.
- Keep text out of generated images.
- Match the page role and style mode.
- Save generated assets into `assets/` and place them in the HTML.
- Generate only the pages that need it, usually 1-2 images for a set.

## Accessibility And Readability

- Use strong contrast for all text.
- Do not place long text over busy photos.
- If text must sit over photo, use a solid ink/paper block or a high-contrast strip, not a blur blob.
- Avoid negative letter spacing in Chinese body text.
- Use line-height that lets Chinese breathe: roughly 1.08-1.22 for big titles, 1.35-1.55 for body.

## Common Fixes

- Cover feels empty: enlarge title, enlarge image, or add a functional bottom strip.
- Screenshot too small: reduce side text, give screenshot 55%-70% of the canvas.
- Lower area empty: read `portrait-fill.md`; merge pages, add a full-height ledger, use a larger evidence image, add a marginal quote column, or switch to an atmospheric thesis page.
- Style feels generic: add issue metadata, better type hierarchy, a stronger evidence image, richer WebGL/ink atmosphere, or more intentional content dividers.
- Text overflows: shorten copy before shrinking type.

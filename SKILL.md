---
name: guizang-social-card-skill
description: Generate Guizang-style social card image sets and WeChat official account cover pairs from articles, scripts, screenshots, product notes, subtitles, or photos. Use when the user asks for 小红书图文, Rednote/Xiaohongshu images, social cards, carousel images, 3:4 covers, 微信公众号封面, WeChat 21:9 + 1:1 covers, Swiss Style, or magazine-style social images.
---

# Guizang Social Card Skill

Create polished social card packages for Xiaohongshu/Rednote, WeChat Official Account, article covers, and platform thumbnails.

This skill is self-contained. It borrows visual principles from the Guizang PPT style system, but it must not edit the original PPT skill, its templates, or its references. If the original PPT skill is available, you may read it for reference only. Put all generated work in the current project or in the user-requested output folder.

## What To Produce

Use this skill for:

- Social card / carousel image sets: cover plus content pages, especially Xiaohongshu/Rednote 3:4.
- WeChat Official Account cover pairs: one `21:9` main cover plus one `1:1` square cover, composed together in the same HTML for visual checking.
- Screenshot-heavy product posts, article covers, tutorial carousels, outdoor/lifestyle notes, AI/product update explainers.
- Social images that need Guizang-style Swiss or editorial magazine layouts.

Do not use this skill for:

- Full slide decks or horizontal PPT websites. Use the PPT skill for that.
- Long-form video generation. Use a video skill for that.
- Pure image editing with no layout or article extraction requirement.

### Rednote Category Capability (capability circle)

The 11 most-common Rednote (小红书) categories fall into three buckets. See `references/category-cookbook.md` for the recipe-by-recipe routing.

**Strong end-to-end** (text, structure, and image story all in scope):

- 旅行 (Travel), 职场 (Workplace), 推荐 (Recommended, after specifying a subtype).

**Strong on text & structure; image needs to come from the user or a sourced library:**

- 游戏 (Game), 影视 (Film/TV), 美食 食谱方向 (Food — recipes only), 彩妆 教程方向 (Makeup — tutorials only), 健身 (Fitness), 家居 (Home), 穿搭 精选方向 (Outfit — capsule/essay only).

**Outside scope — push back honestly rather than promise a result:**

- 美食 菜品大片摆盘 (food-photography showcase).
- 穿搭 日常 OOTD 全身 (daily OOTD body shots; we cannot generate or simulate).
- 情感 梦核 / 氛围感装饰风 (dreamcore / aesthetic-light styling — clashes with both Editorial and Swiss).
- Y2K / 千禧辣妹 / 哥特萝莉 / kawaii decorated aesthetics.
- Pure photography showcase posts where the image is the entire deliverable.

When a request falls in the third bucket, name what we cannot do at intake — do not silently retrofit a layout that misses the user's intent.

## Core Principle

Expression comes first. The goal is not to squeeze text into posters; it is to turn the source into a clear visual argument.

For each page, decide:

- What should the viewer understand in one glance?
- What evidence, screenshot, or image supports it?
- Which words must be large, and which can become captions or metadata?
- What can be removed because it belongs in the post body, not the image?

## Required References

Read these files as needed:

- `references/platform-specs.md` for exact ratios, output sizes, and naming.
- `references/style-system.md` for Guizang editorial and Swiss visual rules.
- `references/theme-presets.md` when choosing electronic-magazine palettes or Swiss accent palettes.
- `references/layout-recipes.md` when selecting carousel/social-card/WeChat page structures.
- `references/components.md` for the shared component spec: font stacks, type scale, minimum readable sizes, Chinese title length bands, Swiss card-fill mutual-exclusion rule, image-container ratio classes, spacing tokens, and Lucide icon rules.
- `references/background-systems.md` when building electronic-magazine WebGL/ink/paper backgrounds.
- `references/portrait-fill.md` when adapting layouts to 3:4 and avoiding under-filled vertical space.
- `references/content-planning.md` for cover hooks, page breakdown, and copy compression.
- `references/production-workflow.md` for HTML/CSS rendering and image handling.
- `references/image-overlay.md` whenever text sits on top of a photo: photo qualification, localized tint fallback, and face / subject avoidance via multimodal subject mapping.
- `references/screenshot-treatment.md` when the user supplies an app / web / code / dashboard screenshot — picks `.frame-shot` over `.frame-img`, sets corners/shadow/bg/inset, decides on `.device-browser` or `.device-phone` chrome.
- `references/map-component.md` when the content has spatial relationships (travel route, store locations, walking tour) — real routes default to Mapbox Static or OSM static tiles; schematic SVG is only for conceptual / illustrative maps. Pins are HTML overlays; never use live JS maps.
- `references/title-shortener.md` when the task is a WeChat 21:9+1:1 cover pair, or any cross-platform reuse — derives the 1:1 short title from the long one (5-step extraction, 4 patterns, anti-patterns, sizing on `.poster.square`).
- `references/category-cookbook.md` to route a user-named Rednote category (旅行 / 职场 / 游戏 / 影视 / 彩妆 / 美食 / 穿搭 / 家居 / 健身 / 情感 / 推荐) to applicable recipes and to confirm scope.
- `references/qa-checklist.md` before delivering final images.

## Workflow

### 1. Intake

Gather only the missing information that changes the output:

- Target platforms and ratios.
- Source text, subtitles, article, or title.
- **Rednote category** — if the user names one of the 11 common types (旅行 / 职场 / 游戏 / 影视 / 美食 / 彩妆 / 穿搭 / 家居 / 健身 / 情感 / 推荐), route via `references/category-cookbook.md` to find the right recipes and to confirm the request is inside the capability circle (see "Rednote Category Capability" above). If a request lands in the outside-scope bucket, surface that to the user **before** designing, do not silently retrofit.
- Supplied images/screenshots and where each should appear. **For News / Tutorial / Data / Review content, actively prompt for screenshots or photos** — they are the evidence layer. A poster with no real artifact tends to read as filler.
- **If the user supplies only text (no images at all), ask once before designing:**

  ```
  这篇我需要 1-2 张图。三种走法：
  A. 你自己有照片 / 截图，传给我（推荐——最不"AI 感"）
  B. 我去 Pexels / Unsplash / Flickr 帮你找
  C. 用 AI 生成
  ```

  Recommend A in one line — your own photo is what makes a poster not look AI-generated. Accept whatever the user picks (including "都行你看着办") and proceed. **Do not re-prompt later, do not keep nudging toward A across multiple turns.** This question is one-shot.
- Preferred style if specified: Swiss Style, magazine/editorial, tech, outdoor, etc.
- Hard constraints: title text, no image on 1:1 cover, must include a hardware photo, keep screenshot readable, and so on.

If the user has already supplied enough context, proceed with reasonable assumptions.

If the content involves current product releases, policies, prices, claims, or news, verify unstable facts with browsing and cite sources in the final response.

### 2. Extract The Story

Turn the source into a page plan before designing.

For Rednote:

- Page 1 is the cover hook.
- Pages 2-N each carry one idea only.
- Use 5-9 pages for most posts. Compress or combine pages when lower areas become empty.
- Keep the post body for nuance; images should carry hooks, comparisons, checklists, and sharp takeaways.

For WeChat:

- Always produce a paired system: `21:9` main cover and `1:1` square cover.
- Build both covers in the same HTML file and add a combined preview section so their visual relationship can be checked together.
- `21:9` keeps the full or near-full title, subtitle, and one strong visual relation.
- `1:1` uses a simplified short title derived from the long title: big centered type, no image by default, no cramped subtitles.

### 3. Choose Style Mode

Pick one mode per package. **The two systems are not bound to specific content types** — what changes is the visual stance, not which topic you can talk about. A workplace essay can be Editorial; a travel ledger can be Swiss. Pick by the feeling you want, not by category lookup.

**Editorial Magazine x E-ink** brings:

- Serif/Songti display + quiet sans body, paper + ink palette.
- Atmosphere layer (paper grain / ink wash / WebGL canvas) over a warm paper base.
- Ledger rows, marginalia, pull quotes, large photo wells — magazine-feature feel.
- Best when you want the page to feel slow, considered, hand-set.

**Swiss International** brings:

- Inter / Helvetica feel, very light display at large sizes, mono labels at small.
- Strict left-aligned grid, hairline rules, one high-saturation accent.
- Card-fill matrices, KPI towers, h-bar charts, numbered statements — system / data feel.
- Best when you want the page to feel engineered, quantified, decisive.

If both feel viable for a piece of content, the question becomes editorial intent: "is this a feature story or a release note?" That decides the mode, not the topic itself.

Do not mix the two visual systems inside the same image set unless the user explicitly asks for a hybrid.

Then pick one theme:

- Editorial Magazine x E-ink uses one of 6 magazine palettes: Ink Classic, Indigo Porcelain, Forest Ink, Kraft Paper, Dune, or Midnight Ink (the only dark variant; reserved for game key art / night photography / cinematic covers).
- Swiss International uses one of 4 accent palettes: IKB Blue, Lemon Yellow, Lemon Green, or Safety Orange.

Read `references/theme-presets.md` for exact CSS tokens. Do not invent arbitrary colors unless the user has a strict brand requirement.

### 4. Plan Pages

Create a concise internal plan:

```text
Page 01 / cover / hook / image source / layout intent
Page 02 / point / key copy / visual evidence / layout intent
...
```

When the user asks for approval, show this plan before rendering. Otherwise use it internally and proceed.

Use `references/layout-recipes.md` to choose page structures. Avoid making every page a repeated title-plus-card layout.

For 3:4 images, check `references/portrait-fill.md` before coding. A short table or ledger must be expanded into a full portrait composition with a quote column, image evidence, marginalia, larger rows, or a background hero zone.

### 4.5. Copy The Seed Template

Do not write HTML from scratch. Pick one seed template based on the style mode chosen in Step 3:

- Editorial Magazine × E-ink → copy `assets/template-editorial-card.html` into the task folder as `index.html`.
- Swiss International → copy `assets/template-swiss-card.html` into the task folder as `index.html`.

The seed already wires up: font loading, theme tokens, all three poster sizes (`.poster.xhs` / `.poster.square` / `.poster.wide`), the pair-preview frame, grain/background layers, and all class definitions referenced by the layout recipes.

Set the theme/accent on the `<html>` element:

- Editorial: `<html data-theme="ink-classic | indigo-porcelain | forest-ink | kraft-paper | dune | midnight-ink">`.
- Swiss: `<html data-accent="ikb | lemon-yellow | lemon-green | safety-orange">`.

Replace the single placeholder poster after `<!-- POSTERS_HERE -->` with one `<section class="poster ...">` block per page, each carrying the HTML skeleton from a chosen Layout Recipe (M01-M16 for Editorial, S01-S12 for Swiss). Never load the wrong template's class system: Editorial recipes assume serif display + ledger/marginalia/pipeline-v; Swiss recipes assume Inter + card-fills + matrix/h-bar/kpi-tower. Mixing them silently breaks the layout.

### 5. Build And Render

Default implementation pattern:

- Create a task folder in the current workspace, for example `social-card-<slug>/`.
- Put source images in `assets/`.
- Start from the seed template copied in Step 4.5, not a blank file. Prefer changing only the `<!-- POSTERS_HERE -->` region page-to-page. If a task needs custom layout CSS, add one clearly named task-scoped block in the copied file and keep semantic defaults reset (`figure { margin:0; }`, no browser-default spacing surprises).
- Use Playwright or a browser screenshot tool to export each `.poster` or `.cover` node.
- Save rendered images in `output/`.
- Verify dimensions and inspect the rendered PNGs.
- Keep `node validate-social-deck.mjs <task-dir>` available for auto-check passes. It checks overflow (R1), footer collision (R2), Swiss bold display (R3), minimum font size (R4), 4-band density (R5), `.h-xl` line caps (R6), and browser-default figure margin drift (R7). Exit code 1 on any FAIL — fix before final delivery when auto-check is requested. WARN is advisory but read it.

Do not place visible instructions, keyboard shortcuts, or usage explanations inside the images.

For Editorial Magazine x E-ink, use a layered background system. Prefer a subtle WebGL ink-flow canvas or a frozen procedural canvas plus paper grain. Read `references/background-systems.md`; do not rely on a flat beige background, and do not add page-wide grid/dot backgrounds.

### 6. Image And Screenshot Handling

When the user provides screenshots:

- Preserve screenshot content unless the user asks for redesign.
- Prefer programmatic framing: target-ratio canvas, safe padding, clean background, readable screenshot.
- Do not stretch screenshots.
- If screenshot clarity matters, enlarge the screenshot area and reduce nearby text.

#### Text-On-Image Composition

Whenever a poster places text on top of a photo (full-bleed cover, large image well, generated-image overlay), follow `references/image-overlay.md`:

- **Text color inverts against the media (Rule 0).** Add the `.on-media` class to the content block sitting over the photo. Type roles hard-code `color: var(--ink)`, which beats a parent `color:#fff` on specificity — so a wrapper color alone leaves the title rendering black on a dark photo. `.on-media` re-asserts light text (Editorial → paper-cream `#f5f1e8`, Swiss → `#fff`) plus a soft shadow. This is the cheapest, most-forgotten fix; do it first.
- **Selection first, tint only if needed.** A photo covering ≥60% of the canvas must first pass the quiet-zone and light tests in `image-overlay.md`. Compose without a mask first; if the thumbnail check fails, add only a localized, image-toned tint around the title area. Do not default to full-canvas falloffs.
- **Subject mapping is mandatory.** Before placing the title, read the image with the Read tool, describe in plain language where the subject's face/focal feature sits, and record the subject map as an HTML comment next to the hero block. Place text only in the documented safe zones.
- **Crop discipline — set `object-position` inline on every photo.** The template default (`center 50%`) is a fallback, not a recommendation. For every `<img>`, decide based on subject location and write it inline: e.g. `style="object-position:center 62%"` for mid-body subjects, `center 30%` for sky-heavy landscapes with horizon-line subjects, `center 70%` for foreground gear. See the table in `references/components.md` for ranges and `image-overlay.md` for face-photo specifics. Skipping this silently crops subjects out of frame on tall ratios (`r-3x4`, `r-21x9`).
- **Thumbnail test.** Downscale the rendered PNG to 360 px wide and confirm the title is still legible. If the title fights the photo, move the title, swap the photo, or add a localized image-toned tint; if the photo looks dead, the tint is too heavy or the photo was wrong for text-on-image.

Editorial dark covers (e.g. game journals on key art) and Swiss covers with hero photos both require these checks. Skipping them is a known failure mode (see `style-system.md` Anti-Pattern D).

When the user has no images:

- This branch only runs if the Step 1 "三选一" gate landed on B (web-sourced) or C (AI-generated). Never silently fall into B or C — the user picked one.
- For C (AI-generated): use generated bitmaps only where they add real value, usually 1-2 pages. Generate images that match the page's visual role, not generic decoration. Keep generated images free of embedded titles, page numbers, logos, or fake UI labels unless explicitly needed.
- For B (web-sourced): see the Web-Sourced Images section below.

#### Web-Sourced Images (fallback when user has none)

When the user has no screenshots/photos and a generated bitmap would not fit the page's role (e.g. Editorial atmosphere shot, outdoor / lifestyle backdrop, game cover art, real-world product shot), fetch from the web instead of leaving the page thin.

Policy: **grab first, disclose after, let the user decide on attribution.** Do not pre-filter sources by guessed license — the user is the rights holder of the final composition and decides what is acceptable.

Recommended sources, in order of preference. **All five below are free-tier libraries with no required licensing fees**; we do not pull from paid stock sites (视觉中国 / Getty / 站酷海洛 etc.).

1. **Unsplash** — `https://unsplash.com/s/photos/<keyword>`. Strong for outdoor / lifestyle / atmospheric backdrops. English keywords work best. License is permissive but verify case by case.
2. **Pexels** — `https://www.pexels.com/search/<keyword>/` or `https://www.pexels.com/zh-cn/search/<keyword>/`. **Supports Chinese keyword search natively** — fills Unsplash's gap on 国内场景 (中文街景 / 国风物件 / 本地地名). Use this first when the subject is China-specific or the keyword is Chinese. Free under Pexels License.
3. **Flickr CC-licensed pool** — `https://www.flickr.com/search/?text=<keyword>&license=2%2C3%2C4%2C5%2C6%2C9`. The license filter (`license=2,3,4,5,6,9`) restricts to Creative Commons photos. Fills the "documentary realness" gap: street photography, people-in-context, real interiors, non-styled scenes that Unsplash/Pexels lack. Always preserve CC attribution if the user opts in.
4. **Wallhaven** — `https://wallhaven.cc/search?q=<keyword>`. Strong for game / anime / wallpaper themes. Content is user-uploaded, rights are unverified.
5. **Direct web search** — when a specific subject is needed (a product render, a game still, a historical photo). Use WebFetch / WebSearch to find a candidate URL.

Editorial-mode picking order: **Pexels (if keyword is Chinese / China-specific) → Unsplash → Flickr CC (if you need real-life feel) → direct search**. Swiss mode rarely needs any of these — product renders, UI screenshots, and keyshot-style images should be user-supplied or AI-generated, not stock.

How to fetch:

- Use WebFetch or `curl` to download the image into the task folder's `assets/` directory.
- Name the file by purpose, not by hash: `assets/hero-mountain.jpg`, `assets/ui-pulse-card.png`.
- Record the source URL in a `assets/SOURCES.md` file next to the images (one line per file: `hero-mountain.jpg ← <url>`). Always do this even if the user declines attribution in the final image — it preserves provenance for the human author.

After fetching, surface the provenance to the user **before** finalizing the design:

```
我从 <site> 取了这些图：
- assets/hero-mountain.jpg — <url>
- assets/ui-pulse-card.png — <url>

⚠️ 版权未经核实。请你判断是否可用。
是否需要在图文中标注来源？
- 要：我把 "Photo · <site> · @<author>" 加到对应页脚 / 角标。
- 不要：原样使用,不加注释。
```

If the user picks "标注" — add a small `mono` caption (Swiss: `.t-meta` 18-20px in corner; Editorial: `.label` next to the image well). Never crowd the caption into the layout's focal area.

If the user picks "不标注" — proceed silently. The provenance still lives in `assets/SOURCES.md` for the user's own records.

If an image is only one element among many in a composite (e.g. one of nine photos in a matrix), the user may reasonably skip attribution. Do not force a credit label that breaks the layout.

### 7. Deliver

**Show user first, validate on request.** Auto-running the validator after every render takes too long and delays the user from seeing results. Default flow:

1. After rendering completes, immediately show the user the rendered images inline (absolute paths) with a one-sentence summary of what was built.
2. Ask one question: **"先你自己看，还是我先自动核查一遍？"** (Do you want to review first, or should I run the auto-check?)
3. If the user says "我自己看" / "先给我" / "no need" — stop here, let them inspect, and respond to whatever they raise.
4. If the user says "你查吧" / "auto-check" / "yes" — only then run `node validate-social-deck.mjs <task-dir>`, fix any FAIL, and re-render before final delivery. Mention density/cap WARNs.

Never silently run the validator before showing the user — it costs minutes per pass and the user often spots issues faster.

Final response (after the user has reviewed or asked for auto-check) should include:

- Output folder path.
- Rendered images shown inline with absolute paths when useful.
- A short note on dimensions and verification (or "not yet validated, awaiting your review").
- For any image fetched from the web: source URL + site + the attribution decision the user made.
- Any unresolved risks, such as source images being low resolution.

## Non-Negotiables

- Never edit the original Guizang PPT skill or any upstream skill copied from elsewhere.
- Do not create random decorative SVG ovals, blobs, rain drops, stickers, or meaningless circles.
- Do not use nested cards or generic SaaS card layouts as the default.
- Do not let text overflow, touch the edge, or collide with the footer band. Pin `.foot` with `margin-top: auto` inside a flex column, never with `position: absolute` over growing content.
- Do not let text become too small to read on mobile.
- Do not write inline `font-size` + `font-weight` on display titles in Swiss. Use the typed classes (`.h-hero` / `.h-statement` / `.h-xl` / `.num-mega`). A 80-120px headline at weight 700-900 is not Swiss; "the larger, the lighter" is a hard rule.
- Do not deliver Editorial posters with a flat paper background, mono labels on every row, and no atmosphere layer. Run the Editorial Identity Test in `references/style-system.md` — a serif title alone does not make a poster Editorial.
- Do not fake data, release details, or percentages.
- Do not crop faces, key UI text, or hardware/product details unless the user explicitly accepts it.
- Do not reuse a 21:9 cover by blindly cropping it into 1:1. Compose each ratio separately.
- **3:4 卡必须吃满画布**。Content (text + image + data) 必须覆盖 ≥75% 画布高度。任何 >15% 画布高度的纯空白带都需要"留白理由"：(a) hero image 自带呼吸、(b) 单句宣言式 hero statement、(c) 段落顶/底 leading & trailing whitespace（前后总和 ≤15%）。**禁止用 `<div style="flex: 1"></div>` 上下夹击把内容塞到中段**——杂志页留白逻辑不适用于社交卡（杂志靠对开页吸收留白，社交卡逐张独立刷，欠填看着像 PPT 漏排）。Recipe-by-recipe 最小密度见 `references/layout-recipes.md` 每条 recipe 的「Minimum density」段。Render 后必须跑 `qa-checklist.md` 的 4 横带密度检查。

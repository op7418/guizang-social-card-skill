# Handoff — guizang-social-card-skill

最后更新：2026-07-01 · 版本：v0.15（Live Photo 生产规则：3s/5s 平台限制、拼图版式、长视频处理、发布提醒、可见文案与不自造规则）

这份文档只记录**事实**：当前 skill 由哪些文件组成、每个文件管什么、本轮更新改了什么、怎么验证它还能跑。想读"为什么这样做"或"未来要怎么走"，去看 `PRODUCT.md`。

> **v0.13 路径约定**：本文件 v0.12 及更早版本历史段落里的 `demo-*` / `social-card-*` / `smoke-*` / `test-*` 目录已统一搬入 `local-tests/`。读历史时请在脑中前缀 `local-tests/`。

---

## 1. 目录结构（事实版）

```
guizang-social-card-skill/
├── SKILL.md                   # 7 步工作流入口
├── HANDOFF.md                 # 本文件
├── PRODUCT.md                 # 产品思考
├── assets/
│   ├── template-editorial-card.html   # 杂志风种子
│   ├── template-swiss-card.html       # 瑞士风种子
│   ├── magazine-bg-webgl.js           # WebGL 墨流背景
│   └── screenshot-backgrounds/        # 9 张 WebP 截图舞台底（v0.14 从 PPT skill port）
│       ├── style-a/                   #   5 张 Editorial（dune / forest-ink / indigo-porcelain / kraft-paper / monocle-classic）
│       └── style-b/                   #   4 张 Swiss（ikb-dot / lemon-green-dot / lemon-grid / safety-orange）
├── references/                # 子规范，按需读取
│   ├── platform-specs.md      平台 × 分辨率 × 命名
│   ├── style-system.md        两种风格的硬规则与反模式
│   ├── theme-presets.md       6 套杂志 palette（含 Midnight Ink）+ 4 套 Swiss accent
│   ├── layout-recipes.md      版式骨架（M01-M16 + S01-S12 + WeChat）
│   ├── components.md          字体 / 卡片 / 间距 / 图标 / 标题字数表
│   ├── background-systems.md  墨流 / 网格 / 纸纹层
│   ├── portrait-fill.md       3:4 板的留白对策
│   ├── content-planning.md    钩子 / 拆页 / 文案压缩
│   ├── production-workflow.md 渲染管线与命令
│   ├── image-overlay.md       文字压图：选图 / 局部 tint / 主体映射
│   ├── screenshot-treatment.md 截图处理
│   ├── map-component.md       Mapbox / OSM / schematic 地图
│   ├── title-shortener.md     公众号 1:1 短标题
│   ├── category-cookbook.md   小红书 11 个品类的版式路由
│   ├── live-photo-production.md Live Photo 生产、拼图、长视频与发布规范
│   └── qa-checklist.md        交付前 checklist
├── agents/
│   └── openai.yaml            # 子代理配置（备用）
├── scripts/
│   ├── check-skill-docs.mjs       # Skill 文档约束测试
│   ├── make-video-contact-sheet.py # Live Photo 视频抽帧 contact sheet
│   ├── package-live-photo.py      # JPG+MOV 打包为 .pvt 的入口
│   └── *.swift                    # Apple Live Photo metadata helper
├── validate-social-deck.mjs   # R1-R9 渲染后校验器
├── package.json / package-lock.json / node_modules   # 仅 playwright
├── .gitignore                 # v0.13 新增
└── local-tests/               # 本地测试与素材（git 忽略，不随 skill 分发）
    ├── demo-*                 # 各次设计案例（kyoto / yading / wukong / kit-* / zzz-* / m16-camping / eyeliner / showcase / smoke-editorial-travel / map-component / screenshot-treatment / multi-platform）
    ├── social-card-*          # 历史与 Codex 外部测试产物（含 codex-remote-* / wukong-breakout / kyoto-guide / moon-eyes-lip-mud）
    ├── smoke-ai-tools/        # v0.6 冒烟测试样例
    ├── test-dark-theme-elden-ring/  # v0.12 Midnight Ink 验证
    ├── Image/                 # 用户上传的测试图
    ├── 全图封面参考/           # v0.10 杂志封面参考图
    ├── .codepilot-uploads/    # 历史上传缓存
    └── *.cjs                  # 旧的 debug / probe / render 脚本
```

v0.13 起：git 仓库。`local-tests/` 整目录在 `.gitignore` 中，commit 只跟踪 skill 内容。

---

## 2. 数据规模与覆盖面

| 维度 | 数量 |
| --- | --- |
| 工作流步骤 | 7 步（Intake → Extract → Style → Plan → Seed → Build → Image → Deliver） |
| 风格模式 | 2 个（Editorial Magazine × E-ink / Swiss International） |
| 主题色 | Editorial 6 套（5 浅 + 1 暗 Midnight Ink）+ Swiss 4 套 = 10 套 |
| 版式骨架 | Editorial 16 个（M01-M16）+ Swiss 12 个（S01-S12）= 28 个 |
| 平台 × 比例 | 小红书 3:4 / 1:1，微信 21:9 + 1:1 配对，方封面 1:1 |
| 小红书品类覆盖 | 11 个品类中 7 个完整支持，4 个需用户提供素材，4 个明确不接 |
| 种子模板 | 2 份（Editorial / Swiss），单文件即含全部 class 与字体 |
| 已交付案例 | 7 个 demo（2 个 image-cover + 5 个 kit） |
| Live Photo 支持 | 小红书 `5s` / 微信公众号 `3s`；单视频、二宫格、三宫格、四宫格、三连拼图、长视频低成本诊断 |

---

## 3. 版本历史

仅记录"什么时候新增/变更了哪些可见资产"，不记录文风调整。

### v0.16 · 2026-10-30（本轮）

主题：**接入 guizang-design 共享设计系统**。PPT、卡片、网页三个 skill 共用一套主题、字号、字体和背景特效，卡片这次先接入。视觉回归用迁移前后同一组卡片逐张比对，再由 agent 用新 skill 实做两套测试卡片验证。

**新增**
- `scripts/render.mjs`：一条命令出图。按页面实际用字把字体子集化内置、等背景定格和图标就绪、按画板尺寸截图并核对尺寸，取代每次现写的 `render.cjs`。需要先在 skill 目录 `npm install`。
- `scripts/gz-theme.mjs`：受约束的品牌主题生成。用户给品牌色或 logo 主色时用它，不再拒绝品牌色，也不允许直接用原色。
- `scripts/gz-fonts.mjs`：字体子集化内置；`add` 子命令登记本机商业字体，出图时内置、不上传。
- `references/gz-components.md`：三个 skill 共用的组件写法。

**修改**
- 两份种子模板的主题、字号、字体、背景特效换成设计系统生成的 `GZ:*` 区块，主题改由 `<html data-theme>` 切换（Swiss 旧的 `data-accent` 仍有效）。
- Editorial 背景改用共享 inkflow：原版 WebGL 没有预乘 alpha，纸色被冲成接近纯白，现在恢复米色纸张和墨流晕染。
- 强调色小字统一用对比度达标的 `--accent-ink`，大字用 `--accent-display`；柠檬黄等浅色主题的强调文字不再看不清。
- 中文不用斜体：pullquote / callout 去掉 italic。
- `validate-social-deck.mjs`：字号下限与设计系统一致；风格优先按 `data-family` 判断（修好 Swiss 被误判成 Editorial）；配对预览里的副本不重复校验。
- 公众号配对预览按实际宽度排版，不再被裁。

### v0.15 · 2026-07-01

主题：**Live Photo 从一次测试能力收口成 Skill 规则**。本轮把两天聊天里关于平台限制、拼图版式、长视频处理、品类判断、发布路径和执行失误的结论写回文档，并补上文档测试。

**新增**
- `references/live-photo-production.md`：Live Photo 生产规范。覆盖 `.pvt` 打包、AirDrop/iPhone 测试、小红书 `5s`、微信公众号 `3s`、信息量判断、三连拼图、material-first 拼图、长视频低成本诊断、contact sheet、平台发布提醒和常见故障。
- `scripts/check-skill-docs.mjs`：文档约束测试。当前卡住根目录产物、Live Photo 拼图能力、M16 图片压字规则、可见文案规则、非模板装饰禁令、平台发布提醒、产品复盘和交接记录。
- `scripts/make-video-contact-sheet.py`：把视频按少量时间点抽成 contact sheet，用于长视频或 Live Photo 视觉检查，避免默认密集抽帧。
- `scripts/package-live-photo.py` 及 Swift helper：把 JPG + MOV 写入 Apple Live Photo metadata 并打包成 `.pvt`，用于 iPhone/AirDrop 测试。

**修改**
- `SKILL.md` 增加 Live Photo 支持范围：短 motion card、三连 Live Photo、material-first 单视频/二宫格/三宫格/四宫格拼图、长视频 intake。明确用户提供视频是正常路径，网页素材只用于 demo / promo / 测试。
- `SKILL.md` 加硬规则：生成产物必须在任务文件夹，默认 `local-tests/<slug>/`；禁止把结果放在 Skill 根目录。
- `SKILL.md` 加可见文案规则：卡面文案必须描述用户真实场景，不能把 `3s`、`5s`、`Live Photo`、`三连拼图`、`信息量`、`长视频处理`、`倍速`、`高光检测` 等内部制作词写成标题或正文。
- `SKILL.md` 加 material-first 规则：单视频加字必须走 M16 / image-overlay 的图片压字逻辑；如果只有一个标题，就用断行、字号、字重、字距、对齐和位置做排版，不发明 kicker、meta、hairline、线条、刻度、徽章、字幕或说明文字。
- `references/category-cookbook.md` 加 Live Photo Scene Library。它不是固定模板清单，而是判断素材在 `3s` / `5s` 内能承载多少信息，以及适合单视频、三连、拼图、修剪还是不做 Live Photo。
- `references/platform-specs.md` 加小红书 / 微信公众号 Live Photo 平台说明：小红书 `5s`，微信文章内 `3s`，发布路径以手机端为准。
- `PRODUCT.md` 加 `Live Photo 复盘（2026-07-01）`，记录这次需求、产品判断、执行问题和验收标准。

**本轮测试素材与输出**
- 用户素材目录：`local-tests/live-photo-best-suite/视频素材/`
- 统一测试目录：`local-tests/live-photo-best-suite/puzzle-layouts/`
- 四个测试视频输出：
  - `IMG_XHS_PUZZLE_SINGLE_TEXT_5S_LIVE.MOV`
  - `IMG_XHS_PUZZLE_TWO_STACK_5S_LIVE.MOV`
  - `IMG_XHS_PUZZLE_THREE_STACK_5S_LIVE.MOV`
  - `IMG_XHS_PUZZLE_FOUR_GRID_5S_LIVE.MOV`
- 规格：全部 `1080x1440` / `5s` / `24fps` / `120 frames`。本地测试目录被 `.gitignore` 忽略，不随 Skill 分发。

**线程里暴露的问题，已转成规则**
- 不要把制作要求当成观众可见内容。之前错误例子包括把"三连拼图"、"5 秒看完完整幅度"、"别硬塞"写到画面上。
- 不要自造主题、背景色、线条、刻度字或装饰组件。没有在 `theme-presets.md` / `layout-recipes.md` / `image-overlay.md` 出现，就不能为了"显得设计过"而加。
- 不要为了通过密度警告给 material-first 拼图加字。二宫格、三宫格、四宫格可以无字；单视频也只能加用户场景需要的短标题。
- 长视频不要默认做精准高光检测。只能先做稀疏抽帧和候选段诊断，再让用户选择修剪、倍速、拆成三连或指定时间段。
- 网页下载视频不是用户工作流。那只服务我们自己的测试和宣传案例。

### v0.14 · 2026-05-28（本轮）

主题：**截图美化素材从 PPT skill 迁移**。v0.11 当时只 port 了规则文档（`references/screenshot-treatment.md` 154 行）和工具类（`.frame-shot.*` + `.device-browser` / `.device-phone`），但 PPT skill 的真实材质 WebP 背景**整目录没拷过来**，导致 `.bg-paper / bg-grid / bg-dot` 这些舞台底全是纯 CSS 实色，截图密度高的卡片视觉偏薄。本轮把素材补齐。

**改动事实**：
- 新增 `assets/screenshot-backgrounds/`，整目录 1.8 MB / 9 张 WebP：
  - `style-a/` 5 张 Editorial：`dune.webp` / `forest-ink.webp` / `indigo-porcelain.webp` / `kraft-paper.webp` / `monocle-classic.webp`
  - `style-b/` 4 张 Swiss：`ikb-dot-gradient.webp` / `lemon-green-dot-shadow.webp` / `lemon-grid.webp` / `safety-orange-halftone.webp`
- `assets/template-editorial-card.html` 加 5 条 `.frame-shot.bg-asset-*` 规则，指向 `style-a/` 五张图（带 fallback 实色防止素材未加载时透明）
- `assets/template-swiss-card.html` 加 4 条 `.frame-shot.bg-asset-*` 规则，指向 `style-b/` 四张图
- `references/screenshot-treatment.md` 加 "Solid `bg-*` vs asset `bg-asset-*`" 小节：两张对照表 + 4 条 rules of thumb（不混 accent / 不叠 `shadow-ed` / 一致使用 / 高比例板不用）+ 路径说明
- 同文件 Style cheat-sheet 加两条 recipe：Editorial hero with real texture / Swiss hero with brand-aligned stage
- `HANDOFF.md` 目录结构段加 `screenshot-backgrounds/` 子目录视图

**重要约定**：
- 素材路径用相对 URL `../assets/screenshot-backgrounds/style-{a|b}/{name}.webp`，假设 deck 的 `index.html` 在 `local-tests/<task>/` 下（比 `assets/` 低一层）。放别处需要在 deck 里本地 override 路径
- Swiss 资产**强 accent 绑定**：`bg-asset-ikb-dot` 只能在 `data-accent="ikb"` 的 deck 用，不允许混色
- 不要在 asset 背景上叠 `shadow-ed`——`1px` 描边会和材质冲突，读起来像 SaaS 框
- `r-3x4` / `r-1x1` 高比例板仍优先用 solid `bg-*`，asset 材质在过裁切时会变怪
- 这是**素材迁移**，不是规则迁移：PPT skill 原版 `screenshot-framing.md` 的 7 参数语义系统未引入（本 skill 走 CSS 工具类路线，决策更轻）

### v0.13 · 2026-05-27（上一轮）

主题：**git 初始化 + 仓库瘦身**。把所有本地测试 / demo / 上传图 / 旧脚本统一搬到 `local-tests/`，写 `.gitignore` 忽略整个测试目录与 `node_modules/`。skill 本身只保留：`SKILL.md` / `HANDOFF.md` / `PRODUCT.md` / `assets/` / `references/` / `agents/` / `validate-social-deck.mjs` / `package.json` 与锁文件。

**改动事实**：
- 新建 `local-tests/`，搬入 28 个测试目录（demo-* 16 个 / social-card-* 6 个 / smoke-* 1 个 / test-* 1 个 / Image / 全图封面参考 / .codepilot-uploads）以及 3 个旧脚本（`render.cjs` / `debug-bg.cjs` / `probe-webgl.cjs`）
- 新增 `.gitignore`：忽略 `local-tests/` / `node_modules/` / `.DS_Store` / `*.log` / `.vscode/` / `.idea/`
- `HANDOFF.md` 目录结构段同步更新，列入 `local-tests/` 子目录视图
- skill 自身文件结构未变，模板与规则文档一律未改

**重要约定**：`local-tests/` 不进 git，不分发，不放入 skill 包。`demo-showcase/editorial.html` 和 `demo-showcase/swiss.html` 仍然是字号/字距/版式还原的 source-of-truth——它们移到了 `local-tests/demo-showcase/`，路径变了但作用未变。所有后续 demo / 冒烟测试都应在 `local-tests/` 下新建子目录。

### v0.12 · 2026-05-27

主题：**Editorial 美学回退 + 第 6 个杂志主题 Midnight Ink + 图片裁切策略 + 交付工作流调整**。本轮起因是用户对 v0.11 冒烟测试的"质量回退"反馈——v0.10/v0.11 在把 showcase 模板化进 seed 的过程中，把 Editorial 的字重/字距/正文字族无意中改成了"信息图横幅"风（900 字重 / 负字距 / sans 正文），与 `demo-showcase/editorial.html` 的"克制磁带感"完全偏离。同时 Codex 外部测试 `social-card-wukong-breakout` 暴露了缺暗色主题、自造 `wukong-night` 不合规的问题。

**新增**
- `assets/template-editorial-card.html` 增加 `[data-theme="midnight-ink"]` 暗色 palette + 三段必随覆盖（`.grain` 翻成 screen-mode 暖光斑 / `.paper-wash` 改成金辉 + 阴影 vignette / `.frame-img` 加深底色 + 1px 暖边）。Editorial palette 从 5 套变 6 套。
- `references/theme-presets.md` 增 **Midnight Ink** 段，含色值 + 必随覆盖代码 + 使用场景（游戏 key art / 夜景 / 影调封面）。明确"暗色 Editorial 只有这一套，不要自造第二套"。
- `test-dark-theme-elden-ring/` — Midnight Ink 验证 deck（4 张 1080×1440，《艾尔登法环》新手指南）。图源 Steam 官方 8 张截图，记录在 `assets/`。验证 P1 全幅 hero-bleed + 黄金 accent、P2 M14 pipeline 4 步 + 21:9 atmosphere、P3 M07 ledger 4 行 + 战斗 atmosphere、P4 quote-card + 4:3 静态时刻。

**修改：Editorial 美学回退（核心）**
- `assets/template-editorial-card.html` 全部 Editorial 排版默认值恢复 showcase 美学：
  - `.h-display` 124px **weight 500** letter-spacing **+.04em**（v0.10/v0.11 误改为 900 / −.01em）
  - `.h-xl` 88px weight 500 +.03em（曾经 700 / −.01em）
  - `.h-md` 56px weight 500 +.02em
  - `.lead` 28px **font-family: var(--serif-zh)**（曾经被切到 sans-zh，是塌掉杂志感的主因）
  - `.body` 24px serif-zh（同上）
  - `.kicker` 21px letter-spacing **+.22em**
  - `.meta` / `.label` 18px +.20em
  - `.ledger-row .ledger-title` 42px weight 500，`.ledger-note` 22px serif-zh
  - `.pipeline-v .step-title` 40px weight 500，`.step-desc` 24px serif-zh
- `references/components.md` Editorial 字号表完整改写为上述值，加一段 **Restored 2026-05-27** 警示，写明"v0.10/v0.11 错改值是什么，为何会塌掉，showcase 是 source-of-truth"。
- `references/style-system.md` Mode A 加 **Typography stance — "the larger, the lighter"** 段：Editorial display 必须 500、serif body、宽字距；反模式（700-900 + sans + 负字距）= "infographic banner" 塌方。

**修改：图片裁切策略**
- `assets/template-editorial-card.html` `.frame-img img` 默认 `object-position` 从 `center top` 改为 `center 50%`。Editorial 之前的 `center top` 是默认值意外，导致竖图主体被切掉；showcase 实际上是逐图 inline 覆盖。
- `references/components.md` Image Containers 段加 **主体感知裁切表**（主体位置 → object-position 取值）+ 硬规则"每张图都要 inline 写 object-position，默认值是 fallback 不是推荐"。
- `SKILL.md` Step 6 Image and Screenshot Handling **Crop discipline** 改写为强制每张图 inline 写 `object-position`，带具体取值示例（`center 25%` 天空多 / `center 50%` 居中 / `center 62%` 半身 / `center 70%` 前景物）。

**修改：交付工作流（"show user first, ask before validating"）**
- `SKILL.md` Step 7 Deliver 重写：
  - 默认 **不再** 渲完自动跑 validator。
  - 渲完先把图给用户看，问一句"先你自己看，还是我先自动核查一遍？"。
  - 用户说"自己看"→ 停下来等反馈；说"你查吧"→ 才跑 `validate-social-deck.mjs`。
- 起因：用户反馈每次渲完自动跑 validator 让交付窗口变得很长，用户大多数时候眼睛比脚本更快。
- 代价：自动校验的"安全网"被撤掉一格——但脚本仍然可用、用户随时可调。

**修改：已有 demo 同步**
- `demo-kyoto-trip/index.html` — 字号回退到 showcase 值，P4 ledger 去掉 03（岚山）解决 3:4 溢出，title 改"四条建议"。
- `demo-smoke-editorial-travel/index.html` — 字号回退到 showcase 值。P1 hero 从 `r-16x10` 改 `r-3x2` + `object-position:center 62%`（hero-grassland 主体在画面中下）。P5 camp-tarp 加 `center 55%`。两份 demo 都 4-5 张 1080×1440 重渲过，无溢出。

**Codex `social-card-wukong-breakout` 诊断**
- 状态：未由本 skill 修复。Codex 在 v0.11 规则下做的测试。
- 根因：Codex 实际**遵守**了规则——错的是规则本身。`components.md` 当时还在写 900/700/sans-body 默认值，Codex 照搬出来必然塌；Codex 自造的 `wukong-night` 是"规则没暗色"的合理外推。
- 修复路径：v0.12 已落地 Midnight Ink 官方暗色 + 美学回退；后续 Codex 任务直接 `data-theme="midnight-ink"` 即可，无需自造。

**未做**
1. 截图美化资产 port（仍在短期清单）
2. 地图组件（同上）
3. 1:1 短标题生成器（同上）
4. 多平台一次出包（同上）
5. `social-card-wukong-breakout` 未重新生成——v0.12 是规则修复，不回灌历史 Codex 测试

### v0.11 · 2026-05-27

主题：**短期规划 Phase A 收口 — validator + Editorial 冒烟测试**。短期规划 6 件事完成第 1、2 件，把 v0.10 留下的 Editorial 长内容欠债（M11/M14 在 3:4 上从未单独验证）也清掉。

**新增**
- `validate-social-deck.mjs` — 单文件 Node 脚本，接受 task-dir 或 index.html，对每个 `<section class="poster …">` 跑 6 条规则：R1 overflow / R2 footer 碰撞 / R3 Swiss 粗体 display / R4 字号下限 / R5 4 横带密度（pixel-row union 覆盖率）/ R6 `.h-xl` 行/字 cap。`--style=swiss|editorial` 可显式指定，默认按 `data-theme/data-accent` 或 serif 字族 fallback 自动判断。退出码 1 仅在 FAIL 时；WARN 是 advisory。
- `package.json` `scripts.validate` — 把 `node validate-social-deck.mjs` 包到 `npm run validate <task-dir>`。
- `demo-smoke-editorial-travel/` — Editorial 冒烟测试 5 张 1080×1440：M01 cover + M11 Marginalia Essay（3 段正文 + 7 行 marginalia）+ M07 Field Ledger（5 行账本）+ M14 Vertical Pipeline（5 步）+ M16 Image-Led Cover 收束。全部 PASS validator。
- `references/components.md` § Editorial `.h-xl` Hard Caps — 实测表：xhs 92px / square 78px / wide 96px；附 M11/M14/M07 各自的 ledger / paragraph / step 数硬上限。

**修改**
- `SKILL.md` Step 5 Build And Render 加：每次 render 后必须跑 validator，FAIL 必修。Step 7 Deliver 加：交付前再跑一次；WARN 在交付消息里报告让用户决定。
- `validate-social-deck.mjs` 修两轮 false positive：
  - R2 footer collision：原版把 `.content` 容器 + 全幅 `.mag-bg` 误判碰底；改成只看 leaf text/media + 跳过 ≥95% 全幅 absolute 节点。
  - R4 min font：原版按 class 选择器命中所有 `.lead`，但 Swiss `.role-card .lead` 是子组件文本。改成只查 leaf text 节点的角色。
- `references/components.md` § Image Containers 加：figcaption 类名硬规则——Editorial 用 `.img-cap`、Swiss 用 `.swiss-img-caption`、**没有共享 `.cap`**。冒烟测试中我把它写成 `.cap` 触发 R4，已固化为警示。

**回归测试**（在 5 个 demo 上跑过 validator）
- `demo-smoke-editorial-travel`：5 pass / 0 fail / 0 warn
- `demo-zzz-miyabi`：4 pass / 1 R5 warn（p4 H-Bar 底部 trailing whitespace，可接受）
- `demo-eyeliner`：3 pass / 1 R5 warn（xhs-03 底带 13%，可接受）
- `smoke-ai-tools`：发现一处历史 R1 overflow（xhs-03 +101px）—— 之前漏看，已暴露
- `demo-showcase/swiss.html` + `editorial.html`：共暴露 39 + 46 条 R4/R5/R6 warn，主要是 lead/body/caption 在数据密集页里被压到 18-22px、几条 h-statement 行数超 cap。下一轮可逐张回修。

**未做（同短期规划清单）**
1. 截图美化资产 port（下一件）
2. 地图组件
3. 1:1 短标题生成器
4. 多平台一次出包

### v0.10 · 2026-05-26

主题：**内容密度硬规则 + 风格-内容类型解绑 + 全版式 showcase**。两件事并轨：(1) 解决 3:4 卡内容欠填——把"杂志留白逻辑"和"社交卡逐张刷"这两件事在文档层面拆清；(2) 把"Editorial 只接生活类 / Swiss 只接产品类"的隐含绑定明确解除，让用户用同一篇内容自由选风格。

**新增**
- `demo-eyeliner/` — 4 张 3:4 美妆类 Editorial 案例（kraft-paper），P1 M16 全幅产品图，P2 M03 翻车叙事，P3 M01 双头机制，P4 M07 收束。验证密度规则在"图+文+ledger"混合卡上的落地。
- `demo-showcase-editorial/` — 16 张 1080×1440 案例，逐张覆盖 M01-M16，循环用 5 套杂志 palette。
- `demo-showcase-swiss/` — 12 张 1080×1440 案例，逐张覆盖 S01-S12，循环用 4 套 Swiss accent。两套 showcase 演示「内容类型与风格脱钩」——美食内容也可走 Swiss、AI 工具也可走 Editorial。

**修改**
- `SKILL.md` Step 3 重写："Editorial 用于 / Swiss 用于" 的硬绑定改成"两种风格是 visual stance，不是 content category；任何内容都可走任一风格；选风格按 editorial intent（feature story 还是 release note），不按 topic lookup。"
- `SKILL.md` Non-Negotiables 增加 **3:4 内容密度硬规则**：内容 ≥75% 画布高度；>15% 空白带需"留白理由"；禁用 `<div style="flex: 1"></div>` 上下夹击；杂志留白逻辑不适用于社交卡。
- `references/style-system.md` 顶部增 **"Style ↔ content type are decoupled"** 段；Mode A / Mode B 的"Use for"硬列表改成"Good fits"软建议（含明确反例：workplace essay 也可走 Editorial、travel ledger 也可走 Swiss）。
- `references/layout-recipes.md`：
  - Editorial 和 Swiss recipe 总览段都加了"这些结构适用于任何 topic"的前言。
  - **新增 Content density rule (hard)** 段，写在 Editorial recipe 列表前。
  - **M03 / M04 / M07 / M13 各加 Minimum density 段**：
    - M03：title + 3 段 或 title + 2 段 + 编号 footer 列表。title 单独是 M04 不是 M03。
    - M04：唯一允许 ≤60% 内容的 recipe，但必须有 3 个 anchor（source row / kicker / hairline）。
    - M07：title + ≥4 ledger items with sub-lines + closing block。"3 短 ledger 行"是已知失败模式。
    - M13：必备 anchor（top kicker + bottom prompt + bottom metadata + 可见 WebGL bg）。
- `references/qa-checklist.md`：新增 **4 横带密度检查**（Filled / Justified empty / Under-filled 分类，>15% 画布的 under-filled 带判失败；通过门槛：Filled+Justified ≥100%、Filled ≥75%、相邻两带不能都 justified）。
- `PRODUCT.md` 决策 1 重写：风格不再绑定内容品类。删除"Editorial × 人文/Swiss × 工程"的硬对应；明确"两种风格是视觉立场不是内容门"。

**修复路径（落到代码）**
- 杂志留白逻辑→社交卡的对策：用 `flex-grow: 1` + `justify-content: space-between` 让"内容块本身撑开"，禁用空 `<div style="flex:1"></div>` 作为占位。`demo-eyeliner` P2/P4 两次重渲染后通过 4 横带检查。
- M07 spec 从 "2-3 rules" 改成 "4-6 ledger items with sub-lines"，每行 100-140px 垂直。

**未变动**
- Recipe 计数：仍是 M01-M16 + S01-S12 = 28 个。
- Theme palette 计数：5 + 4 = 9 套。
- 工作流步数仍 7 步；种子模板未动。
- 小红书品类能力圈未变；只是不再把"风格-品类"硬绑定。

**对比验证**
- 旧 P2/P4（v0.9 demo-eyeliner 第一版）：内容散在画布中段，底部 25%-35% 是空白带，缩略图刷过去像 PPT 漏排。
- 新 P2/P4（v0.10）：内容撑满到 ~92% 画布高度，引语+footer 紧贴底缘；FALLOUT 四条 a-d 均匀分布到引语之上。
- showcase 两套：28 个 recipe 每个出 1 张 1080×1440，全部通过 4 横带检查、覆盖全 9 调色、内容类型故意打散（户外 / AI / 食谱 / 数据 / 节气 / 影评等都既出现在 Editorial 也出现在 Swiss）。

### v0.9 · 2026-05-26

主题：**M16 编辑杂志化重写**。v0.8 的 M16 借了"游戏 key art"那套（全幅黑色 vertical falloff + 132px 黑体感字 + 纯白文字），出来像旅游海报、不像 Kinfolk / Cereal。本轮按 8 张参考的共同语言推倒重来：**选图是主要杠杆，遮罩是兜底；字小、字细、字色偏纸**。

**修改**
- `references/image-overlay.md` **Rule 1 重写**："选图先，遮罩后，禁全幅 falloff"四步法。Step 1 选图门（quiet-zone 测试 + light 测试），Step 2 默认不加 mask 直接验，Step 3 兜底用 localized + image-toned 软渐变（peak α ≤ 0.30），Step 4 缩略图测试。Banned 段把"全幅 vertical falloff"和"纯黑 mask 色"明确点名禁掉。
- `references/image-overlay.md` Rule 2 增 **Composition discipline** 段：4 条编辑杂志构图硬规（非对称、≥60% 留白、标题只占一个 quiet zone、绝不跨越主体轮廓）。
- `references/image-overlay.md` Checklist 重写：把"≥60% → 强制 mask"翻成"先看选图通不通过，mask 仅在 Step 4 失败时"。
- `references/layout-recipes.md` **M16 重写**：
  - 顶部加 **Photo qualification gate**——quiet-zone test + light test 都过才能走 M16，否则退回 M01。
  - Modes A/B/C/D 表里"Mask"列改成"Tint (only if Step 4 fails)"，明确"先无 mask、不行再局部图调色软渐变"。
  - **字号字色字体彻底改**：标题 88-108px（v0.8 是 108-132px），Noto Serif SC 400-500（v0.8 没限制字重，default 700+），色 `#f5f1e8` 纸米（v0.8 是 var(--paper) 容易跑成 #fff），letter-spacing 0.10-0.15em。
  - 加 **Forbidden in M16 type** 段：禁 inline 700+ 字重、禁纯白 `#fff`、禁标题 > 120px、禁拉丁 sans 作主标题、禁 D 模式标题居中。
  - HTML skeleton 两段重写：默认不加 mask、用 `Noto Serif SC weight 500 + #f5f1e8`，全 inline 字号（不依赖 `.h-display`，因为种子模板 `.h-display` 强制 `color: var(--ink)` 在暗背景上失效）。
- `demo-m16-camping/index.html` **P1 封面重做**：Mode A（顶 kicker + 底标题），无全幅 mask，仅底部 22%x84% 苔绿色 (`rgba(20,32,22,...)`) 软 radial 在标题区，标题 92px Noto Serif SC weight 500 / tracking 0.12em / 色 `#f5f1e8`。HTML 注释加 photo qualification 记录。

**未变动**
- Editorial recipe 计数：仍是 M01-M16。
- Swiss recipe / theme / 工作流 / 种子模板没动。
- demo-m16-camping P2 (ledger) / P3 (field notes) 没动——它们用的是 M05/M02 文字主导版式，没踩 M16 的坑。

**对比验证**
- 旧 P1（v0.8）：黑色 78% 侧栏 scrim + 132px 字 + 整页压重。读起来像旅游打卡。
- 新 P1（v0.9）：林荫透出、字小克制、底部苔绿软渐渍只够支撑标题对比。读起来像 Kinfolk camping 专题。
- 缩略图测试（360px wide）：标题 / kicker / 底部 mono strip 全部可读，无糊。

### v0.8 · 2026-05-26

主题：**图先序列 + 满图封面 recipe**。给"生活化、吃图片"的内容一个明确的 P1 图占满 + P2-3 数据的版式。

**新增**
- `references/layout-recipes.md` 新增 **M16 Image-Led Cover (Full-Bleed Hero)**：填补 M01"图+文分块"到"图占满 + 文字压上"的空白。含 4 种文字位置（顶压底沉 / 侧栏立柱 / 角落徽章 / 下沉条带，按 subject map 选）、字号 spec 表、标题长度上限表、1:1 / 21:9 适配、两段完整 HTML 骨架（Mode A + Mode D）。Editorial 模式专用，Swiss 不用。Editorial recipe 数：15 → 16。
- `references/content-planning.md` 新增 **Image-Led Sequence** 段：P1 M16 满图 → P2 文字数据卡（S11/M05/M10）→ P3 M02 副图 → … 硬规则"绝不连续两张 M16"。

**修改**
- `references/category-cookbook.md`：
  - 旅行 / 家居 / 美食（食谱）路由首选改为 M16 → S11/数据卡 → M02 的图先序列。
  - 情感不强推图先序列（M16 不适合 quiet documentary 的 "窗 / 椅 / 手"——继续走 M04/M09/M11 文字主导）。
- `SKILL.md` Seed 引用范围 `M01-M15` → `M01-M16`。

**未变动**
- 工作流步数与种子模板。
- Swiss 12 个 recipe / 9 套 palette / image-overlay 规则。
- M16 强依赖既有 image-overlay.md（mask + subject map + crop），没有放宽任何安全检查。

### v0.7 · 2026-05-26（上一轮）

主题：**Editorial 图源扩展**。没有新增 layout，没有改种子。

**修改**
- `SKILL.md` Step 6 web-sourced 图源从 3 条扩到 5 条：新增 **Pexels**（#2，原生支持中文搜索，补 Unsplash 在国内场景的缺口）与 **Flickr CC**（#3，`license=2,3,4,5,6,9` 过滤，补"纪实感真实感"的缺口）。加了取图顺序：Pexels（中文/国内）→ Unsplash → Flickr CC（纪实）→ direct search。明确"全部免版权图库，不接 视觉中国 / Getty / 站酷海洛 等付费源"。Swiss 模式继续不走图库。
- `references/category-cookbook.md`：
  - 旅行：Pexels 优先用于国内目的地（中文关键词）；Flickr CC 用于"真实旅程"的纪实质感。
  - 美食：Pexels 用于中式菜品 / 国内餐厅；Unsplash 标注为"西式 stock 感"，仅做兜底。
  - 情感：Flickr CC 升为主推（窗 / 椅 / 手这类纪实质感最契合）；Pexels 补国内语境；Unsplash 仍然可用但避开"moodcore" gradient-light stock。
- `references/qa-checklist.md`：图源 checklist 改为枚举 Pexels / Unsplash / Flickr CC / Wallhaven / direct search，并提示 Flickr CC 在用户同意标注时要保留作者署名。

**新增**
- `SKILL.md` Step 1 Intake 加"三选一"入口：用户只给文字时问一次（A. 自己提供照片 推荐 / B. 我帮你找 / C. AI 生成），按选择走 Step 6，不二次劝导。
- `SKILL.md` Step 6 "When the user has no images" 改为依赖 Step 1 gate，明确不再自动跳到 B/C。

**未变动**
- 工作流步数（仍为 7 步，三选一是 Step 1 内的子项）与种子模板。
- 9 套 palette 与 27 个 recipe。
- 不接付费图库（视觉中国 / Getty）是产品边界（见 `PRODUCT.md` 决策 4）。

### v0.6 · 2026-05-26（上一轮）

主题：**冒烟测试 + 种子模板硬化**。没有新增 layout，没有改工作流。

**新增**
- `smoke-ai-tools/` — 完整冒烟测试样例。主题"程序员一周 AI 工具使用周记"。用 5 张 1080×1440 跑通 S01/S07/S10/S11/S12 五个 recipe。Klein Blue accent。
- `HANDOFF.md` · `PRODUCT.md`（本文件 + 产品文档）

**修改**
- `assets/template-swiss-card.html`：为 `.poster.xhs` 补全 display 字号 override。
  - `.h-hero` 168px · `.h-statement` 124px · `.h-xl` 96px · `.num-mega` 168px · `.num-xl` 120px
  - `.matrix-fill` 改为 `grid-auto-rows: min-content`、`min-height: 0`、`gap: var(--sp-4)`
  - `.matrix-cell .cell-title` 在 xhs 下降到 24px
  - `.hero-stat-bottom` 在 xhs 下紧凑 margin / padding，`num-mega` 128px
- `references/components.md`：新增两张实测对照表。
  - "Swiss `.h-xl` Hard Caps per Board" — 每板最多几行、单行最多几字、超限会怎样
  - "Matrix + hero-stat-bottom on `.poster.xhs`" — cell 数对应的搭配建议

**已知遗留**
- Editorial 模板（`template-editorial-card.html`）**未做同样的冒烟测试**。M14 纵向 Pipeline 5 步在 3:4 板上是否溢出，未验证。
- 冒烟测试只覆盖 5 个 Swiss recipe（S01/S07/S10/S11/S12）。其余 S02-S06/S08/S09 未跑过真实小例子。

### v0.5 · 2026-05-26 早些时候

主题：**image-overlay 规则上线 + 文字压图验证**。

**新增**
- `references/image-overlay.md` — 文字压图规则：蒙版强制 + 多模态主体映射 + 缩略图测试
- `demo-image-02-wukong/` — 用《黑神话:悟空》主视觉验证 image-overlay 规则

**修改**
- `SKILL.md` Step 6 加入文字压图小节
- `references/style-system.md` 新增 Anti-Pattern D（封面照片裸跑无蒙版）

### v0.4 · 之前

主题：**模板种子 + 9 个新版式补全**（对齐已成熟的 PPT skill）。

**新增**
- `assets/template-editorial-card.html` · `assets/template-swiss-card.html` 两份种子
- `references/components.md` 字体/卡片/间距/Lucide token 表
- `layout-recipes.md` 加 M12-M15（Editorial 缺失节奏型）+ S08-S12（Swiss 5 个 port from PPT）

**修改**
- `SKILL.md` 加 Step 4.5（拷贝种子模板）
- Required References 加 `components.md`

### v0.3 及更早

`SKILL.md` + 9 份 reference 的初始体系。小红书品类能力圈（`category-cookbook.md`）。Editorial 11 个版式 + Swiss 7 个版式。

---

## 4. 如何验证 skill 还能跑

先跑文档层验证，确认 Skill Creator 基础格式和本仓库约束都还成立：

```bash
python3 /Users/guohao/.agents/skills/skill-creator/scripts/quick_validate.py .
npm run test:docs
```

`quick_validate.py` 只检查 Skill Creator 的基础结构：`SKILL.md`、frontmatter、name / description 合法性。`npm run test:docs` 检查本仓库新增的产品规则：根目录不产出、Live Photo 拼图、M16 图片压字、可见文案、发布提醒、产品复盘和交接记录。

最快的验证路径，不要发明新需求。

```bash
cd /Users/guohao/Documents/code/HyperFrames-test/guizang-social-card-skill/local-tests/smoke-ai-tools
node render.mjs
ls output/   # 应该看到 xhs-01.png ... xhs-05.png
sips -g pixelWidth -g pixelHeight output/xhs-01.png   # 应为 1080×1440
```

5 张图都能渲染、尺寸都对 → Swiss 种子模板 + 5 个 recipe 工作正常。

视觉验收：用 `Read` 工具读 `output/xhs-04.png`，确认大数字 "8" 在右下角完整可见、未被截断。

更全的 demo：`local-tests/demo-image-02-wukong/index.html` 用 Playwright 渲染，验证 image-overlay 规则下文字与人物未冲突。

Live Photo 视觉回归可以直接看本地测试目录：

```bash
cd /Users/guohao/Documents/code/HyperFrames-test/guizang-social-card-skill/local-tests/live-photo-best-suite/puzzle-layouts
ls output/
```

重点看 `contact-sheet-*.jpg` 和四个 `IMG_XHS_PUZZLE_*_LIVE.MOV`。不要重新开新目录，除非用户明确要新的测试集。

---

## 5. 工作流要点（给接手者的极简版）

按 `SKILL.md` 第 7 步走，**不要跳步**。最易踩坑的两步：

- **Step 3 不要混风格**：Editorial 用 serif + ledger/marginalia；Swiss 用 Inter + card-fill/matrix。两套 class 命名空间隔离，模板间不能跨用。
- **Step 4.5 必须拷种子**：从零写 HTML 是 v0.4 之前的工作流，已废弃。

文字压图的页（封面 / 大图位 / 全幅图）四步：先 `Read` 图、写 HTML 注释记录主体位置、选 `object-position`、做 360px 缩略图检查。默认先不加遮罩；只有缩略图不可读时才加局部、取自图片色调的 tint。

Live Photo 页先当静态社交卡做：先确认第一帧、裁切、字体、可见文案和模板匹配，再渲 MOV / `.pvt`。单视频加字走 M16 / image-overlay；二宫格、三宫格、四宫格默认无字；三连拼图只放能并行理解的三个短片段。

---

## 6. 已知风险与限制（事实层面）

- **校验脚本是按需兜底**。`validate-social-deck.mjs` 已可检查溢出、页脚碰撞、字号下限、密度、标题行数与 figure 默认 margin 漂移；默认交付流先给用户看，用户要求 auto-check 时再跑。
- **没有跨平台一次出包工具**。一篇文章要同时出小红书 3:4 + 微信 21:9+1:1 + 方封面 1:1，目前要手工开两个任务文件夹。
- **品类能力圈未硬编码**。`category-cookbook.md` 写明了 4 个不接的品类，但 skill 不会主动拒绝；需要执行者在 Step 1 自己读到并主动告知用户。
- **图片来源签名机制是"用户决定"**。`SOURCES.md` 总会写，但是否在图上加标注由用户回答。这不是技术限制是产品决策（见 `PRODUCT.md`）。
- **Live Photo 高光选择只是低成本诊断**。默认只做稀疏抽帧 / contact sheet / 时间段建议，不承诺精准识别转场、空镜、黑场或最佳高光。
- **Live Photo 发布依赖手机端路径**。交付时必须提醒小红书 `5s`、微信公众号 `3s`，并提醒 `.pvt` AirDrop 到 iPhone 后从对应 App / 手机端编辑路径发布。

---

## 7. 不要做的事

- 不要改 PPT skill（在 `~/.claude/skills/guizang-ppt-skill/`）。本 skill 借了它的视觉原则但**独立维护**。
- 不要把 demo 文件夹删掉来"清理"。它们是回归测试样本。
- 不要在两份种子模板里塞动效系统、键盘翻页、ESC 索引——那是 PPT 的需求，社交卡是静态 PNG。
- 不要把 components.md 的硬上限表"调宽"以接更长的标题。先压文案。
- 不要把内部制作词写到卡面上，例如 `三连拼图`、`5 秒看完`、`信息量`、`Live Photo`、`长视频处理`。这些词只能出现在计划、文件名、QA 或交付说明里。
- 不要用自造背景色、线条、刻度、标签、徽章去"补排版"。先找既有模板和 reference；没有规则支持就不要加。

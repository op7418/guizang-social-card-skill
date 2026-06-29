# Guizang Social Card Skill · 小红书图文 / 公众号封面对 

![GitHub stars](https://img.shields.io/github/stars/op7418/guizang-social-card-skill?style=flat-square)
![License](https://img.shields.io/github/license/op7418/guizang-social-card-skill?style=flat-square)
![Skill](https://img.shields.io/badge/Skill-Agent-111111?style=flat-square)
![Social Cards](https://img.shields.io/badge/Social-Cards-FF4D6D?style=flat-square)
![Claude Code](https://img.shields.io/badge/Claude%20Code-Supported-6B5B95?style=flat-square)
![Codex](https://img.shields.io/badge/Codex-Supported-222222?style=flat-square)

[English README](./README.en.md)

一个适配 Claude Code / Codex 等 Agent 环境的图文卡片技能,用于从文章、文案、截图、产品笔记、字幕或照片生成**小红书 / Rednote 图文组图**与**公众号 21:9 + 1:1 封面对**。

内置两套视觉系统,共用一份图文工作流:

- **电子杂志风(Editorial)**。像 *Monocle* / *Kinfolk* / *Cereal* 那样克制的版面,适合叙事、生活方式、旅行、阅读、影视、个人观察。
- **瑞士国际主义(Swiss)**。网格、单一锚点色、直角发丝线、极致字号对比,适合产品测评、数据、方法论、教程、AI 工具。

> 这个 Skill 是 [guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill) 的姊妹项目,共享美学语言但独立维护。PPT 解决"横向翻页演讲",这里解决"静态信息流图文"。

![Guizang Social Card Skill 效果展示](https://github.com/user-attachments/assets/d370abcc-1fc4-4de1-903a-09020a6556ce)

## 30 秒开始

```bash
npx skills add https://github.com/op7418/guizang-social-card-skill --skill guizang-social-card-skill
```

也可以直接把这段话发给有 shell 权限的 AI Agent:

```text
帮我安装 guizang-social-card-skill。请把 https://github.com/op7418/guizang-social-card-skill 克隆到 ~/.claude/skills/guizang-social-card-skill,安装完成后检查 SKILL.md、assets/、references/ 是否存在。
```

已经安装过的话,用这段话更新:

```text
帮我更新 guizang-social-card-skill。请进入 ~/.claude/skills/guizang-social-card-skill 执行 git pull,然后告诉我当前最新 commit。
```

安装后直接对 Agent 说:

```text
帮我基于这篇文章做一套瑞士风小红书图文,5 张,IKB 蓝。
```

也可以试这些请求:

```text
基于这份产品测评做一套小红书 3:4,标题用电子杂志风。
帮我把这篇文章做成公众号封面对:21:9 头图 + 1:1 分享卡,视觉保持一致。
我有 3 张露营照片,帮我做一套全图风格的小红书图文。
把这段游戏攻略文案做成一套小红书图文,需要从 wallhaven 拿点游戏原画。
```

## 效果

- 🖋 **双视觉系统**:电子杂志风做氛围与叙事,瑞士风做事实与结构,两套共用同一份工作流
- 📐 **3 个画板尺寸**:`.poster.xhs` 1080×1440(小红书 3:4)、`.poster.wide` 2100×900(公众号 21:9)、`.poster.square` 1080×1080(公众号 1:1)
- 🧩 **28 个版式骨架**:Editorial 16 个(`M01-M16`,含 Image-Led Cover、Pipeline、Before/After 等)+ Swiss 12 个(`S01-S12`,含 KPI Tower、H-Bar Chart、Matrix + Hero 等)
- 🎨 **10 套主题预设**:Editorial 6 套(墨水经典、靛蓝瓷、森林墨、牛皮纸、沙丘、**Midnight Ink** 暗色)+ Swiss 4 套锚点色(IKB Klein Blue、柠檬黄、柠檬绿、安全橙)
- 🖼 **图源工作流**:用户图优先;无图时按 Unsplash → Pexels → Flickr CC → Wallhaven → 直接搜索的优先级取图,落本地 + 自动写 `SOURCES.md`
- 🌫 **WebGL 墨流背景**:杂志风 hero 页可挂动态墨流;低性能或截图时可禁用
- 🪧 **图片底图遮罩 + 人脸避让**:满铺图必须叠遮罩,文字落点要避开主体,`references/image-overlay.md` 给硬规则
- 🧰 **截图美化资产**:9 张 WebP 真实材质背景(Editorial 5 / Swiss 4),配套 `.frame-shot` / `.device-browser` / `.device-phone` 工具类
- 🗺 **地图组件**:MapLibre + OSM 真实瓦片,支持多 pin + 连线,适合旅行攻略
- ✅ **校验脚本**:`validate-social-deck.mjs` 自动检测溢出、字号上限、4 横带密度、footer 碰撞
- 📄 **单文件 HTML + Playwright 渲染**:不需要前端构建链,`node render.mjs` 直接出 PNG

## 适合 / 不适合

**✅ 合适**:小红书图文组图 / 公众号封面对 / 微信朋友圈封面 / 视频号封面 / 文章配图 / 教程拆页 / 数据回顾 / 旅行攻略 / 产品测评 / 截图说明

**❌ 不合适**:横向翻页 PPT(用 [guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill))/ 长视频生成 / 纯图片修图 / 无版式诉求的纯文字编辑

## 11 个小红书品类适配

按"能力圈"分三档,详见 [`references/category-cookbook.md`](./references/category-cookbook.md):

**端到端强势**(文 / 结构 / 图都在能力圈内):

- 旅行、职场、推荐(指定子类后)

**文与结构强势,图依赖用户或搜图源:**

- 游戏、影视、美食(食谱方向)、彩妆(教程方向)、健身、家居、穿搭(精选方向)

**能力圈外,主动说清**(不强行接):

- OOTD 实拍流 / 梦核 / 仿胶片调色 / 真实测肤美妆等强烈依赖摄影或后期的细分赛道

## 常见使用场景

| 任务 | 推荐方式 |
|------|---------|
| 长文章 → 小红书图文 | 抽核心观点,Editorial 走叙事节奏,Swiss 走拆条数据 |
| 产品测评 / 工具回顾 | Swiss + IKB 蓝,优先 `S09 KPI Tower` / `S10 H-Bar Chart` |
| 旅行 / 生活方式分享 | Editorial + Midnight Ink 或 Dune,`M16 Image-Led Cover` 满铺主图 |
| 公众号封面对 | 同一份内容渲两块:`.poster.wide` 21:9 + `.poster.square` 1:1,视觉一致 |
| 截图教程 / 工具说明 | `.frame-shot` + `.device-browser` 包壳,优先 Swiss 网格底 |
| 游戏攻略 / 影视回顾 | Editorial + Midnight Ink,从 Wallhaven 取游戏原画做满铺 |
| 数据回顾 / 年终总结 | Swiss + Lemon 或 Safety Orange,矩阵 + ledger 组合 |

## 为什么是单文件 HTML 渲 PNG

- **Agent 友好**:HTML + CSS 是文本,Agent 能直接写、读、改、验证
- **版式精确**:CSS Grid + 严格字号 / 留白 / 网格,远超 Markdown 排版能力
- **图源开放**:可以接 Unsplash / Pexels / Wallhaven / Mapbox / OSM 等任意网络资源
- **质量可校验**:`validate-social-deck.mjs` 用 Playwright 跑真实 DOM 测量,不是猜
- **交付简单**:`output/*.png` 直接发,不需要部署、不需要导出工具

## 平台支持

| 平台 | 状态 | 说明 |
|------|------|------|
| Claude Code | 支持 | 原生 Skill 工作流,适合生成 + 迭代图文 |
| Codex | 支持 | 适合长流程图文生成、调用图片源、做视觉检查 |
| Cursor / 其他本地 Agent | 可用 | 需要能读写文件 + 执行 shell |
| 普通 Chatbot | 不推荐 | 没有文件系统和渲染管线时无法稳定出图 |

## 安装

### 方式一:一行命令安装(推荐)

```bash
npx skills add https://github.com/op7418/guizang-social-card-skill --skill guizang-social-card-skill
```

### 方式二:把下面这段话直接发给 AI

> 帮我安装 `guizang-social-card-skill` 这个 Claude Code skill。请按下面步骤做:
>
> 1. 确保 `~/.claude/skills/` 目录存在(不存在就创建)
> 2. 执行 `git clone https://github.com/op7418/guizang-social-card-skill.git ~/.claude/skills/guizang-social-card-skill`
> 3. 验证:`ls ~/.claude/skills/guizang-social-card-skill/` 应该看到 `SKILL.md`、`assets/`、`references/` 三项
> 4. 告诉我装好了,之后我说"做一套小红书图文"之类的话就会触发这个 skill

把这段话复制粘贴给 Claude Code / Cursor / 任何有 shell 权限的 AI Agent,它会自动完成安装。

### 方式三:手动命令行

```bash
git clone https://github.com/op7418/guizang-social-card-skill.git ~/.claude/skills/guizang-social-card-skill
```

### 触发方式

装好后,Claude Code 会自动发现并调用这个 skill。触发关键词:

- "帮我做一套小红书图文 / Xiaohongshu 图文"
- "帮我做一套 Rednote 卡片"
- "做一个公众号 21:9 头图 + 1:1 分享卡"
- "生成一套 social cards / 杂志风社交卡片"
- "把这篇文章做成轮播图文 / 教程拆页"
- "做一套瑞士风的小红书测评 / IKB 风格图文"

## 使用流程

Skill 本身是结构化工作流,Agent 会按 7 步走:

1. **Intake** — 抓 4 件事:目标平台 / 风格 / 内容素材 / 用户图。无图时一次性给 A/B/C 三选(自己拍图 / AI 生图 / 网络取图),不二次劝导
2. **Style & Theme** — 选 Editorial 还是 Swiss,再从 10 套预设里选主题色。不允许自定义 hex
3. **Layout Selection** — 根据内容结构从 28 个版式骨架里挑、粘、改文案。Editorial 16 个 / Swiss 12 个
4. **Asset Prep** — 取图(Unsplash / Pexels / Flickr CC / Wallhaven / 直接搜索),落本地 + 写 `SOURCES.md`;问用户要不要标来源
5. **Compose & Render** — 拷种子模板 → 替换 `<!-- POSTERS_HERE -->` → `node render.mjs`
6. **Deliver & Review** — 先把 PNG 给用户看,询问"你自己看还是我先帮你跑 validator",默认不自动核查
7. **Iterate** — 用户提反馈,改 inline 样式或 swap 版式 / 替图,重渲

详细说明见 [`SKILL.md`](./SKILL.md)。深度细节去看对应 `references/*.md`。

## 校验脚本

```bash
node validate-social-deck.mjs path/to/task-dir
```

6 条规则,基于 Playwright 真实渲染测量,不是静态扫描:

- **R1** Overflow — 任何 section 超出 `.poster` 立刻报错
- **R2** Type Caps — `.h-xl` / `.h-display` 字号 + 字重组合超出种子定义
- **R3** Footer Collision — 内容压到底部 footer / page-number
- **R4** 4-Band Density — 1440 高画布切 4 横带,每带应有内容或主动留白理由
- **R5** Frame Overflow — `.frame-img` / `.frame-shot` 子元素溢出框
- **R6** Swiss Identity — Swiss 模板里 inline `font-weight >= 700` 警告(违反"越大越细")

`SKILL.md` 第 7 步明确**默认不自动跑** validator —— 等用户先看完图再问,避免每轮多花数十秒。

## 主题色预设

从 [`references/theme-presets.md`](./references/theme-presets.md) 里选一套——**不允许自定义 hex 值**,保护美学比给自由更重要。

### Editorial 6 套

| 主题 | 色调 | 适合场景 |
|------|------|---------|
| 🖋 **墨水经典 Ink Classic** | `#0a0a0b` / `#f1efea` | 通用默认、商业话题、不知道选啥时最稳 |
| 🌊 **靛蓝瓷 Indigo Porcelain** | `#0a1f3d` / `#f1f3f5` | 科技、研究、AI、技术分享 |
| 🌿 **森林墨 Forest Ink** | `#1a2e1f` / `#f5f1e8` | 自然、可持续、户外、非虚构 |
| 🍂 **牛皮纸 Kraft Paper** | `#2a1e13` / `#eedfc7` | 怀旧、人文、阅读、文学 |
| 🌙 **沙丘 Dune** | `#1f1a14` / `#f0e6d2` | 艺术、设计、创意、时尚 |
| ⚫ **午夜墨 Midnight Ink** | `#0e0d0c` / `#ece2cf` / `#d4a04a` | 游戏 key art / 夜景 / 影调封面 / 黑神话 · 艾尔登法环类深色题材 |

### Swiss 4 套

| 主题 | 锚点色 | 适合场景 |
|------|--------|---------|
| 🔵 **克莱因蓝 IKB** | `#002FA7` | 通用默认、商业发布、AI 产品、方法论 |
| 🟡 **柠檬黄 Lemon** | `#FFD500` | 年轻、运动、零售、消费品、Y2K |
| 🟢 **柠檬绿 Lemon Green** | `#C5E803` | 生态、健康、Z 世代、绿色品牌 |
| 🟠 **安全橙 Safety Orange** | `#FF6B35` | 警示、新闻、工业、活力主题 |

切主题只需替换种子模板的 `<section class="poster" data-theme="...">` 属性,所有 CSS 走 `var(--...)`。

## 目录结构

```
guizang-social-card-skill/
├── SKILL.md                              ← Skill 主文件:7 步工作流
├── README.md                             ← 本文件
├── HANDOFF.md                            ← 交接文档:事实 + 版本历史
├── PRODUCT.md                            ← 产品文档:思考 + 决策 + roadmap
├── validate-social-deck.mjs              ← Playwright 版式校验脚本
├── assets/
│   ├── template-editorial-card.html      ← Editorial 种子(6 主题 / 3 画板)
│   ├── template-swiss-card.html          ← Swiss 种子(4 accent / 3 画板)
│   ├── magazine-bg-webgl.js              ← WebGL 墨流背景
│   └── screenshot-backgrounds/           ← 9 张截图舞台底(WebP)
│       ├── style-a/                      ←   Editorial 5 套
│       └── style-b/                      ←   Swiss 4 套
└── references/
    ├── platform-specs.md                 ← 平台 × 分辨率 × 命名
    ├── style-system.md                   ← 两种风格的硬规则与反模式
    ├── theme-presets.md                  ← 10 套色票详解
    ├── layout-recipes.md                 ← 28 个版式骨架(M01-M16 + S01-S12)
    ├── components.md                     ← 字体 / 卡片 / 间距 / 图标
    ├── background-systems.md             ← 墨流 / 网格 / 纸纹层
    ├── portrait-fill.md                  ← 3:4 板的留白对策
    ├── content-planning.md               ← 钩子 / 拆页 / 文案压缩
    ├── category-cookbook.md              ← 11 个小红书品类路由表
    ├── image-overlay.md                  ← 满铺图遮罩 + 人脸避让规则
    ├── screenshot-treatment.md           ← `.frame-shot` 工具类 + 截图美化
    ├── map-component.md                  ← `.map-block` MapLibre 地图
    ├── title-shortener.md                ← 1:1 封面的短标题策略
    ├── production-workflow.md            ← Playwright 渲染管线
    └── qa-checklist.md                   ← 质量检查清单
```

## 核心设计原则

1. **克制优于喊话** — 信息流里克制色板反而最显眼,不要堆饱和度
2. **结构优于装饰** — 字号 + 字体对比 + 网格留白撑起信息层级,不靠阴影和卡片
3. **版式优于自由** — 28 个版式骨架先选后改,不要发明不存在的页面
4. **图片优先用户的** — Intake 时一次性给 A/B/C,不二次劝导用户拍图
5. **遮罩与避让** — 满铺图必加遮罩,文字落点必须避开主体(人脸 / 产品 / 文字密集区)
6. **越大越细** — Swiss `.h-xl` 字号上去 → 字重必须下来。Editorial 同此原则
7. **默认不自动核查** — 把"先看图、再决定要不要 validate"做成工作流,省每轮几十秒
8. **Skill 是产品不是 Prompt** — 有 PRODUCT.md、有版本号、有 CHANGELOG、有能力边界
9. **本地测试不进 git** — 所有 demo / 冒烟测试归 `local-tests/`,被 gitignore

## 视觉参考

- *Monocle* / *Kinfolk* / *Cereal* 杂志的版式与字距
- Massimo Vignelli / Helvetica Forever / 瑞士国际主义网格系统
- Apartamento / The Gentlewoman 的图文比与人物纪实
- 小红书 / Rednote 信息流里"克制反而吃香"的内容样本
- 歸藏的图文卡片实践

## Roadmap

- 补充更多 Editorial 长内容下的字号上限冒烟测试
- 扩展 Swiss 数据类版式(更多图表骨架)
- AI 出图后处理:渲染后主动询问是否做局部修复 / 整张重出
- 增加更多小红书品类的官方推荐版式包(目前 11 个里 7 个端到端可用)
- 整理 WorkBuddy 等平台上架版本

## FAQ

**可以批量出图吗?**
可以。一个 task 目录下的 `index.html` 包含多个 `.poster`,`node render.mjs` 会逐个截 PNG。一次出小红书 3-9 张组图很常见。

**为什么不允许自定义颜色?**
和 PPT skill 同样的理由——这个 Skill 的核心价值是稳定产出。自由选色会破坏整体风格,只允许从 10 套预设里挑。

**能用其他模型生图吗?**
可以。生图本身不在 Skill 范围内,但 SKILL.md Step 4 写清了取图协议:用户图 → AI 生图 → 网络取图。AI 生图能力依赖你当前 Agent 接的模型。

**Codex 写出来不合规怎么办?**
v0.12 起把"种子模板与 components.md 表格保持一致"做成了硬规则。如果还是出现违规,大概率是 seed template 默认值与 `references/style-system.md` 不一致——开 Issue 给我们。

**怎么更新到最新版?**
重新运行安装命令,或在本地 skill 目录执行 `git pull`。

**支持英文图文吗?**
支持。Editorial 的 Playfair Display + Noto Serif、Swiss 的 Inter + Helvetica 都同时覆盖中英文。版式骨架未做语言绑定。

## 贡献

Bug、排版问题、新版式需求——欢迎开 Issue 或 PR。改动请优先:

- 改种子模板时,同步更新 `references/components.md` 的对照表(字号 / 字距 / 字重)
- 新增版式时,在 `references/layout-recipes.md` 加完整 recipe(文案上限 + minimum density)
- 新增主题色时,同步更新种子模板的 `[data-theme="..."]` 块 + `references/theme-presets.md`
- 新增 Swiss 规则时,同步更新 `validate-social-deck.mjs` 的对应规则
- 踩过的坑写到 `references/qa-checklist.md`
- 测试与 demo 一律放在 `local-tests/` 下,不要污染 skill 根目录

## License

AGPL-3.0 © 2026 [op7418](https://github.com/op7418)

本项目采用 **GNU AGPL-3.0** 协议,要点:

1. **必须署名** — 保留版权声明
2. **衍生品必须开源** — 任何修改版本、Fork、二次分发,必须以 AGPL-3.0(或兼容协议)公开发布,提供完整源代码
3. **网络服务也要开源** — 即使你只是把修改版本部署成 SaaS / Web 服务给别人用而不分发代码,也要公开源代码(这是 AGPL 区别于 GPL 的核心)
4. **不允许闭源、专有化、仅付费分发**

完整条款见 [`LICENSE`](./LICENSE)。

#!/usr/bin/env node
// 歸藏设计系统 · 字体工具（guizang-design v0.1.0 生成，不要手改；内置字体时依赖 subset-font）
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const FONTS_DIR = (() => { try { return fileURLToPath(new URL('../fonts/', import.meta.url)) } catch { return '' } })()
const MANIFEST_PATH = join(FONTS_DIR, 'manifest.json')
const LOCK_PATH = join(FONTS_DIR, 'lock.json')

export const cacheDir = () => process.env.GUIZANG_FONT_CACHE || join(homedir(), '.cache', 'guizang-design', 'fonts')

// 国内访问 fonts.googleapis.com 不稳定时，可以换成兼容 css2 接口的镜像
export const cssHost = () => process.env.GUIZANG_FONT_CSS_HOST || 'https://fonts.googleapis.com'

// 子集里总是带上的字：ASCII 可见字符、常用中文标点、数字相关符号，避免后期改一个字就缺字
export const BASE_CHARS =
  Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('') +
  '，。、；：？！“”‘’（）《》〈〉【】「」『』—…·￥％＋－×÷→←↑↓©®™°±€£¥§¶•–'

export const userFontsPath = () => process.env.GUIZANG_USER_FONTS || join(homedir(), '.config', 'guizang-design', 'fonts.json')

async function loadUserFonts() {
  const p = userFontsPath()
  if (!existsSync(p)) return []
  const { fonts = [] } = JSON.parse(await readFile(p, 'utf8'))
  return fonts.map((f) => ({ ...f, local: true, status: 'local' }))
}

// 数据源：在设计系统仓库里读 fonts/ 目录；打包进 skill 后（gz-fonts.mjs）改用内嵌的清单和 lock，lock 只读
const source = {
  manifest: async () => JSON.parse(await readFile(MANIFEST_PATH, 'utf8')),
  lock: async () => (existsSync(LOCK_PATH) ? JSON.parse(await readFile(LOCK_PATH, 'utf8')) : {}),
  saveLock: (lock) => writeFile(LOCK_PATH, JSON.stringify(lock, null, 2) + '\n'),
}
export function useEmbeddedData(manifest, lock) {
  source.manifest = async () => manifest
  source.lock = async () => lock
  source.saveLock = async () => {}
}

export async function loadManifest() {
  const manifest = await source.manifest()
  const user = await loadUserFonts()
  const clash = user.find((u) => manifest.fonts.some((f) => f.id === u.id))
  if (clash) throw new Error(`本机字体 ${clash.id} 和内置字体重名，请在 ${userFontsPath()} 里换一个 id`)
  return { ...manifest, fonts: [...manifest.fonts, ...user] }
}

// 登记一款本机字体。文件名带 Italic 的视为斜体；字重取 fvar 范围，静态字体取 OS/2 的 usWeightClass
export async function addUserFont({ id, family, category = 'sans', script = 'latin', files, note }) {
  const entries = []
  for (const file of files) {
    const buf = await readFile(file)
    const axes = readAxes(buf)
    entries.push({ style: /italic/i.test(file) ? 'italic' : 'normal', ...(axes.wght ? {} : { weight: readWeightClass(buf) }), file })
  }
  const p = userFontsPath()
  const current = existsSync(p) ? JSON.parse(await readFile(p, 'utf8')) : { fonts: [] }
  current.fonts = current.fonts.filter((f) => f.id !== id)
  current.fonts.push({ id, family, category, script, license: 'user', files: entries, ...(note ? { note } : {}) })
  await mkdir(join(p, '..'), { recursive: true })
  await writeFile(p, JSON.stringify(current, null, 2) + '\n')
  return { path: p, files: entries }
}

const loadLock = () => source.lock()

export async function getFont(id) {
  const { fonts } = await loadManifest()
  const font = fonts.find((f) => f.id === id)
  if (!font) throw new Error(`字体清单里没有 ${id}，可用：${fonts.map((f) => f.id).join(', ')}`)
  return font
}

const fileUrl = (pin, path) => `https://raw.githubusercontent.com/google/fonts/${pin}/${encodeURI(path)}`
const cachePath = (pin, path) => join(cacheDir(), pin.slice(0, 12), path.replace(/[\[\]]/g, '_'))

// ---------- OpenType fvar：读可变字体的轴范围 ----------

export function readAxes(buf) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const numTables = view.getUint16(4)
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16
    const tag = String.fromCharCode(...buf.subarray(rec, rec + 4))
    if (tag !== 'fvar') continue
    const off = view.getUint32(rec + 8)
    const axesOffset = view.getUint16(off + 4)
    const axisCount = view.getUint16(off + 8)
    const axisSize = view.getUint16(off + 10)
    const axes = {}
    for (let a = 0; a < axisCount; a++) {
      const p = off + axesOffset + a * axisSize
      const fixed = (q) => view.getInt32(q) / 65536
      axes[String.fromCharCode(...buf.subarray(p, p + 4))] = { min: fixed(p + 4), default: fixed(p + 8), max: fixed(p + 12) }
    }
    return axes
  }
  return {}
}

function readWeightClass(buf) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  for (let i = 0; i < view.getUint16(4); i++) {
    const rec = 12 + i * 16
    if (String.fromCharCode(...buf.subarray(rec, rec + 4)) === 'OS/2') return view.getUint16(view.getUint32(rec + 8) + 4)
  }
  return 400
}

// ---------- 下载与校验 ----------

async function download(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`下载失败 ${res.status}：${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await mkdir(join(dest, '..'), { recursive: true })
  await writeFile(dest + '.part', buf)
  await rename(dest + '.part', dest)
  return buf
}

// 返回 [{ style, weight: [min,max], buffer }]。缺缓存就下载；lock 里有 sha256 就校验，没有就写入
export async function fetchFont(id, { log = () => {} } = {}) {
  const { pin } = await loadManifest()
  const font = await getFont(id)
  if (font.local) {
    return Promise.all(font.files.map(async (file) => {
      if (!existsSync(file.file)) throw new Error(`本机字体 ${id} 的文件不存在：${file.file}`)
      const buf = await readFile(file.file)
      const axes = readAxes(buf)
      return { style: file.style, weight: axes.wght ? [axes.wght.min, axes.wght.max] : [file.weight ?? 400, file.weight ?? 400], buffer: buf }
    }))
  }
  const lock = await loadLock()
  let lockChanged = false
  const out = []
  for (const file of font.files) {
    const dest = cachePath(pin, file.path)
    let buf
    if (existsSync(dest)) buf = await readFile(dest)
    else {
      log(`下载 ${font.family} ${file.style}…`)
      buf = await download(fileUrl(pin, file.path), dest)
    }
    const sha256 = createHash('sha256').update(buf).digest('hex')
    const key = `${pin.slice(0, 12)}/${file.path}`
    const axes = readAxes(buf)
    const weight = axes.wght ? [axes.wght.min, axes.wght.max] : [file.weight ?? 400, file.weight ?? 400]
    if (lock[key] && lock[key].sha256 !== sha256) {
      throw new Error(`${key} 的 sha256 和 lock.json 不一致，缓存可能损坏：删掉 ${dest} 重新下载`)
    }
    if (!lock[key]) {
      lock[key] = { sha256, bytes: buf.length, weight, axes: Object.keys(axes) }
      lockChanged = true
    }
    out.push({ style: file.style, weight, buffer: buf })
  }
  if (lockChanged) {
    await source.saveLock(Object.fromEntries(Object.entries(lock).sort(([a], [b]) => a.localeCompare(b))))
  }
  return out
}

// ---------- 在线引用 ----------

// 字重范围从 lock.json 读，不需要先下载字体。本机字体不进在线链接；全是本机字体时返回 null
export async function onlineCssUrl(ids) {
  const { pin, fonts } = await loadManifest()
  const lock = await loadLock()
  const shareable = ids.filter((id) => !fonts.find((f) => f.id === id)?.local)
  if (!shareable.length) return null
  const families = shareable.map((id) => {
    const font = fonts.find((f) => f.id === id)
    if (!font) throw new Error(`字体清单里没有 ${id}`)
    const ranges = font.files.map((file) => {
      const rec = lock[`${pin.slice(0, 12)}/${file.path}`]
      if (!rec) throw new Error(`${id} 还没有 lock 记录，先运行 npm run fonts:fetch -- ${id}`)
      const [lo, hi] = rec.weight
      return { ital: file.style === 'italic' ? 1 : 0, w: lo === hi ? `${lo}` : `${lo}..${hi}` }
    })
    const name = font.family.replace(/ /g, '+')
    if (ranges.some((r) => r.ital)) {
      const spec = ranges.sort((a, b) => a.ital - b.ital || a.w.localeCompare(b.w)).map((r) => `${r.ital},${r.w}`).join(';')
      return `family=${name}:ital,wght@${spec}`
    }
    return `family=${name}:wght@${[...new Set(ranges.map((r) => r.w))].join(';')}`
  })
  return `${cssHost()}/css2?${families.join('&')}&display=swap`
}

// data-gz-fonts 记全部字体（内置时用），href 只含可分发的字体
export async function fontLinkTag(ids) {
  const url = await onlineCssUrl(ids)
  return `<link rel="stylesheet" data-gz-fonts="${ids.join(' ')}" href="${url ?? 'data:text/css,'}">`
}

// ---------- 内置 ----------

// 页面里会被渲染出来的文字：去掉 script / style / 注释和标签，解开常见实体
export function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
}

const uniqueChars = (s) => [...new Set(Array.from(s))].join('')

// 返回内联 @font-face 的 CSS 和每个字体文件的子集大小
export async function embedCss(ids, text, { log } = {}) {
  const chars = uniqueChars(BASE_CHARS + text)
  const rules = []
  const report = []
  for (const id of ids) {
    const font = await getFont(id)
    for (const file of await fetchFont(id, { log })) {
      // 只有内置字体时才需要 subset-font：在线链接、列表等用法不装依赖也能跑
      const { default: subsetFont } = await import('subset-font')
      const woff2 = await subsetFont(file.buffer, chars, { targetFormat: 'woff2' })
      const [lo, hi] = file.weight
      rules.push(
        `@font-face{font-family:'${font.family}';font-style:${file.style};font-weight:${lo === hi ? lo : `${lo} ${hi}`};` +
          `font-display:block;src:url(data:font/woff2;base64,${woff2.toString('base64')}) format('woff2')}`,
      )
      report.push({ id, style: file.style, bytes: woff2.length, sourceBytes: file.buffer.length })
    }
  }
  return { css: rules.join('\n'), report }
}

const LINK_RE = /<link\b[^>]*\bdata-gz-fonts="([^"]+)"[^>]*>/i

// 把 data-gz-fonts 这条在线 link 换成内联字体；页面没有这条 link 就原样返回
export async function embedFonts(html, opts = {}) {
  const m = LINK_RE.exec(html)
  if (!m) return { html, report: [] }
  const ids = m[1].trim().split(/\s+/)
  const { css, report } = await embedCss(ids, visibleText(html) + (opts.extraText || ''), opts)
  const tag = `<style data-gz-fonts="${ids.join(' ')}" data-gz-embedded>\n${css}\n</style>`
  return { html: html.slice(0, m.index) + tag + html.slice(m.index + m[0].length), report }
}

useEmbeddedData({
  "$comment": "字体清单。只收许可证允许内置分发的字体（OFL 等）。source 固定到 google/fonts 的某次提交，保证所有人拿到同一份文件。status：in-use = 现有 skill 已在用；candidate = 新增候选，等定稿。字重范围以字体文件里的 fvar 为准，scripts/fonts.mjs check 会核对。",
  "pin": "6157dfaa640ca5738b4d1a7070fe389c3036d7fc",
  "fonts": [
    { "id": "playfair-display", "family": "Playfair Display", "category": "serif", "script": "latin", "license": "OFL-1.1", "status": "in-use",
      "files": [{ "style": "normal", "path": "ofl/playfairdisplay/PlayfairDisplay[wght].ttf" }, { "style": "italic", "path": "ofl/playfairdisplay/PlayfairDisplay-Italic[wght].ttf" }] },
    { "id": "source-serif-4", "family": "Source Serif 4", "category": "serif", "script": "latin", "license": "OFL-1.1", "status": "in-use",
      "files": [{ "style": "normal", "path": "ofl/sourceserif4/SourceSerif4[opsz,wght].ttf" }, { "style": "italic", "path": "ofl/sourceserif4/SourceSerif4-Italic[opsz,wght].ttf" }] },
    { "id": "inter", "family": "Inter", "category": "sans", "script": "latin", "license": "OFL-1.1", "status": "in-use",
      "files": [{ "style": "normal", "path": "ofl/inter/Inter[opsz,wght].ttf" }] },
    { "id": "dm-sans", "family": "DM Sans", "category": "sans", "script": "latin", "license": "OFL-1.1", "status": "in-use",
      "files": [{ "style": "normal", "path": "ofl/dmsans/DMSans[opsz,wght].ttf" }] },
    { "id": "space-grotesk", "family": "Space Grotesk", "category": "sans", "script": "latin", "license": "OFL-1.1", "status": "in-use",
      "files": [{ "style": "normal", "path": "ofl/spacegrotesk/SpaceGrotesk[wght].ttf" }] },
    { "id": "jetbrains-mono", "family": "JetBrains Mono", "category": "mono", "script": "latin", "license": "OFL-1.1", "status": "in-use",
      "files": [{ "style": "normal", "path": "ofl/jetbrainsmono/JetBrainsMono[wght].ttf" }] },
    { "id": "ibm-plex-mono", "family": "IBM Plex Mono", "category": "mono", "script": "latin", "license": "OFL-1.1", "status": "in-use",
      "files": [{ "style": "normal", "weight": 400, "path": "ofl/ibmplexmono/IBMPlexMono-Regular.ttf" }, { "style": "normal", "weight": 500, "path": "ofl/ibmplexmono/IBMPlexMono-Medium.ttf" }, { "style": "normal", "weight": 600, "path": "ofl/ibmplexmono/IBMPlexMono-SemiBold.ttf" }] },
    { "id": "noto-serif-sc", "family": "Noto Serif SC", "category": "serif", "script": "cjk", "license": "OFL-1.1", "status": "in-use",
      "files": [{ "style": "normal", "path": "ofl/notoserifsc/NotoSerifSC[wght].ttf" }] },
    { "id": "noto-sans-sc", "family": "Noto Sans SC", "category": "sans", "script": "cjk", "license": "OFL-1.1", "status": "in-use",
      "files": [{ "style": "normal", "path": "ofl/notosanssc/NotoSansSC[wght].ttf" }] },

    { "id": "inter-tight", "family": "Inter Tight", "category": "sans", "script": "latin", "license": "OFL-1.1", "status": "candidate", "note": "Inter 的紧排版本，瑞士风大标题",
      "files": [{ "style": "normal", "path": "ofl/intertight/InterTight[wght].ttf" }] },
    { "id": "archivo", "family": "Archivo", "category": "sans", "script": "latin", "license": "OFL-1.1", "status": "candidate", "note": "带宽度轴的怪诞体，海报级瑞士风标题",
      "files": [{ "style": "normal", "path": "ofl/archivo/Archivo[wdth,wght].ttf" }] },
    { "id": "schibsted-grotesk", "family": "Schibsted Grotesk", "category": "sans", "script": "latin", "license": "OFL-1.1", "status": "candidate", "note": "北欧报业怪诞体，正文和标题都稳",
      "files": [{ "style": "normal", "path": "ofl/schibstedgrotesk/SchibstedGrotesk[wght].ttf" }] },
    { "id": "familjen-grotesk", "family": "Familjen Grotesk", "category": "sans", "script": "latin", "license": "OFL-1.1", "status": "candidate", "note": "瑞典怪诞体，个性强，适合大字",
      "files": [{ "style": "normal", "path": "ofl/familjengrotesk/FamiljenGrotesk[wght].ttf" }] },
    { "id": "instrument-sans", "family": "Instrument Sans", "category": "sans", "script": "latin", "license": "OFL-1.1", "status": "candidate",
      "files": [{ "style": "normal", "path": "ofl/instrumentsans/InstrumentSans[wdth,wght].ttf" }] },
    { "id": "newsreader", "family": "Newsreader", "category": "serif", "script": "latin", "license": "OFL-1.1", "status": "candidate", "note": "为长文阅读设计、带光学尺寸，网页正文",
      "files": [{ "style": "normal", "path": "ofl/newsreader/Newsreader[opsz,wght].ttf" }, { "style": "italic", "path": "ofl/newsreader/Newsreader-Italic[opsz,wght].ttf" }] },
    { "id": "fraunces", "family": "Fraunces", "category": "serif", "script": "latin", "license": "OFL-1.1", "status": "candidate", "note": "老式风格展示衬线，杂志大标题",
      "files": [{ "style": "normal", "path": "ofl/fraunces/Fraunces[SOFT,WONK,opsz,wght].ttf" }, { "style": "italic", "path": "ofl/fraunces/Fraunces-Italic[SOFT,WONK,opsz,wght].ttf" }] },
    { "id": "instrument-serif", "family": "Instrument Serif", "category": "serif", "script": "latin", "license": "OFL-1.1", "status": "candidate", "note": "窄体展示衬线，只有常规体",
      "files": [{ "style": "normal", "weight": 400, "path": "ofl/instrumentserif/InstrumentSerif-Regular.ttf" }, { "style": "italic", "weight": 400, "path": "ofl/instrumentserif/InstrumentSerif-Italic.ttf" }] },
    { "id": "eb-garamond", "family": "EB Garamond", "category": "serif", "script": "latin", "license": "OFL-1.1", "status": "candidate",
      "files": [{ "style": "normal", "path": "ofl/ebgaramond/EBGaramond[wght].ttf" }, { "style": "italic", "path": "ofl/ebgaramond/EBGaramond-Italic[wght].ttf" }] },
    { "id": "zcool-xiaowei", "family": "ZCOOL XiaoWei", "category": "serif", "script": "cjk", "license": "OFL-1.1", "status": "candidate", "note": "站酷小薇，带书卷气的中文展示宋体",
      "files": [{ "style": "normal", "weight": 400, "path": "ofl/zcoolxiaowei/ZCOOLXiaoWei-Regular.ttf" }] }
  ]
}, {
  "6157dfaa640c/ofl/archivo/Archivo[wdth,wght].ttf": {
    "sha256": "0e094a7d3c7c4c25cf1310c4b30014f1dae9332220b1c2c88f4fa996f0b05053",
    "bytes": 658596,
    "weight": [
      100,
      900
    ],
    "axes": [
      "wght",
      "wdth"
    ]
  },
  "6157dfaa640c/ofl/dmsans/DMSans[opsz,wght].ttf": {
    "sha256": "8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d",
    "bytes": 240164,
    "weight": [
      100,
      1000
    ],
    "axes": [
      "opsz",
      "wght"
    ]
  },
  "6157dfaa640c/ofl/ebgaramond/EBGaramond-Italic[wght].ttf": {
    "sha256": "bba2c4499c93c9612b90b9825d32b07da52fce2fe57562a1eb6b833553f93c4e",
    "bytes": 754468,
    "weight": [
      400,
      800
    ],
    "axes": [
      "wght"
    ]
  },
  "6157dfaa640c/ofl/ebgaramond/EBGaramond[wght].ttf": {
    "sha256": "ef9512f92f6d579e5dc75af59a5a4b1b8b47d2eda89e00b954d44520e5369027",
    "bytes": 851176,
    "weight": [
      400,
      800
    ],
    "axes": [
      "wght"
    ]
  },
  "6157dfaa640c/ofl/familjengrotesk/FamiljenGrotesk[wght].ttf": {
    "sha256": "2d25fc41321a04561fab20a90fc8bc9ed4d1c0743fe8ba76cc51cd3632138b80",
    "bytes": 90048,
    "weight": [
      400,
      700
    ],
    "axes": [
      "wght"
    ]
  },
  "6157dfaa640c/ofl/fraunces/Fraunces-Italic[SOFT,WONK,opsz,wght].ttf": {
    "sha256": "b24448c43702fac4ee856781d461a0dfba8d8e594b6e8e190234b75fed2c0e01",
    "bytes": 414904,
    "weight": [
      100,
      900
    ],
    "axes": [
      "opsz",
      "wght",
      "SOFT",
      "WONK"
    ]
  },
  "6157dfaa640c/ofl/fraunces/Fraunces[SOFT,WONK,opsz,wght].ttf": {
    "sha256": "177ff6c0f14e5550a3c624247cd1189611d4eb65d000b14944c63d967958abbb",
    "bytes": 360440,
    "weight": [
      100,
      900
    ],
    "axes": [
      "opsz",
      "wght",
      "SOFT",
      "WONK"
    ]
  },
  "6157dfaa640c/ofl/ibmplexmono/IBMPlexMono-Medium.ttf": {
    "sha256": "a9b4c49bb299e05b5f6c481e7fb5e78943d2793249a0c8874ab574a2d1ea6755",
    "bytes": 136704,
    "weight": [
      500,
      500
    ],
    "axes": []
  },
  "6157dfaa640c/ofl/ibmplexmono/IBMPlexMono-Regular.ttf": {
    "sha256": "6a3412f058c7d8dfd9170c41e85ade48e5156ecb89356110ca57a0a27734af46",
    "bytes": 135580,
    "weight": [
      400,
      400
    ],
    "axes": []
  },
  "6157dfaa640c/ofl/ibmplexmono/IBMPlexMono-SemiBold.ttf": {
    "sha256": "d3c38e55c78f5b0f28009fddba4834ec503278936a5986032424c9bd2d23aa46",
    "bytes": 140216,
    "weight": [
      600,
      600
    ],
    "axes": []
  },
  "6157dfaa640c/ofl/instrumentsans/InstrumentSans[wdth,wght].ttf": {
    "sha256": "b24f1812584816958afcf22e22d08e44318c5e51651e25d2438efdde389b33b1",
    "bytes": 194336,
    "weight": [
      400,
      700
    ],
    "axes": [
      "wdth",
      "wght"
    ]
  },
  "6157dfaa640c/ofl/instrumentserif/InstrumentSerif-Italic.ttf": {
    "sha256": "08939b8bdf534afec24ae0ef5e03f948940cd9a8fe08e7fecbad040e62327385",
    "bytes": 71592,
    "weight": [
      400,
      400
    ],
    "axes": []
  },
  "6157dfaa640c/ofl/instrumentserif/InstrumentSerif-Regular.ttf": {
    "sha256": "498efd461f6ddfcb7a111bf9a565709d2085d48201d501ead960d93e84ffbb88",
    "bytes": 70012,
    "weight": [
      400,
      400
    ],
    "axes": []
  },
  "6157dfaa640c/ofl/inter/Inter[opsz,wght].ttf": {
    "sha256": "29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031",
    "bytes": 876576,
    "weight": [
      100,
      900
    ],
    "axes": [
      "opsz",
      "wght"
    ]
  },
  "6157dfaa640c/ofl/intertight/InterTight[wght].ttf": {
    "sha256": "b81b73dcb64df3c230cabade7df6c5773bf863233f24c9ee51087519f1f88b6f",
    "bytes": 581588,
    "weight": [
      100,
      900
    ],
    "axes": [
      "wght"
    ]
  },
  "6157dfaa640c/ofl/jetbrainsmono/JetBrainsMono[wght].ttf": {
    "sha256": "48715a42ec242c21e9f02692891e147d022299a52e48d5e413e1a942193ffeda",
    "bytes": 187208,
    "weight": [
      100,
      800
    ],
    "axes": [
      "wght"
    ]
  },
  "6157dfaa640c/ofl/newsreader/Newsreader-Italic[opsz,wght].ttf": {
    "sha256": "796668611f80b64d5adf182fde3b6f29ed83b4e7cbec7b96937e84ac01364792",
    "bytes": 495684,
    "weight": [
      200,
      800
    ],
    "axes": [
      "wght",
      "opsz"
    ]
  },
  "6157dfaa640c/ofl/newsreader/Newsreader[opsz,wght].ttf": {
    "sha256": "8a08d13f8a6c0d51be379a60af84f945f65369a67e509ee3c3bdcc421254d7c1",
    "bytes": 451664,
    "weight": [
      200,
      800
    ],
    "axes": [
      "wght",
      "opsz"
    ]
  },
  "6157dfaa640c/ofl/notosanssc/NotoSansSC[wght].ttf": {
    "sha256": "a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da",
    "bytes": 17772300,
    "weight": [
      100,
      900
    ],
    "axes": [
      "wght"
    ]
  },
  "6157dfaa640c/ofl/notoserifsc/NotoSerifSC[wght].ttf": {
    "sha256": "050080d9255a86808f2945bffac582b31ef32bc36411ce29563b4961670c66f9",
    "bytes": 25125512,
    "weight": [
      200,
      900
    ],
    "axes": [
      "wght"
    ]
  },
  "6157dfaa640c/ofl/playfairdisplay/PlayfairDisplay-Italic[wght].ttf": {
    "sha256": "a5e26dc5e2e77fb2803a0bf02fd4f81ee136ec8dea863ccdb0c59a263b21378b",
    "bytes": 278688,
    "weight": [
      400,
      900
    ],
    "axes": [
      "wght"
    ]
  },
  "6157dfaa640c/ofl/playfairdisplay/PlayfairDisplay[wght].ttf": {
    "sha256": "c40f2293766a503bc70cce9e512ef844a4ccb7cbcde792fe2ea31d191917d8d6",
    "bytes": 300724,
    "weight": [
      400,
      900
    ],
    "axes": [
      "wght"
    ]
  },
  "6157dfaa640c/ofl/schibstedgrotesk/SchibstedGrotesk[wght].ttf": {
    "sha256": "6ceeadf6be8e1fd7687011c7fa38ed0edd1abe967a0b73d97caec183552e823d",
    "bytes": 176068,
    "weight": [
      400,
      900
    ],
    "axes": [
      "wght"
    ]
  },
  "6157dfaa640c/ofl/sourceserif4/SourceSerif4-Italic[opsz,wght].ttf": {
    "sha256": "15fbc7e4679489a501998c3669272637a6646388ef7e4bd77eebb5bf967a1f42",
    "bytes": 855432,
    "weight": [
      200,
      900
    ],
    "axes": [
      "wght",
      "opsz"
    ]
  },
  "6157dfaa640c/ofl/sourceserif4/SourceSerif4[opsz,wght].ttf": {
    "sha256": "97b2d4da6e3cb494b5a1e66ae176914d852ccabef49e0c02c0df25f3e39aca0b",
    "bytes": 1209508,
    "weight": [
      200,
      900
    ],
    "axes": [
      "wght",
      "opsz"
    ]
  },
  "6157dfaa640c/ofl/spacegrotesk/SpaceGrotesk[wght].ttf": {
    "sha256": "acad6de1fc93436f5c0f1f4137751ef04f1aea3063e7036535970ffcfbd79f72",
    "bytes": 136676,
    "weight": [
      300,
      700
    ],
    "axes": [
      "wght"
    ]
  },
  "6157dfaa640c/ofl/zcoolxiaowei/ZCOOLXiaoWei-Regular.ttf": {
    "sha256": "a42b620140f493db42f741351dfbf343c0936d58588ee8004b8b2a218d997ff1",
    "bytes": 6313808,
    "weight": [
      400,
      400
    ],
    "axes": []
  }
})

// ---------- 命令行（被其他脚本 import 时不执行） ----------
import { fileURLToPath as __toPath } from 'node:url'
import { resolve as __resolve } from 'node:path'
if (process.argv[1] && __toPath(import.meta.url) === __resolve(process.argv[1])) {
  // 用法：
  //   node scripts/fonts.mjs list                       列出清单里的字体
  //   node scripts/fonts.mjs fetch [id…|--in-use|--all]   下载到本地缓存并写 lock.json
  //   node scripts/fonts.mjs link id…                   打印在线引用的 <link>
  //   node scripts/fonts.mjs embed in.html [-o out.html] 把在线字体换成按需子集的内联字体
  //   node scripts/fonts.mjs add <id> "<Family>" 文件… [--category serif|sans|mono|display] [--script latin|cjk]
  //                                                     登记本机字体：只内置、不进在线链接
  
  const [cmd, ...args] = process.argv.slice(2)
  const log = (m) => console.error(m)
  const kb = (n) => `${(n / 1024).toFixed(1)}KB`
  
  async function main() {
    const { fonts } = await loadManifest()
    if (cmd === 'list') {
      for (const f of fonts) console.log(`${f.id.padEnd(20)} ${f.family.padEnd(20)} ${f.category.padEnd(6)} ${f.script.padEnd(6)} ${f.status}${f.local ? '（只内置，不分发）' : ''}${f.note ? '  ' + f.note : ''}`)
    } else if (cmd === 'fetch') {
      const ids = args.includes('--all') ? fonts.map((f) => f.id)
        : args.includes('--in-use') || args.length === 0 ? fonts.filter((f) => f.status === 'in-use').map((f) => f.id)
        : args
      for (const id of ids) {
        const files = await fetchFont(id, { log })
        console.log(`${id.padEnd(20)} ${files.map((f) => `${f.style} wght ${f.weight.join('–')} ${kb(f.buffer.length)}`).join(' | ')}`)
      }
    } else if (cmd === 'add') {
      const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d)
      const [id, family, ...rest] = args
      const files = rest.filter((a, i) => !a.startsWith('--') && !rest[i - 1]?.startsWith('--'))
      if (!id || !family || !files.length) throw new Error('用法：fonts.mjs add <id> "<Family>" 文件… [--category …] [--script …]')
      const r = await addUserFont({ id, family, files, category: opt('--category', 'sans'), script: opt('--script', 'latin') })
      console.log(`已登记 ${family}（${r.files.length} 个文件）→ ${r.path}`)
      console.log(`在主题或页面里把它放到字体栈最前面，例如 --font-display:'${family}',<原来的栈>；分享出去时会自动落回原来的字体`)
    } else if (cmd === 'link') {
      console.log(await fontLinkTag(args))
    } else if (cmd === 'embed') {
      const [input] = args
      const o = args.indexOf('-o')
      const output = o >= 0 ? args[o + 1] : input.replace(/\.html?$/, '.embedded.html')
      const { html, report } = await embedFonts(await readFile(input, 'utf8'), { log })
      await writeFile(output, html)
      for (const r of report) console.log(`${r.id.padEnd(20)} ${r.style.padEnd(7)} ${kb(r.sourceBytes).padStart(10)} → ${kb(r.bytes)}`)
      console.log(`合计内置 ${kb(report.reduce((s, r) => s + r.bytes, 0))} → ${output}`)
    } else {
      console.error('用法：fonts.mjs list | fetch [id…|--in-use|--all] | link id… | embed in.html [-o out.html] | add <id> "<Family>" 文件…')
      process.exit(1)
    }
  }
  
  main().catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
  
}

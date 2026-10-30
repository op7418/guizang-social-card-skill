#!/usr/bin/env node
// 渲染卡片（guizang-design 生成，不要手改；源文件在 guizang-design/skill-scripts/card/render.mjs）
//
//   node <SKILL_ROOT>/scripts/render.mjs <任务目录|index.html> [--out output] [--no-embed] [--only xhs-01,wechat-1x1]
//
// 1. 字体内置：按页面实际用字把字体子集化写进 HTML（首次使用会下载字体到本机缓存），之后离线渲染、结果不受网络影响。
//    本机登记的商业字体（scripts/gz-fonts.mjs add）也在这一步内置。--no-embed 跳过，改用在线字体。
// 2. 等字体、背景特效（定格帧）和图标就绪。
// 3. 每张 .poster 按画板原始尺寸截成 PNG，写到 <任务目录>/output/<id>.png；有 .pair-preview 时另存一张预览图。
// 4. 核对每张图的尺寸是否等于画板尺寸（小红书 1080×1440、方形 1080×1080、宽幅 2100×900）。
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { embedFonts } from './gz-fonts.mjs'

const args = process.argv.slice(2)
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d)
const target = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.match(/^--(out|only)$/))
if (!target) {
  console.error('用法：node scripts/render.mjs <任务目录|index.html> [--out output] [--no-embed] [--only id,id]')
  process.exit(1)
}
const input = resolve(target)
const htmlPath = existsSync(input) && statSync(input).isDirectory() ? join(input, 'index.html') : input
const dir = dirname(htmlPath)
const outDir = resolve(dir, opt('--out', 'output'))
const only = opt('--only', '')?.split(',').filter(Boolean)
const BOARDS = { xhs: [1080, 1440], square: [1080, 1080], wide: [2100, 900] }

const SKILL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
let html = readFileSync(htmlPath, 'utf8')
// 模板里截图底图写的是相对 skill 的路径（../assets/screenshot-backgrounds/），任务目录里加载不到：渲染时换成 skill 目录下的实际文件
html = html.replaceAll('../assets/screenshot-backgrounds/', pathToFileURL(join(SKILL_ROOT, 'assets/screenshot-backgrounds/')).href)
if (!args.includes('--no-embed')) {
  try {
    const r = await embedFonts(html, { log: (m) => console.log('  ' + m) })
    html = r.html
    if (r.report.length) console.log(`字体内置：${r.report.map((f) => f.id).filter((v, i, a) => a.indexOf(v) === i).join('、')}，合计 ${(r.report.reduce((s, f) => s + f.bytes, 0) / 1024).toFixed(0)}KB`)
  } catch (e) {
    console.warn(`字体内置失败，改用在线字体：${e.message}`)
  }
}
// 渲染用的临时文件和原文件放在同一目录，相对路径（assets/…）照常可用
const tmp = join(dir, `.render-${process.pid}.html`)
writeFileSync(tmp, html)
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
try {
  const page = await browser.newPage({ viewport: { width: 2400, height: 1600 }, deviceScaleFactor: 1 })
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    await document.fonts.ready
    if (window.GZEffects) await window.GZEffects.ready
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons()
  })
  await page.waitForTimeout(600)
  // 配对预览（2100 + 1080 + 间距）比默认窗口宽：按页面实际宽度把窗口加宽，元素截图才不会被裁
  const need = await page.evaluate(() => Math.ceil(document.documentElement.scrollWidth))
  if (need > 2400) { await page.setViewportSize({ width: need, height: 1600 }); await page.waitForTimeout(300) }
  const list = await page.evaluate(() => [...document.querySelectorAll('.poster')]
    .filter((p) => !p.closest('.pair-preview'))
    .map((p, i) => ({ id: p.id || `poster-${i + 1}`, board: ['xhs', 'square', 'wide'].find((b) => p.classList.contains(b)) })))
  const outside = []
  for (const el of await page.$$('.poster')) if (!(await el.evaluate((p) => !!p.closest('.pair-preview')))) outside.push(el)
  const problems = []
  for (const [i, el] of outside.entries()) {
    const { id, board } = list[i]
    if (only.length && !only.includes(id)) continue
    const box = await el.boundingBox()
    const file = join(outDir, `${id}.png`)
    await el.screenshot({ path: file })
    const want = BOARDS[board]
    const got = [Math.round(box.width), Math.round(box.height)]
    if (want && (got[0] !== want[0] || got[1] !== want[1])) problems.push(`${id}：${got.join('×')}，应为 ${want.join('×')}`)
    console.log(`${id}.png  ${got.join('×')}`)
  }
  const pair = await page.$('.pair-preview')
  if (pair && !only.length) {
    await pair.screenshot({ path: join(outDir, 'wechat-cover-pair-preview.png') })
    console.log('wechat-cover-pair-preview.png')
  }
  if (problems.length) {
    console.error('尺寸不对：\n  ' + problems.join('\n  '))
    process.exitCode = 1
  }
  console.log(`→ ${outDir}`)
} finally {
  await browser.close()
  rmSync(tmp, { force: true })
}

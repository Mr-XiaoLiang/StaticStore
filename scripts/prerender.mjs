import fs from 'node:fs'
import path from 'node:path'

/**
 * 构建后处理：为每个应用生成可直达、可分享的静态壳。
 *
 * GitHub Pages 没有服务端，history 模式直达会 404，
 * 因此每个应用目录下写一份 index.html（内容与首页同构，由 Vue 接管），
 * 再补一份 404.html 兜底，保证任何深链都能落到应用内。
 */

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const INDEX = path.join(DIST, 'index.html')
const CATALOG = path.join(ROOT, 'src', 'generated', 'catalog.json')

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function withMeta(html, { title, description, url }) {
  const head = [
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`
  ].join('\n    ')

  const noscript = `<noscript><div style="max-width:640px;margin:120px auto;padding:0 24px;font-family:-apple-system,'PingFang SC',sans-serif;color:#ECEDF3"><h1 style="font-size:20px;font-weight:600">${escapeHtml(
    title
  )}</h1><p style="margin-top:12px;line-height:1.7;color:rgba(236,237,243,.7)">${escapeHtml(
    description
  )}</p><p style="margin-top:12px"><a href="${escapeHtml(url)}" style="color:#E8C97A">${escapeHtml(
    url
  )}</a></p></div></noscript>`

  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace('</head>', `  ${head}\n  </head>`)
    .replace('<div id="app"></div>', `${noscript}\n    <div id="app"></div>`)
}

function main() {
  if (!fs.existsSync(INDEX)) {
    throw new Error('未找到 dist/index.html，请先执行 vite build')
  }
  if (!fs.existsSync(CATALOG)) {
    throw new Error('未找到 src/generated/catalog.json，请先执行 build-data')
  }

  const html = fs.readFileSync(INDEX, 'utf8')
  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'))
  const { site } = catalog

  let count = 0
  for (const app of catalog.apps) {
    const dir = path.join(DIST, 'apps', app.id)
    fs.mkdirSync(dir, { recursive: true })

    const description = app.version
      ? `${app.summary}。最新版本 ${app.version}，${app.publishedAt.slice(0, 10)} 发布。`
      : app.summary

    fs.writeFileSync(
      path.join(dir, 'index.html'),
      withMeta(html, {
        title: `${app.name} · ${site.title}`,
        description,
        url: app.pageUrl
      })
    )
    count += 1
  }

  // 兜底：未知路径交给前端路由
  fs.copyFileSync(INDEX, path.join(DIST, '404.html'))

  // CNAME 以仓库根目录那份为准：GitHub 在分支部署时读根目录，
  // Actions 部署时读产物根目录，因此构建时复制一份进 dist，两处一致。
  const rootCname = path.join(ROOT, 'CNAME')
  const domain = fs.existsSync(rootCname)
    ? fs.readFileSync(rootCname, 'utf8').trim()
    : site.domain

  if (domain) {
    fs.writeFileSync(path.join(DIST, 'CNAME'), `${domain}\n`)
  }

  console.log(`[prerender] 生成 ${count} 个应用静态壳，并写入 404.html 与 CNAME（${domain || '未设置'}）`)
}

try {
  main()
} catch (err) {
  console.error(`[prerender] ${err.message}`)
  process.exit(1)
}

import fs from 'node:fs'
import path from 'node:path'
import { ConfigError, loadConfig, syncIcons } from './load-config.mjs'

/**
 * 合并「人工清单」与「最新一次发布」，产出三份消费方数据：
 *   1. src/generated/catalog.json  —— 页面内联，运行时零请求
 *   2. public/api/v1/index.json    —— 全量摘要，供客户端检查更新
 *   3. public/api/v1/apps/<id>.json 与 latest.json —— 单应用与最近更新流
 *
 * 产物不再手工匹配：按配置声明的平台，用固定的扩展名规则检索该平台的安装包；
 * 检索不到的平台直接不展示。取数失败的仓库整条跳过，全部失败才中止构建。
 */

const ROOT = process.cwd()
const CACHE_FILE = path.join(ROOT, '.cache', 'releases.json')
const CATALOG_FILE = path.join(ROOT, 'src', 'generated', 'catalog.json')
const API_DIR = path.join(ROOT, 'public', 'api', 'v1')

const args = new Set(process.argv.slice(2))
const local = args.has('--local')

const SCHEMA_VERSION = 2

/** 每个平台认哪些产物，按先后顺序取第一个有命中的扩展名 */
const PLATFORM_ASSETS = {
  android: ['apk'],
  ios: ['ipa'],
  wear: ['apk'],
  windows: ['msi', 'exe', 'msix', 'zip'],
  macos: ['dmg', 'pkg', 'zip'],
  linux: ['appimage', 'deb', 'rpm', 'tar.gz', 'zip'],
  web: ['zip']
}

/** 校验表、映射表、调试包一律不算安装包 */
const IGNORED_ASSET = /(debug|mapping|symbols|checksum)/i

const DEFAULT_VERSION_CODE = /versionCode\s*[：:=]\s*(\d+)/i

function assetExtension(name) {
  const lower = String(name).toLowerCase()
  if (lower.endsWith('.tar.gz')) return 'tar.gz'
  const dot = lower.lastIndexOf('.')
  return dot === -1 ? '' : lower.slice(dot + 1)
}

function packageFormat(name) {
  return assetExtension(name)
}

function installKind(platform) {
  if (platform === 'wear') return 'wear-sideload'
  if (platform === 'ios') return 'ios-sideload'
  if (platform === 'android') return 'direct'
  if (platform === 'web') return 'archive'
  return 'installer'
}

/** 配置里只写图标文件名，产物统一挂在 /icons/ 下 */
function iconUrl(file) {
  return file ? `icons/${file}` : ''
}

/**
 * 发布标签转成显示版本：去掉前导 v；
 * 按模块打标签的仓库（FileBrowser-1.0.0）只取结尾的版本段。
 */
function versionFromTag(tag) {
  const raw = String(tag || '').replace(/^[vV]/, '')
  const tail = raw.match(/(\d+(?:\.\d+)*)$/)
  return tail && tail[0] !== raw ? tail[0] : raw
}

function extractVersionCode(notes) {
  const match = String(notes || '').match(DEFAULT_VERSION_CODE)
  if (!match) return null
  const value = Number(match[1])
  return Number.isFinite(value) ? value : null
}

function pickAsset(assets, platform) {
  const extensions = PLATFORM_ASSETS[platform] || []
  for (const ext of extensions) {
    const matched = assets.filter(
      (asset) => assetExtension(asset.name) === ext && !IGNORED_ASSET.test(asset.name)
    )
    if (matched.length) {
      // 同类型有多个时取体积最大的，避免把校验文件当安装包
      return matched.slice().sort((a, b) => b.size - a.size)[0]
    }
  }
  return null
}

function buildVariants(app, release, warnings) {
  if (!release) return []

  const variants = []
  for (const platform of app.platforms) {
    const asset = pickAsset(release.assets || [], platform)
    if (!asset) {
      warnings.push(`${app.id} 未在最新发布中找到 ${platform} 平台的可安装产物，该平台已隐藏`)
      continue
    }
    variants.push({
      platform,
      format: packageFormat(asset.name),
      install: installKind(platform),
      download: {
        fileName: asset.name,
        size: asset.size,
        url: asset.downloadUrl,
        downloadCount: asset.downloadCount
      }
    })
  }
  return variants
}

function buildApp(app, release, site, warnings) {
  const variants = buildVariants(app, release, warnings)
  const platforms = variants.map((variant) => variant.platform)

  return {
    id: app.id,
    repository: app.repository,
    owner: app.owner,
    repo: app.repo,
    name: app.name,
    summary: app.summary,
    description: app.description,
    platforms,
    variants,
    tags: app.tags,
    emoji: app.emoji,
    icon: iconUrl(app.icon),
    version: release ? versionFromTag(release.tag) : '',
    tag: release ? release.tag : '',
    versionCode: release ? extractVersionCode(release.notes) : null,
    publishedAt: release ? release.publishedAt : '',
    notes: release ? release.notes : '',
    releaseUrl: release ? release.releaseUrl : '',
    releasesUrl: `https://github.com/${app.owner}/${app.repo}/releases`,
    pageUrl: `https://${site.domain}/apps/${app.id}/`
  }
}

function toSummary(app) {
  return {
    id: app.id,
    name: app.name,
    summary: app.summary,
    repository: app.repository,
    platforms: app.platforms,
    variants: app.variants.map((variant) => ({
      platform: variant.platform,
      format: variant.format,
      install: variant.install,
      size: variant.download.size,
      fileName: variant.download.fileName,
      url: variant.download.url
    })),
    tags: app.tags,
    emoji: app.emoji,
    icon: app.icon,
    version: app.version,
    versionCode: app.versionCode,
    publishedAt: app.publishedAt,
    page: app.pageUrl,
    releases: app.releasesUrl
  }
}

function readCache() {
  if (!fs.existsSync(CACHE_FILE)) {
    if (!local) {
      throw new Error(
        `未找到发布数据 ${path.relative(ROOT, CACHE_FILE)}，请先运行 npm run data（或 npm run data:local）`
      )
    }
    console.warn('[build] 未找到发布数据，按「暂无发布」生成，仅适合调试界面')
    return { fetchedAt: null, repos: {}, failed: {} }
  }
  return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
}

function main() {
  const { site, apps } = loadConfig()

  const iconFiles = syncIcons()
  const usedIcons = new Set(apps.map((app) => app.icon).filter(Boolean))
  const unusedIcons = iconFiles.filter((file) => !usedIcons.has(file))
  if (unusedIcons.length) {
    console.warn(`[build] app/icons 中有未被引用的图标：${unusedIcons.join(', ')}`)
  }

  const cache = readCache()
  const repos = cache.repos || {}
  const warnings = []
  const skipped = []

  const built = []
  for (const app of apps) {
    const key = `${app.owner}/${app.repo}`
    if (!(key in repos)) {
      const reason = cache.failed?.[key] || '未取到发布数据'
      skipped.push(`${app.id}（${key}）：${reason}`)
      continue
    }

    const entry = buildApp(app, repos[key], site, warnings)
    // 没有安装包的项目不收录，商店只陈列可下载的内容
    if (!entry.variants.length) {
      skipped.push(`${app.id}（${key}）：最新发布中没有可识别的安装包`)
      continue
    }
    built.push(entry)
  }

  if (!built.length) {
    const detail = skipped.length ? `\n  - ${skipped.join('\n  - ')}` : ''
    throw new Error(`没有任何应用取得可用数据，构建中止${detail}`)
  }

  if (warnings.length) {
    warnings.forEach((message) => console.warn(`[build] ${message}`))
  }
  if (skipped.length) {
    console.warn(`[build] 跳过 ${skipped.length} 个应用：`)
    skipped.forEach((message) => console.warn(`  - ${message}`))
  }

  const generatedAt = new Date().toISOString()
  const summaries = built.map(toSummary)

  const catalog = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    fetchedAt: cache.fetchedAt || null,
    site,
    apps: built
  }

  fs.mkdirSync(path.dirname(CATALOG_FILE), { recursive: true })
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2))

  // 先清空接口目录：应用标识由仓库名推导，改动仓库或删除条目后不能留下旧文件
  fs.rmSync(API_DIR, { recursive: true, force: true })
  fs.mkdirSync(path.join(API_DIR, 'apps'), { recursive: true })

  fs.writeFileSync(
    path.join(API_DIR, 'index.json'),
    JSON.stringify({ schemaVersion: SCHEMA_VERSION, updatedAt: generatedAt, apps: summaries }, null, 2)
  )

  for (const summary of summaries) {
    const detail = built.find((item) => item.id === summary.id)
    fs.writeFileSync(
      path.join(API_DIR, 'apps', `${summary.id}.json`),
      JSON.stringify(
        {
          schemaVersion: SCHEMA_VERSION,
          updatedAt: generatedAt,
          app: {
            ...summary,
            description: detail.description,
            notes: detail.notes,
            history: detail.releasesUrl
          }
        },
        null,
        2
      )
    )
  }

  const recent = summaries
    .filter((item) => item.publishedAt)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

  fs.writeFileSync(
    path.join(API_DIR, 'latest.json'),
    JSON.stringify({ schemaVersion: SCHEMA_VERSION, updatedAt: generatedAt, apps: recent }, null, 2)
  )

  const variantCount = summaries.reduce((sum, item) => sum + item.variants.length, 0)
  console.log(
    `[build] 收录 ${summaries.length} 个应用，共 ${variantCount} 个平台产物；数据时间 ${generatedAt}`
  )
  console.log(`[build] 图标 ${iconFiles.length} 个已同步到 public/icons/`)
  console.log(`[build] 页面数据 ${path.relative(ROOT, CATALOG_FILE)}`)
  console.log(`[build] 静态接口 ${path.relative(ROOT, API_DIR)}/`)
}

try {
  main()
} catch (err) {
  if (err instanceof ConfigError) {
    console.error('[build] 配置校验失败：')
    err.messages.forEach((msg) => console.error(`  - ${msg}`))
  } else {
    console.error(`[build] ${err.message}`)
  }
  process.exit(1)
}

import fs from 'node:fs'
import path from 'node:path'

/**
 * 读取并校验 app/apps.json。
 *
 * 结构刻意保持扁平：应用是数组，仓库写完整地址，平台写数组，
 * 产物不再手工匹配，而是按平台使用固定的扩展名规则自动检索。
 *
 * 校验失败一律抛出 ConfigError，由调用方以非零状态退出，
 * 错误信息按 JSON 路径定位到具体字段。
 */

const ROOT = process.cwd()
const CONFIG_PATH = path.join(ROOT, 'app', 'apps.json')
const ICON_DIR = path.join(ROOT, 'app', 'icons')
const PUBLIC_ICON_DIR = path.join(ROOT, 'public', 'icons')

/** 平台名允许大小写与常见写法，内部统一成小写标识 */
const PLATFORM_ALIASES = new Map([
  ['android', 'android'],
  ['ios', 'ios'],
  ['iphone', 'ios'],
  ['ipados', 'ios'],
  ['wear', 'wear'],
  ['wearos', 'wear'],
  ['wear os', 'wear'],
  ['windows', 'windows'],
  ['win', 'windows'],
  ['macos', 'macos'],
  ['mac os', 'macos'],
  ['mac', 'macos'],
  ['macosx', 'macos'],
  ['linux', 'linux'],
  ['web', 'web']
])

export const PLATFORM_ORDER = ['android', 'ios', 'wear', 'windows', 'macos', 'linux', 'web']

export class ConfigError extends Error {
  constructor(messages) {
    super(messages.join('\n'))
    this.name = 'ConfigError'
    this.messages = messages
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && Boolean(value.trim())
}

/** 仓库地址转成 owner / repo，接受 https、git@ 与省略协议的写法 */
function parseRepository(value) {
  if (!isNonEmptyString(value)) return null

  const trimmed = value.trim().replace(/\.git$/, '').replace(/\/+$/, '')
  const match = trimmed.match(/github\.com[/:]([^/\s]+)\/([^/\s]+)$/i)
  if (!match) return null

  return { owner: match[1], repo: match[2] }
}

/** 仓库名转页面标识：MediaFlow → media-flow，LQR → lqr */
function slugify(name) {
  return String(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizePlatforms(value, errors, appPath) {
  const list = Array.isArray(value) ? value : [value]
  if (!list.length) {
    errors.push(`${appPath}.platform 至少要写一个平台，可选值为 ${PLATFORM_ORDER.join(' / ')}`)
    return []
  }

  const out = []
  for (const item of list) {
    if (typeof item !== 'string') {
      errors.push(`${appPath}.platform 必须是字符串数组`)
      continue
    }
    const key = PLATFORM_ALIASES.get(item.trim().toLowerCase())
    if (!key) {
      errors.push(
        `${appPath}.platform 取值非法：${JSON.stringify(item)}，可选值为 Android / iOS / WearOS / Windows / MacOS / Linux`
      )
      continue
    }
    if (!out.includes(key)) out.push(key)
  }

  return out.sort((a, b) => PLATFORM_ORDER.indexOf(a) - PLATFORM_ORDER.indexOf(b))
}

function checkIcon(errors, appPath, file) {
  if (file === undefined || file === '') return
  if (typeof file !== 'string') {
    errors.push(`${appPath}.icon 必须是文件名字符串，例如 "mediaflow.png"`)
    return
  }
  if (file.includes('/') || file.includes('\\')) {
    errors.push(`${appPath}.icon 只写文件名，不要写目录：当前为 ${JSON.stringify(file)}`)
    return
  }
  if (!fs.existsSync(path.join(ICON_DIR, file))) {
    errors.push(
      `${appPath}.icon 指向的文件不存在：app/icons/${file}（请把图标放进 app/icons，或删除该字段改用 emoji）`
    )
  }
}

export function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new ConfigError([`未找到配置文件：${CONFIG_PATH}`])
  }

  let data
  try {
    data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  } catch (err) {
    throw new ConfigError([`app/apps.json 不是合法的 JSON：${err.message}`])
  }

  const errors = []

  if (!isPlainObject(data.site)) errors.push('site 缺失或不是对象')
  if (!Array.isArray(data.apps)) errors.push('apps 必须是数组')
  else if (!data.apps.length) errors.push('apps 为空，至少需要收录一个应用')

  const site = data.site || {}
  for (const field of ['title', 'domain']) {
    if (!isNonEmptyString(site[field])) errors.push(`site.${field} 必须是非空字符串`)
  }
  if (site.about !== undefined && !isNonEmptyString(site.about)) {
    errors.push('site.about 必须是非空字符串')
  }

  const ids = new Set()
  const seen = new Set()

  const apps = (Array.isArray(data.apps) ? data.apps : []).map((value, index) => {
    const appPath = `apps[${index}]`

    if (!isPlainObject(value)) {
      errors.push(`${appPath} 必须是对象`)
      return { id: `invalid-${index}` }
    }

    const parsed = parseRepository(value.repository)
    if (!parsed) {
      errors.push(
        `${appPath}.repository 必须是 GitHub 仓库地址，例如 https://github.com/Mr-XiaoLiang/MediaFlow`
      )
    }

    const repoKey = parsed ? `${parsed.owner}/${parsed.repo}`.toLowerCase() : ''
    if (repoKey) {
      if (seen.has(repoKey)) {
        errors.push(`${appPath}.repository 与前面的条目重复：${value.repository}`)
      }
      seen.add(repoKey)
    }

    if (!isNonEmptyString(value.name)) errors.push(`${appPath}.name 必须是非空字符串`)
    if (!isNonEmptyString(value.summary)) errors.push(`${appPath}.summary 必须是非空字符串`)

    if (value.description !== undefined && typeof value.description !== 'string') {
      errors.push(`${appPath}.description 必须是字符串`)
    }
    if (value.emoji !== undefined && typeof value.emoji !== 'string') {
      errors.push(`${appPath}.emoji 必须是字符串`)
    }
    if (!Array.isArray(value.tags) || value.tags.some((tag) => typeof tag !== 'string')) {
      errors.push(`${appPath}.tags 必须是字符串数组`)
    }

    checkIcon(errors, appPath, value.icon)

    const platforms = normalizePlatforms(value.platform, errors, appPath)

    const id = slugify(parsed?.repo || value.name || '')
    if (!id) {
      errors.push(`${appPath} 无法生成页面标识，请检查 repository 与 name`)
    } else if (ids.has(id)) {
      errors.push(`${appPath} 生成的标识重复：${id}，请调整仓库名或顺序`)
    }
    ids.add(id)

    return {
      id: id || `invalid-${index}`,
      repository: value.repository,
      owner: parsed?.owner || '',
      repo: parsed?.repo || '',
      name: value.name,
      summary: value.summary,
      description: value.description || '',
      platforms,
      tags: Array.isArray(value.tags) ? value.tags : [],
      emoji: value.emoji || '',
      icon: value.icon || ''
    }
  })

  if (errors.length) throw new ConfigError(errors)

  return { site, apps }
}

/**
 * 把 app/icons/ 同步到 public/icons/。
 * 每次构建先清空目标目录，避免删除图标后产物里留下孤儿文件。
 */
export function syncIcons() {
  fs.rmSync(PUBLIC_ICON_DIR, { recursive: true, force: true })
  fs.mkdirSync(PUBLIC_ICON_DIR, { recursive: true })

  if (!fs.existsSync(ICON_DIR)) return []

  const files = fs
    .readdirSync(ICON_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)

  for (const file of files) {
    fs.copyFileSync(path.join(ICON_DIR, file), path.join(PUBLIC_ICON_DIR, file))
  }

  return files
}

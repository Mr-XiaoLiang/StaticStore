import fs from 'node:fs'
import path from 'node:path'
import { ConfigError, loadConfig } from './load-config.mjs'

/**
 * 构建期取数：每个仓库只取最新一次发布。
 *
 * 两条通道：
 *   - 有令牌时走 GraphQL，一次请求取回全部仓库；
 *   - 没有令牌（本地调试）时走 REST 的 releases/latest，逐仓库一次请求。
 *
 * 失败语义：单个仓库取不到（不存在、私有无权、接口报错）只跳过该仓库，
 * 其余仓库照常生成；全部仓库都失败才让工作流失败。
 * 仓库存在但没有发布记录属于正常情况，记为 null。
 */

const ROOT = process.cwd()
const CACHE_DIR = path.join(ROOT, '.cache')
const CACHE_FILE = path.join(CACHE_DIR, 'releases.json')
const FRESH_MS = 6 * 60 * 60 * 1000
const BATCH = 40

const args = new Set(process.argv.slice(2))
const forceRest = args.has('--rest')
const force = args.has('--force')

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''

function readCache() {
  if (!fs.existsSync(CACHE_FILE)) return null
  const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
  if (!data || !data.repos) return null
  return data
}

function isFresh(cache) {
  if (!cache.fetchedAt) return false
  return Date.now() - new Date(cache.fetchedAt).getTime() < FRESH_MS
}

function normalizeAssets(nodes) {
  return (nodes || []).map((asset) => ({
    name: asset.name,
    size: asset.size,
    downloadUrl: asset.downloadUrl,
    downloadCount: asset.downloadCount
  }))
}

function toRelease(release) {
  return {
    tag: release.tagName,
    publishedAt: release.publishedAt,
    notes: release.description || '',
    releaseUrl: release.url,
    assets: normalizeAssets(release.releaseAssets?.nodes)
  }
}

/** GraphQL 别名批量取数，单个别名出错只影响该仓库 */
async function fetchGraphQL(repos, collected, failed) {
  const lines = repos.map(
    (item, index) => `  r${index}: repository(owner: ${JSON.stringify(item.owner)}, name: ${JSON.stringify(item.repo)}) {
    name
    latestRelease {
      tagName
      publishedAt
      description
      url
      releaseAssets(first: 30) { nodes { name size downloadUrl downloadCount } }
    }
  }`
  )

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'lollipop-store-build'
    },
    body: JSON.stringify({ query: `query {\n${lines.join('\n')}\n}` })
  })

  if (!res.ok) {
    const text = await res.text()
    const reason = `GraphQL HTTP ${res.status}`
    repos.forEach((item) => {
      failed[item.key] = reason
    })
    console.warn(`[fetch] ${reason}：${text.slice(0, 200)}`)
    return
  }

  const payload = await res.json()
  const errorPaths = new Set(
    (payload.errors || [])
      .map((error) => (Array.isArray(error.path) ? error.path[0] : null))
      .filter(Boolean)
  )

  repos.forEach((item, index) => {
    const alias = `r${index}`
    const node = payload.data?.[alias]

    if (!node || errorPaths.has(alias)) {
      const detail =
        (payload.errors || []).find((error) => error.path?.[0] === alias)?.message ||
        '仓库不存在或无权访问'
      failed[item.key] = detail
      return
    }

    collected[item.key] = node.latestRelease ? toRelease(node.latestRelease) : null
  })
}

/** REST 通道：逐个仓库取，单个失败只记录原因 */
async function fetchRest(repos, collected, failed) {
  for (const item of repos) {
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'lollipop-store-build'
    }
    if (token) headers.Authorization = `Bearer ${token}`

    try {
      const res = await fetch(
        `https://api.github.com/repos/${item.owner}/${item.repo}/releases/latest`,
        { headers }
      )

      if (res.status === 404) {
        // 仓库不存在、私有无权、没有发布，三者都返回 404，再确认一次仓库本身
        const repoRes = await fetch(`https://api.github.com/repos/${item.owner}/${item.repo}`, {
          headers
        })
        if (repoRes.status === 404) {
          failed[item.key] = '仓库不存在或无权访问'
        } else if (repoRes.ok) {
          collected[item.key] = null
        } else {
          failed[item.key] = `HTTP ${repoRes.status}`
        }
        continue
      }

      if (!res.ok) {
        failed[item.key] = `HTTP ${res.status}`
        continue
      }

      const release = await res.json()
      collected[item.key] = {
        tag: release.tag_name,
        publishedAt: release.published_at,
        notes: release.body || '',
        releaseUrl: release.html_url,
        assets: normalizeAssets(
          (release.assets || []).map((asset) => ({
            name: asset.name,
            size: asset.size,
            downloadUrl: asset.browser_download_url,
            downloadCount: asset.download_count
          }))
        )
      }
    } catch (err) {
      failed[item.key] = err.message
    }
  }
}

async function main() {
  const { apps } = loadConfig()

  const items = []
  const seen = new Set()
  for (const app of apps) {
    const key = `${app.owner}/${app.repo}`
    if (seen.has(key.toLowerCase())) continue
    seen.add(key.toLowerCase())
    items.push({ key, owner: app.owner, repo: app.repo })
  }

  const cache = readCache()
  if (cache && !force && isFresh(cache)) {
    console.log(`[fetch] 缓存仍在有效期内（${cache.fetchedAt}），跳过取数`)
    return
  }

  const useGraphQL = Boolean(token) && !forceRest
  console.log(
    `[fetch] ${items.length} 个仓库，通道：${useGraphQL ? 'GraphQL（单次请求）' : 'REST（逐仓库）'}`
  )

  const collected = {}
  const failed = {}

  if (useGraphQL) {
    for (let i = 0; i < items.length; i += BATCH) {
      const slice = items.slice(i, i + BATCH)
      await fetchGraphQL(slice, collected, failed)
      console.log(`[fetch] 已处理 ${Math.min(i + BATCH, items.length)}/${items.length}`)
    }
  } else {
    await fetchRest(items, collected, failed)
  }

  const succeeded = Object.keys(collected)
  if (!succeeded.length) {
    const detail = Object.entries(failed)
      .map(([key, reason]) => `  - ${key}：${reason}`)
      .join('\n')
    throw new Error(`全部仓库取数失败，构建中止：\n${detail}`)
  }

  const skipped = Object.entries(failed)
  if (skipped.length) {
    console.warn(`[fetch] 跳过 ${skipped.length} 个仓库：`)
    skipped.forEach(([key, reason]) => console.warn(`  - ${key}：${reason}`))
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(
    CACHE_FILE,
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        repos: collected,
        failed
      },
      null,
      2
    )
  )
  console.log(`[fetch] 成功 ${succeeded.length} 个，跳过 ${skipped.length} 个，写入 ${path.relative(ROOT, CACHE_FILE)}`)
}

main().catch((err) => {
  if (err instanceof ConfigError) {
    console.error('[fetch] 配置校验失败：')
    err.messages.forEach((msg) => console.error(`  - ${msg}`))
  } else {
    console.error(`[fetch] ${err.message}`)
  }
  process.exit(1)
})

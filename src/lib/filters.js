export const SORTS = [
  { id: 'recent', label: '最近更新' },
  { id: 'name', label: '名称' },
  { id: 'size', label: '体积' }
]

export const PLATFORMS = [
  { id: 'all', label: '全部' },
  { id: 'android', label: 'Android' },
  { id: 'ios', label: 'iOS' },
  { id: 'wear', label: 'WearOS' },
  { id: 'windows', label: 'Windows' },
  { id: 'macos', label: 'macOS' },
  { id: 'linux', label: 'Linux' }
]

function matchesQuery(app, query) {
  if (!query) return true
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const haystack = [app.name, app.summary, app.repo, ...(app.tags || [])]
    .join(' ')
    .toLowerCase()
  return haystack.includes(needle)
}

/** 多平台应用取最大安装包体积，用于「按体积」排序 */
function packageSize(app) {
  return (app.variants || []).reduce((max, variant) => Math.max(max, variant.download.size), 0)
}

export function applyFilters(list, { query = '', platform = 'all', tag = '', sort = 'recent' } = {}) {
  const filtered = list.filter((app) => {
    if (platform !== 'all' && !(app.platforms || []).includes(platform)) return false
    if (tag && !(app.tags || []).includes(tag)) return false
    return matchesQuery(app, query)
  })

  return filtered.slice().sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'zh-Hans-CN')
    if (sort === 'size') return packageSize(b) - packageSize(a)
    const at = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const bt = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return bt - at
  })
}

export function collectTags(list) {
  const counter = new Map()
  for (const app of list) {
    for (const tag of app.tags || []) {
      counter.set(tag, (counter.get(tag) || 0) + 1)
    }
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hans-CN'))
    .map(([tag, count]) => ({ tag, count }))
}

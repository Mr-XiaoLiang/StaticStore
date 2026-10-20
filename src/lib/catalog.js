import catalog from '../generated/catalog.json'

/**
 * 页面数据在构建期就已定型并内联进产物，
 * 运行时只读取这里的静态对象，不发起任何外部请求。
 */
export const site = catalog.site
/** 没有安装包的项目不进商店：卡片、筛选、接口都只针对有产物的应用 */
export const apps = catalog.apps.filter((app) => (app.variants || []).length > 0)
export const generatedAt = catalog.generatedAt
export const fetchedAt = catalog.fetchedAt

/**
 * 收录很少时，筛选与搜索只是摆设。
 * 页面按收录量决定是否显示这些浏览工具，避免为稀疏内容铺设控件。
 */
export const BROWSING_TOOLS_THRESHOLD = 4
export const needsBrowsingTools = apps.length >= BROWSING_TOOLS_THRESHOLD

/** 平台一律用系统名，不再用「手机」「手表」这类统称 */
export const PLATFORM_META = {
  android: { label: 'Android', color: 'var(--status-ok)' },
  ios: { label: 'iOS', color: 'var(--status-ios)' },
  wear: { label: 'WearOS', color: 'var(--status-wear)' },
  windows: { label: 'Windows', color: 'var(--status-windows)' },
  macos: { label: 'macOS', color: 'var(--status-macos)' },
  linux: { label: 'Linux', color: 'var(--status-linux)' },
  web: { label: 'Web', color: 'var(--status-source)' }
}

/** 配置里只有仓库地址，账号主页由第一个条目推导，避免再维护一个字段 */
export const profileUrl = apps[0]?.owner
  ? `https://github.com/${apps[0].owner}`
  : 'https://github.com'

export function getApp(id) {
  return apps.find((app) => app.id === id) || null
}

export function platformMeta(platform) {
  return PLATFORM_META[platform] || { label: platform, color: 'var(--status-source)' }
}

/** 首页默认排序：按发布时间倒序，没有发布的排在最后 */
export function defaultOrder(list) {
  return list.slice().sort((a, b) => {
    const at = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const bt = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return bt - at
  })
}

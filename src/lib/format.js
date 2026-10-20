const UNITS = ['B', 'KB', 'MB', 'GB']

/** 体积：保留一位小数，避免 40.0 MB 这类无信息量的写法 */
export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '—'
  let value = Number(bytes)
  if (!Number.isFinite(value) || value <= 0) return '—'

  let index = 0
  while (value >= 1024 && index < UNITS.length - 1) {
    value /= 1024
    index += 1
  }
  const digits = value >= 100 || index === 0 ? 0 : 1
  return `${value.toFixed(digits)} ${UNITS[index]}`
}

/** 日期：统一为 YYYY-MM-DD，规格表里不出现本地化长短句 */
export function formatDate(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const pad = (n) => String(n).padStart(2, '0')
  return `${formatDate(iso)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 相对时间：只用于「最近更新」流，超过一个月就退回具体日期 */
export function relativeTime(iso) {
  if (!iso) return '—'
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return '—'

  const diff = Date.now() - time
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`
  return formatDate(iso)
}

export function formatCount(value) {
  const num = Number(value) || 0
  if (num >= 10000) return `${(num / 10000).toFixed(1)} 万`
  return String(num)
}

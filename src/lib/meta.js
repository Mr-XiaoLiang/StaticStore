/**
 * 路由切换时更新标题与分享信息。
 * 静态壳（scripts/prerender.mjs）已经为每个应用写好首屏 meta，
 * 这里负责站内跳转后的同步，二者不冲突。
 */

function upsertMeta(selector, attrs) {
  let node = document.head.querySelector(selector)
  if (!node) {
    node = document.createElement('meta')
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value))
    document.head.appendChild(node)
    return
  }
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value))
}

export function setPageMeta({ title, description, url }) {
  if (title) document.title = title

  if (description) {
    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: description
    })
  }

  if (title) {
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title })
  }

  if (url) {
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url })
    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)
  }
}

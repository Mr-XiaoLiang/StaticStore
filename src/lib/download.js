/**
 * 复制到剪贴板。
 * 优先用异步剪贴板接口；在非安全上下文（如本地 IP 访问）下退回选区复制，
 * 两条路都失败时返回 false，由界面给出可手动选中的提示。
 */
export async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('[copy] 剪贴板接口不可用，退回选区复制', err)
    }
  }

  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch (err) {
    console.error('[copy] 复制失败', err)
    return false
  }
}

export function triggerDownload(url) {
  if (!url) return
  const link = document.createElement('a')
  link.href = url
  link.rel = 'noopener'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

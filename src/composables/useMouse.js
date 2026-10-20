import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 全局归一化鼠标坐标 (-1 ~ 1)，用于视差与光斑。
 * 桌面端使用 mousemove；触屏不监听（避免移动端误触）。
 */
export function useMouse(options = {}) {
  const { enabled = true } = options
  const x = ref(0)
  const y = ref(0)
  const active = ref(false)
  let raf = 0

  function handleMove(e) {
    if (raf) return
    raf = requestAnimationFrame(() => {
      const w = window.innerWidth
      const h = window.innerHeight
      x.value = (e.clientX / w) * 2 - 1
      y.value = (e.clientY / h) * 2 - 1
      active.value = true
      raf = 0
    })
  }

  function handleLeave() {
    active.value = false
  }

  onMounted(() => {
    if (!enabled || typeof window === 'undefined') return
    const supportsHover = window.matchMedia('(hover: hover)').matches
    if (!supportsHover) return
    window.addEventListener('mousemove', handleMove, { passive: true })
    window.addEventListener('mouseleave', handleLeave)
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('mousemove', handleMove)
    window.removeEventListener('mouseleave', handleLeave)
    if (raf) cancelAnimationFrame(raf)
  })

  return { x, y, active }
}

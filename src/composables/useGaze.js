import { onBeforeUnmount, onMounted, unref } from 'vue'

/**
 * 眼睛跟着鼠标看。
 *
 * 成本控制（这也是它值得做的原因）：
 *   - 一个 passive 的 pointermove，用 rAF 合并，每帧最多算一次；
 *   - 只往一个元素上写两个 CSS 变量，不读布局（rect 缓存，滚动/缩放时才失效）；
 *   - 位移上限 1.6px，在 16px 的等宽字标里只是「眼珠偏了一点」；
 *   - 系统开了「减少动态效果」就整体关掉，变量留在 0。
 *
 * 只影响眼睛所在的格子，不移动字标本身，所以五格宽度始终不变。
 */
const LIMIT_X = 1.6
const LIMIT_Y = 1.4
const SPREAD_X = 90
const SPREAD_Y = 70

const clamp = (value) => Math.max(-1, Math.min(1, value))

export function useGaze(target) {
  let rect = null
  let raf = 0
  let pointerX = 0
  let pointerY = 0

  const reduced =
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches

  const node = () => unref(target)

  function measure() {
    rect = node()?.getBoundingClientRect() ?? null
  }

  function apply() {
    raf = 0
    const el = node()
    if (!el || !rect) return
    const x = clamp((pointerX - rect.left - rect.width / 2) / SPREAD_X) * LIMIT_X
    const y = clamp((pointerY - rect.top - rect.height / 2) / SPREAD_Y) * LIMIT_Y
    el.style.setProperty('--gaze-x', `${x.toFixed(2)}px`)
    el.style.setProperty('--gaze-y', `${y.toFixed(2)}px`)
  }

  function onPointerMove(event) {
    if (!rect) measure()
    pointerX = event.clientX
    pointerY = event.clientY
    if (!raf) raf = requestAnimationFrame(apply)
  }

  function reset() {
    const el = node()
    if (!el) return
    el.style.setProperty('--gaze-x', '0px')
    el.style.setProperty('--gaze-y', '0px')
  }

  /** 布局可能变了，下一帧再量，不在事件里强制回流 */
  function invalidate() {
    rect = null
  }

  onMounted(() => {
    if (reduced) return
    measure()
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('resize', invalidate, { passive: true })
    window.addEventListener('scroll', invalidate, { passive: true })
    document.addEventListener('pointerleave', reset)
  })

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('resize', invalidate)
    window.removeEventListener('scroll', invalidate)
    document.removeEventListener('pointerleave', reset)
  })
}

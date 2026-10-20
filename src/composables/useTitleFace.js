import { onBeforeUnmount, onMounted } from 'vue'
import { composeFace } from '../data/faces.js'

/**
 * 标签页标题彩蛋。
 *
 * 标题里的表情和导航字标共用同一套语法（见 src/data/faces.js），
 * 所以这里不是手写四段字符串，而是从情绪表里现取：
 *   idle → (oo)y   busy → [00]y   star → {**}v
 * 改一次词表，标题和字标会一起变。
 *
 * 只在标签页可见时轮播；切走时换成睡觉的表情并停掉计时器，
 * 回来再从当前标题继续，避免后台空转和标题闪烁。
 *
 * 与品牌站的差异仅在两处文案：站名由 Home 改为 Store。
 */
const BASE_TITLE = 'Lollipop · Store'
const TITLES = [
  BASE_TITLE,
  `${composeFace({ mood: 'idle' }).text} · Store`,
  `${composeFace({ mood: 'busy' }).text} · Store`,
  `${composeFace({ mood: 'star' }).text} · Store`
]
const SLEEPING_TITLE = `${composeFace({ mood: 'sleepy' }).text} zZ`
const STEP = 5000

export function useTitleFace() {
  let timer = 0
  let index = 0
  let hidden = false

  function paint() {
    if (typeof document === 'undefined') return
    document.title = hidden ? SLEEPING_TITLE : TITLES[index]
  }

  function stop() {
    if (!timer) return
    clearInterval(timer)
    timer = 0
  }

  function start() {
    stop()
    timer = window.setInterval(() => {
      index = (index + 1) % TITLES.length
      paint()
    }, STEP)
  }

  function onVisibilityChange() {
    hidden = document.visibilityState === 'hidden'
    if (hidden) stop()
    else start()
    paint()
  }

  onMounted(() => {
    paint()
    document.addEventListener('visibilitychange', onVisibilityChange)
    start()
  })

  onBeforeUnmount(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibilityChange)
    document.title = BASE_TITLE
  })
}

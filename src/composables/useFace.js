import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { EYES, MOODS, composeFace } from '../data/faces.js'

/**
 * 把页面上的真实状态叠加成一个表情。
 *
 * 四层状态，优先级从高到低：
 *   1. 覆盖层  ?face= / ?eyes= / ?frame= / ?hand= —— 调试与彩蛋
 *   2. 外部层  reaction —— 任意组件注入的一次性情绪（卡片悬停等）
 *   3. 环境层  asleep / cheering / drift —— 切走标签、点击、发呆换表情
 *   4. 交互层  hovering / pressing / holding / focusing —— 只改手势
 *
 * 交互阶梯（全部是一次性反馈，不改变导航行为）：
 *   悬停   → 糖果眼 + 举手 Y
 *   按下   → 眯眼 + 点赞 9，松手即还原
 *   按住   → 600ms 后星星眼 + 比耶 v
 *   单击   → 欢呼 \^^/V，900ms 后落回
 *   发呆   → 每 6.5~12 秒在 平静 / 疑惑 / 开心 之间漂移，一动就醒
 *
 * blink：每隔 4~8 秒眼睛闭 130ms。
 * 它只改眼睛、不动布局，所以五格宽度恒定，不会让导航跳动。
 */

const BLINK_MIN = 4200
const BLINK_MAX = 8400
const BLINK_MS = 130
const CHEER_MS = 900
const HOLD_MS = 600

/** 发呆时会自己换的表情：平静为主，偶尔疑惑或开心 */
const DRIFT_MOODS = ['idle', 'idle', 'puzzled', 'happy']
const DRIFT_MIN = 6500
const DRIFT_MAX = 12000

/**
 * 跨组件的一次性情绪注入。
 * 任意组件只要说一句「我现在是专注的」，字标自己决定怎么翻译成表情，
 * 卡片、列表、未来任何模块都不必关心颜文字语法。
 */
const reaction = ref(null)

export function react(expression) {
  reaction.value = expression || null
}

export function clearReaction() {
  reaction.value = null
}

/**
 * 预览用参数，方便把整套词表翻出来看：
 *   ?face=dizzy              按情绪预设取一整套
 *   ?face=@@                 直接给一对眼睛
 *   ?frame=[]&hand=9         单独换语气和手势
 */
function readOverrides() {
  if (typeof location === 'undefined') return {}
  const params = new URLSearchParams(location.search)
  const pick = (key) => params.get(key) || undefined
  const face = pick('face')
  return {
    mood: MOODS[face] ? face : undefined,
    eyes: pick('eyes') || (EYES[face] ? face : undefined),
    frame: pick('frame'),
    hand: pick('hand')
  }
}

export function useFace() {
  const overrides = readOverrides()

  const asleep = ref(false)
  const hovering = ref(false)
  const focusing = ref(false)
  const cheering = ref(false)
  const blinking = ref(false)
  const pressed = ref(false)
  const holding = ref(false)
  /** 发呆时的自发情绪，用户一动就回到 idle */
  const drift = ref('idle')

  let blinkTimer = 0
  let blinkOffTimer = 0
  let cheerTimer = 0
  let holdTimer = 0
  let driftTimer = 0

  const reduced =
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches

  /** 没有人碰它、也没有外部情绪时，才允许自己发呆换表情 */
  function isIdle() {
    return (
      !asleep.value &&
      !hovering.value &&
      !focusing.value &&
      !pressed.value &&
      !holding.value &&
      !cheering.value &&
      !reaction.value &&
      !overrides.mood
    )
  }

  const mood = computed(() => {
    if (overrides.mood) return overrides.mood
    if (reaction.value?.mood) return reaction.value.mood
    if (asleep.value) return 'sleepy'
    if (cheering.value) return 'happy'
    return drift.value
  })

  /** 眼睛的优先级：外部情绪 > 按住星星眼 > 按下眯眼 > 眨眼 */
  function currentEyes() {
    if (overrides.eyes) return overrides.eyes
    if (reaction.value?.eyes) return reaction.value.eyes
    if (holding.value) return '**'
    if (pressed.value) return '--'
    if (blinking.value) return '--'
    return undefined
  }

  /** 语气（括号）：外部场景优先，其余交给 mood 预设 */
  function currentFrame() {
    if (overrides.frame) return overrides.frame
    if (reaction.value?.frame) return reaction.value.frame
    return undefined
  }

  /** 手势的优先级：点击 > 按住 > 按下 > 悬停 > 键盘聚焦 */
  function currentHand() {
    if (overrides.hand) return overrides.hand
    if (reaction.value?.hand) return reaction.value.hand
    if (cheering.value) return 'V'
    if (holding.value) return 'v'
    if (pressed.value) return '9'
    if (hovering.value) return 'Y'
    if (focusing.value) return 'v'
    return undefined
  }

  const face = computed(() =>
    composeFace({
      mood: mood.value,
      eyes: currentEyes(),
      frame: currentFrame(),
      hand: currentHand()
    })
  )

  function scheduleBlink() {
    if (reduced || overrides.mood) return
    clearTimeout(blinkTimer)
    blinkTimer = window.setTimeout(() => {
      const busy =
        asleep.value ||
        hovering.value ||
        focusing.value ||
        cheering.value ||
        pressed.value ||
        holding.value ||
        Boolean(reaction.value)
      if (busy) {
        scheduleBlink()
        return
      }
      blinking.value = true
      blinkOffTimer = window.setTimeout(() => {
        blinking.value = false
        scheduleBlink()
      }, BLINK_MS)
    }, BLINK_MIN + Math.random() * (BLINK_MAX - BLINK_MIN))
  }

  /** 发呆换表情：完全没人打扰时才轮换，动一下立刻回到 idle 并重新计时 */
  function scheduleDrift() {
    if (reduced) return
    clearTimeout(driftTimer)
    driftTimer = window.setTimeout(() => {
      if (isIdle()) {
        const pool = DRIFT_MOODS.filter((item) => item !== drift.value)
        drift.value = pool[Math.floor(Math.random() * pool.length)] || 'idle'
      }
      scheduleDrift()
    }, DRIFT_MIN + Math.random() * (DRIFT_MAX - DRIFT_MIN))
  }

  function wake() {
    drift.value = 'idle'
    scheduleDrift()
  }

  function onVisibilityChange() {
    asleep.value = document.visibilityState === 'hidden'
    blinking.value = false
    if (asleep.value) clearTimeout(blinkTimer)
    else {
      scheduleBlink()
      wake()
    }
  }

  function enter() {
    hovering.value = true
    wake()
  }

  function leave() {
    hovering.value = false
  }

  /** 鼠标点击也会触发 focus，这里只认键盘可见焦点，避免点完手势卡在 v */
  function onFocus(event) {
    focusing.value = Boolean(event?.target?.matches?.(':focus-visible'))
    if (focusing.value) wake()
  }

  function onBlur() {
    focusing.value = false
  }

  /**
   * 按下时立刻眯眼点赞；按住超过 600ms 升级成星星眼。
   * 抬手指的监听挂在 window 上，指针移出元素也能正常还原，
   * 不会出现「表情卡在 9」的状态。
   */
  function pressStart(event) {
    if (event.button > 0) return
    pressed.value = true
    wake()
    clearTimeout(holdTimer)
    holdTimer = window.setTimeout(() => {
      holding.value = true
    }, HOLD_MS)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
  }

  function release() {
    clearTimeout(holdTimer)
    pressed.value = false
    holding.value = false
    window.removeEventListener('pointerup', release)
    window.removeEventListener('pointercancel', release)
  }

  function cheer() {
    cheering.value = true
    wake()
    clearTimeout(cheerTimer)
    cheerTimer = window.setTimeout(() => {
      cheering.value = false
    }, CHEER_MS)
  }

  onMounted(() => {
    asleep.value = document.visibilityState === 'hidden'
    document.addEventListener('visibilitychange', onVisibilityChange)
    scheduleBlink()
    scheduleDrift()
  })

  onBeforeUnmount(() => {
    clearTimeout(blinkTimer)
    clearTimeout(blinkOffTimer)
    clearTimeout(cheerTimer)
    clearTimeout(holdTimer)
    clearTimeout(driftTimer)
    window.removeEventListener('pointerup', release)
    window.removeEventListener('pointercancel', release)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  return { face, enter, leave, onFocus, onBlur, cheer, pressStart }
}

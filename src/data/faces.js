/**
 * looly 颜文字语法
 * ============================================================
 * 一个表情恒为 5 个等宽字形：
 *
 *     { 左括号 } { 左眼 }{ 右眼 } { 右括号 } { 手势 }
 *         ()        o     o         ()        y
 *
 * 三个轴互相独立，任意叠加都还是一个合法的表情：
 *
 *   括号 = 语气 / 场景   （frame）
 *   眼睛 = 情绪 / 状态   （mood）
 *   手势 = 交互 / 动作   （gesture）
 *
 * 所以「忙碌 + 鼠标悬停」会自动得到 `[00]Y`，
 * 「晕了 + 点击」会得到 `\@@/V`，不需要为每种组合单独写文案。
 *
 * 三条约束，改词表时必须守住：
 *   1. 眼睛固定 2 个字符，括号与手势各 1 个，合计 5 格；
 *   2. 只用 ASCII，全角括号会把等宽网格撑破；
 *   3. 字标里不出现 emoji，情绪靠字形本身表达。
 */

/** 眼睛：情绪与状态，两字符一组 */
export const EYES = {
  oo: { glyph: 'oo', label: '平静' },
  '00': { glyph: '00', label: '专注' },
  OO: { glyph: 'OO', label: '惊讶' },
  '--': { glyph: '--', label: '困倦' },
  '^^': { glyph: '^^', label: '开心' },
  '**': { glyph: '**', label: '星星眼' },
  '$$': { glyph: '$$', label: '迷恋' },
  '@@': { glyph: '@@', label: '晕了' },
  '##': { glyph: '##', label: '无语' }
}

/** 括号：语气与场景，左右各一个字符 */
export const FRAMES = {
  '()': { open: '(', close: ')', label: '友好' },
  '[]': { open: '[', close: ']', label: '冷静' },
  '{}': { open: '{', close: '}', label: '代码感' },
  '||': { open: '|', close: '|', label: '正经' },
  '\\/': { open: '\\', close: '/', label: '欢呼' }
}

/** 手势：末尾那个字符，y 的字形家族 */
export const HANDS = {
  y: { glyph: 'y', label: '挥手' },
  Y: { glyph: 'Y', label: '举手' },
  v: { glyph: 'v', label: '比耶' },
  V: { glyph: 'V', label: '胜利' },
  '9': { glyph: '9', label: '点赞' },
  T: { glyph: 'T', label: '摊手' }
}

/**
 * 情绪预设：每个 mood 给出一套默认的「眼 + 括号 + 手势」。
 * 上层状态只需要挑一个 mood，再用 frame / hand 做局部覆盖即可。
 */
export const MOODS = {
  idle: { eyes: 'oo', frame: '()', hand: 'y', label: '平静' },
  busy: { eyes: '00', frame: '[]', hand: 'y', label: '专注' },
  alert: { eyes: 'OO', frame: '{}', hand: 'T', label: '惊讶' },
  puzzled: { eyes: 'OO', frame: '()', hand: 'T', label: '疑惑' },
  sleepy: { eyes: '--', frame: '()', hand: 'y', label: '困了' },
  happy: { eyes: '^^', frame: '\\/', hand: 'Y', label: '开心' },
  star: { eyes: '**', frame: '{}', hand: 'v', label: '心动' },
  love: { eyes: '$$', frame: '{}', hand: 'v', label: '迷恋' },
  dizzy: { eyes: '@@', frame: '\\/', hand: 'T', label: '晕了' },
  flat: { eyes: '##', frame: '||', hand: 'T', label: '无语' }
}

const FALLBACK = 'idle'

/**
 * 组合出最终表情。
 *
 * mood 决定底色，eyes / frame / hand 是可选的局部覆盖；
 * 任何一个键写错都不会炸，只会退回该 mood 的默认值，
 * 这样调用方可以放心地把外部状态直接传进来。
 */
export function composeFace({ mood, eyes, frame, hand } = {}) {
  const moodKey = MOODS[mood] ? mood : FALLBACK
  const base = MOODS[moodKey]

  const eyesKey = EYES[eyes] ? eyes : base.eyes
  const frameKey = FRAMES[frame] ? frame : base.frame
  const handKey = HANDS[hand] ? hand : base.hand

  const eye = EYES[eyesKey]
  const pair = FRAMES[frameKey]
  const gesture = HANDS[handKey]

  return {
    mood: moodKey,
    eyes: eyesKey,
    frame: frameKey,
    hand: handKey,
    open: pair.open,
    left: eye.glyph[0],
    right: eye.glyph[1],
    close: pair.close,
    handGlyph: gesture.glyph,
    text: `${pair.open}${eye.glyph}${pair.close}${gesture.glyph}`,
    label: `${base.label} · ${pair.label} · ${gesture.label}`
  }
}

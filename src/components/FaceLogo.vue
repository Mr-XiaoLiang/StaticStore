<script setup>
import { computed, ref } from 'vue'
import { useFace } from '../composables/useFace.js'
import { useGaze } from '../composables/useGaze.js'

/**
 * 颜文字字标。
 *
 * 五格等宽的排版、糖果眼互换、挥手动画与视线变量全部沿用品牌站，
 * 只把外框尺寸与配色换成商店的规格。宽度恒定，任何表情都不会让顶栏跳动。
 */
const props = defineProps({
  size: { type: String, default: 'md' } // sm | md | lg
})

const { face, enter, leave, onFocus, onBlur, cheer, pressStart } = useFace()
const candy = computed(() => face.value.eyes === 'oo')

const faceEl = ref(null)
useGaze(faceEl)

defineExpose({ cheer })

const faceProps = computed(() => ({
  onMouseenter: enter,
  onMouseleave: leave,
  onFocus,
  onBlur,
  onPointerdown: pressStart,
  onClick: cheer
}))
</script>

<template>
  <span class="logo" :class="`logo--${props.size}`" v-bind="faceProps">
    <!-- 括号是语气，两只眼是情绪，末位字符是手势 -->
    <span ref="faceEl" class="face" :class="{ 'face--candy': candy }" :data-mood="face.mood">
      <span class="face__cell face__cell--bracket">{{ face.open }}</span>
      <span class="face__cell face__cell--eye">
        <span class="face__o">{{ face.left }}</span>
        <span v-if="candy" class="face__candy" />
      </span>
      <span class="face__cell face__cell--eye">
        <span class="face__o">{{ face.right }}</span>
        <span v-if="candy" class="face__candy" />
      </span>
      <span class="face__cell face__cell--bracket">{{ face.close }}</span>
      <span class="face__cell face__cell--wave">{{ face.handGlyph }}</span>
    </span>
  </span>
</template>

<style scoped>
.logo {
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--bg-surface-strong);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 0 28px -12px var(--accent-glow);
  transition: transform var(--dur-base) var(--ease-spring),
    border-color var(--dur-base) var(--ease-out);
}

.logo--sm {
  width: 52px;
  height: 30px;
}
.logo--md {
  width: 60px;
  height: 34px;
}
.logo--lg {
  width: 76px;
  height: 44px;
}

.logo:hover {
  transform: rotate(-5deg) scale(1.04);
  border-color: var(--border-strong);
}

.face {
  display: grid;
  grid-auto-flow: column;
  /* 眼睛两格略宽，给糖果留出间距；总宽固定 */
  grid-template-columns: 1ch 1.4ch 1.4ch 1ch 1ch;
  place-items: center;
  font-family: var(--font-mono);
  font-size: 15px;
  line-height: 1;
  letter-spacing: 0;
  font-variant-ligatures: none;
  color: var(--text-primary);
  user-select: none;
}

.logo--sm .face {
  font-size: 13px;
}
.logo--lg .face {
  font-size: 20px;
}

.face__cell {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 1em;
}

/* 眼珠跟着指针偏一点点：只挪眼睛所在的两格，字标与括号不动 */
.face__cell--eye {
  transform: translate3d(var(--gaze-x, 0px), var(--gaze-y, 0px), 0);
}

.face__cell--bracket {
  color: var(--text-secondary);
  transition: color var(--dur-fast) var(--ease-out);
}
.logo:hover .face__cell--bracket {
  color: var(--accent);
}

/* o 与糖果叠在同一格里，靠透明度互换，不参与布局 */
.face__o {
  display: block;
  opacity: 1;
  transform: scale(1);
  transition: opacity var(--dur-fast) var(--ease-out),
    transform var(--dur-base) var(--ease-spring);
}

.logo:hover .face--candy .face__o,
.logo:focus-visible .face--candy .face__o {
  opacity: 0;
  transform: scale(0.4);
}

.face__candy {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  border-radius: 50%;
  background: var(--accent-gradient);
  box-shadow: 0 0 10px -2px var(--accent-glow);
  opacity: 0;
  transform: scale(0.35) rotate(-30deg);
  transition: opacity var(--dur-fast) var(--ease-out),
    transform var(--dur-base) var(--ease-spring);
}

.face__candy::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2.5px;
  width: 4px;
  height: 2.4px;
  border-radius: 50%;
  background: #fff;
  opacity: 0.65;
  transform: rotate(-18deg);
}

.logo:hover .face__candy,
.logo:focus-visible .face__candy {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

.face__cell--wave {
  transform-origin: 50% 85%;
}
.logo:hover .face__cell--wave {
  animation: face-wave 900ms var(--ease-in-out) 1;
}

@keyframes face-wave {
  0%,
  100% {
    transform: rotate(0deg) translateY(0);
  }
  30% {
    transform: rotate(14deg) translateY(-1px);
  }
  65% {
    transform: rotate(-8deg) translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo:hover {
    transform: none;
  }
  .logo:hover .face__cell--wave {
    animation: none;
  }
  .face__o,
  .face__candy,
  .face__cell--bracket {
    transition: none;
  }
}
</style>

<script setup>
import { computed } from 'vue'
import { useMouse } from '../composables/useMouse.js'

/**
 * 背景光晕。
 * 结构取自品牌站：两层径向渐变 + 两枚模糊光球，随指针反向视差。
 * 色相改为琥珀与冷蓝，与商店的语义色一致，不再使用紫粉。
 */
const { x, y } = useMouse()

const orb1Style = computed(() => ({
  transform: `translate3d(${x.value * -18}px, ${y.value * -14}px, 0) translate(-50%, -50%)`
}))
const orb2Style = computed(() => ({
  transform: `translate3d(${x.value * 22}px, ${y.value * 16}px, 0) translate(-50%, -50%)`
}))
</script>

<template>
  <div class="bg" aria-hidden="true">
    <div class="bg__gradient" />
    <div class="orb orb--1" :style="orb1Style" />
    <div class="orb orb--2" :style="orb2Style" />
    <div class="bg__grid" />
  </div>
</template>

<style scoped>
.bg {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg);
  overflow: hidden;
  pointer-events: none;
}

.bg__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 22% 12%, rgba(232, 201, 122, 0.1), transparent 52%),
    radial-gradient(circle at 82% 82%, rgba(111, 168, 255, 0.08), transparent 55%);
}

:root[data-theme='light'] .bg__gradient {
  background:
    radial-gradient(circle at 22% 12%, rgba(154, 117, 38, 0.08), transparent 52%),
    radial-gradient(circle at 82% 82%, rgba(47, 111, 208, 0.06), transparent 55%);
}

/* 极淡的网格，给「仪器面板」一点结构感，不参与交互 */
.bg__grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.028) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.028) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(circle at 50% 30%, #000 0%, transparent 78%);
  -webkit-mask-image: radial-gradient(circle at 50% 30%, #000 0%, transparent 78%);
}

:root[data-theme='light'] .bg__grid {
  background-image: linear-gradient(to right, rgba(20, 21, 26, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(20, 21, 26, 0.05) 1px, transparent 1px);
}

.orb {
  position: absolute;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  filter: blur(110px);
  opacity: 0.32;
  will-change: transform;
  transition: transform 900ms var(--ease-out);
}

.orb--1 {
  top: 26%;
  left: 16%;
  background: radial-gradient(circle, #e8c97a 0%, transparent 70%);
}

.orb--2 {
  top: 62%;
  left: 80%;
  background: radial-gradient(circle, #6fa8ff 0%, transparent 70%);
}

:root[data-theme='light'] .orb {
  opacity: 0.22;
}

@media (max-width: 720px) {
  .orb {
    width: 340px;
    height: 340px;
    filter: blur(80px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .orb {
    transition: none;
  }
}
</style>

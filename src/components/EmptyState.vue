<script setup>
import { computed } from 'vue'
import { composeFace } from '../data/faces.js'

/**
 * 空状态用颜文字作插图：与字标同一套语法，改词表时这里会一起变。
 */
const props = defineProps({
  mood: { type: String, default: 'puzzled' },
  title: { type: String, default: '没有符合条件的结果' },
  hint: { type: String, default: '' }
})

const face = computed(() => composeFace({ mood: props.mood }))
</script>

<template>
  <div class="empty">
    <p class="empty__face mono" aria-hidden="true">{{ face.text }}</p>
    <p class="empty__title">{{ title }}</p>
    <p v-if="hint" class="empty__hint">{{ hint }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8) var(--space-4);
  text-align: center;
}

.empty__face {
  font-size: 30px;
  letter-spacing: 0.06em;
  color: var(--accent);
  opacity: 0.9;
  margin-bottom: var(--space-2);
}

.empty__title {
  font-size: 14px;
  color: var(--text-primary);
}

.empty__hint {
  font-size: 12.5px;
  color: var(--text-tertiary);
  max-width: 36ch;
  line-height: 1.7;
}
</style>

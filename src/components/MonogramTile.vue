<script setup>
import { computed, ref, watch } from 'vue'

/**
 * 图标三级降级，与品牌站一致：
 *   1. 配置里提供的图标
 *   2. 配置里的 emoji
 *   3. 名称首字
 * 任何一级失败都不会出现破图。
 */
const props = defineProps({
  app: { type: Object, required: true },
  size: { type: Number, default: 52 }
})

const failed = ref(false)

watch(
  () => props.app.icon,
  () => {
    failed.value = false
  }
)

const showIcon = computed(() => Boolean(props.app.icon) && !failed.value)
const showEmoji = computed(() => !showIcon.value && Boolean(props.app.emoji))
const initial = computed(() => (props.app.name || '?').trim().slice(0, 1).toUpperCase())

const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.round(props.size * 0.34)}px`
}))
</script>

<template>
  <span class="tile" :style="style">
    <img
      v-if="showIcon"
      class="tile__img"
      :src="`/${app.icon}`"
      alt=""
      loading="lazy"
      decoding="async"
      @error="failed = true"
    />
    <span v-else-if="showEmoji" class="tile__emoji" aria-hidden="true">{{ app.emoji }}</span>
    <span v-else class="tile__initial" aria-hidden="true">{{ initial }}</span>
  </span>
</template>

<style scoped>
.tile {
  position: relative;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.tile__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tile__emoji {
  font-size: 0.92em;
  line-height: 1;
}

.tile__initial {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--accent);
  line-height: 1;
}
</style>

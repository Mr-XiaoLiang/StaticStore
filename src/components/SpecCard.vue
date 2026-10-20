<script setup>
import { computed } from 'vue'
import { Download } from 'lucide-vue-next'
import MonogramTile from './MonogramTile.vue'
import { clearReaction, react } from '../composables/useFace.js'
import { platformMeta } from '../lib/catalog.js'
import { formatDate, formatSize } from '../lib/format.js'

/**
 * 规格卡：顶行平台与版本、中部图标与名称、底部体积与日期、左缘状态色条。
 * 多平台应用在顶行并列写出全部平台，左侧色条取第一个平台的颜色。
 */
const props = defineProps({
  app: { type: Object, required: true }
})

const meta = computed(() => platformMeta(props.app.platforms[0]))
const platformLabel = computed(() =>
  (props.app.platforms || []).map((platform) => platformMeta(platform).label).join(' / ')
)
const primary = computed(() => props.app.variants?.[0] || null)
const version = computed(() => (props.app.version ? `v${props.app.version}` : '未发布'))
const size = computed(() => (primary.value ? formatSize(primary.value.download.size) : '源码项目'))
const date = computed(() => formatDate(props.app.publishedAt))

function inspect() {
  react({ mood: 'busy', hand: 'Y' })
}

defineExpose({ inspect })
</script>

<template>
  <RouterLink
    class="card"
    :to="`/apps/${app.id}`"
    :style="{ '--status': meta.color }"
    @pointerenter="inspect"
    @pointerleave="clearReaction"
    @focus="inspect"
    @blur="clearReaction"
  >
    <span class="card__bar" aria-hidden="true" />

    <span class="card__top">
      <span class="badge">
        <span class="badge__dot" aria-hidden="true" />
        {{ platformLabel }}
      </span>
      <span class="card__version mono">{{ version }}</span>
    </span>

    <span class="card__body">
      <MonogramTile :app="app" :size="46" />
      <span class="card__text">
        <span class="card__name">{{ app.name }}</span>
        <span class="card__summary">{{ app.summary }}</span>
      </span>
    </span>

    <span class="card__bottom mono">
      <span>{{ size }}</span>
      <span class="card__date">{{ date }}</span>
      <Download v-if="primary" class="card__dl" :size="13" aria-hidden="true" />
    </span>
  </RouterLink>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-4) var(--space-3) calc(var(--space-4) + 6px);
  min-height: 176px;
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  transition: transform var(--dur-base) var(--ease-spring),
    border-color var(--dur-base) var(--ease-out),
    background-color var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out);
}

.card:hover,
.card:focus-visible {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--accent) 42%, var(--border-subtle));
  background: var(--bg-surface-strong);
  box-shadow: var(--shadow-card);
}

.card__bar {
  position: absolute;
  left: 0;
  top: 12%;
  bottom: 12%;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: var(--status);
  opacity: 0.8;
  transition: width var(--dur-base) var(--ease-out), opacity var(--dur-base) var(--ease-out);
}
.card:hover .card__bar {
  width: 4px;
  opacity: 1;
}

.card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.badge__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--status);
}

.card__version {
  font-size: 11.5px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.card__body {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.card__text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.card__name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card__summary {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card__bottom {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.card__date {
  margin-left: auto;
}

.card__dl {
  color: var(--status-ok);
  opacity: 0;
  transform: translateY(2px);
  transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out);
}
.card:hover .card__dl,
.card:focus-visible .card__dl {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 560px) {
  .card {
    min-height: 0;
    padding-block: var(--space-4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card:hover {
    transform: none;
  }
}
</style>

<script setup>
import { computed } from 'vue'
import { apps } from '../lib/catalog.js'
import { PLATFORMS, SORTS } from '../lib/filters.js'

/**
 * 筛选条：平台为分段控件，标签为可横滑的胶囊。
 * 选中态用琥珀下划线与描边表达，不使用高饱和色块。
 */
const props = defineProps({
  platform: { type: String, default: 'all' },
  tag: { type: String, default: '' },
  sort: { type: String, default: 'recent' },
  tags: { type: Array, default: () => [] },
  total: { type: Number, default: 0 }
})

const emit = defineEmits(['update:platform', 'update:tag', 'update:sort', 'reset'])

const hasFilter = computed(() => props.platform !== 'all' || Boolean(props.tag))

// 没有收录对应平台时不摆空按钮
const platforms = computed(() =>
  PLATFORMS.filter(
    (item) => item.id === 'all' || apps.some((app) => (app.platforms || []).includes(item.id))
  )
)
</script>

<template>
  <div class="bar">
    <div class="bar__row">
      <div class="seg" role="tablist" aria-label="平台筛选">
        <button
          v-for="item in platforms"
          :key="item.id"
          class="seg__btn"
          :class="{ 'is-active': platform === item.id }"
          type="button"
          role="tab"
          :aria-selected="platform === item.id"
          @click="emit('update:platform', item.id)"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="bar__right">
        <span class="bar__count mono">{{ total }} 项</span>
        <label class="sort">
          <span class="visually-hidden">排序方式</span>
          <select
            class="sort__select"
            :value="sort"
            @change="emit('update:sort', $event.target.value)"
          >
            <option v-for="item in SORTS" :key="item.id" :value="item.id">{{ item.label }}</option>
          </select>
        </label>
      </div>
    </div>

    <div v-if="tags.length" class="tags">
      <button
        class="tag"
        :class="{ 'is-active': !tag }"
        type="button"
        @click="emit('update:tag', '')"
      >
        全部标签
      </button>
      <button
        v-for="item in tags"
        :key="item.tag"
        class="tag"
        :class="{ 'is-active': tag === item.tag }"
        type="button"
        @click="emit('update:tag', tag === item.tag ? '' : item.tag)"
      >
        {{ item.tag }}
        <span class="tag__count mono">{{ item.count }}</span>
      </button>
      <button v-if="hasFilter" class="tag tag--reset" type="button" @click="emit('reset')">
        清除筛选
      </button>
    </div>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bar__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.seg {
  display: inline-flex;
  padding: 3px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.seg__btn {
  position: relative;
  padding: 5px 14px;
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  color: var(--text-secondary);
  transition: color var(--dur-fast) var(--ease-out),
    background-color var(--dur-fast) var(--ease-out);
}

.seg__btn:hover {
  color: var(--text-primary);
}

.seg__btn.is-active {
  color: var(--text-primary);
  background: var(--bg-elevated);
  box-shadow: inset 0 -1px 0 var(--accent);
}

.bar__right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.bar__count {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.sort__select {
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  outline: none;
}
.sort__select:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
}
.sort__select option {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.tags {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.tags::-webkit-scrollbar {
  display: none;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 0 0 auto;
  padding: 4px 11px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-subtle);
  font-size: 12px;
  color: var(--text-secondary);
  transition: border-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out);
}

.tag:hover {
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.tag.is-active {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.tag__count {
  font-size: 10px;
  color: var(--text-tertiary);
}

.tag--reset {
  color: var(--text-tertiary);
  border-style: dashed;
}

@media (max-width: 560px) {
  .seg__btn {
    padding: 5px 11px;
    font-size: 12px;
  }
  .bar__count {
    display: none;
  }
}
</style>

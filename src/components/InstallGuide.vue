<script setup>
import { computed, ref, watch } from 'vue'
import CommandBlock from './CommandBlock.vue'
import { installPlan } from '../lib/install.js'

/**
 * 安装向导。
 * Android 与 WearOS 给出可复制的命令；iOS 与桌面端给出编号步骤与系统提示的放行方式。
 * 具体内容由 lib/install.js 按平台与安装包类型生成，这里只负责排版。
 */
const props = defineProps({
  app: { type: Object, required: true },
  // 当前选中的平台产物；为空表示该项目没有安装包
  variant: { type: Object, default: null }
})

const tabs = computed(() => installPlan(props.app, props.variant))
const active = ref(tabs.value[0]?.id || '')

watch(tabs, (list) => {
  if (!list.some((tab) => tab.id === active.value)) {
    active.value = list[0]?.id || ''
  }
})

const current = computed(
  () => tabs.value.find((tab) => tab.id === active.value) || tabs.value[0] || null
)
</script>

<template>
  <section v-if="current" class="guide">
    <div class="guide__head">
      <h2 class="guide__title">安装方式</h2>
      <div v-if="tabs.length > 1" class="guide__tabs" role="tablist" aria-label="安装方式">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="guide__tab"
          :class="{ 'is-active': active === tab.id }"
          type="button"
          role="tab"
          :aria-selected="active === tab.id"
          @click="active = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="guide__body">
      <div class="guide__col">
        <h3 class="guide__sub">前置条件</h3>
        <ol class="guide__list">
          <li v-for="(item, index) in current.prerequisites" :key="item">
            <span class="guide__index mono">{{ index + 1 }}</span>
            <span>{{ item }}</span>
          </li>
        </ol>
      </div>

      <div class="guide__col">
        <template v-if="current.commands.length">
          <h3 class="guide__sub">执行命令</h3>
          <div class="guide__commands">
            <CommandBlock
              v-for="item in current.commands"
              :key="item.command"
              :label="item.label"
              :command="item.command"
            />
          </div>
        </template>

        <template v-else>
          <h3 class="guide__sub">安装步骤</h3>
          <ol class="guide__list">
            <li v-for="(item, index) in current.steps" :key="item">
              <span class="guide__index mono">{{ index + 1 }}</span>
              <span>{{ item }}</span>
            </li>
          </ol>
          <p v-if="current.note" class="guide__tip">{{ current.note }}</p>
        </template>
      </div>
    </div>
  </section>

</template>

<style scoped>
.guide {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.guide__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.guide__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.guide__tabs {
  display: inline-flex;
  padding: 3px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-subtle);
  background: var(--bg-canvas);
}

.guide__tab {
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  color: var(--text-secondary);
}
.guide__tab.is-active {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.guide__body {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
}

.guide__sub {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-tertiary);
  letter-spacing: 0.04em;
  margin-bottom: var(--space-2);
}

.guide__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.guide__list li {
  display: flex;
  gap: var(--space-2);
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--text-secondary);
}

.guide__index {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  font-size: 10.5px;
  color: var(--text-tertiary);
  margin-top: 1px;
}

.guide__commands {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.guide__tip {
  margin-top: var(--space-3);
  padding-left: var(--space-3);
  border-left: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-secondary);
}

@media (max-width: 760px) {
  .guide__body {
    grid-template-columns: minmax(0, 1fr);
  }
  .guide {
    padding: var(--space-4);
  }
}
</style>

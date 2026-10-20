<script setup>
import { computed, ref, watch } from 'vue'
import FilterBar from '../components/FilterBar.vue'
import SpecCard from '../components/SpecCard.vue'
import EmptyState from '../components/EmptyState.vue'
import { apps, defaultOrder, needsBrowsingTools } from '../lib/catalog.js'
import { applyFilters, collectTags } from '../lib/filters.js'
import { clearSearch, searchQuery } from '../lib/search.js'
import { clearReaction, react } from '../composables/useFace.js'

const platform = ref('all')
const tag = ref('')
const sort = ref('recent')

// 应用很少时筛选没有意义，直接陈列；数量上来后再显示筛选条。
const showFilters = needsBrowsingTools

const tags = computed(() => collectTags(apps))

const filtered = computed(() =>
  applyFilters(defaultOrder(apps), {
    query: searchQuery.value,
    platform: platform.value,
    tag: tag.value,
    sort: sort.value
  })
)

const isFiltering = computed(
  () => Boolean(searchQuery.value.trim()) || platform.value !== 'all' || Boolean(tag.value)
)

// 空结果时让字标露出疑惑，恢复结果后立刻收回，不打断浏览
watch(
  () => isFiltering.value && filtered.value.length === 0,
  (empty) => {
    if (empty) react({ mood: 'puzzled' })
    else clearReaction()
  }
)

function reset() {
  platform.value = 'all'
  tag.value = ''
  clearSearch()
}
</script>

<template>
  <div class="store">
    <FilterBar
      v-if="showFilters"
      v-model:platform="platform"
      v-model:tag="tag"
      v-model:sort="sort"
      :tags="tags"
      :total="filtered.length"
      @reset="reset"
    />

    <div v-if="filtered.length" class="grid">
      <SpecCard v-for="app in filtered" :key="app.id" :app="app" />
    </div>

    <EmptyState
      v-else
      title="没有符合条件的应用"
      hint="换一个关键词，或者清除筛选条件重新浏览。"
    >
      <button class="empty__btn" type="button" @click="reset">清除筛选</button>
    </EmptyState>
  </div>
</template>

<style scoped>
.store {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* 卡片宽度有上限并整体居中：两三个应用时不至于被拉成空荡的长条 */
.grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(288px, 360px));
  justify-content: center;
}

.empty__btn {
  margin-top: var(--space-3);
  padding: 6px 16px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-strong);
  font-size: 12.5px;
  color: var(--text-primary);
  transition: border-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}
.empty__btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

@media (max-width: 560px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

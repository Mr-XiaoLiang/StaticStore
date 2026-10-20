<script setup>
import { onMounted } from 'vue'
import EmptyState from '../components/EmptyState.vue'
import { site } from '../lib/store-meta.js'
import { setPageMeta } from '../lib/meta.js'

onMounted(() => {
  setPageMeta({
    title: `页面不存在 · ${site.title}`,
    description: '该地址没有对应的页面。'
  })
})
</script>

<template>
  <EmptyState
    mood="dizzy"
    title="这个地址没有内容"
    hint="可能是链接拼写有误，或者应用已经不再收录。"
  >
    <RouterLink class="home" to="/">返回应用目录</RouterLink>
  </EmptyState>
</template>

<style scoped>
.home {
  margin-top: var(--space-3);
  padding: 7px 18px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-strong);
  font-size: 12.5px;
  color: var(--text-primary);
  transition: border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.home:hover {
  border-color: var(--accent);
  color: var(--accent);
}
</style>

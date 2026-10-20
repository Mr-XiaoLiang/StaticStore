<script setup>
import { computed } from 'vue'
import { Github } from 'lucide-vue-next'
import { profileUrl } from '../lib/catalog.js'
import { appCount, generatedAtLabel, site } from '../lib/store-meta.js'

/**
 * 页脚承担三件事：说明数据从哪来、什么时候取的、接口在哪。
 * 对使用者而言这决定了他能不能信任页面上的版本号。
 */
const year = computed(() => new Date().getFullYear())
</script>

<template>
  <footer class="ftr">
    <div class="container ftr__inner">
      <div class="ftr__left">
        <RouterLink class="ftr__link" to="/about">关于</RouterLink>
        <a class="ftr__link" :href="profileUrl" target="_blank" rel="noopener noreferrer">
          <Github :size="13" aria-hidden="true" />
          GitHub
        </a>
      </div>

      <p class="ftr__meta mono">{{ appCount }} 个应用 · 更新于 {{ generatedAtLabel }}</p>

      <p class="ftr__copy">© {{ year }} {{ site.title }}</p>
    </div>
  </footer>
</template>

<style scoped>
.ftr {
  position: relative;
  z-index: var(--z-content);
  margin-top: var(--space-8);
  border-top: 1px solid var(--border-subtle);
  padding-block: var(--space-5);
}

.ftr__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-5);
  justify-content: space-between;
}

.ftr__left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.ftr__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-secondary);
  transition: color var(--dur-fast) var(--ease-out);
}
.ftr__link:hover {
  color: var(--accent);
}

.ftr__meta {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.ftr__copy {
  flex: 1 1 100%;
  font-size: 11.5px;
  color: var(--text-tertiary);
}

@media (min-width: 900px) {
  .ftr__copy {
    flex: 0 1 auto;
    text-align: right;
  }
}
</style>

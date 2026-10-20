<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Github, Moon, Search, Sun, X } from 'lucide-vue-next'
import FaceLogo from './FaceLogo.vue'
import { useTheme } from '../composables/useTheme.js'
import { needsBrowsingTools, profileUrl } from '../lib/catalog.js'
import { clearSearch, searchQuery } from '../lib/search.js'

const route = useRoute()
const { theme, toggle } = useTheme()

// 只有可搜索的规模才摆搜索框，收录很少时顶栏保持干净
const showSearch = computed(() => route.name === 'store' && needsBrowsingTools)

const scrolled = ref(false)
let raf = 0

function onScroll() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    scrolled.value = window.scrollY > 24
    raf = 0
  })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <header class="hdr" :class="{ 'hdr--scrolled': scrolled }">
    <div class="container hdr__inner">
      <RouterLink class="brand" to="/" aria-label="返回应用目录">
        <FaceLogo size="md" />
        <span class="brand__text">Store</span>
      </RouterLink>

      <form v-if="showSearch" class="search" role="search" @submit.prevent>
        <Search class="search__icon" :size="15" aria-hidden="true" />
        <input
          v-model="searchQuery"
          class="search__input"
          type="search"
          placeholder="搜索应用或标签"
          aria-label="搜索应用"
        />
        <button
          v-if="searchQuery"
          class="search__clear"
          type="button"
          aria-label="清空搜索"
          @click="clearSearch"
        >
          <X :size="14" />
        </button>
      </form>

      <div class="actions">
        <a
          class="icon-btn"
          :href="profileUrl"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub 主页"
        >
          <Github :size="18" />
        </a>

        <button
          class="theme-toggle"
          type="button"
          :aria-label="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
          @click="toggle"
        >
          <span class="theme-toggle__track">
            <span class="theme-toggle__thumb" :class="{ 'is-light': theme === 'light' }">
              <Moon v-if="theme === 'dark'" :size="11" />
              <Sun v-else :size="11" />
            </span>
          </span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hdr {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-nav);
  padding-block: var(--space-3);
  transition: padding var(--dur-base) var(--ease-out),
    background-color var(--dur-base) var(--ease-out),
    backdrop-filter var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out);
  border-bottom: 1px solid transparent;
}

.hdr--scrolled {
  padding-block: var(--space-2);
  background: color-mix(in srgb, var(--bg-canvas) 78%, transparent);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border-bottom-color: var(--border-subtle);
}

.hdr__inner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 0 0 auto;
}

.brand__text {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: 0.02em;
}

.search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 420px;
  margin-inline: auto;
  padding-inline: 10px;
  height: 34px;
  border-radius: var(--radius-pill);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  transition: border-color var(--dur-fast) var(--ease-out),
    background-color var(--dur-fast) var(--ease-out);
}

.search:focus-within {
  border-color: var(--border-strong);
  background: var(--bg-surface-strong);
}

.search__icon {
  flex: 0 0 auto;
  color: var(--text-tertiary);
}

.search__input {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  padding-inline: 8px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--text-primary);
}

.search__input::placeholder {
  color: var(--text-tertiary);
}

/* 去掉 WebKit 搜索框自带的清除按钮，统一用自己的 */
.search__input::-webkit-search-cancel-button {
  display: none;
}

.search__clear {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: var(--text-tertiary);
}
.search__clear:hover {
  color: var(--text-primary);
  background: var(--border-subtle);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 0 0 auto;
}

.icon-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-secondary);
  transition: transform var(--dur-fast) var(--ease-spring),
    color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.icon-btn:hover {
  transform: translateY(-2px);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.theme-toggle {
  padding: 0;
  border-radius: var(--radius-pill);
}
.theme-toggle__track {
  position: relative;
  display: inline-flex;
  width: 50px;
  height: 28px;
  border-radius: var(--radius-pill);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
}
.theme-toggle__thumb {
  position: absolute;
  top: 50%;
  left: 3px;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-gradient);
  display: grid;
  place-items: center;
  color: var(--accent-ink);
  box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.4);
  transition: left var(--dur-base) var(--ease-spring);
}
.theme-toggle__thumb.is-light {
  left: calc(100% - 23px);
}

@media (max-width: 560px) {
  .brand__text {
    display: none;
  }
  .search {
    max-width: none;
  }
  .search__input {
    font-size: 12.5px;
  }
}
</style>

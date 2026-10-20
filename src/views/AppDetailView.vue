<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Download, ExternalLink, Github } from 'lucide-vue-next'
import MonogramTile from '../components/MonogramTile.vue'
import InstallGuide from '../components/InstallGuide.vue'
import EmptyState from '../components/EmptyState.vue'
import { getApp, platformMeta, site } from '../lib/catalog.js'
import { formatDate, formatSize, relativeTime } from '../lib/format.js'
import { downloadLabel, formatLabel, platformRequirement } from '../lib/install.js'
import { triggerDownload } from '../lib/download.js'
import { react } from '../composables/useFace.js'
import { setPageMeta } from '../lib/meta.js'

const route = useRoute()
const app = computed(() => getApp(route.params.id))

const meta = computed(() => platformMeta(app.value?.platforms?.[0]))
const platformLabels = computed(() =>
  (app.value?.platforms || []).map((platform) => platformMeta(platform).label).join(' / ')
)

/** 一个应用可能有多个平台的产物，页面按所选平台切换下载与安装说明 */
const variants = computed(() => app.value?.variants || [])
const activePlatform = ref('')
const variant = computed(
  () =>
    variants.value.find((item) => item.platform === activePlatform.value) ||
    variants.value[0] ||
    null
)
const requirement = computed(() =>
  variant.value ? platformRequirement(variant.value.platform) : ''
)

const paragraphs = computed(() =>
  (app.value?.description || app.value?.summary || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
)

const notes = computed(() => (app.value?.notes || '').trim())

function syncMeta() {
  if (!app.value) {
    setPageMeta({
      title: `未找到该应用 · ${site.title}`,
      description: '该应用不在收录范围内。'
    })
    return
  }
  setPageMeta({
    title: `${app.value.name} · ${site.title}`,
    description: app.value.version
      ? `${app.value.summary}。最新版本 ${app.value.version}。`
      : app.value.summary,
    url: app.value.pageUrl
  })
}

function download() {
  if (!variant.value) return
  react({ mood: 'happy', hand: 'V' })
  window.setTimeout(() => react(null), 900)
  triggerDownload(variant.value.download.url)
}

watch(
  app,
  (value) => {
    activePlatform.value = value?.variants?.[0]?.platform || ''
    syncMeta()
  },
  { immediate: true }
)
onMounted(syncMeta)
</script>

<template>
  <div v-if="app" class="detail">
    <RouterLink class="back" to="/">
      <ArrowLeft :size="15" aria-hidden="true" />
      返回目录
    </RouterLink>

    <section class="hero">
      <div class="hero__panel" :style="{ '--status': meta.color }">
        <span class="hero__bar" aria-hidden="true" />
        <MonogramTile :app="app" :size="84" />
        <span class="hero__platform">
          <span class="hero__dot" aria-hidden="true" />
          {{ platformLabels }}
        </span>
      </div>

      <div class="hero__info">
        <h1 class="hero__name">{{ app.name }}</h1>
        <p class="hero__summary">{{ app.summary }}</p>

        <dl class="specs">
          <div class="specs__item">
            <dt>版本</dt>
            <dd class="mono">{{ app.version ? `v${app.version}` : '未有发布' }}</dd>
          </div>
          <div class="specs__item">
            <dt>体积</dt>
            <dd class="mono">{{ variant ? formatSize(variant.download.size) : '源码项目' }}</dd>
          </div>
          <div v-if="variant" class="specs__item">
            <dt>安装包</dt>
            <dd class="mono">{{ formatLabel(variant) }}</dd>
          </div>
          <div v-if="requirement" class="specs__item">
            <dt>系统</dt>
            <dd>{{ requirement }}</dd>
          </div>
          <div class="specs__item">
            <dt>发布</dt>
            <dd class="mono">{{ formatDate(app.publishedAt) }}</dd>
          </div>
          <div class="specs__item">
            <dt>仓库</dt>
            <dd class="mono">
              <a
                class="specs__link"
                :href="app.repository"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ app.repo }}
              </a>
            </dd>
          </div>
        </dl>

        <div
          v-if="variants.length > 1"
          class="platforms"
          role="tablist"
          aria-label="选择下载平台"
        >
          <button
            v-for="item in variants"
            :key="item.platform"
            class="platforms__btn"
            :class="{ 'is-active': item.platform === variant?.platform }"
            type="button"
            role="tab"
            :aria-selected="item.platform === variant?.platform"
            @click="activePlatform = item.platform"
          >
            {{ platformMeta(item.platform).label }}
            <span class="platforms__format mono">{{ formatLabel(item) }}</span>
          </button>
        </div>

        <div class="hero__actions">
          <button v-if="variant" class="btn btn--primary" type="button" @click="download">
            <Download :size="15" aria-hidden="true" />
            {{ downloadLabel(app, variant) }}
          </button>
          <a
            v-else
            class="btn"
            :href="app.repository"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github :size="15" aria-hidden="true" />
            查看仓库
          </a>

          <a
            class="btn btn--ghost"
            :href="app.releasesUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            全部版本
            <ExternalLink :size="13" aria-hidden="true" />
          </a>
        </div>

        <p v-if="app.publishedAt" class="hero__fresh mono">
          更新于 {{ relativeTime(app.publishedAt) }}
          <span v-if="variant">· {{ variant.download.downloadCount || 0 }} 次下载</span>
        </p>
      </div>
    </section>

    <section class="block">
      <h2 class="block__title">功能说明</h2>
      <div class="prose">
        <p v-for="line in paragraphs" :key="line">{{ line }}</p>
      </div>
    </section>

    <section v-if="notes" class="block notes">
      <div class="notes__head">
        <h2 class="block__title">本次更新</h2>
        <span class="notes__version mono">{{ app.tag }}</span>
      </div>
      <div class="prose prose--notes">
        <p v-for="line in notes.split('\n').filter((l) => l.trim())" :key="line">{{ line }}</p>
      </div>
    </section>

    <InstallGuide :app="app" :variant="variant" />
  </div>

  <EmptyState
    v-else
    mood="dizzy"
    title="没有这个应用"
    hint="链接可能已经失效，或者该应用尚未收录。"
  >
    <RouterLink class="back__link" to="/">返回目录</RouterLink>
  </EmptyState>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 5px 12px 5px 9px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-subtle);
  font-size: 12.5px;
  color: var(--text-secondary);
  transition: color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.back:hover {
  color: var(--accent);
  border-color: var(--border-strong);
}

.hero {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: var(--space-6);
  align-items: start;
}

.hero__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  overflow: hidden;
}

.hero__bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--status);
  opacity: 0.85;
}

.hero__platform {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--text-secondary);
}

.hero__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--status);
}

.hero__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.hero__name {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.hero__summary {
  font-size: 13.5px;
  color: var(--text-secondary);
  max-width: 52ch;
}

.specs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-6);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.specs__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.specs__item dt {
  font-size: 10.5px;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
}

.specs__item dd {
  font-size: 12.5px;
  color: var(--text-primary);
}

.specs__link {
  color: inherit;
  border-bottom: 1px dotted var(--border-strong);
}
.specs__link:hover {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

/* 多平台应用先选平台，再下载 */
.platforms {
  display: inline-flex;
  align-self: flex-start;
  padding: 3px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.platforms__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  color: var(--text-secondary);
  transition: color var(--dur-fast) var(--ease-out),
    background-color var(--dur-fast) var(--ease-out);
}
.platforms__btn:hover {
  color: var(--text-primary);
}
.platforms__btn.is-active {
  color: var(--text-primary);
  background: var(--bg-elevated);
  box-shadow: inset 0 -1px 0 var(--accent);
}

.platforms__format {
  font-size: 10.5px;
  color: var(--text-tertiary);
}
.platforms__btn.is-active .platforms__format {
  color: var(--text-secondary);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-strong);
  font-size: 13px;
  color: var(--text-primary);
  transition: transform var(--dur-fast) var(--ease-spring),
    border-color var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out);
}
.btn:hover {
  transform: translateY(-1px);
  border-color: var(--accent);
}

.btn--primary {
  border: none;
  background: var(--accent-gradient);
  color: var(--accent-ink);
  font-weight: 600;
}
.btn--primary:hover {
  box-shadow: 0 10px 24px -12px var(--accent-glow);
}

.btn--ghost {
  border-color: var(--border-subtle);
  color: var(--text-secondary);
}

.hero__fresh {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.block {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.block__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.prose {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 68ch;
  font-size: 13px;
  line-height: 1.85;
  color: var(--text-secondary);
}

.notes {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.notes__head {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.notes__version {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.prose--notes {
  font-size: 12.5px;
  line-height: 1.75;
}

.back__link {
  margin-top: var(--space-3);
  color: var(--accent);
  font-size: 13px;
}

@media (max-width: 760px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
  }
  .hero__panel {
    flex-direction: row;
    padding: var(--space-4);
  }
  .hero__name {
    font-size: 22px;
  }
  /* 手机上让主按钮整行出现，避免被挤出首屏 */
  .hero__actions {
    flex-direction: column;
  }
  .btn {
    justify-content: center;
  }
}
</style>

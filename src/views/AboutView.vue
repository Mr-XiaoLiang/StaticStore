<script setup>
import { onMounted } from 'vue'
import { Github } from 'lucide-vue-next'
import { composeFace } from '../data/faces.js'
import { profileUrl } from '../lib/catalog.js'
import { appCount, generatedAtLabel, site } from '../lib/store-meta.js'
import { setPageMeta } from '../lib/meta.js'

const face = composeFace({ mood: 'idle' })

const endpoints = [
  { path: '/api/v1/index.json', desc: '全部应用的最新版本摘要' },
  { path: '/api/v1/apps/<id>.json', desc: '单个应用的详情与下载直链' },
  { path: '/api/v1/latest.json', desc: '按发布时间倒序的最近更新' }
]

onMounted(() => {
  setPageMeta({
    title: `关于 · ${site.title}`,
    description: site.about
  })
})
</script>

<template>
  <div class="about">
    <p class="about__face mono" aria-hidden="true">{{ face.text }}</p>

    <h1 class="about__title">{{ site.title }}</h1>
    <p class="about__text">{{ site.about }}</p>

    <dl class="facts">
      <div class="facts__row">
        <dt>当前收录</dt>
        <dd class="mono">{{ appCount }} 个应用</dd>
      </div>
      <div class="facts__row">
        <dt>更新于</dt>
        <dd class="mono">{{ generatedAtLabel }}</dd>
      </div>
    </dl>

    <section class="block">
      <h2 class="block__title">版本与安装</h2>
      <p class="block__text">
        每个应用页给出当前版本、安装包体积、更新时间与安装步骤。
        需要更早的版本时，从应用页进入对应仓库的 Releases 页面。
      </p>
    </section>

    <section class="block">
      <h2 class="block__title">版本接口</h2>
      <p class="block__text">
        供客户端检查更新使用。请求时建议附加
        <code class="mono">?t=时间戳</code> 以避免缓存。
      </p>
      <ul class="endpoints">
        <li v-for="item in endpoints" :key="item.path" class="endpoints__row">
          <a class="endpoints__path mono" :href="item.path" target="_blank" rel="noopener noreferrer">
            {{ item.path }}
          </a>
          <span class="endpoints__desc">{{ item.desc }}</span>
        </li>
      </ul>
    </section>

    <a class="about__github" :href="profileUrl" target="_blank" rel="noopener noreferrer">
      <Github :size="15" aria-hidden="true" />
      {{ profileUrl.replace('https://', '') }}
    </a>
  </div>
</template>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 62ch;
  margin-inline: auto;
  padding-top: var(--space-5);
}

.about__face {
  font-size: 26px;
  letter-spacing: 0.08em;
  color: var(--accent);
}

.about__title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.about__text {
  font-size: 13.5px;
  line-height: 1.85;
  color: var(--text-secondary);
}

.facts {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  overflow: hidden;
}

.facts__row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 9px var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}
.facts__row:last-child {
  border-bottom: none;
}

.facts__row dt {
  font-size: 12px;
  color: var(--text-tertiary);
}
.facts__row dd {
  font-size: 12px;
  color: var(--text-primary);
  text-align: right;
}

.block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.block__title {
  font-size: 13px;
  font-weight: 600;
}

.block__text {
  font-size: 12.5px;
  line-height: 1.85;
  color: var(--text-secondary);
}

code {
  padding: 1px 5px;
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  font-size: 11.5px;
}

.endpoints {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.endpoints__row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}
.endpoints__row:last-child {
  border-bottom: none;
}

.endpoints__path {
  font-size: 11.5px;
  color: var(--accent);
}
.endpoints__path:hover {
  text-decoration: underline;
}

.endpoints__desc {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.about__github {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  margin-top: var(--space-2);
  font-size: 12.5px;
  color: var(--text-secondary);
}
.about__github:hover {
  color: var(--accent);
}
</style>

<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import BackgroundFX from './components/BackgroundFX.vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import { useTitleFace } from './composables/useTitleFace.js'
import { clearReaction, react } from './composables/useFace.js'

// 标签页标题在站名与表情之间轮播，切走时变成困倦的样子
useTitleFace()

const route = useRoute()

// 路由切换：进入详情页时字标保持专注，未找到页面时露出晕眩
watch(
  () => route.fullPath,
  () => {
    if (route.name === 'notFound') {
      react({ mood: 'dizzy' })
      return
    }
    if (route.name === 'app') {
      react({ mood: 'busy' })
      return
    }
    clearReaction()
  },
  { immediate: true }
)
</script>

<template>
  <BackgroundFX />
  <AppHeader />

  <main class="main">
    <div class="container">
      <RouterView />
    </div>
  </main>

  <AppFooter />
</template>

<style scoped>
.main {
  position: relative;
  z-index: var(--z-content);
  /* 顶部让开固定顶栏，底部留给页脚 */
  padding-block: 96px 0;
  min-height: calc(100vh - 120px);
}

@media (max-width: 560px) {
  .main {
    padding-top: 84px;
  }
}
</style>

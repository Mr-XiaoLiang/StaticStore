import { createRouter, createWebHistory } from 'vue-router'
import StoreView from '../views/StoreView.vue'

/**
 * history 模式 + 构建后的 404.html 兜底：
 * 详情页可以直接分享、可以从搜索进入，也可被搜索引擎索引。
 * 首屏静态壳由 scripts/prerender.mjs 生成，这里只负责站内跳转。
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'store',
      component: StoreView
    },
    {
      path: '/apps/:id',
      name: 'app',
      component: () => import('../views/AppDetailView.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: () => import('../views/NotFoundView.vue')
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

export default router

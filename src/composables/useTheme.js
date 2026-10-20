import { ref, watch } from 'vue'

/** 与品牌站同一个键：两个站点共享主题偏好，切一处两边都变 */
const STORAGE_KEY = 'lollipop-theme'

function getInitial() {
  if (typeof window === 'undefined') return 'dark'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch (e) {}
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

// 单例主题状态，跨组件共享
const theme = ref(getInitial())

function apply(value) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = value
  }
}

apply(theme.value)

watch(theme, (v) => {
  apply(v)
  try {
    localStorage.setItem(STORAGE_KEY, v)
  } catch (e) {}
})

export function useTheme() {
  const toggle = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }
  const set = (value) => {
    if (value === 'dark' || value === 'light') theme.value = value
  }
  return { theme, toggle, set }
}

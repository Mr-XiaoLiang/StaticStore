import { ref } from 'vue'

/**
 * 顶栏与目录页共用的搜索词。
 * 顶栏常驻在应用壳里，目录页需要读到同一个值，因此提到模块级单例。
 */
export const searchQuery = ref('')

export function setSearch(value) {
  searchQuery.value = value || ''
}

export function clearSearch() {
  searchQuery.value = ''
}

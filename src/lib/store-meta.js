import { apps, generatedAt, site } from './catalog.js'
import { formatDateTime } from './format.js'

export { site }

export const appCount = apps.length

/** 数据截止时间：页脚与关于页都用它，避免两处各写一遍格式化逻辑 */
export const generatedAtLabel = generatedAt ? formatDateTime(generatedAt) : '未知'

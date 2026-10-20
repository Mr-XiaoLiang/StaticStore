<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { Check, Copy } from 'lucide-vue-next'
import { copyText } from '../lib/download.js'
import { react } from '../composables/useFace.js'

const props = defineProps({
  command: { type: String, required: true },
  label: { type: String, default: '' }
})

const state = ref('idle') // idle | done | failed
let timer = 0

async function handleCopy() {
  const ok = await copyText(props.command)
  state.value = ok ? 'done' : 'failed'

  if (ok) react({ mood: 'star' })

  clearTimeout(timer)
  timer = window.setTimeout(() => {
    state.value = 'idle'
    if (ok) react(null)
  }, 1600)
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="cmd">
    <div class="cmd__head">
      <span v-if="label" class="cmd__label">{{ label }}</span>
      <button
        class="cmd__btn"
        type="button"
        :class="{ 'is-done': state === 'done', 'is-failed': state === 'failed' }"
        @click="handleCopy"
      >
        <Check v-if="state === 'done'" :size="13" aria-hidden="true" />
        <Copy v-else :size="13" aria-hidden="true" />
        {{ state === 'done' ? '已复制' : state === 'failed' ? '请手动选中' : '复制' }}
      </button>
    </div>

    <pre class="cmd__code mono"><code>{{ command }}</code></pre>
  </div>
</template>

<style scoped>
.cmd {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface-strong);
  overflow: hidden;
}

.cmd__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 7px 10px 7px 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.cmd__label {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.cmd__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  padding: 3px 9px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  font-size: 11.5px;
  color: var(--text-secondary);
  transition: color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out);
}

.cmd__btn:hover {
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.cmd__btn.is-done {
  color: var(--status-ok);
  border-color: color-mix(in srgb, var(--status-ok) 45%, transparent);
}

.cmd__btn.is-failed {
  color: var(--status-danger);
  border-color: color-mix(in srgb, var(--status-danger) 45%, transparent);
}

.cmd__code {
  margin: 0;
  padding: 11px 12px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.65;
  color: var(--text-primary);
  white-space: pre;
  tab-size: 2;
}

.cmd__code::selection {
  background: var(--accent);
  color: var(--accent-ink);
}
</style>

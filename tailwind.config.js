/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  // 关闭 preflight：基础重置由 src/styles/base.css 提供，
  // 与品牌站保持同一套排版基线，避免两层重置互相覆盖。
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        canvas: '#0B0C10',
        surface: '#16181F',
        elevated: '#1E212A',
        line: 'rgba(255,255,255,0.08)',
        amber: {
          DEFAULT: '#E8C97A',
          soft: '#F2D896'
        },
        ok: '#5FD3A0',
        wear: '#6FA8FF',
        muted: '#6B7186',
        danger: '#E45C5C'
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'PingFang SC',
          'Helvetica Neue',
          'Microsoft YaHei',
          'Source Han Sans CN',
          'sans-serif'
        ],
        mono: ['SF Mono', 'JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    }
  },
  plugins: []
}

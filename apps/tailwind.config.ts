// apps/vue/tailwind.config.ts — Semantic Design Tokens (SOP §0.1 & §10.1 Hard Rule 9)
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--c-canvas)',
        ink: 'var(--c-ink)',
        body: 'var(--c-body)',
        muted: 'var(--c-muted)',
        'muted-soft': 'var(--c-muted-soft)',
        faint: 'var(--c-faint)',
        hairline: 'var(--c-hairline)',
        'hairline-soft': 'var(--c-hairline-soft)',
        'surface-card': 'var(--c-surface-card)',
        'surface-soft': 'var(--c-surface-soft)',
        'surface-strong': 'var(--c-surface-strong)',
        'surface-dark': 'var(--c-surface-dark)',
        'on-dark': 'var(--c-on-dark)',
        primary: 'var(--c-primary)',
        success: 'var(--c-success)',
        warning: 'var(--c-warning)',
        error: 'var(--c-error)',
      },
      fontFamily: {
        display: ['var(--font-main)'],
        sans: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      spacing: {
        xxs: 'var(--s-xxs)',
        xs: 'var(--s-xs)',
        sm: 'var(--s-sm)',
        md: 'var(--s-md)',
        lg: 'var(--s-lg)',
        xl: 'var(--s-xl)',
        xxl: 'var(--s-xxl)',
        topbar: 'var(--layout-topbar-h)',
        sidebar: 'var(--layout-sidebar-w)',
      },
    },
  },
  plugins: [],
}

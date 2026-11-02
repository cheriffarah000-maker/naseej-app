/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // All colours come from CSS variables (see src/index.css) so light and
      // dark mode are one palette swap, not two copies of every class name.
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        ink: 'var(--text)',
        muted: 'var(--text-muted)',
        brand: 'var(--primary)',
        'brand-dark': 'var(--primary-600)',
        deep: 'var(--deep)',
        danger: 'var(--danger)',
        sand: 'var(--sand)',
        gold: 'var(--gold)',
        line: 'var(--border)',
      },
      fontFamily: {
        sans: ['Inter', 'Cairo', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        arch: '28px 28px 6px 6px', // the Tunisian window shape
        xl2: '20px',
      },
      boxShadow: {
        float: '0 12px 40px -12px rgba(3, 34, 60, 0.28)',
        soft: '0 2px 12px -2px rgba(3, 34, 60, 0.12)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(231, 0, 19, 0.45)' },
          '70%': { boxShadow: '0 0 0 16px rgba(231, 0, 19, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(231, 0, 19, 0)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s infinite',
        'fade-up': 'fade-up 0.28s ease-out both',
        shimmer: 'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
};

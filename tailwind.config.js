/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#050504',
        surface: '#0f0e0c',
        surface2: '#17130d',
        accent: '#d8a84e',
        accentLight: '#f4d58a',
        bronze: '#8d6228',
        ink: '#080706',
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
      boxShadow: {
        glow: '0 0 32px rgba(216, 168, 78, 0.25)',
        'gold-soft': '0 18px 60px rgba(118, 79, 26, 0.22)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
        'gold-pulse': {
          '0%, 100%': { opacity: '0.32', transform: 'scale(1)' },
          '50%': { opacity: '0.62', transform: 'scale(1.04)' },
        },
        'ambient-float': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -10px, 0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.6s ease-in-out infinite',
        'gold-pulse': 'gold-pulse 5s ease-in-out infinite',
        'ambient-float': 'ambient-float 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

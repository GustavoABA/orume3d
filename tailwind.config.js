/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#071017',
        surface: '#0B171E',
        surface2: '#102129',
        accent: '#24DD75',
        accentLight: '#72F2A8',
        gold: '#DFAA4E',
        bronze: '#A9792E',
        paper: '#F1EEE7',
        muted: '#92A0AA',
        ink: '#071017',
      },
      fontFamily: {
        display: ['Arial', 'Helvetica', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 34px rgba(36, 221, 117, 0.20)',
        'gold-soft': '0 18px 60px rgba(223, 170, 78, 0.18)',
        'panel-soft': '0 24px 80px rgba(0, 0, 0, 0.28)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
        'accent-pulse': {
          '0%, 100%': { opacity: '0.34', transform: 'scale(1)' },
          '50%': { opacity: '0.62', transform: 'scale(1.04)' },
        },
        'ambient-float': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -10px, 0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.6s ease-in-out infinite',
        'accent-pulse': 'accent-pulse 5s ease-in-out infinite',
        'ambient-float': 'ambient-float 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx,css}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        /** Matches logo: deep navy + metallic gold */
        brand: {
          navy: '#050B1A',
          elevated: '#0a1628',
          panel: '#0f1729',
          gold: '#C5A059',
          bright: '#e4c77d',
        },
        surface: {
          DEFAULT: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
        },
        accent: {
          DEFAULT: '#C5A059',
          muted: '#94a3b8',
        },
      },
    },
  },
  plugins: [],
};

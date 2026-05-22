/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        /** Primary dark canvas + accents (see #194864 in CSS) */
        darkBrand: {
          DEFAULT: '#1e293b',
          deep: '#0f172a',
          soft: '#334155',
          muted: 'rgb(30 41 59 / 0.5)',
        },
        /** Dashboard accent: muted teal/cyan on slate (readable, not neon) */
        brand: {
          navy: '#050B1A',
          elevated: '#12151c',
          panel: '#17191f',
          accent: '#5eb4c8',
          accentSoft: '#a8e8f0',
          muted: '#94a3b8',
        },
        surface: {
          DEFAULT: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
        },
        accent: {
          DEFAULT: '#5eb4c8',
          muted: '#64748b',
        },
      },
    },
  },
  plugins: [],
};

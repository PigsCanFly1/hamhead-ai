/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wheat: '#F4D03F',
        soil: '#2C1810',
        neon: '#00FF88',
        deep: '#0A0E27',
        rust: '#B7410E',
        cloud: '#F9F7F0',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        body: ['Space Grotesk', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

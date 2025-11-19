/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{tsx,ts,js,jsx}'],
  darkMode: 'class',               // <-- we control it with a class
  theme: {
    extend: {
      colors: {
        primary: '#007acc',
        surface: '#000000',        // pure black for the main surface
        overlay: '#111111',        // a very dark overlay for sidebars
      },
    },
  },
  plugins: [],
};
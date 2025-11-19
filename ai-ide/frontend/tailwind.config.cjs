/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{tsx,ts,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#007acc',
        surface: '#1e1e1e',
        overlay: '#2d2d2d',
      },
    },
  },
  plugins: [],
};
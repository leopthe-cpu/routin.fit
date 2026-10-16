/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // "white" is the theme's ink: white on the night panel, near-black by day.
      colors: { white: 'rgb(var(--ink-rgb) / <alpha-value>)' },
    },
  },
  plugins: [],
};

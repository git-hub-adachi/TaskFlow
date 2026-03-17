/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};

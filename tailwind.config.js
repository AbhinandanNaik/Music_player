/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Grandstander', 'cursive', 'sans-serif'],
      },
      colors: {
        'brand-dark': '#404898',
        'brand-light': '#A2A6D1',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}

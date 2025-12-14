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
        'aurora-dark': '#0F172A',
        'aurora-purple': '#C084FC',
        'aurora-blue': '#818CF8',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'blob': 'blob 10s infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        }
      }
    },
  },
  plugins: [],
}

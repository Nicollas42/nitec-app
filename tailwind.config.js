/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nitec_blue': '#008CBA', // Usando Snake Case conforme seu padrão
        'nitec_dark': '#1a1a1a',
      }
    },
  },
  plugins: [],
}
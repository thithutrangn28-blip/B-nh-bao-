/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "ui-serif", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
        cursive: ["Great Vibes", "cursive"],
        lora: ["Lora", "serif"],
      },
    },
  },
  plugins: [],
}

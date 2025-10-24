/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- This tells Tailwind to scan all your component files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
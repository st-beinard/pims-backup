// frontend/tailwind.config.cjs (or .js)
/** @type {import('tailwindcss').Config} */
module.exports = { // or export default { if using .js with ES module syntax
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This covers all relevant files in src
  ],
  theme: {
    extend: {
      fontFamily: { // If you added custom fonts
        'comme-medium': ['Comme-Medium', 'Helvetica', 'sans-serif'],
        'comme-semibold': ['Comme-SemiBold', 'Helvetica', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
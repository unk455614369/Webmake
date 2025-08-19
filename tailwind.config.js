/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          400: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca'
        }
      }
    }
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Inter"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f7f4',
          100: '#e2f0eb',
          200: '#c5e3d8',
          300: '#a3cfc0',
          400: '#7bb5a2',
          500: '#4a9e83',
          600: '#2a7d5f',
          700: '#236b50',
          800: '#1a3d30',
          900: '#1a3d30',
          950: '#1a3d30',
        },
        surface: {
          50: '#f0f7f4',
          100: '#e2f0eb',
          200: '#c5e3d8',
          300: '#a3cfc0',
          400: '#7bb5a2',
          500: '#4a7a67',
          600: '#2e5e4a',
          700: '#2e5e4a',
          800: '#1a3d30',
          900: '#1a3d30',
          950: '#1a3d30',
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0b1d30',
        },
        emblem: {
          gold: '#c69214',
          navy: '#0b2545',
          slate: '#134074',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'gov': '0 4px 6px -1px rgba(16, 42, 67, 0.08), 0 2px 4px -1px rgba(16, 42, 67, 0.04)',
        'gov-lg': '0 10px 15px -3px rgba(16, 42, 67, 0.1), 0 4px 6px -2px rgba(16, 42, 67, 0.05)',
      }
    },
  },
  plugins: [],
}

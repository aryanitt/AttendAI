/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#dce5fe',
          300: '#c2d1fd',
          400: '#9db4fb',
          500: '#758ef8',
          600: '#5566f1',
          700: '#434ee1',
          800: '#3941b7',
          900: '#323a91',
        },
        secondary: "#6366f1", // Indigo
        accent: "#3b82f6", // Blue
        dark: "#0f172a", // Slate 900
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
        'glass': 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
}

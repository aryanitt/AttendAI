/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "DM Sans", "system-ui", "sans-serif"],
        display: ["Outfit", "Instrument Sans", "DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        stitch: {
          bg: "rgb(var(--stitch-bg) / <alpha-value>)",
          surface: "rgb(var(--stitch-surface) / <alpha-value>)",
          border: "rgb(var(--stitch-border) / <alpha-value>)",
          muted: "rgb(var(--stitch-muted) / <alpha-value>)",
          accent: "rgb(var(--stitch-accent) / <alpha-value>)",
          accent2: "rgb(var(--stitch-accent2) / <alpha-value>)",
        },
      },
      boxShadow: {
        stitch: "0 1px 0 rgba(255,255,255,0.06) inset, 0 12px 40px -20px rgba(0,0,0,0.45)",
        "stitch-lg":
          "0 1px 0 rgba(255,255,255,0.08) inset, 0 24px 64px -24px rgba(0,0,0,0.55)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

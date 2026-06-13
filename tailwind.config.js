/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        port: {
          50: "#eef2f8",
          100: "#d6deea",
          200: "#aec2d9",
          300: "#7e9cc2",
          400: "#4d75a5",
          500: "#2f5787",
          600: "#1e416b",
          700: "#183458",
          800: "#0A2540",
          900: "#06192b",
        },
        warn: {
          50: "#fff3ed",
          100: "#ffe2d1",
          300: "#ffb38a",
          500: "#FF6B35",
          600: "#e55521",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "PingFang SC",
          "Microsoft YaHei",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

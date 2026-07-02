/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      maxWidth: "1440px",
    },
    extend: {
      colors: {
        ink: {
          900: "#0c0a08",
          800: "#1a1510",
          700: "#2a2218",
          600: "#3d3220",
        },
        gold: {
          50: "#fdf6e3",
          100: "#f5e6c4",
          200: "#e9c176",
          300: "#d4a84a",
          400: "#c19b4d",
          500: "#b8860b",
        },
        cinnabar: {
          50: "#fef2f0",
          100: "#f5d0cb",
          200: "#e8a095",
          300: "#d35041",
          400: "#c23030",
          500: "#a02020",
        },
        rice: {
          50: "#faf8f2",
          100: "#f5f0e6",
          200: "#ebe4d4",
          300: "#ddd4c0",
          400: "#c8bda8",
        },
      },
      fontFamily: {
        calligraphy: ['"Zhi Mang Xing"', "cursive"],
        brush: ['"Ma Shan Zheng"', "cursive"],
        song: ['"Noto Serif SC"', "serif"],
        body: ['"Noto Serif SC"', "serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bce0ff",
          300: "#8eccff",
          400: "#59b0ff",
          500: "#2f8fff",
          600: "#166ff5",
          700: "#1157dd",
          800: "#1547b3",
          900: "#173e8d",
          950: "#0f2757",
        },
        saffron: {
          500: "#ff9933",
          600: "#f2801a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

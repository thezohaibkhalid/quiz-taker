/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Inter", "Roboto", "sans-serif"],
        serif: ["Georgia", "Cambria", "ui-serif", "serif"],
      },
      colors: {
        ink: {
          50:  "#f7f7f5",
          100: "#efeee9",
          200: "#dad8d0",
          300: "#bcb9ad",
          400: "#9a9789",
          500: "#7b7868",
          600: "#5e5b4d",
          700: "#454335",
          800: "#2a2820",
          900: "#1a1813",
        },
        cream: {
          50:  "#fdfcf8",
          100: "#f9f6ee",
          200: "#f1ecde",
        },
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        accent: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(17,24,39,0.04), 0 4px 12px rgba(17,24,39,0.04)",
        card: "0 1px 2px rgba(17,24,39,0.05), 0 8px 24px rgba(17,24,39,0.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

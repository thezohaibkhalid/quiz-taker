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
          50:  "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
        cream: {
          50:  "#f8f7f4",
          100: "#f0eee7",
          200: "#e5e1d4",
        },
        brand: {
          50:  "#f1f5f9",
          100: "#e2e8f0",
          200: "#cbd5e1",
          300: "#94a3b8",
          400: "#64748b",
          500: "#475569",
          600: "#334155",
          700: "#1e293b",
          800: "#0f172a",
          900: "#020617",
        },
        accent: {
          50:  "#fbf2eb",
          100: "#f5dcc7",
          200: "#edb693",
          300: "#df8d5e",
          400: "#cc6a36",
          500: "#b25525",
          600: "#944325",
          700: "#75351f",
          800: "#5a2a1c",
          900: "#44211a",
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

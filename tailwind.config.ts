import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050510",
        foreground: "#e2e8f0",
        "accent-blue": "#3b82f6",
        "accent-purple": "#7c3aed",
      },
    },
  },
  plugins: [],
};

export default config;

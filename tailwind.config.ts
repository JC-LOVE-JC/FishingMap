import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        abyss: {
          950: "#020712",
          900: "#07111f",
          800: "#0e1b2c",
          700: "#15283e"
        },
        lagoon: {
          100: "#ecffff",
          200: "#c9f4f1",
          300: "#9de7e4",
          500: "#49c6c7",
          400: "#78d7d6"
        },
        gold: {
          100: "#fff3db",
          200: "#f6dfb6",
          300: "#f2d6a2",
          400: "#e3bc74",
          500: "#d7aa5a"
        }
      },
      boxShadow: {
        panel: "0 28px 60px rgba(0, 0, 0, 0.35)",
        glow: "0 0 0 1px rgba(255, 255, 255, 0.06), 0 18px 40px rgba(0, 0, 0, 0.32)"
      },
      fontFamily: {
        display: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "serif"],
        body: ["Avenir Next", "Segoe UI", "Helvetica Neue", "sans-serif"]
      },
      backgroundImage: {
        "ocean-radial":
          "radial-gradient(circle at top, rgba(72, 198, 199, 0.18), rgba(2, 7, 18, 0) 38%)",
        "gold-sheen":
          "linear-gradient(135deg, rgba(215, 170, 90, 0.12), rgba(215, 170, 90, 0))"
      }
    }
  },
  plugins: []
};

export default config;

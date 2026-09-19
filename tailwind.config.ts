import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        case: "#1C1A17",     // fondo, como el interior de una caja de relojero
        dial: "#262320",     // superficies
        brass: "#C89B3C",    // acento — metal de la maquinaria
        steel: "#8A8377",    // texto secundario
        cream: "#EDE8DE",    // texto principal
        line: "#3A362F",     // divisores
      },
      fontFamily: {
        display: ["var(--font-archivo)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

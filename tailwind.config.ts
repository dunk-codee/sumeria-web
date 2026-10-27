import type { Config } from "tailwindcss";

/**
 * Tokens de Sumeria. El rojo de marca sale del Manual de Identidad
 * ("Naranja salmón" #D75B4B), que tiene prioridad sobre el prototipo.
 * Para rellenos con texto blanco se usa `sumeria-dark`, que mantiene
 * contraste ≥ 4.5:1.
 */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      screens: {
        // El prototipo cambia de mobile a desktop a los 900px.
        d: "900px",
      },
      colors: {
        ink: "#0B0A09",
        coal: "#141210",
        well: "#0E0D0B",
        raised: "#191714",
        page: "#1A1918",
        bone: "#F4F1EC",
        sand: "#D9D3CB",
        silver: "#C7C4C4",
        stone: { 2: "#BDB6AD", 3: "#A39B91", 4: "#7E7770", 5: "#8A837B", 6: "#6E6862" },
        sumeria: {
          DEFAULT: "#D75B4B",
          light: "#FF7A6B",
          dark: "#BF4636",
          deep: "#A3362A",
        },
        kraft: { DEFAULT: "#D8BC93", ink: "#21170E", bag: "#C29A6B" },
        // Avisos positivos ("Hay lugar"): borde/ícono y fondo oscuro verdoso. El texto va en `bone`.
        ok: { DEFAULT: "#6FBF7A", bg: "#121C14" },
        // Fondo de avisos de error/sin lugar (con borde `sumeria`).
        alert: { bg: "#1A0F0E" },
        line: "rgba(244,241,236,.22)",
        // Panel de administración
        panel: {
          bg: "#0F0E0D",
          surface: "#151412",
          hover: "#1F1D1B",
          text: "#F1EEE9",
          muted: "#9C958D",
          soft: "#B5AEA6",
        },
        smoke: { 1: "#2C2826", 2: "#34302D", 3: "#3A3532", 4: "#4A4440" },
      },
      fontFamily: {
        display: ["var(--font-oswald)", "Oswald", "sans-serif"],
        sans: ["var(--font-instrument)", "Instrument Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "IBM Plex Mono", "monospace"],
        script: ["var(--font-script)", "Mrs Saint Delafield", "cursive"],
        jost: ["var(--font-jost)", "Jost", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "3px",
        xs: "2px",
      },
      keyframes: {
        "x-spin": { "0%": { transform: "rotate(0)" }, "100%": { transform: "rotate(180deg)" } },
        "x-pulse": { "0%,100%": { opacity: ".35" }, "50%": { opacity: ".75" } },
        "toast-in": { "0%": { opacity: "0", transform: "translate(-50%, 8px)" }, "100%": { opacity: "1", transform: "translate(-50%, 0)" } },
      },
      animation: {
        "x-spin": "x-spin .9s cubic-bezier(.6,0,.3,1) infinite",
        "x-pulse": "x-pulse 1.4s ease-in-out infinite",
        "toast-in": "toast-in .18s ease-out",
      },
    },
  },
} satisfies Config;

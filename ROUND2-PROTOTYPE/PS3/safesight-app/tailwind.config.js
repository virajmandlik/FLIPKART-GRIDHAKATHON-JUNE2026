/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#06070A", 900: "#0A0C12", 800: "#11141C", 700: "#181C28" },
        amber: { brand: "#FFC200" },
        cyan: { tech: "#22D3EE" },
        danger: "#FF4757",
        ok: "#22C55E",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      keyframes: {
        flow: { "0%": { strokeDashoffset: 24 }, "100%": { strokeDashoffset: 0 } },
        pulseSoft: { "0%,100%": { opacity: 0.4 }, "50%": { opacity: 1 } },
        scan: { "0%": { top: "0%" }, "100%": { top: "100%" } },
      },
      animation: {
        flow: "flow 1s linear infinite",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
        scan: "scan 3s linear infinite",
      },
    },
  },
  plugins: [],
};

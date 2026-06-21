/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#0A0B0F", 900: "#0E1016", 800: "#141820", 700: "#1A1F2A" },
        amber: { brand: "#FFC200" },
        cyan: { tech: "#22D3EE" },
        /* Drishaak — premium storytelling palette */
        ss: {
          bg: "#050505",
          bg2: "#0B0B0B",
          card: "#101114",
          line: "rgba(255,255,255,0.08)",
          text: "#FFFFFF",
          muted: "#B5B5B5",
          gold: "#F5B84A",
          green: "#7ED957",
          red: "#FF5A5A",
        },
        saffron: {
          DEFAULT: "#FF9933",
          light: "#FFB366",
          dark: "#E67E00",
        },
        teal: {
          DEFAULT: "#14B8A6",
          light: "#2DD4BF",
          dark: "#0D9488",
        },
        traffic: {
          red: "#EF4444",
          amber: "#F59E0B",
          green: "#22C55E",
        },
        risk: {
          low: "#22C55E",
          medium: "#F59E0B",
          high: "#EF4444",
        },
        danger: "#FF4757",
        ok: "#22C55E",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "glow-saffron": "0 0 24px -4px rgba(255, 153, 51, 0.45)",
        "glow-teal": "0 0 24px -4px rgba(20, 184, 166, 0.45)",
      },
      keyframes: {
        flow: { "0%": { strokeDashoffset: 24 }, "100%": { strokeDashoffset: 0 } },
        pulseSoft: { "0%,100%": { opacity: 0.4 }, "50%": { opacity: 1 } },
        scan: { "0%": { top: "0%" }, "100%": { top: "100%" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        dashmove: { to: { strokeDashoffset: -200 } },
        sheen: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        flow: "flow 1s linear infinite",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
        scan: "scan 3s linear infinite",
        floaty: "floaty 6s ease-in-out infinite",
        dashmove: "dashmove 3s linear infinite",
        sheen: "sheen 6s linear infinite",
      },
    },
  },
  plugins: [],
};

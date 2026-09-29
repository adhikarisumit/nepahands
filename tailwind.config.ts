import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette driven by CSS variables so the colour can be changed from Admin → Branding.
        // Defaults live in globals.css; the root layout overrides them from the saved brand colour.
        clay: Object.fromEntries(
          ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"].map((s) => [
            s,
            `rgb(var(--clay-${s}) / <alpha-value>)`,
          ])
        ),
        ink: "#2b211c",
        sage: { 500: "#7a8b6f", 600: "#63725a" },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-off": "var(--bg-off)",
        text: "var(--text)",
        "text-mid": "var(--text-mid)",
        "text-light": "var(--text-light)",
        "text-faint": "var(--text-faint)",
        border: "var(--border)",
        accent: "var(--accent)",
      },
      fontFamily: {
        display: ["Libre Caslon Display", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        prose: ["Crimson Pro", "Georgia", "serif"],
      },
      letterSpacing: {
        widest: "0.2em",
        superwide: "0.35em",
      },
    },
  },
  plugins: [],
};

export default config;

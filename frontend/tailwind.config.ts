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
        retro: {
          bg: "#FDF8E1",
          primary: "#E63946",
          dark: "#1D1D1D",
          accent: "#F4A261",
        },
      },
      fontFamily: {
        pixel: ["var(--font-vt323)", "monospace"],
      },
      boxShadow: {
        pixel: "4px 4px 0px 0px #1D1D1D",
      },
    },
  },
  plugins: [],
};
export default config;

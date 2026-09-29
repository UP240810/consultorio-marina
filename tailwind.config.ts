import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2E1065",
        plum: "#4C1D95",
        violet: "#6D28D9",
        lilac: "#8B5CF6",
        mist: "#F5F3FF",
        paper: "#FBFAFF",
        risk: "#B45309",
        ok: "#15803D",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "0.65rem",
      },
    },
  },
  plugins: [],
};
export default config;

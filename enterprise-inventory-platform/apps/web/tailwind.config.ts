import type { Config } from "tailwindcss";

const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(210 18% 86%)",
        background: "hsl(200 17% 97%)",
        foreground: "hsl(202 29% 12%)",
        primary: {
          DEFAULT: "hsl(176 76% 27%)",
          foreground: "hsl(0 0% 100%)",
        },
      },
      borderRadius: {
        md: "8px",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;

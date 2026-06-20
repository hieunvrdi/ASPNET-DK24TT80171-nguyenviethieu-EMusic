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
        // Spotify Design System
        "sp-black":   "#121212",   // deepest background
        "sp-surface": "#181818",   // cards, sidebar
        "sp-mid":     "#1f1f1f",   // button bg, interactive
        "sp-card":    "#252525",   // elevated card
        "sp-green":   "#1ed760",   // brand accent
        "sp-green-b": "#1db954",   // green border variant
        "sp-white":   "#ffffff",
        "sp-silver":  "#b3b3b3",   // secondary text
        "sp-border":  "#4d4d4d",
        "sp-border-l":"#7c7c7c",
        "sp-red":     "#f3727f",   // error
        "sp-orange":  "#ffa42b",   // warning
        "sp-blue":    "#539df5",   // info
      },
      fontFamily: {
        spotify: [
          "SpotifyMixUI",
          "CircularSp",
          "Helvetica Neue",
          "helvetica",
          "arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        pill:   "9999px",
        "pill-lg": "500px",
      },
      boxShadow: {
        "sp-heavy":  "rgba(0,0,0,0.5) 0px 8px 24px",
        "sp-medium": "rgba(0,0,0,0.3) 0px 8px 8px",
      },
    },
  },
  plugins: [],
};
export default config;

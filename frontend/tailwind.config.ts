import type { Config } from "tailwindcss";
const config: Config = {
  content:["./app/**/*.{js,ts,jsx,tsx,mdx}","./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme:{extend:{colors:{ink:"#070a0d",panel:"#0d1217",line:"#1e2933",cyan:"#22d3ee"}}},
  plugins:[]
};
export default config;
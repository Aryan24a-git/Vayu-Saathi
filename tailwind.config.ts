import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#F7F6F2',
        surface: '#FFFFFF',
        ink: '#0F172A',
        aqi: {
          good: '#00e400',
          moderate: '#ffff00',
          usg: '#ff7e00',
          unhealthy: '#ff0000',
          'very-unhealthy': '#8f3f97',
          hazardous: '#7e0023',
          severe: '#4a0010',
        },
      },
    },
  },
  plugins: [],
};
export default config;


import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Kasha brand palette (2023 Branding Guidelines)
        // Blue is the "Enterprise/Corporate" market color - the right primary
        // for an internal ERP tool. Pink/Yellow are used as accents.
        brand: {
          50: '#eaf0fa',
          100: '#c7d8f0',
          500: '#1E499F', // Kasha Blue - Enterprises
          600: '#1a3f89',
          700: '#153373',
        },
        kasha: {
          pink: '#E2156A', // Consumers
          yellow: '#EBCD1A', // Retailers & Health Facilities
          blue: '#1E499F', // Enterprises
          black: '#000000',
          grey: '#EEEEEE',
        },
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

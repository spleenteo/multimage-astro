/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',
        sm: '2rem',
        lg: '3rem',
      },
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      colors: {
        brand: {
          navy: '#004881',
          'navy-light': '#005192',
          sky: '#088AF2',
          crimson: '#AE0E0E',
          charcoal: '#343434',
          slate: '#6C757D',
          sand: '#F4F4F4',
          mist: '#F2F4F6',
          orange: '#FA7810',
        },
        social: {
          facebook: '#4267B2',
          instagram: '#C13584',
          twitter: '#38A1F3',
          newsletter: '#53BE42',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Playfair Display', 'serif'],
      },
      boxShadow: {
        soft: '0 18px 45px rgba(0, 72, 129, 0.08)',
      },
      letterSpacing: {
        wide: '0.08em',
        wider: '0.12em',
      },
    },
  },
  plugins: [],
};

export default config;

const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: c('black'),      // #0B0F10
        coal: c('dark'),        // #121719
        leaf: c('green'),       // #35A900
        lime: c('green-bright'),// #55C900
        moss: c('green-ink'),   // dark green for text on white (AA contrast)
        mist: c('light'),       // #F5F7F5
      },
      fontFamily: {
        display: ['Archivo', 'Arial Narrow', 'Arial', 'sans-serif'],
        sans: ['"Public Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(11 15 16 / 0.06), 0 12px 32px -12px rgb(11 15 16 / 0.18)',
        glow: '0 0 0 1px rgb(var(--c-green) / 0.5), 0 18px 40px -18px rgb(var(--c-green) / 0.55)',
      },
    },
  },
  plugins: [],
};

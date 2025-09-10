/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: '#1a1f2e',
          card: '#23293a',
          hover: '#2c3446',
          accent: '#394867',
          text: '#e3eafc',
          primary: '#90caf9',
          secondary: '#1976d2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}


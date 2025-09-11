/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: '#2c3e50',
          card: '#1a252f',
          hover: '#2c3e50',
          accent: '#34495e',
          text: '#ffffff',
          primary: '#3498db',
          secondary: '#1976d2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full': '9999px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}


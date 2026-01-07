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
      maxWidth: {
        '7xl': '80rem', // Reduce from default 80rem to make it smaller
        '6xl': '72rem',
        '5xl': '64rem',
      },
      spacing: {
        // Reduce spacing on larger screens
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '2rem',
        '2xl': '2rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px', // Reduce from default 1536px
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}


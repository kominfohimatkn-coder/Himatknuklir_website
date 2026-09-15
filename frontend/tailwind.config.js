/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          700: '#15803d',
          800: '#166534',
          900: '#113f2e',
          950: '#06261b'
        },
        nuclear: {
          50: '#f3f8f5',
          100: '#e3eee8',
          200: '#c4d9ce',
          700: '#166534',
          800: '#0f5138',
          900: '#0a3d2d',
          950: '#06261b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['Inter', 'sans-serif']
      },
      boxShadow: {
        soft: '0 18px 45px rgba(20, 29, 24, .11)'
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(17,63,46,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(17,63,46,.055) 1px, transparent 1px)'
      },
      animation: {
        'fade-in': 'fadeIn .45s ease-out both',
        'fade-in-up': 'fadeInUp .55s ease-out both'
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(15px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
}

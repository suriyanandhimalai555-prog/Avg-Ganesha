import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gs: {
          teal:     '#2D9C8A',  // Primary teal/green
          navy:     '#1A1A3E',  // Headings dark navy
          cream:    '#F9F6F0',  // Warm off-white background
          gold:     '#D4AF37',  // Soft gold accents
          white:    '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      backgroundImage: {
        'teal-gradient': 'linear-gradient(135deg, #2D9C8A 0%, #1A7566 100%)',
        'navy-gradient': 'linear-gradient(180deg, #1A1A3E 0%, #0D0D1F 100%)',
        'confetti-pattern': "url('/floral-pattern.svg')", // We will map a CSS fallback if SVG missing
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
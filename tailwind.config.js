/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        // `white` resuelve a una variable CSS para soportar tema claro/oscuro:
        // en modo claro --w pasa a un tono tinta (slate-900), así todas las
        // utilidades text-white / bg-white / border-white se invierten solas.
        white: 'rgb(var(--w, 255 255 255) / <alpha-value>)',
        // Apple system electric blue accent
        accent: {
          DEFAULT: '#0A84FF',
          soft: '#409CFF',
          deep: '#0066CC',
        },
        // Low-saturation status colors (visionOS friendly)
        status: {
          good: '#5BD6A6',
          moderate: '#E8C468',
          bad: '#E88A8A',
          severe: '#E06B9A',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-lg': '0 16px 48px -8px rgba(0, 0, 0, 0.55)',
        'inner-glass': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        float: 'float 14s ease-in-out infinite',
        shimmer: 'shimmer 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

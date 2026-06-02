/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fredoka', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        pop: '0 12px 28px -8px rgba(15, 16, 32, 0.45)',
        card: '0 18px 40px -16px rgba(15, 16, 32, 0.6)',
        inset: 'inset 0 2px 0 0 rgba(255,255,255,0.35), inset 0 -3px 0 0 rgba(0,0,0,0.18)',
      },
      keyframes: {
        bob: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        popIn: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '70%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        bob: 'bob 3s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        pulseGlow: 'pulseGlow 2.6s ease-in-out infinite',
        popIn: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
      },
    },
  },
  plugins: [],
}

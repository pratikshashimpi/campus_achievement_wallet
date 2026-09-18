/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        purple: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        dark: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          800: '#1e1e2e',
          850: '#181825',
          900: '#0f0f1a',
          950: '#0a0a0f',
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #0f0f2a 50%, #0a0a0f 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
        'gold-gradient': 'linear-gradient(135deg, #f59e0b, #fbbf24)',
        'brand-gradient': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(228,100%,74%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(268,100%,74%,0.15) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(228,100%,74%,0.1) 0px, transparent 50%)',
      },
      boxShadow: {
        'glow-brand': '0 0 20px rgba(99,102,241,0.4)',
        'glow-gold': '0 0 20px rgba(245,158,11,0.4)',
        'glow-purple': '0 0 20px rgba(168,85,247,0.4)',
        'glass': '0 8px 32px rgba(0,0,0,0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(99,102,241,0.8)' },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

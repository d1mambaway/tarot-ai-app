import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        mystic: {
          bg: '#0a0a1a',
          card: '#1a1a2e',
          'card-hover': '#242445',
          accent: '#c4a35a',
          gold: '#d4af37',
          purple: '#7b2d8e',
          blue: '#1e3a5f',
          text: '#e8e0d0',
          muted: '#8a8294',
          danger: '#d94f4f',
          success: '#4fd97a',
        },
      },
      fontFamily: {
        mystic: ['Georgia', 'serif'],
      },
      animation: {
        'card-flip': 'cardFlip 0.6s ease-in-out',
        'card-glow': 'cardGlow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        cardGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(196, 163, 90, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(196, 163, 90, 0.6)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

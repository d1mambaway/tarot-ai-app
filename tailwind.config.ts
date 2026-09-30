import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // Brand tokens — see the brand book (Design System artifact) and
      // src/styles/BRAND.md. Old names are kept as aliases of the new values
      // so every screen moves to one palette at once.
      colors: {
        mystic: {
          bg: '#0a0a1a',        // night-900: app background
          card: '#15142a',      // night-800: cards
          'card-hover': '#1e1c3a', // night-700: raised / pressed
          accent: '#d4af37',    // = gold (was a second, duller gold #c4a35a)
          gold: '#d4af37',      // brand gold: interactive, prices, icons
          purple: '#7b2d8e',
          blue: '#1e3a5f',
          text: '#ede6d6',      // ink
          muted: '#8a8294',     // ink-3
          danger: '#f08a8a',
          success: '#6ee7b7',
        },
        ink: { DEFAULT: '#ede6d6', 2: '#b7afc2', 3: '#8a8294' },
        gold: { DEFAULT: '#d4af37', soft: '#e9c97a' },
        lavender: '#b9a7f0',
        night: { 900: '#0a0a1a', 800: '#15142a', 700: '#1e1c3a' },
      },
      fontFamily: {
        // One serif for every title: Cormorant Garamond (self-hosted).
        // `mystic` used to be Georgia — now the same face as `display`.
        mystic: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      // Type scale — the only sizes the UI uses
      fontSize: {
        micro: ['11px', { lineHeight: '14px' }],
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13.5px', { lineHeight: '19px' }],
        base: ['15px', { lineHeight: '22px' }],
        lg: ['17px', { lineHeight: '24px' }],
        xl: ['20px', { lineHeight: '24px' }],
        '2xl': ['24px', { lineHeight: '28px' }],
        '3xl': ['30px', { lineHeight: '34px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
        '5xl': ['44px', { lineHeight: '48px' }],
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

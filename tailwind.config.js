import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f7f3ff',
          100: '#ede4ff',
          200: '#dccbff',
          300: '#c3a6ff',
          400: '#a783fc',
          500: '#8f5cff',
          600: '#7b3dff',
          700: '#6f33ff',
          800: '#5b25d6',
          900: '#431aa3',
        },
        ink: {
          900: '#15121c',
          800: '#26222e',
          700: '#3f3f42',
          600: '#55555b',
          500: '#6b6b72',
          400: '#6f6f76',
          300: '#a9a9b0',
          200: '#c9c9ce',
        },
        disabled: '#828384',
        grey: {
          50: '#eeeeee',
          100: '#f5f5f6',
          200: '#e8e8ea',
          300: '#d9d9dd',
          400: '#bdbdc3',
        },
        canvas: '#f8f7fb',
        danger: '#e00000',
        success: '#0b7a53',
        warning: '#f79009',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h3: ['32px', { lineHeight: '40px', fontWeight: '600' }],
        h4: ['28px', { lineHeight: '36px', fontWeight: '600' }],
        h5: ['24px', { lineHeight: '32px', fontWeight: '600' }],
        h6: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        pmd: ['16px', { lineHeight: '24px' }],
        psm: ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
      borderRadius: {
        card: '10px',
        xl2: '16px',
        xl3: '24px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 2px 10px rgba(21, 18, 28, 0.05)',
        float: '0 12px 32px rgba(111, 51, 255, 0.18)',
        brand: '0 8px 24px rgba(111, 51, 255, 0.28)',
        nav: '0 -4px 24px rgba(21, 18, 28, 0.06)',
      },
      minHeight: {
        tap: '44px',
      },
      minWidth: {
        tap: '44px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.3s ease both',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 5s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;

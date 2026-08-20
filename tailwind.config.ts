import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  // Class mùa ghép động `mua-${mua}` — không có chuỗi literal để quét
  safelist: ['mua-xuan', 'mua-ha', 'mua-thu', 'mua-dong'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // 3 cấp chữ của NPP — nhịp "label mờ nhỏ / value đậm to"
        'text-2': 'hsl(var(--text-2))',
        'text-3': 'hsl(var(--text-3))',
        'surface-2': 'hsl(var(--surface-2))',

        primary: {
          DEFAULT: 'hsl(var(--primary))', // = accent mùa, dùng cho ring/viền/chữ
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },

        // Ngữ nghĩa — KHÔNG đổi theo mùa
        info: { DEFAULT: '#3b82f6', soft: '#dbeafe', ink: '#1e40af' },
        success: { DEFAULT: '#10b981', soft: '#d1fae5', ink: '#065f46' },
        danger: { DEFAULT: '#ef4444', soft: '#fee2e2', ink: '#991b1b' },
        warning: { DEFAULT: '#f59e0b', soft: '#fef3c7', ink: '#92400e' },
      },
      borderRadius: {
        sm: '10px',
        md: '12px',
        lg: '14px',
        xl: '20px',
        '2xl': '28px', // mép trên bottom-sheet
      },
      boxShadow: {
        // Bóng mềm tông slate, KHÔNG đen thuần
        sm: '0 1px 2px rgba(15, 23, 42, 0.04)',
        md: '0 4px 12px rgba(15, 23, 42, 0.06)',
        lg: '0 12px 32px rgba(15, 23, 42, 0.10)',
      },
      fontFamily: {
        sans: ['var(--font-be-vietnam)', 'system-ui', 'sans-serif'],
      },
      height: {
        tap: '48px',
        header: 'var(--header-h)',
        nav: 'var(--bottom-h)',
      },
      width: { tap: '48px' },
      minWidth: { tap: '48px' },
      minHeight: { tap: '48px' },
      maxWidth: { app: '1200px' },
      keyframes: {
        'len-tu-day': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'vao-ngang': {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'len-tu-day': 'len-tu-day 0.25s ease',
        'vao-ngang': 'vao-ngang 0.25s ease',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Design system Sổ Bếp (contract) ──
        // Neutral = stone-* của Tailwind: ấm hơn slate, hợp tông bếp.
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))', // #EA580C cam đất
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
          DEFAULT: 'hsl(var(--destructive))', // #DC2626 đỏ
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
        // Màu ngữ nghĩa nghiệp vụ — dùng thẳng, không đổi theo theme
        success: { DEFAULT: '#16A34A', fg: '#FFFFFF', soft: '#DCFCE7', ink: '#166534' },
        danger: { DEFAULT: '#DC2626', fg: '#FFFFFF', soft: '#FEE2E2', ink: '#991B1B' },
        warning: { DEFAULT: '#CA8A04', fg: '#FFFFFF', soft: '#FEF9C3', ink: '#854D0E' },
      },
      borderRadius: {
        xl: '0.75rem',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-be-vietnam)', 'system-ui', 'sans-serif'],
      },
      height: {
        // Ngón tay ngoài chợ: mọi nút chính ≥ 48px
        tap: '48px',
        nav: '56px',
      },
      // Phải khai cả width: nút icon dùng "h-tap w-tap", thiếu width thì nút co
      // lại bằng đúng cái icon (20px) mà không báo lỗi gì.
      width: {
        tap: '48px',
      },
      minWidth: {
        tap: '48px',
      },
      minHeight: {
        tap: '48px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;

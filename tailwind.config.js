/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand
        primary: {
          DEFAULT: '#2563EB',  // blue-600
          dark: '#1D4ED8',     // blue-700
        },
        secondary: {
          DEFAULT: '#7C3AED',  // violet-600
          dark: '#6D28D9',     // violet-700
        },
        // Hero gradient stops
        hero: {
          from: '#1E3A8A',  // blue-900
          via: '#312E81',    // indigo-900
          to: '#4C1D95',     // purple-900
        },
        // Semantic
        success: '#10B981',  // green-500
        warning: '#F59E0B',  // amber-500
        danger: '#EF4444',   // red-500
        // Background (use Tailwind's built-in gray scale via CSS vars)
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Matches DESIGN.md typography scale
        'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '800' }],
        'h2': ['1.875rem', { lineHeight: '1.25', fontWeight: '700' }],
        'h3': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'label': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '40px',
      },
      maxWidth: {
        'reader': '42rem',  // max-w-2xl for reading columns per DESIGN.md
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      transitionDuration: {
        'card': '300ms',
      },
    },
  },
  plugins: [],
}

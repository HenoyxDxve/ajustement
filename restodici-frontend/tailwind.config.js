// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF8C00',
          light: '#FFAD40',
          lighter: '#FFF5E8',
          dark: '#E07A00',
          darker: '#C06800',
        },
        secondary: {
          DEFAULT: '#FFB800',
          light: '#FFF5E8',
        },
        tertiary: {
          DEFAULT: '#00A7CB',
          light: '#E6F5F9',
        },
        neutral: {
          DEFAULT: '#F5F5F5',
          50:  '#FFFAF3',
          100: '#FFF5E8',
          200: '#FFEFD8',
          300: '#D4D4D4',
          500: '#7A5E3A',
          700: '#3B2409',
          800: '#3F3F3F',
          900: '#1A0C00',
        },
        status: {
          disponible: '#2ECC71',
          epuise:     '#E67E22',
          rupture:    '#E74C3C',
        },
      },
      fontFamily: {
        sans:    ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card':     '0 2px 14px rgba(0,0,0,0.07)',
        'card-hover':'0 18px 48px rgba(255,140,0,0.2)',
        'button':   '0 6px 22px rgba(255,140,0,0.44)',
        'floating': '0 -4px 20px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
}

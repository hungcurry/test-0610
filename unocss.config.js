import { defineConfig, presetAttributify, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
      scale: 1.2,
      warn: true,
    }),
  ],
  shortcuts: [
    {
      'wh-full': 'w-full h-full',
      'flex-center': 'flex justify-center items-center',
      'flex-col': 'flex flex-col',
      'text-ellipsis': 'truncate',
      'card-rounded': 'rounded-10px bg-white p-16px',
      // ===================
      'btn-primary':
        'text-2.2rem shrink-0 min-w-150px hover:bg-blue-800 hover:text-white h-40px',
      'btn-more': 'bg-btn-300 text-blue-1200 hover:bg-btn-300 px-20px py-16px',
      'btn-Release': 'bg-blue-900 text-white hover:bg-blue-900 hover:text-white',
      'secondary-hover': 'text-secondary hover:text-blue-500',
    },
  ],
  theme: {
    colors: {
      white: 'var(--white)',
      black: 'var(--black)',
      primary: 'var(--primary)',
      secondary: 'var(--secondary)',
      // -----------------------
      Available: 'var(--Available)',
      'Available-2': 'var(--Available-2)',
      Charging: 'var(--Charging)',
      'Charging-2': 'var(--Charging-2)',
      Offline: 'var(--Offline)',
      'Offline-2': 'var(--Offline-2)',
      Error: 'var(--Error)',
      // -----------------------
      'blue-100': 'var(--blue-100)',
      'blue-200': 'var(--blue-200)',
      'blue-300': 'var(--blue-300)',
      'blue-400': 'var(--blue-400)',
      'blue-500': 'var(--blue-500)',
      'blue-600': 'var(--blue-600)',
      'blue-700': 'var(--blue-700)',
      'blue-800': 'var(--blue-800)',

      'blue-900': 'var(--blue-900)',
      'blue-1000': 'var(--blue-1000)',
      'blue-1100': 'var(--blue-1100)',
      'blue-1200': 'var(--blue-1200)',
      'blue-1300': 'var(--blue-1300)',
      // -----------------------
      'btn-100': 'var(--btn-100)',
      'btn-200': 'var(--btn-200)',
      'btn-300': 'var(--btn-300)',
      // -----------------------
      'gray-100': 'var(--gray-100)',
      'gray-200': 'var(--gray-200)',
      'gray-300': 'var(--gray-300)',
      'gray-400': 'var(--gray-400)',
      'gray-500': 'var(--gray-500)',
      'gray-600': 'var(--gray-600)',
      'gray-700': 'var(--gray-700)',
      // -----------------------
      'black-100': 'var(--black-100)',
      'black-200': 'var(--black-200)',
      'black-300': 'var(--black-300)',
    },
    breakpoints: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      '2xl': '1400px',
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',
      },
    },
    fontWeight: {
      100: '100',
      200: '200',
      300: '300',
      400: '400',
      500: '500',
      600: '600',
      700: '700',
      800: '800',
      900: '900',
    },
    fontSize: {
      xs: ['1.2rem', '1'],
      sm: ['1.4rem', '1.25'],
      base: ['1.6rem', '1.5'],
      m: ['2rem', '1.5'],
      lg: ['2.4rem', '1.5'],
      xl: ['2.8rem', '1.5'],
      '2xl': ['3.2rem', '1.5'],
      '3xl': ['3.6rem', '1.5'],
      '4xl': ['4rem', '1.5'],
      '5xl': ['4.4rem', '1.5'],
      '6xl': ['4.8rem', '1.5'],
      '7xl': ['5.2rem', '1'],
      '8xl': ['6rem', '1'],
      '9xl': ['8rem', '1'],
    },
  },
})

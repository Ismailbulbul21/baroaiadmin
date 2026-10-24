/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0B1030',
        brand: {
          from: '#3D63F5',
          to: '#7B4DFF',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #3D63F5 0%, #7B4DFF 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

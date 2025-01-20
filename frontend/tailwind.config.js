/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      'lightBlue': '#C5DDFF',
      'lighterBlue': '#89A9D9',
      'mainBlue': '#22224B',
      'secondaryBlue': '#1D3D91',
      'mainGreen': '#42911D',
      'mainRed': '#E3504B',
      'white': '#F2F2F2',
      'black': '#333333'
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      fontFamily: {
        'Mulish': ['"Mulish"', 'sans-serif']
      }
    },
  },
  plugins: [],
}


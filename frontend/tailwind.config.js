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
        'yanstoreLogo': 'url("./Images/YanstoreLogoTransparent(azul).png")',
        'circle': `url('data:image/svg+xml,<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="34" fill="%231D3D91"/><circle cx="60" cy="60" r="59" stroke="%231D3D91" stroke-width="3"/></svg>')`,
      },
      fontFamily: {
        'Mulish': ['"Mulish"', 'sans-serif']
      },
    },
  },
  plugins: [],
}


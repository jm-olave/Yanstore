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
      'white': '#FFFFFF',
      'black': '#333333'
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'yanstoreLogo': 'url("./Images/YanstoreLogoTransparent(azul).png")',
        'circle': `url('data:image/svg+xml,<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="34" fill="%231D3D91"/><circle cx="60" cy="60" r="59" stroke="%231D3D91" stroke-width="3"/></svg>')`,
        'downArrow': `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 24 24" style="fill: rgba(29, 61, 145, 1);transform: ;msFilter:;"><path d="M11.178 19.569a.998.998 0 0 0 1.644 0l9-13A.999.999 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569l9 13z"></path></svg>')`,
        'upArrow': `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 24 24" style="fill: rgba(29, 61, 145, 1);transform: ;msFilter:;"><path d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"></path></svg>')`,
        'calendar': `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 24 24" style="fill: rgba(29, 61, 145, 1);transform: ;msFilter:;"><path d="M21 20V6c0-1.103-.897-2-2-2h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2zM9 18H7v-2h2v2zm0-4H7v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm2-5H5V7h14v2z"></path></svg>')`
      },
      fontFamily: {
        'Mulish': ['"Mulish"', 'sans-serif'],
        'Josefin': ['"Josefin Sans"', 'sans-serif']
      },
    },
  },
  plugins: [],
}
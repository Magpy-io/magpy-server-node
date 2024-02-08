/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['node_modules/flowbite-react/lib/esm/**/*.js','./src/**/*.{js,jsx,ts,tsx}'],
  plugins: [
    require('flowbite/plugin'),
  ],
  theme: {
    colors: {
      //Light theme
      'l-bg': '#ffffff',
      'l-fg': '#020D17',
      'l-fg-inverse': '#ffffff',
      'l-primary': '#2CA7AF',
      'l-fg-primary': '#ffffff',
      'l-secondary': '#06607F',
      'l-bg-light': '#f1f5f9',
      
      //Dark theme
      'd-bg': '#020D17',
      'd-fg': '#ffffff',
      'd-fg-inverse': '#020D17',
      'd-primary': '#50CAD3',
      'd-fg-primary': '#020D17',
      'd-secondary': '#12666F',
      'd-bg-light': '#121A22',
    },
    extend: {}
  }
}

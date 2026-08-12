/** 
 * Configuración de Tailwind CSS
 * Esta configuración personaliza Tailwind para el proyecto de barbería
 */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#1a365d',
        'secondary': '#4b5563',
        'accent': '#3b82f6',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
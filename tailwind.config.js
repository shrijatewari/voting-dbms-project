/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          navy: '#0D47A1',
          royal: '#1565C0',
          light: '#E3F2FD',
        },
        gray: {
          light: '#F5F6FA',
          border: '#E2E8F0',
        },
        success: '#0FA958',
        warning: '#F59E0B',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'Source Sans Pro', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


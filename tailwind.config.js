/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      colors: {
        'neon-blue': '#00f3ff',
        'deep-space': '#0a0a0f',
      },
      boxShadow: {
        'neon': '0 0 15px rgba(0, 243, 255, 0.3)',
        'neon-hover': '0 0 25px rgba(0, 243, 255, 0.5)',
      },
    },
  },
  plugins: [],
};
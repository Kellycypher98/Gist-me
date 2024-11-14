/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        GeistMono: ["Geist Mono", "monospace"],
        // Add more custom font families as needed
      },
    },
  },
  plugins: [],
};

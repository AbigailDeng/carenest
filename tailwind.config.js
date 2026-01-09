/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Claymorphic pastel palette
        clay: {
          bg: '#f5f0ff',        // Soft lavender background
          surface: '#ffffff',   // White surface
          lavender: '#e6d9ff', // Lavender
          mint: '#d4f4dd',     // Mint green
          orange: '#ffe5d4',   // Light orange
          blue: '#d4e8ff',     // Baby blue
          text: '#4a4a4a',     // Soft dark text
          textDim: '#8a8a8a',  // Dimmed text
          primary: '#b794f6',  // Purple primary
          secondary: '#90cdf4', // Blue secondary
          success: '#9ae6b4',  // Green success
          warning: '#fbd38d',  // Orange warning
        },
      },
      fontFamily: {
        heading: ['Fredoka One', 'cursive'],
        body: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        'clay': '20px',  // Large rounded corners (18-22px)
      },
      spacing: {
        'touch': '44px', // Minimum touch target size
      },
      boxShadow: {
        'clay': '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        'clay-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        'clay-extrude': '0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}


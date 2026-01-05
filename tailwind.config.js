/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // We will add custom colors here as we design the UI
                primary: '#f63b3bff', // Default nice blue
                secondary: '#84e6c5ff', // Default nice green
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}

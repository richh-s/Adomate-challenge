// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {}, // enables @import "tailwindcss" and @apply
    autoprefixer: {},           // vendor prefixes
  },
};

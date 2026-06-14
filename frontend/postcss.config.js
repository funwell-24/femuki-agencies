// postcss.config.js
export default {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-preset-env': {
      features: {
        'nesting-rules': true,
      },
    },
    ...(process.env.NODE_ENV === 'production'
      ? {
          'cssnano': {
            preset: ['default', {
              discardComments: {
                removeAll: true,
              },
              normalizeWhitespace: true,
              minifyFontValues: true,
              minifySelectors: true,
            }],
          },
        }
      : {}),
  },
}
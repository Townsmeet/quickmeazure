import withNuxt from '.nuxt/eslint.config.mjs'
import prettierConfig from 'eslint-config-prettier'

export default withNuxt(
  // Add Prettier as the last config to override other style rules
  prettierConfig,
  // Add your custom flat configs here
  {
    files: ['**/*.{js,ts,vue}'],
    rules: {
      // Relax some rules for initial setup
      'vue/max-attributes-per-line': [
        'warn',
        {
          singleline: 3,
          multiline: 1,
        },
      ],
      'vue/no-v-html': 'warn',
      'vue/no-side-effects-in-computed-properties': 'warn',
      'vue/no-async-in-computed-properties': 'warn',
      'vue/attributes-order': 'warn',
      'vue/no-unused-vars': 'warn',
      'vue/no-useless-template-attributes': 'warn',
      // Disable some rules that are too noisy for development
      'no-useless-escape': 'warn', // Downgrade to warning for pre-commit
      'no-unused-vars': 'off', // Turn off the base rule as it can report incorrect errors
      'no-prototype-builtins': 'warn', // Downgrade to warning
    },
  }
)
  // You can also use the chainable API
  .override('nuxt/typescript/rules', {
    rules: {
      // Customize TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Downgrade any to warning or off based on your preference
      '@typescript-eslint/no-explicit-any': 'off', // Set to 'off' to completely ignore any types
      // Relax other TypeScript rules that might be too strict for initial setup
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unsafe-declaration-merging': 'warn', // Downgrade to warning
      '@typescript-eslint/no-extraneous-class': 'warn',
      '@typescript-eslint/no-dynamic-delete': 'warn', // Downgrade to warning
    },
  })

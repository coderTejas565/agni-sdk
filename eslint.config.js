import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  // Ignore folders globally
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'apps/**', 'architecture/**'],
  },

  eslint.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts'],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    rules: {
      // Disable JS rule
      'no-unused-vars': 'off',

      // Use TS-aware rule
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Examples & spikes
  {
    files: ['examples/**/*.ts', 'spikes/**/*.ts'],

    rules: {
      'no-console': 'off',
    },
  },
];

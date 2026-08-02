import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,

  ...tseslint.configs.recommended,

  {
    ignores: ['dist', 'node_modules'],

    rules: {
      // Disable JS rule
      'no-unused-vars': 'off',

      // Use TypeScript-aware rule
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],

      'no-console': 'warn',
    },
  },
];

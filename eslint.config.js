import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,

  ...tseslint.configs.recommended,

  {
    ignores: ['dist', 'node_modules'],

    rules: {
      'no-unused-vars': 'error',
      'no-console': 'warn',
    },
  },
];

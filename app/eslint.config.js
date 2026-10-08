// @ts-check
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  { ignores: ['dist/**', 'node_modules/**', '.expo/**', 'scripts/**'] },
  ...expoConfig,
  {
    files: ['__tests__/**/*.{ts,tsx}'],
    rules: {
      // jest.mock must run before imports; hoisting is intentional in tests.
      'import/first': 'off',
    },
  },
];

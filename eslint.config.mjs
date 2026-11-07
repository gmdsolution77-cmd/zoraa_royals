import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const nextCoreWebVitals = require('eslint-config-next/core-web-vitals');

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextCoreWebVitals,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'android/**',
      'ios/**',
      'out/**',
      'scripts/**',
    ],
  },
];

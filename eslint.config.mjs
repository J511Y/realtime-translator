import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import boundariesPlugin from 'eslint-plugin-boundaries';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      import: importPlugin,
      boundaries: boundariesPlugin,
    },
    rules: {
      // TypeScript 엄격 규칙
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // 아키텍처 레이어 분리 검증
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: ['app', 'components'],
              allow: ['components', 'types', 'services', 'hooks'],
              disallow: ['lib'],
            },
            {
              from: ['services'],
              allow: ['lib', 'types', 'repositories'],
            },
            {
              from: ['hooks'],
              allow: ['lib', 'types', 'services'],
            },
            {
              from: ['lib'],
              allow: ['types'],
            },
          ],
        },
      ],

      // 일반 코딩 컨벤션
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',

      // Jest 설정 파일 등에서 CommonJS require 허용
      '@typescript-eslint/no-require-imports': 'off',
    },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: '**/app/**' },
        { type: 'components', pattern: '**/components/**' },
        { type: 'services', pattern: '**/services/**' },
        { type: 'hooks', pattern: '**/lib/hooks/**' },
        { type: 'lib', pattern: '**/lib/**' },
        { type: 'types', pattern: '**/types/**' },
        { type: 'repositories', pattern: '**/repositories/**' },
      ],
    },
  },
  // Next.js app 디렉토리는 default export 허용
  {
    files: [
      'app/**/page.tsx',
      'app/**/layout.tsx',
      'app/**/loading.tsx',
      'app/**/error.tsx',
      'app/**/not-found.tsx',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;

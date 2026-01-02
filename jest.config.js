const nextJest = require('next/jest');

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Next.js 앱의 경로를 제공하여 테스트 환경에서 next.config.js 및 .env 파일을 로드합니다.
  dir: './',
});

// Jest에 전달할 사용자 정의 설정
const config = {
  // 각 테스트 실행 전 추가 설정을 위해 jest.setup.js 지정
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // 절대 경로 별칭 설정 (tsconfig.json의 paths와 일치해야 함)
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/', // E2E 테스트는 Playwright에서 담당하므로 제외
  ],
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'features/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
};

// createJestConfig는 비동기식인 Next.js 설정을 Jest가 사용할 수 있도록 내보냅니다.
module.exports = createJestConfig(config);

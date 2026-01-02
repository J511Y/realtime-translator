import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
  ],
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'features/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/node_modules/**',
  ],
};

module.exports = createJestConfig(customJestConfig);

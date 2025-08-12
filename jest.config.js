module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/e2e/', '<rootDir>/.next/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@supabase/supabase-js$': '<rootDir>/__mocks__/@supabase/supabase-js',
    '^@/components/auth/AuthProvider$': '<rootDir>/__mocks__/components/auth/AuthProvider',
  },
  transform: {
    '^.+\.(ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@supabase)',
  ],
};

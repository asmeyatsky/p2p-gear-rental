const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/config/jest.setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/e2e/', '<rootDir>/.next/'],
  rootDir: '..',
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    // Mocks must come after the paths mapper
    '^@supabase/supabase-js$': '<rootDir>/__mocks__/@supabase/supabase-js.ts',
    '^@/components/auth/AuthProvider$': '<rootDir>/__mocks__/components/auth/AuthProvider.tsx',
    '^next/server$': '<rootDir>/__mocks__/next/server.js',
    '^@/lib/api-error-handler$': '<rootDir>/__mocks__/lib/api-error-handler.ts',
    '^@/app/api/gear/route$': '<rootDir>/__mocks__/app/api/gear/route.ts',
    '^@/app/api/gear/[id]/route$': '<rootDir>/__mocks__/app/api/gear/[id]/route.ts',
    '^@/lib/supabase-browser$': '<rootDir>/__mocks__/lib/supabase-browser.ts',
    '^@/lib/supabase$': '<rootDir>/__mocks__/@/lib/supabase.ts',
    '^@supabase/ssr$': '<rootDir>/__mocks__/@supabase/ssr.ts',
    '^next/navigation$': '<rootDir>/__mocks__/next/navigation.ts',
    '^@/lib/prisma$': '<rootDir>/__mocks__/@/lib/prisma.ts',
    '^@/lib/cache$': '<rootDir>/__mocks__/@/lib/cache.ts',
    '^@/lib/logger$': '<rootDir>/__mocks__/@/lib/logger.ts',
    '^@/lib/monitoring$': '<rootDir>/__mocks__/@/lib/monitoring.ts',
    '^@/lib/rate-limit$': '<rootDir>/__mocks__/@/lib/rate-limit.ts',
  },
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@supabase)',
  ],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
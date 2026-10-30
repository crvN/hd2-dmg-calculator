/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          target: 'es2023',
          types: ['jest', 'node'],
          esModuleInterop: true,
          resolveJsonModule: true,
        },
      },
    ],
  },
}

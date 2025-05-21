module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageReporters: ['text'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/__tests__/**',
  ],
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Forzar que Jest cierre los manejadores abiertos
  forceExit: true,
  // Detener después de la primera falla
  bail: 1,
  // Tiempo de espera para las pruebas
  testTimeout: 30000,
};
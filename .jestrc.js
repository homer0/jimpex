const path = require('path');

/**
 * @type {import('ts-jest').InitialOptionsTsJest}
 */
module.exports = {
  preset: 'ts-jest',
  automock: true,
  collectCoverage: true,
  testPathIgnorePatterns: ['/node_modules/', '/utils/scripts/', '/mocks/'],
  unmockedModulePathPatterns: ['/node_modules/', '/mocks/', 'src/utils'],
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: path.join(__dirname, 'tests', 'tsconfig.json'),
    },
  },
};

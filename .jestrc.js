const path = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tests/tsconfig');

/**
 * @type {import('ts-jest').InitialOptionsTsJest}
 */
module.exports = {
  preset: 'ts-jest',
  automock: true,
  collectCoverage: true,
  testPathIgnorePatterns: ['/utils/scripts/', 'tests/mocks/'],
  unmockedModulePathPatterns: ['/node_modules/', 'src/utils', 'tests/mocks/'],
  coveragePathIgnorePatterns: ['/utils/scripts/', 'tests/mocks/'],
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: path.join(__dirname, 'tests', 'tsconfig.json'),
    },
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/tests',
  }),
};

module.exports = {
  testEnvironment: "node",
  testMatch: ["**/e2e/tests/**/*.test.js"],
  testPathIgnorePatterns: ["/node_modules/"],
  moduleFileExtensions: ["js"],
  verbose: true,
  bail: false,
  testTimeout: 30000,
  transform: {},
  coverageProvider: "v8",
  collectCoverage: false,
};

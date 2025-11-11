export default {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/src/test/mocks/fileMock.js",
  },
  setupFilesAfterEnv: ["<rootDir>/src/test/utils/setupTests.js"],
  testMatch: ["**/__tests__/**/*.test.(js|jsx)"],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  extensionsToTreatAsEsm: [".jsx"],
  moduleFileExtensions: ["js", "jsx"],
};

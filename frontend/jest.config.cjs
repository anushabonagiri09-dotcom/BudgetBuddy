module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.js"],
  moduleNameMapper: {
    "\\.(css)$": "<rootDir>/src/test/styleMock.js",
  },
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
};

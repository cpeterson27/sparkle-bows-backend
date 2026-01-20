module.exports = {
  testEnvironment: "node",
  verbose: true,
  testTimeout: 20000,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["**/tests/**/*.test.js"],
  detectOpenHandles: true
};

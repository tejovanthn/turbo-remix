module.exports = {
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/jest-testing-library",
    "turbo", 
    "prettier"
  ],
  plugins: [
    "cypress",
  ],
  rules: {
    "react/jsx-key": "off",
  },
  env: {
    "cypress/globals": true,
  },
  settings: {
    jest: {
      version: 28,
    },
  },
};

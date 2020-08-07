"use strict";

module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: "module",
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier", "prettier/@typescript-eslint"],
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "prettier/prettier": 2,
  },
  env: {
    browser: true,
    node: true,
  },
};

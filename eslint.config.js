export default [
  {
    ignores: ["dist/**", "node_modules/**", ".sites-runtime/**"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        document: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        window: "readonly",
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      "no-console": ["error", { "allow": ["warn", "error"] }],
      "no-duplicate-imports": "error",
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "prefer-const": "error",
      "no-var": "error"
    },
  },
];

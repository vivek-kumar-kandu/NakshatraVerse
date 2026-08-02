// eslint.config.js  — ESLint 9 flat config for the NakshatraVerse backend
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Node.js globals
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        URL: "readonly",
      },
    },
    rules: {
      // ── Errors ───────────────────────────────────────────────────────
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-console": "off",         // logger.js wraps console; direct console is fine
      "no-duplicate-imports": "error",

      // ── Warnings ─────────────────────────────────────────────────────
      "no-var": "warn",
      "prefer-const": "warn",
      "eqeqeq": ["warn", "always", { null: "ignore" }],

      // ── Style (Prettier handles formatting; these just catch common issues)
      "semi": "off",               // Prettier controls semicolons
      "quotes": "off",             // Prettier controls quotes
      "indent": "off",             // Prettier controls indentation
    },
  },
  {
    // Ignore build output, vendored files, and test-only setup files
    ignores: [
      "node_modules/**",
      "data/**",
      "coverage/**",
    ],
  },
];

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "build/**", "dist/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Downgrade no-explicit-any to warning for infrastructure/lib code
    // These files often need any for dynamic typing patterns
    files: [
      "**/infrastructure/**/*.ts",
      "**/lib/**/*.ts",
      "**/domain/**/*.ts",
      "**/presentation/**/*.ts",
      "**/__tests__/**/*.ts",
      "**/__tests__/**/*.tsx",
      "**/*.test.ts",
      "**/*.test.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow require imports in test files (common in Jest)
      "@typescript-eslint/no-require-imports": "off",
      // Allow unused variables in tests (common for mock setup)
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow unsafe function types in tests
      "@typescript-eslint/no-unsafe-function-type": "warn",
    },
  },
];

export default eslintConfig;

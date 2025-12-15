import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
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
      "**/*.test.ts",
      "**/*.test.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;

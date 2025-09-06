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
    rules: {
      // Allow 'any' type with warning instead of error
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused variables with 'any' type
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // Allow implicit any in catch clauses
      "@typescript-eslint/no-implicit-any-catch": "warn",
      // Allow any in function signatures
      "@typescript-eslint/no-unsafe-function-type": "warn",
      // Allow any in assignments
      "@typescript-eslint/no-unsafe-assignment": "warn",
      // Allow any in member access
      "@typescript-eslint/no-unsafe-member-access": "warn",
      // Allow any in function calls
      "@typescript-eslint/no-unsafe-call": "warn",
      // Allow any in returns
      "@typescript-eslint/no-unsafe-return": "warn",
    },
  },
];

export default eslintConfig;

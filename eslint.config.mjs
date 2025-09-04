// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Игноры для flat-config
  {
    ignores: ["**/.next/**", "node_modules/**", "dist/**", "build/**"],
  },

  // Базовые конфиги Next + TS
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Наши переопределения: превращаем ошибки в warn/выключаем
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/prefer-as-const": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      "prefer-const": "warn",
      "react-hooks/exhaustive-deps": "warn",

      // опционально: выключить шум от next/image
      "@next/next/no-img-element": "off",
    },
  },
];

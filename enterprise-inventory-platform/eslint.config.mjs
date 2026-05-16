import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import globals from "globals";
import tseslint from "typescript-eslint";

const forbiddenRuntimeImports = [
  "prisma",
  "@prisma/client",
  "@supabase/supabase-js",
  "firebase",
  "firebase-admin",
  "mongodb",
  "mongoose",
  "@neondatabase/serverless",
  "@clerk/nextjs",
  "resend",
  "@vercel/blob",
];

const restrictedProcessEnvRule = [
  "error",
  {
    selector: "MemberExpression[object.object.name='process'][object.property.name='env']",
    message: "Read environment variables only through @enterprise-inventory/config.",
  },
];

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "**/.next/**",
      "dist/**",
      "**/dist/**",
      "coverage/**",
      "pnpm-lock.yaml",
      "infra/grafana/dashboards/*.json",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
  })),
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.eslint.json",
        },
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "import/no-cycle": "error",
      "import/order": [
        "error",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
          "newlines-between": "always",
        },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-restricted-imports": [
        "error",
        {
          paths: forbiddenRuntimeImports.map((name) => ({
            name,
            message: "Forbidden runtime dependency for enterprise-inventory-platform.",
          })),
          patterns: [
            {
              group: ["@supabase/*", "@neondatabase/*", "firebase/*"],
              message: "Forbidden runtime dependency for enterprise-inventory-platform.",
            },
          ],
        },
      ],
      "no-restricted-syntax": restrictedProcessEnvRule,
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...forbiddenRuntimeImports.map((name) => ({
              name,
              message: "Forbidden runtime dependency for enterprise-inventory-platform.",
            })),
            {
              name: "@enterprise-inventory/db",
              message: "Web routes and UI must use core services instead of direct DB imports.",
            },
            {
              name: "@enterprise-inventory/cache",
              message: "Web routes and UI must use core services instead of direct Valkey imports.",
            },
            {
              name: "@enterprise-inventory/storage",
              message:
                "Web routes and UI must use core services instead of direct storage imports.",
            },
            { name: "pg", message: "Only packages/db may import PostgreSQL clients." },
            { name: "fs", message: "Node filesystem APIs are not allowed in web code." },
            { name: "node:fs", message: "Node filesystem APIs are not allowed in web code." },
            { name: "path", message: "Node path APIs are not allowed in web code." },
            { name: "node:path", message: "Node path APIs are not allowed in web code." },
          ],
          patterns: [
            {
              group: [
                "@supabase/*",
                "@neondatabase/*",
                "firebase/*",
                "drizzle-orm/*",
                "@aws-sdk/*",
                "@valkey/*",
              ],
              message: "Web code must not import forbidden, DB, storage, or Valkey runtime APIs.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...forbiddenRuntimeImports.map((name) => ({
              name,
              message: "Forbidden runtime dependency for enterprise-inventory-platform.",
            })),
            { name: "react", message: "Core services must not import React." },
            { name: "next", message: "Core services must not import Next.js." },
          ],
          patterns: [
            {
              group: ["apps/*", "next/*", "react/*"],
              message: "Core services must not import app or UI code.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "packages/config/**/*.ts",
      "packages/telemetry/**/*.ts",
      "scripts/**/*.mjs",
      "*.config.ts",
      "**/*.config.ts",
    ],
    rules: {
      "no-console": "off",
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["**/*.test.ts", "tests/**/*.ts", "scripts/**/*.mjs"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
      "no-restricted-syntax": "off",
    },
  },
);

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
    message: "Read environment variables only through @custivio/config.",
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
      "_cleanup_review/**",
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
            message: "Forbidden runtime dependency for custivio.",
          })),
          patterns: [
            {
              group: ["@supabase/*", "@neondatabase/*", "firebase/*"],
              message: "Forbidden runtime dependency for custivio.",
            },
          ],
        },
      ],
      "no-restricted-syntax": restrictedProcessEnvRule,
    },
  },
  {
    files: ["apps/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...forbiddenRuntimeImports.map((name) => ({
              name,
              message: "Forbidden runtime dependency for custivio.",
            })),
            {
              name: "@custivio/db",
              message: "Fastify routes must use core/auth services instead of direct DB imports.",
            },
            {
              name: "@custivio/cache",
              message:
                "Fastify routes must use core services/plugins instead of direct Valkey imports.",
            },
            {
              name: "@custivio/storage",
              message: "Fastify routes must use core services instead of direct storage imports.",
            },
            { name: "next", message: "Fastify API code must not import Next.js." },
          ],
          patterns: [
            {
              group: [
                "@supabase/*",
                "@neondatabase/*",
                "firebase/*",
                "next/*",
                "drizzle-orm/*",
                "@aws-sdk/*",
                "@valkey/*",
              ],
              message: "Fastify API code must not import UI, DB, storage, or Valkey runtime APIs.",
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
              message: "Forbidden runtime dependency for custivio.",
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
    files: ["apps/api/src/workers/**/*.{ts,tsx}", "apps/api/src/tests/worker-runtime.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...forbiddenRuntimeImports.map((name) => ({
              name,
              message: "Forbidden runtime dependency for custivio.",
            })),
            { name: "next", message: "Fastify worker code must not import Next.js." },
          ],
          patterns: [
            {
              group: ["@supabase/*", "@neondatabase/*", "firebase/*", "next/*"],
              message: "Fastify worker code must not import UI or forbidden cloud runtime APIs.",
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

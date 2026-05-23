// eslint.config.mjs
// Governance-first ESLint config for custivio.
// Codex may adjust package names/paths during implementation, but must preserve the boundary intent.

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import promise from "eslint-plugin-promise";
import security from "eslint-plugin-security";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";

const restrictedForAll = [
  {
    name: "prisma",
    message: "Prisma is forbidden. Use Drizzle ORM only.",
  },
  {
    name: "@prisma/client",
    message: "Prisma is forbidden. Use Drizzle ORM only.",
  },
  {
    name: "@supabase/supabase-js",
    message: "Supabase runtime dependency is forbidden in this on-prem build.",
  },
  {
    name: "firebase",
    message: "Firebase is forbidden.",
  },
  {
    name: "mongoose",
    message: "MongoDB/Mongoose is forbidden. Use PostgreSQL only.",
  },
];

const nodeOnlyImports = [
  "fs",
  "node:fs",
  "path",
  "node:path",
  "child_process",
  "node:child_process",
  "cluster",
  "node:cluster",
];

const directInfraImports = [
  "drizzle-orm",
  "pg",
  "postgres",
  "minio",
  "@aws-sdk/client-s3",
  "@valkey/valkey-glide",
  "redis",
  "ioredis",
];

export default tseslint.config(
  {
    ignores: [
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/drizzle/**",
      "**/migrations/meta/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettier,

  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      import: importPlugin,
      promise,
      security,
      sonarjs,
      unicorn,
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-restricted-imports": ["error", { paths: restrictedForAll }],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Do not access process.env directly. Use packages/config env helpers.",
        },
      ],

      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/switch-exhaustiveness-check": "error",

      "import/no-cycle": "error",
      "import/no-duplicates": "error",
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      "promise/always-return": "off",
      "promise/catch-or-return": "error",
      "security/detect-object-injection": "off",
      "sonarjs/no-duplicate-string": "warn",
      "sonarjs/cognitive-complexity": ["warn", 20],
      "unicorn/prevent-abbreviations": "off",
      "unicorn/no-null": "off",
      "unicorn/filename-case": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-html-link-for-pages": "off",
    },
  },

  // Scripts may use console/process.env and direct Node APIs.
  {
    files: ["scripts/**/*.{ts,js,mjs}", "**/*.config.{ts,js,mjs}"],
    rules: {
      "no-console": "off",
      "no-restricted-syntax": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Client/UI code must never import server/database/storage/cache infrastructure directly.
  {
    files: [
      "apps/web/components/**/*.{ts,tsx}",
      "apps/web/features/**/components/**/*.{ts,tsx}",
      "apps/web/**/*.client.{ts,tsx}",
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [...restrictedForAll, ...nodeOnlyImports, ...directInfraImports],
          patterns: [
            {
              group: [
                "@inventory/db",
                "@inventory/db/*",
                "@inventory/cache",
                "@inventory/cache/*",
                "@inventory/storage",
                "@inventory/storage/*",
                "@inventory/core/**/repositories/*",
              ],
              message:
                "Client/UI code cannot import DB/cache/storage/repositories directly. Use server actions or API adapters.",
            },
          ],
        },
      ],
    },
  },

  // App route handlers and server actions should call core services, not raw DB/storage/cache clients.
  {
    files: [
      "apps/web/app/api/**/*.{ts,tsx}",
      "apps/web/features/**/actions.{ts,tsx}",
      "apps/web/**/*.server.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [...restrictedForAll, ...directInfraImports],
          patterns: [
            {
              group: ["@inventory/db/src/client", "@inventory/db/src/schema/*"],
              message:
                "Route handlers/server actions should call core services. Keep raw DB details in packages/db repositories.",
            },
          ],
        },
      ],
    },
  },

  // Only packages/db may import Drizzle/Postgres directly.
  {
    files: ["packages/core/**/*.{ts,tsx}", "packages/auth/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [...restrictedForAll, "drizzle-orm", "pg", "postgres"],
          patterns: [
            {
              group: ["@inventory/db/src/client"],
              message:
                "Core/auth must use repository interfaces or db package exports, not raw DB client.",
            },
          ],
        },
      ],
    },
  },

  // DB package may use Drizzle/Postgres but not UI/cache/storage.
  {
    files: ["packages/db/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: restrictedForAll,
          patterns: [
            {
              group: [
                "react",
                "react-dom",
                "@inventory/storage",
                "@inventory/storage/*",
                "@inventory/cache",
                "@inventory/cache/*",
              ],
              message:
                "packages/db must not import UI, storage, or cache. Keep database layer pure.",
            },
          ],
        },
      ],
    },
  },

  // Config package is the only normal place for direct process.env access.
  {
    files: ["packages/config/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },

  // Tests can be more flexible but still cannot use forbidden stack choices.
  {
    files: ["tests/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "sonarjs/no-duplicate-string": "off",
    },
  }
);

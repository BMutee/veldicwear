import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Not part of the Next.js app's lint surface:
    ".claude/**", // ClaudeKit skill tooling (standalone CJS scripts)
    "tmp/**", // local scratch space (git-ignored)
    "extension/**", // self-contained browser-extension artifact with its own runtime
  ]),
  {
    // Plain CommonJS Node scripts/services — run directly with `node`, never
    // bundled: `require()` is the intended module system in these files.
    files: ["server.js", "cj-api/**/*.js", "tests/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // One-off maintenance/migration/ops scripts (scripts/*.ts). These never
    // ship in the app bundle; full app strictness here is noise, not safety.
    files: ["scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // Underscore-prefixed bindings are the conventional "intentionally
    // unused" idiom (e.g. omitting fields from a destructured row).
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // CMS/admin-managed imagery is served from arbitrary remote URLs
    // (Cloudinary, CJ, supplier CDNs) with unknown intrinsic dimensions —
    // next/image would need a per-image sizing pipeline that does not exist
    // yet. Plain <img> is a deliberate choice in these surfaces.
    files: [
      "app/admin/**",
      "app/collection/**",
      "components/Admin*.tsx",
      "components/Categories.tsx",
      "components/FeaturedProductsBlockEditors.tsx",
      "components/blocks/**",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;

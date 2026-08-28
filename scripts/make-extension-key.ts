/**
 * Creates an extension API key for testing and prints the raw key.
 * Usage: npx tsx --env-file=.env scripts/make-extension-key.ts [label]
 */
import { generateExtensionApiKey } from "@/lib/extension-api-keys";

async function main() {
  const label = process.argv[2] ?? "Smoke test key";
  const generated = await generateExtensionApiKey(label);
  console.log(JSON.stringify({ id: generated.id, key: generated.key, name: generated.name }));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

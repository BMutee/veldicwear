import "dotenv/config";
import { auth } from "../lib/auth-server";

async function main() {
  const email = "abdulkhalilmohammadi78@gmail.com";
  const password = "12345678";

  console.log("Testing server-side login...");
  console.log("Email:", email);
  console.log("Password:", "****" + password.slice(-4));
  
  try {
    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: new Headers({ "content-type": "application/json" }),
    });
    console.log("\n✅ LOGIN SUCCESSFUL");
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.log("\n❌ LOGIN FAILED");
    console.log("Error message:", err?.message || err);
    console.log("Error name:", err?.name || "N/A");
    console.log("Error code:", err?.code || err?.status || "N/A");
    if (err?.cause) console.log("Cause:", err.cause);
    if (err?.body) console.log("Body:", err.body);
  }

  process.exit(0);
}

main();
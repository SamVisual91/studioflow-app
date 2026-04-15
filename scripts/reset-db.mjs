import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const dbPath = join(process.cwd(), "data", "studioflow.db");

if (existsSync(dbPath)) {
  rmSync(dbPath);
  console.log(`Removed ${dbPath}`);
} else {
  console.log(`No database file found at ${dbPath}`);
}

console.log("StudioFlow will recreate and reseed the database the next time the app starts.");

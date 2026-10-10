// Run schema migration via Prisma CLI
const { execSync } = require("child_process");
const path = require("path");

// Connection string comes from the environment. Never hardcode credentials here:
// this file is committed, and a hardcoded password would leak with the repo.
const DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!DIRECT_URL) {
  console.error("Missing DIRECT_URL (or DATABASE_URL). Set it in your environment before running this script.");
  console.error("Example: DIRECT_URL='postgresql://user:pass@host:5432/postgres' node scripts/migrate.cjs");
  process.exit(1);
}

console.log("🚀 Pushing Prisma schema to Supabase...\n");

try {
  const output = execSync(
    `npx prisma db push --schema="${path.join(__dirname, "..", "prisma", "schema.prisma")}" --accept-data-loss`,
    {
      cwd: path.join(__dirname, ".."),
      timeout: 60000,
      encoding: "utf8",
      shell: true,
      env: {
        ...process.env,
        DATABASE_URL: DIRECT_URL,
        DIRECT_URL: DIRECT_URL,
      },
      maxBuffer: 10 * 1024 * 1024,
    }
  );
  console.log(output);
  console.log("✅ Schema pushed successfully!");
} catch (err) {
  console.error("❌ Error:", err.message);
  if (err.stdout) console.log("STDOUT:", err.stdout);
  if (err.stderr) console.log("STDERR:", err.stderr);
}

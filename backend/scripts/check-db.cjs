// Quick schema migration script — run via: node scripts/migrate.cjs
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    // Test connection
    await prisma.$connect();
    console.log("✅ Connected to database");

    // Check if users table exists
    const result = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      ) as exists
    `);

    const hasUsers = Array.isArray(result) && result[0]?.exists;

    if (!hasUsers) {
      console.log("⚠️  Tables don't exist yet. Running prisma db push...");

      // We'll exit and tell the user to run it
      console.log("\n❗ Run this command from the backend folder:\n");
      console.log("   npx prisma db push --accept-data-loss\n");
      process.exit(1);
    } else {
      console.log("✅ Tables exist! The app should work.");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

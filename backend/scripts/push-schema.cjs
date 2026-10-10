// One-time schema push script
const { execSync } = require("child_process");

try {
  console.log("Pushing Prisma schema to database...");
  const output = execSync("npx prisma db push --accept-data-loss", {
    cwd: __dirname,
    timeout: 120000,
    encoding: "utf8",
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || process.env.DIRECT_URL,
    },
  });
  console.log(output);
} catch (err) {
  console.error("Error:", err.message);
  if (err.stdout) console.log(err.stdout);
  if (err.stderr) console.log(err.stderr);
}

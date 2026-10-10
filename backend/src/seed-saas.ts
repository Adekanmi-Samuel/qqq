import "dotenv/config";
import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  // Check if super admin exists
  const existing = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (existing) {
    console.log("Super Admin already exists. Skipping...");
  } else {
    // Create super admin
    const passwordHash = await bcrypt.hash("Admin@12345", 12);
    const admin = await prisma.user.create({
      data: {
        fullName: "Platform Admin",
        email: "superadmin@schoolpilot.ng",
        passwordHash,
        role: "SUPER_ADMIN",
      },
    });
    console.log(`✅ Super Admin created: ${admin.email} / Password: Admin@12345`);
  }

  // SchoolPilot subscription plans (base fee + per-student pricing)
  const plans: Array<Record<string, any>> = [
    { name: "Pilot", planType: "FREE", price: 0, maxStudents: 30, maxStaff: 10, billingCycle: "monthly", features: ["Report card generator", "Student management", "Attendance tracking", "Timetable", "20 AI queries/month"], interval: "month" },
    { name: "Navigator", planType: "PREMIUM", price: 3000, maxStudents: 500, maxStaff: 50, billingCycle: "monthly", features: ["AI lesson notes", "CBT exams", "Parent portal", "Fee management", "200 AI queries/month", "Performance analytics"], interval: "month" },
    { name: "Commander", planType: "ENTERPRISE", price: 10000, maxStudents: 5000, maxStaff: 200, billingCycle: "monthly", features: ["Multi-campus", "Virtual classroom", "ID cards", "Unlimited AI", "Compliance reports", "Timesheets"], interval: "month" },
    { name: "Enterprise", planType: "ENTERPRISE", price: 25000, maxStudents: 99999, maxStaff: 9999, billingCycle: "monthly", features: ["Custom branding", "API access", "Dedicated support", "SLA guarantee", "On-site training"], interval: "month" },
  ];

  for (const plan of plans) {
    const exists = await prisma.subscriptionPlan.findFirst({ where: { name: plan.name } });
    if (!exists) {
      await prisma.subscriptionPlan.create({ data: plan as any });
      console.log(`✅ Plan created: ${plan.name} (${plan.planType})`);
    } else {
      console.log(`Plan "${plan.name}" already exists. Skipping...`);
    }
  }

  console.log("\n🎉 Seeding complete!");
  console.log("   Super Admin: superadmin@schoolpilot.ng / Admin@12345");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

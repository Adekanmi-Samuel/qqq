import "dotenv/config";
import express, { Router } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { prisma } from "./lib/prisma";
import { errorHandler } from "./middleware/errorHandler";
import { requestIdMiddleware } from "./middleware/requestId";
import { auditMiddleware } from "./middleware/audit";
import { schoolController } from "./controllers/school.controller";
import schoolRoutes from "./routes/schools";
import studentRoutes from "./routes/students";
import authRoutes from "./routes/auth";
import classRoutes from "./routes/classes";
import attendanceRoutes from "./routes/attendance";
import noticeRoutes from "./routes/notices";
import userRoutes from "./routes/users";
import inviteRoutes from "./routes/invites";
import platformRoutes from "./routes/platform";
import onboardingRoutes from "./routes/onboarding";
import timetableRoutes from "./routes/timetable";
import teacherSetupRoutes from "./routes/teacher-setup";
import schoolCurriculumRoutes from "./routes/school-curriculum";
import resultsRoutes from "./routes/results";
import examRoutes from "./routes/exams";
import dashboardRoutes from "./routes/dashboard";
import { tenantIsolation } from "./middleware/tenant";
import { csrfProtection, ensureCsrfCookie } from "./middleware/csrf";
import { deviceTracking } from "./middleware/deviceTracking";
import aiRoutes from "./routes/ai";
import subjectRoutes from "./routes/subjects";
import cbtRoutes from "./routes/cbt";
import timesheetRoutes from "./routes/timesheet";
import emailRoutes from "./routes/email";
import complianceRoutes from "./routes/compliance";
import feeRoutes from "./routes/fees";
import paymentRoutes from "./routes/payments";
import reviewRoutes from "./routes/reviews";
import profileRoutes from "./routes/profile";
import { authenticate, authorize } from "./middleware/auth";

// --- Environment variable validation at startup ---
function validateEnv() {
  const errors: string[] = [];

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is missing. The server cannot start without a database connection.");
  }

  if (!process.env.JWT_SECRET) {
    errors.push("JWT_SECRET is missing. Authentication will fail without it.");
  } else if (process.env.JWT_SECRET.length < 32) {
    console.warn(
      `[Startup Warning] JWT_SECRET is only ${process.env.JWT_SECRET.length} characters long. Recommended minimum is 32 characters.`
    );
  }

  if (!process.env.FRONTEND_URL) {
    errors.push("FRONTEND_URL is missing. CORS configuration may not work correctly.");
  }

  if (errors.length > 0) {
    console.error("\n=== Startup Environment Validation Failed ===");
    errors.forEach((e) => console.error(`  - ${e}`));
    console.error("=============================================\n");
    // Don't exit — allow degraded operation so health checks still work
  } else {
    console.log("[Startup] Environment validation passed.");
  }
}

validateEnv();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Trust proxy for rate limiting and real IP behind Vercel
app.set("trust proxy", 1);

// Security middleware configured for Vercel
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());

// CORS — only allow known, specific origins (no wildcard regexes)
const getAllowedOrigins = (): string[] => {
  // Production aliases only. Never allow ephemeral deployment hosts:
  // those send OAuth/callbacks and browser origin checks to "another website".
  const allowed: string[] = [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "https://schoolpilot-work.vercel.app",
    "https://schoolpilot-theta.vercel.app",
  ].filter((o): o is string => Boolean(o) && o.startsWith("http"));

  return [...new Set(allowed)];
};

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) {
      // Same-origin proxy + server-to-server (health checks, Vercel fetch)
      // never send a browser Origin. CORS does not stop curl; auth + CSRF do.
      return callback(null, true);
    }
    const normalized = origin.replace(/\/+$/, '');
    const allowed = getAllowedOrigins();
    const matched = allowed.some(a => a.replace(/\/+$/, '') === normalized);
    if (matched) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser for HttpOnly cookies
app.use(cookieParser());

// CSRF: mint readable token cookie on GET; enforce double-submit on mutating authenticated routes
app.use(ensureCsrfCookie);

// Device tracking middleware (adds req.deviceId, req.deviceFingerprint)
app.use(deviceTracking);

// Request ID middleware (before rate limiting and logging)
app.use(requestIdMiddleware);

// Request logging with request ID
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] [${req.requestId || "no-id"}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ─── Health Check Routes ───

// GET /api/health — basic health check (no auth required)
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    },
  });
});

// Temporary migrate/seed endpoints removed after use.

// GET /api/health/ready — readiness check (verifies DB connection)
app.get("/api/health/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: {
        status: "ready",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    // Log details server-side only; never leak Prisma messages or DB hosts to clients.
    console.error("[health/ready] Database check failed:", error?.message || error);
    res.status(503).json({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Service temporarily unavailable. Please try again shortly.",
      },
    });
  }
});

// Global API rate limiting — 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
});
app.use("/api/", globalLimiter);

// ─── Audit Middleware (for all write operations) ───
app.use(auditMiddleware);

// ─── Public Routes (no auth) ───

// Auth routes (with their own rate limiting)
app.use("/api/auth", authRoutes);

// Onboarding routes (public registration)
app.use("/api/onboarding", onboardingRoutes);

// Invite verification (public, rate limited to prevent code enumeration)
app.post("/api/invites/verify", async (req, res, next) => {
  try {
    const { inviteVerifyLimiter } = await import("./middleware/rateLimiter");
    inviteVerifyLimiter(req, res, async (err?: any) => {
      if (err) return next(err);
      const { inviteController } = await import("./controllers/invite.controller");
      await inviteController.verify(req, res);
    });
  } catch (error) {
    next(error);
  }
});

// Public school profile
app.get("/api/public/schools/:slug", (req, res) => schoolController.getBySlug(req, res));

// Public approved reviews for marketing
app.use("/api/reviews", reviewRoutes);

// ─── Tenant-Scoped Routes (authenticate + CSRF + tenantIsolation) ───
// CSRF is enforced on all authenticated mutating APIs (not only auth routes).
const authed = (router: Router) => [authenticate, csrfProtection, tenantIsolation, router];

// Profile is account-scoped, not tenant-scoped: a Google/OAuth signup has no
// school yet, and must still be able to read and edit its own profile.
app.use("/api/profile", authenticate, csrfProtection, profileRoutes);
app.use("/api/schools", ...authed(schoolRoutes));
app.use("/api/students", ...authed(studentRoutes));
app.use("/api/classes", ...authed(classRoutes));
app.use("/api/attendance", ...authed(attendanceRoutes));
app.use("/api/notices", ...authed(noticeRoutes));
app.use("/api/users", ...authed(userRoutes));
app.use("/api/invites", ...authed(inviteRoutes));
app.use("/api/platform", ...authed(platformRoutes));
app.use("/api/timetable", ...authed(timetableRoutes));
app.use("/api/teacher", ...authed(teacherSetupRoutes));
app.use("/api/school", ...authed(schoolCurriculumRoutes));
app.use("/api/results", ...authed(resultsRoutes));
app.use("/api/exams", ...authed(examRoutes));
app.use("/api/dashboard", ...authed(dashboardRoutes));
app.use("/api/ai", ...authed(aiRoutes));
app.use("/api/subjects", ...authed(subjectRoutes));
app.use("/api/cbt", ...authed(cbtRoutes));

// Phase 4: Teacher Timesheet, Email Communication, Compliance Reports
app.use("/api/timesheets", ...authed(timesheetRoutes));
app.use("/api/email", ...authed(emailRoutes));
app.use("/api/compliance", ...authed(complianceRoutes));

// Fee & Payment Tracking
app.use("/api/fees", ...authed(feeRoutes));
app.use("/api/payments", ...authed(paymentRoutes));

// ─── 404 handler ───
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "RESOURCE_NOT_FOUND",
      message: "Route not found.",
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[SIGTERM] Shutting down...");
  prisma.$disconnect().then(() => process.exit(0));
});
process.on("SIGINT", () => {
  console.log("[SIGINT] Shutting down...");
  prisma.$disconnect().then(() => process.exit(0));
});

// Start server - bind to 0.0.0.0 to accept connections from other devices on LAN
// In production (Vercel), don't start a listener — Vercel handles that.
if (process.env.VERCEL !== "1") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SchoolHub API running on port ${PORT}`);
    console.log(`   Health (local): http://localhost:${PORT}/api/health`);
    console.log(`   Readiness: http://localhost:${PORT}/api/health/ready`);
    console.log(`   Frontend: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  });
}

// For Vercel serverless: quick DB connection test on cold start
if (process.env.VERCEL === "1") {
  prisma.$connect().catch((err) => {
    console.error("[Startup] Prisma connection failed:", err.message);
  });
}

export default app;

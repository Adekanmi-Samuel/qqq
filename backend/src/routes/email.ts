import { Router } from "express";
import { z } from "zod";
import { emailController } from "../controllers/email.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// All email routes require authentication
router.use(authenticate);

// Validation schemas
const configSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  fromEmail: z.string().email("Valid fromEmail is required"),
  fromName: z.string().min(1, "fromName is required"),
  encryption: z.enum(["NONE", "SSL", "STARTTLS"]).optional(),
  isActive: z.boolean().optional(),
});

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  isActive: z.boolean().optional(),
});

const sendEmailSchema = z.object({
  to: z.string().email("Valid recipient email is required"),
  subject: z.string().min(1, "Subject is required"),
  html: z.string().min(1, "HTML body is required"),
});

const sendTemplateSchema = z.object({
  templateName: z.string().min(1, "Template name is required"),
  to: z.string().email("Valid recipient email is required"),
  recipientName: z.string().min(1, "Recipient name is required"),
  data: z.record(z.union([z.string(), z.number()])).optional(),
});

const sendBulkSchema = z.object({
  templateName: z.string().min(1, "Template name is required"),
  recipients: z.array(
    z.object({
      email: z.string().email(),
      name: z.string().min(1),
      data: z.record(z.union([z.string(), z.number()])).optional(),
    })
  ).min(1, "At least one recipient is required"),
});

// SMTP Configuration
// POST /api/email/config — Configure SMTP settings
router.post("/config", async (req, res, next) => {
  try {
    req.body = configSchema.parse(req.body);
    await emailController.upsertConfig(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(" | ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// GET /api/email/config — Get SMTP config
router.get("/config", async (req, res, next) => {
  try {
    await emailController.getConfig(req, res);
  } catch (error: any) {
    next(error);
  }
});

// POST /api/email/test — Test SMTP connection
router.post("/test", async (req, res, next) => {
  try {
    await emailController.testConnection(req, res);
  } catch (error: any) {
    next(error);
  }
});

// Templates
// POST /api/email/templates — Create email template
router.post("/templates", async (req, res, next) => {
  try {
    req.body = templateSchema.parse(req.body);
    await emailController.createTemplate(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(" | ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// PUT /api/email/templates/:id — Update email template
router.put("/templates/:id", async (req, res, next) => {
  try {
    req.body = templateSchema.partial().parse(req.body);
    await emailController.updateTemplate(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(" | ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// GET /api/email/templates — Get all email templates
router.get("/templates", async (req, res, next) => {
  try {
    await emailController.getTemplates(req, res);
  } catch (error: any) {
    next(error);
  }
});

// POST /api/email/templates/defaults — Create default templates
router.post("/templates/defaults", async (req, res, next) => {
  try {
    await emailController.createDefaultTemplates(req, res);
  } catch (error: any) {
    next(error);
  }
});

// Sending emails
// POST /api/email/send — Send custom email
router.post("/send", async (req, res, next) => {
  try {
    req.body = sendEmailSchema.parse(req.body);
    await emailController.sendEmail(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(" | ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// POST /api/email/send-template — Send email using template
router.post("/send-template", async (req, res, next) => {
  try {
    req.body = sendTemplateSchema.parse(req.body);
    await emailController.sendTemplateEmail(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(" | ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// POST /api/email/send-bulk — Send bulk emails using template
router.post("/send-bulk", async (req, res, next) => {
  try {
    req.body = sendBulkSchema.parse(req.body);
    await emailController.sendBulkTemplateEmail(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(" | ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// Logs and Stats
// GET /api/email/logs — Get email logs
router.get("/logs", async (req, res, next) => {
  try {
    await emailController.getLogs(req, res);
  } catch (error: any) {
    next(error);
  }
});

// GET /api/email/stats — Get email stats
router.get("/stats", async (req, res, next) => {
  try {
    await emailController.getStats(req, res);
  } catch (error: any) {
    next(error);
  }
});

export default router;

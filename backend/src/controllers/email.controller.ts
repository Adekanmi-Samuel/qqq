import { Response } from "express";
import { z } from "zod";
import { emailService } from "../services/emailCommunication.service";
import { AuthenticatedRequest } from "../types";

export class EmailController {
  /**
   * POST /api/email/config — Configure SMTP settings for school
   */
  async upsertConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { host, port, username, password, fromEmail, fromName, encryption, isActive } = req.body;

      const config = await emailService.upsertConfig(schoolId, {
        host,
        port,
        username,
        password,
        fromEmail,
        fromName,
        encryption,
        isActive,
      });

      res.json({ success: true, data: config });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to save email config" });
    }
  }

  /**
   * GET /api/email/config — Get SMTP config for school
   */
  async getConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const config = await emailService.getConfig(schoolId);
      // Don't return password
      if (config) {
        const { password, ...safeConfig } = config;
        return res.json({ success: true, data: safeConfig });
      }
      res.json({ success: true, data: null });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch email config" });
    }
  }

  /**
   * POST /api/email/test — Test SMTP connection
   */
  async testConnection(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const result = await emailService.testSmtpConnection(schoolId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to test connection" });
    }
  }

  /**
   * POST /api/email/templates — Create email template
   */
  async createTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { name, subject, body } = req.body;
      if (!name || !subject || !body) {
        return res.status(400).json({ success: false, error: "name, subject, and body are required" });
      }

      const template = await emailService.createTemplate(schoolId, { name, subject, body });
      res.json({ success: true, data: template });
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(400).json({ success: false, error: "Template with this name already exists" });
      }
      res.status(500).json({ success: false, error: error.message || "Failed to create template" });
    }
  }

  /**
   * PUT /api/email/templates/:id — Update email template
   */
  async updateTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { id } = req.params;
      const { subject, body, isActive } = req.body;

      const template = await emailService.updateTemplate(schoolId, id as string, { subject, body, isActive });
      res.json({ success: true, data: template });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to update template" });
    }
  }

  /**
   * GET /api/email/templates — Get all email templates
   */
  async getTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const templates = await emailService.getTemplates(schoolId);
      res.json({ success: true, data: templates });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch templates" });
    }
  }

  /**
   * POST /api/email/templates/defaults — Create default templates
   */
  async createDefaultTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const result = await emailService.createDefaultTemplates(schoolId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to create default templates" });
    }
  }

  /**
   * POST /api/email/send — Send custom email
   */
  async sendEmail(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { to, subject, html } = req.body;
      if (!to || !subject || !html) {
        return res.status(400).json({ success: false, error: "to, subject, and html are required" });
      }

      const result = await emailService.sendEmail(schoolId, { to, subject, html });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to send email" });
    }
  }

  /**
   * POST /api/email/send-template — Send email using template
   */
  async sendTemplateEmail(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { templateName, to, recipientName, data } = req.body;
      if (!templateName || !to || !recipientName) {
        return res.status(400).json({ success: false, error: "templateName, to, and recipientName are required" });
      }

      const result = await emailService.sendTemplateEmail(schoolId, templateName, to, recipientName, data || {});
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message || "Failed to send template email" });
    }
  }

  /**
   * POST /api/email/send-bulk — Send bulk emails using template
   */
  async sendBulkTemplateEmail(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { templateName, recipients } = req.body;
      if (!templateName || !recipients || !Array.isArray(recipients)) {
        return res.status(400).json({ success: false, error: "templateName and recipients array are required" });
      }

      const result = await emailService.sendBulkTemplateEmail(schoolId, templateName, recipients);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to send bulk emails" });
    }
  }

  /**
   * GET /api/email/logs — Get email logs
   */
  async getLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { limit, offset } = req.query;
      const logs = await emailService.getEmailLogs(
        schoolId,
        limit ? parseInt(limit as string) : 50,
        offset ? parseInt(offset as string) : 0
      );
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch email logs" });
    }
  }

  /**
   * GET /api/email/stats — Get email stats
   */
  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const stats = await emailService.getEmailStats(schoolId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch email stats" });
    }
  }
}

export const emailController = new EmailController();

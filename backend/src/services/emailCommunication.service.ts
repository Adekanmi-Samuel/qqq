import { prisma } from "../lib/prisma";
import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface TemplateData {
  [key: string]: string | number;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize transporter with school's SMTP config
   */
  private async getTransporter(schoolId: string) {
    const config = await prisma.schoolEmailConfig.findUnique({
      where: { schoolId },
    });

    if (!config || !config.isActive) {
      throw { statusCode: 400, message: "Email not configured for this school" };
    }

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.encryption === "SSL",
      auth: {
        user: config.username,
        pass: config.password,
      },
      tls: config.encryption === "STARTTLS" ? { rejectUnauthorized: false } : undefined,
    });

    return { transporter: this.transporter, fromEmail: config.fromEmail, fromName: config.fromName };
  }

  /**
   * Upsert SMTP configuration for a school
   */
  async upsertConfig(
    schoolId: string,
    data: {
      host: string;
      port: number;
      username: string;
      password: string;
      fromEmail: string;
      fromName: string;
      encryption?: "NONE" | "SSL" | "STARTTLS";
      isActive?: boolean;
    }
  ) {
    return prisma.schoolEmailConfig.upsert({
      where: { schoolId },
      create: { schoolId, ...data, encryption: data.encryption || "STARTTLS", isActive: data.isActive ?? false },
      update: { ...data, encryption: data.encryption || "STARTTLS", isActive: data.isActive ?? false },
    });
  }

  /**
   * Get SMTP configuration for a school (without password)
   */
  async getConfig(schoolId: string) {
    return prisma.schoolEmailConfig.findUnique({
      where: { schoolId },
    });
  }

  /**
   * Create email template
   */
  async createTemplate(
    schoolId: string,
    data: { name: string; subject: string; body: string; isActive?: boolean }
  ) {
    return prisma.emailTemplate.create({
      data: { schoolId, ...data, isActive: data.isActive ?? true },
    });
  }

  /**
   * Update email template
   */
  async updateTemplate(
    schoolId: string,
    templateId: string,
    data: { subject?: string; body?: string; isActive?: boolean }
  ) {
    return prisma.emailTemplate.update({
      where: { id: templateId, schoolId },
      data,
    });
  }

  /**
   * Get all email templates for a school
   */
  async getTemplates(schoolId: string) {
    return prisma.emailTemplate.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Send email using school's SMTP config
   */
  async sendEmail(
    schoolId: string,
    options: EmailOptions,
    templateId?: string
  ) {
    const { transporter, fromEmail, fromName } = await this.getTransporter(schoolId);

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    // Log email attempt
    const log = await prisma.emailLog.create({
      data: {
        schoolId,
        templateId,
        to: options.to,
        subject: options.subject,
        html: options.html,
        status: "PENDING",
      },
    });

    try {
      await transporter.sendMail(mailOptions);

      // Update log as sent
      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "SENT", sentAt: new Date() },
      });

      return { success: true, logId: log.id };
    } catch (error: any) {
      // Update log as failed
      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "FAILED", error: error.message },
      });
      throw error;
    }
  }

  /**
   * Send email using a template
   */
  async sendTemplateEmail(
    schoolId: string,
    templateName: string,
    to: string,
    recipientName: string,
    data: TemplateData
  ) {
    const template = await prisma.emailTemplate.findFirst({
      where: { schoolId, name: templateName, isActive: true },
    });

    if (!template) {
      throw { statusCode: 404, message: `Template "${templateName}" not found` };
    }

    // Replace placeholders in subject and body
    let subject = this.replacePlaceholders(template.subject, data);
    let body = this.replacePlaceholders(template.body, data);
    body = body.replace(/\{\{recipientName\}\}/g, recipientName);

    return this.sendEmail(
      schoolId,
      { to, subject, html: body },
      template.id
    );
  }

  /**
   * Send bulk emails using a template
   */
  async sendBulkTemplateEmail(
    schoolId: string,
    templateName: string,
    recipients: Array<{ email: string; name: string; data: TemplateData }>
  ) {
    const template = await prisma.emailTemplate.findFirst({
      where: { schoolId, name: templateName, isActive: true },
    });

    if (!template) {
      throw { statusCode: 404, message: `Template "${templateName}" not found` };
    }

    const results = await Promise.allSettled(
      recipients.map(({ email, name, data }) =>
        this.sendTemplateEmail(schoolId, templateName, email, name, data)
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return { successful, failed, total: recipients.length };
  }

  /**
   * Replace placeholders in template
   */
  private replacePlaceholders(template: string, data: TemplateData): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key]?.toString() || match;
    });
  }

  /**
   * Get email logs for a school
   */
  async getEmailLogs(schoolId: string, limit = 50, offset = 0) {
    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: { template: { select: { name: true } } },
      }),
      prisma.emailLog.count({ where: { schoolId } }),
    ]);

    return { logs, total };
  }

  /**
   * Get email stats for dashboard
   */
  async getEmailStats(schoolId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalSent, totalFailed, todaySent, todayFailed, pendingCount] = await Promise.all([
      prisma.emailLog.count({ where: { schoolId, status: "SENT" } }),
      prisma.emailLog.count({ where: { schoolId, status: "FAILED" } }),
      prisma.emailLog.count({
        where: { schoolId, status: "SENT", sentAt: { gte: today } },
      }),
      prisma.emailLog.count({
        where: { schoolId, status: "FAILED", sentAt: { gte: today } },
      }),
      prisma.emailLog.count({ where: { schoolId, status: "PENDING" } }),
    ]);

    return {
      totalSent,
      totalFailed,
      todaySent,
      todayFailed,
      pendingCount,
      successRate:
        totalSent + totalFailed > 0
          ? Math.round((totalSent / (totalSent + totalFailed)) * 100)
          : 0,
    };
  }

  /**
   * Test SMTP configuration
   */
  async testSmtpConnection(schoolId: string) {
    try {
      const { transporter } = await this.getTransporter(schoolId);
      await transporter.verify();
      return { success: true, message: "SMTP connection successful" };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Create default email templates for a school
   */
  async createDefaultTemplates(schoolId: string) {
    const defaults = [
      {
        name: "fee_reminder",
        subject: "Fee Reminder — {{studentName}} ({{schoolName}})",
        body: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:#111827;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:20px;">{{schoolName}}</h1>
          </div>
          <div style="background:#fff;padding:32px 24px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#374151;font-size:15px;">Dear {{parentName}},</p>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;">
              This is a reminder that school fees for <strong>{{studentName}}</strong> are due.
            </p>
            <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:20px 0;text-align:center;">
              <p style="color:#ef4444;font-size:12px;margin:0 0 4px;">Amount Outstanding</p>
              <p style="color:#dc2626;font-size:28px;font-weight:bold;margin:0;">₦{{amountDue}}</p>
            </div>
            <p style="color:#6b7280;font-size:14px;">Due date: <strong>{{dueDate}}</strong></p>
            <p style="color:#6b7280;font-size:14px;">Please make payment at the school bursary or via the parent portal to avoid disruption.</p>
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">{{schoolName}} · SchoolPilot</p>
          </div>
        </div>`,
      },
      {
        name: "result_published",
        subject: "Report Card — {{studentName}} ({{term}} Term {{session}})",
        body: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:#111827;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:20px;">{{schoolName}}</h1>
          </div>
          <div style="background:#fff;padding:32px 24px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#374151;font-size:15px;">Dear {{parentName}},</p>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;">
              The report card for <strong>{{studentName}}</strong> for the 
              <strong>{{term}} Term, {{session}}</strong> session is now available.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="{{resultUrl}}" 
                 style="display:inline-block;background:#111827;color:#fff;text-decoration:none;
                        padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                View Report Card
              </a>
            </div>
            <p style="color:#6b7280;font-size:13px;">Or copy this link: {{resultUrl}}</p>
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">{{schoolName}} · SchoolPilot</p>
          </div>
        </div>`,
      },
      {
        name: "attendance_alert",
        subject: "Attendance Alert — {{studentName}} was {{status}} today",
        body: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:#111827;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:20px;">{{schoolName}}</h1>
          </div>
          <div style="background:#fff;padding:32px 24px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#374151;font-size:15px;">Dear {{parentName}},</p>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;">
              This is to inform you that <strong>{{studentName}}</strong> was marked 
              <strong>{{status}}</strong> on {{date}}.
            </p>
            <p style="color:#6b7280;font-size:14px;">Class: {{className}}</p>
            <p style="color:#6b7280;font-size:14px;">If this is an error, please contact the school administration.</p>
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">{{schoolName}} · SchoolPilot</p>
          </div>
        </div>`,
      },
      {
        name: "welcome_student",
        subject: "Welcome to {{schoolName}} — Set Up Your Account",
        body: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:#111827;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:20px;">{{schoolName}}</h1>
          </div>
          <div style="background:#fff;padding:32px 24px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#374151;font-size:15px;">Welcome, {{studentName}}!</p>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;">
              Your student account has been created on the {{schoolName}} portal.
            </p>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;">
              Click the button below to set your password and sign in.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="{{setupUrl}}" 
                 style="display:inline-block;background:#111827;color:#fff;text-decoration:none;
                        padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                Set Up Account
              </a>
            </div>
            <p style="color:#6b7280;font-size:13px;">Or copy this link: {{setupUrl}}</p>
            <p style="color:#6b7280;font-size:12px;margin-top:16px;">This link expires in 7 days.</p>
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">{{schoolName}} · SchoolPilot</p>
          </div>
        </div>`,
      },
      {
        name: "welcome_staff",
        subject: "Welcome to {{schoolName}} — Set Up Your Account",
        body: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:#111827;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:20px;">{{schoolName}}</h1>
          </div>
          <div style="background:#fff;padding:32px 24px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#374151;font-size:15px;">Welcome, {{staffName}}!</p>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;">
              Your account has been created as <strong>{{role}}</strong> on the {{schoolName}} portal.
            </p>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;">
              Click the button below to set your password and sign in.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="{{setupUrl}}" 
                 style="display:inline-block;background:#111827;color:#fff;text-decoration:none;
                        padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                Set Up Account
              </a>
            </div>
            <p style="color:#6b7280;font-size:13px;">Or copy this link: {{setupUrl}}</p>
            <p style="color:#6b7280;font-size:12px;margin-top:16px;">This link expires in 7 days.</p>
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">{{schoolName}} · SchoolPilot</p>
          </div>
        </div>`,
      },
      {
        name: "password_reset",
        subject: "Reset Your SchoolPilot Password",
        body: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:#111827;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:20px;">SchoolPilot</h1>
          </div>
          <div style="background:#fff;padding:32px 24px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#374151;font-size:15px;">Hi {{fullName}},</p>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;">
              A password reset was requested for your SchoolPilot account.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="{{resetUrl}}" 
                 style="display:inline-block;background:#111827;color:#fff;text-decoration:none;
                        padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                Reset Password
              </a>
            </div>
            <p style="color:#6b7280;font-size:13px;">Or copy this link: {{resetUrl}}</p>
            <p style="color:#6b7280;font-size:12px;margin-top:16px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">SchoolPilot</p>
          </div>
        </div>`,
      },
    ];

    for (const tmpl of defaults) {
      await prisma.emailTemplate.upsert({
        where: { schoolId_name: { schoolId, name: tmpl.name } },
        create: { schoolId, ...tmpl, isActive: true },
        update: { subject: tmpl.subject, body: tmpl.body, isActive: true },
      });
    }

    return { success: true, count: defaults.length };
  }
}

export const emailService = new EmailService();

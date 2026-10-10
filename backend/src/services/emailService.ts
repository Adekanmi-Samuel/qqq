import nodemailer from "nodemailer";
import { ntfyService } from "./ntfy.service";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_NAME = "SchoolPilot";
const FROM_EMAIL = process.env.SMTP_USER || "schoolpilot.notification@gmail.com";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using the configured SMTP transport.
 */
async function sendMail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${subject}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[Email] Failed to send to ${to}: ${error.message}`);
    // Fallback: log the HTML content to the console in development so users can grab links (like resetUrl)
    console.log("\n--- [Email Fallback Log] ---");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${html}`);
    console.log("----------------------------\n");
    // Don't throw — email failures should not break the app
    return { success: false, error: error.message };
  }
}

// ─── Templates ───────────────────────────────────────────────

/**
 * Fee Reminder to Parent
 */
export async function sendFeeReminder(params: {
  parentEmail: string;
  parentName: string;
  studentName: string;
  amountDue: number;
  schoolName: string;
  dueDate: string;
}) {
  // Send ntfy.sh push notification (SMS alternative)
  const safeTopic = params.parentEmail.replace(/[^a-zA-Z0-9]/g, "_");
  ntfyService.sendNotification(
    `sh_${safeTopic}`,
    `Fee Reminder: ${params.schoolName}`,
    `Fees for ${params.studentName} are due (${params.dueDate}). Amount: ₦${params.amountDue.toLocaleString()}`,
    "money_bag"
  ).catch(console.error);

  return sendMail({
    to: params.parentEmail,
    subject: `Fee Reminder — ${params.studentName} (${params.schoolName})`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#111827;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:20px;">${params.schoolName}</h1>
        </div>
        <div style="background:#fff;padding:32px 24px;border:1px solid #e5e7eb;border-top:0;">
          <p style="color:#374151;font-size:15px;">Dear ${params.parentName},</p>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;">
            This is a reminder that school fees for <strong>${params.studentName}</strong> are due.
          </p>
          <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:20px 0;text-align:center;">
            <p style="color:#ef4444;font-size:12px;margin:0 0 4px;">Amount Outstanding</p>
            <p style="color:#dc2626;font-size:28px;font-weight:bold;margin:0;">₦${params.amountDue.toLocaleString()}</p>
          </div>
          <p style="color:#6b7280;font-size:14px;">Due date: <strong>${params.dueDate}</strong></p>
          <p style="color:#6b7280;font-size:14px;">Please make payment at the school bursary or via the parent portal to avoid disruption.</p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:0;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">${params.schoolName} · SchoolPilot</p>
        </div>
      </div>
    `,
  });
}

/**
 * Result / Report Card Delivery
 */
export async function sendResult(params: {
  parentEmail: string;
  parentName: string;
  studentName: string;
  term: string;
  session: string;
  schoolName: string;
  resultUrl: string;
}) {
  // Send ntfy.sh push notification (SMS alternative)
  const safeTopic = params.parentEmail.replace(/[^a-zA-Z0-9]/g, "_");
  ntfyService.sendNotification(
    `sh_${safeTopic}`,
    `Report Card Ready: ${params.schoolName}`,
    `The report card for ${params.studentName} (${params.term} Term) is now available.`,
    "scroll"
  ).catch(console.error);

  return sendMail({
    to: params.parentEmail,
    subject: `Report Card — ${params.studentName} (${params.term} Term ${params.session})`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#111827;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:20px;">${params.schoolName}</h1>
        </div>
        <div style="background:#fff;padding:32px 24px;border:1px solid #e5e7eb;border-top:0;">
          <p style="color:#374151;font-size:15px;">Dear ${params.parentName},</p>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;">
            The report card for <strong>${params.studentName}</strong> for the 
            <strong>${params.term} Term, ${params.session}</strong> session is now available.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${params.resultUrl}" 
               style="display:inline-block;background:#111827;color:#fff;text-decoration:none;
                      padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
              View Report Card
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px;">Or copy this link: ${params.resultUrl}</p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:0;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">${params.schoolName} · SchoolPilot</p>
        </div>
      </div>
    `,
  });
}

/**
 * Setup Link Delivery (New Staff or Student Account)
 * Sends a secure link instead of plaintext password.
 */
export async function sendSetupLink(params: {
  email: string;
  fullName: string;
  role: string;
  schoolName: string;
  setupUrl: string;
}) {
  return sendMail({
    to: params.email,
    subject: `Welcome to ${params.schoolName} — Set Up Your Account`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#111827;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:20px;">${params.schoolName}</h1>
        </div>
        <div style="background:#fff;padding:32px 24px;border:1px solid #e5e7eb;border-top:0;">
          <p style="color:#374151;font-size:15px;">Welcome, ${params.fullName}!</p>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;">
            Your account has been created as <strong>${params.role}</strong> on the ${params.schoolName} portal.
          </p>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;">
            Click the button below to set your password and sign in.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${params.setupUrl}" 
               style="display:inline-block;background:#111827;color:#fff;text-decoration:none;
                      padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
              Set Up Account
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px;">Or copy this link: ${params.setupUrl}</p>
          <p style="color:#6b7280;font-size:12px;margin-top:16px;">This link expires in 7 days.</p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:0;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">${params.schoolName} · SchoolPilot</p>
        </div>
      </div>
    `,
  });
}

/**
 * Password Reset Email
 */
export async function sendPasswordReset(params: {
  email: string;
  fullName: string;
  resetUrl: string;
}) {
  return sendMail({
    to: params.email,
    subject: `Reset Your SchoolPilot Password`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#111827;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:20px;">SchoolPilot</h1>
        </div>
        <div style="background:#fff;padding:32px 24px;border:1px solid #e5e7eb;border-top:0;">
          <p style="color:#374151;font-size:15px;">Hi ${params.fullName},</p>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;">
            A password reset was requested for your SchoolPilot account.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${params.resetUrl}" 
               style="display:inline-block;background:#111827;color:#fff;text-decoration:none;
                      padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
              Reset Password
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px;">Or copy this link: ${params.resetUrl}</p>
          <p style="color:#6b7280;font-size:12px;margin-top:16px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:0;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">SchoolPilot</p>
        </div>
      </div>
    `,
  });
}

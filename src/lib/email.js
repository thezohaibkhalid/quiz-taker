import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

const FROM_NAME = process.env.SMTP_FROM_NAME || "Quiz System";
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Online Quiz Management System";

function shell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background:#2563eb;color:#fff;padding:20px 28px;font-size:18px;font-weight:bold;">${APP_NAME}</td></tr>
        <tr><td style="padding:28px;font-size:14px;line-height:1.6;color:#1f2937;">
          <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">${title}</h2>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 28px;background:#f9fafb;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
          You are receiving this email because of your account on ${APP_NAME}.<br/>
          &copy; ${new Date().getFullYear()} ${APP_NAME}.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    // eslint-disable-next-line no-console
    console.warn("[email] SMTP not configured — skipping send to", to, "subject:", subject);
    return { ok: false, skipped: true };
  }
  try {
    const info = await getTransporter().sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      text: text || subject,
      html,
    });
    return { ok: true, id: info.messageId };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[email] send error:", err.message);
    return { ok: false, error: err.message };
  }
}

export function welcomeEmail({ name, verifyUrl }) {
  return {
    subject: `Welcome to ${APP_NAME}`,
    html: shell(
      `Welcome, ${name}!`,
      `<p>Your account has been created successfully.</p>
       <p>Please verify your email address to activate full access:</p>
       <p style="margin:24px 0;"><a href="${verifyUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Verify Email</a></p>
       <p style="color:#6b7280;font-size:12px;">Or copy this link: ${verifyUrl}</p>`
    ),
  };
}

export function passwordResetEmail({ name, resetUrl }) {
  return {
    subject: `Reset your ${APP_NAME} password`,
    html: shell(
      `Password reset request`,
      `<p>Hi ${name},</p>
       <p>We received a request to reset your password. This link is valid for 1 hour.</p>
       <p style="margin:24px 0;"><a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Reset Password</a></p>
       <p style="color:#6b7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>`
    ),
  };
}

export function quizInvitationEmail({ name, quizTitle, startTime, endTime, durationMinutes }) {
  const startFmt = new Date(startTime).toLocaleString();
  const endFmt = new Date(endTime).toLocaleString();
  return {
    subject: `New quiz available: ${quizTitle}`,
    html: shell(
      `You're invited to take "${quizTitle}"`,
      `<p>Hi ${name},</p>
       <p>A new quiz is now available for you to attempt.</p>
       <table style="border-collapse:collapse;margin:16px 0;">
         <tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb;"><b>Duration</b></td><td style="padding:6px 12px;border:1px solid #e5e7eb;">${durationMinutes} minutes</td></tr>
         <tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb;"><b>Opens</b></td><td style="padding:6px 12px;border:1px solid #e5e7eb;">${startFmt}</td></tr>
         <tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb;"><b>Closes</b></td><td style="padding:6px 12px;border:1px solid #e5e7eb;">${endFmt}</td></tr>
       </table>
       <p style="margin:24px 0;"><a href="${APP_URL}/student/quizzes" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Go to Quizzes</a></p>`
    ),
  };
}

export function resultAnnouncementEmail({ name, quizTitle, obtained, total, percentage, status }) {
  const color = status === "pass" ? "#16a34a" : status === "fail" ? "#dc2626" : "#6b7280";
  return {
    subject: `Result published: ${quizTitle}`,
    html: shell(
      `Your result is in`,
      `<p>Hi ${name},</p>
       <p>The result for <b>${quizTitle}</b> has been announced.</p>
       <table style="border-collapse:collapse;margin:16px 0;">
         <tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb;"><b>Score</b></td><td style="padding:6px 12px;border:1px solid #e5e7eb;">${obtained} / ${total}</td></tr>
         <tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb;"><b>Percentage</b></td><td style="padding:6px 12px;border:1px solid #e5e7eb;">${percentage.toFixed(2)}%</td></tr>
         <tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb;"><b>Status</b></td><td style="padding:6px 12px;border:1px solid #e5e7eb;color:${color};text-transform:uppercase;font-weight:bold;">${status}</td></tr>
       </table>
       <p style="margin:24px 0;"><a href="${APP_URL}/student/results" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">View Detailed Result</a></p>`
    ),
  };
}

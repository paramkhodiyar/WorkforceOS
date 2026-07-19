import nodemailer from "nodemailer";
import { config } from "../config/env";
import { buildClientTrialEmailHtml, buildLeadEmailHtml, buildTrialLeadEmailText } from "./email.templates";

export type TrialLeadEmailData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  companySize: string;
  challenge?: string;
  source: string;
  submittedAt: string;
};

function getMailerConfig() {
  const smtpHost = config.SMTP_HOST;
  const smtpUser = config.SMTP_USER;
  const smtpPass = config.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  return {
    host: smtpHost,
    port: config.SMTP_PORT || 587,
    secure: config.SMTP_SECURE,
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    fromEmail: config.SMTP_FROM || smtpUser,
    fromName: config.SMTP_FROM_NAME || "WorkforceOS",
    notifyEmail: config.LEAD_NOTIFY_EMAIL || smtpUser
  };
}

export async function sendTrialLeadEmails(data: TrialLeadEmailData) {
  const mailerConfig = getMailerConfig();

  if (!mailerConfig) {
    console.warn("Trial email notifications are skipped because SMTP env vars are not configured.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: mailerConfig.host,
    port: mailerConfig.port,
    secure: mailerConfig.secure,
    auth: mailerConfig.auth
  });

  const from = `${mailerConfig.fromName} <${mailerConfig.fromEmail}>`;
  const replyTo = `${data.firstName} ${data.lastName}`.trim() ? `${data.firstName} ${data.lastName} <${data.email}>` : data.email;

  const leadMessage = {
    from,
    to: mailerConfig.notifyEmail,
    subject: `New WorkforceOS Trial Lead: ${data.companyName}`,
    text: buildTrialLeadEmailText(data),
    html: buildLeadEmailHtml(data),
    replyTo
  };

  const clientMessage = {
    from,
    to: data.email,
    subject: `Your WorkforceOS trial request for ${data.companyName}`,
    text: buildTrialLeadEmailText(data),
    html: buildClientTrialEmailHtml(data),
    replyTo: mailerConfig.notifyEmail
  };

  await transporter.sendMail(leadMessage);
  await transporter.sendMail(clientMessage);
}
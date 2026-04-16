import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { lookup } from "node:dns/promises";

function getRequired(name: string) {
  return process.env[name]?.trim() || "";
}

export function hasMailerConfig() {
  return Boolean(
    getRequired("SMTP_HOST") &&
      getRequired("SMTP_PORT") &&
      getRequired("SMTP_USER") &&
      getRequired("SMTP_PASS") &&
      getRequired("EMAIL_FROM")
  );
}

export async function sendProposalEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (!hasMailerConfig()) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  const secure = getRequired("SMTP_SECURE").toLowerCase() === "true";
  const port = Number(getRequired("SMTP_PORT"));
  const smtpHost = getRequired("SMTP_HOST");
  const resolvedHost = await lookup(smtpHost, { family: 4 });

  const transportConfig: SMTPTransport.Options = {
    host: resolvedHost.address,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: {
      user: getRequired("SMTP_USER"),
      pass: getRequired("SMTP_PASS"),
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    tls: {
      servername: smtpHost,
      rejectUnauthorized:
        (process.env.SMTP_ALLOW_SELF_SIGNED || "").toLowerCase() === "true" ? false : true,
    },
  };

  const transporter = nodemailer.createTransport(transportConfig);

  await transporter.sendMail({
    from: getRequired("EMAIL_FROM"),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

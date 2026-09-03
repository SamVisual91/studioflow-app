import nodemailer from "nodemailer";

function getRequired(name: string) {
  return process.env[name]?.trim() || "";
}

function hasResendMailerConfig() {
  return Boolean(getRequired("RESEND_API_KEY") && getRequired("EMAIL_FROM"));
}

function hasSmtpMailerConfig() {
  return Boolean(
    getRequired("SMTP_HOST") &&
      getRequired("SMTP_USER") &&
      getRequired("SMTP_PASS") &&
      getRequired("EMAIL_FROM")
  );
}

function getSmtpPassword() {
  const password = getRequired("SMTP_PASS");

  // Google displays app passwords in groups of four, but SMTP expects the raw 16-character value.
  return getRequired("SMTP_HOST").toLowerCase().includes("gmail.com") ? password.replace(/\s/g, "") : password;
}

export function hasMailerConfig() {
  return hasResendMailerConfig() || hasSmtpMailerConfig();
}

export async function sendProposalEmail(input: {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
}) {
  if (hasResendMailerConfig()) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getRequired("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getRequired("EMAIL_FROM"),
        to: Array.isArray(input.to) ? input.to : [input.to],
        cc: input.cc ? (Array.isArray(input.cc) ? input.cc : [input.cc]) : undefined,
        bcc: input.bcc ? (Array.isArray(input.bcc) ? input.bcc : [input.bcc]) : undefined,
        reply_to: input.replyTo,
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments: input.attachments,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`RESEND_SEND_FAILED: ${response.status} ${errorText}`);
    }

    return (await response.json()) as { id?: string };
  }

  if (!hasSmtpMailerConfig()) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  const port = Number(getRequired("SMTP_PORT") || "465");
  const secureSetting = getRequired("SMTP_SECURE").toLowerCase();
  const secure = secureSetting ? secureSetting === "true" : port === 465;
  const allowSelfSigned = getRequired("SMTP_ALLOW_SELF_SIGNED").toLowerCase() === "true";
  const transporter = nodemailer.createTransport({
    host: getRequired("SMTP_HOST"),
    port,
    secure,
    auth: {
      user: getRequired("SMTP_USER"),
      pass: getSmtpPassword(),
    },
    tls: allowSelfSigned ? { rejectUnauthorized: false } : undefined,
  });
  let response: { messageId: string };
  try {
    response = await transporter.sendMail({
      from: getRequired("EMAIL_FROM"),
      to: input.to,
      cc: input.cc,
      bcc: input.bcc,
      replyTo: input.replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
        encoding: "base64",
      })),
    });
  } catch (error) {
    const errorCode =
      error && typeof error === "object" && "code" in error ? String(error.code || "") : "";

    if (errorCode === "EAUTH") {
      throw new Error("SMTP_AUTH_FAILED");
    }

    throw error;
  }

  return { id: response.messageId };
}

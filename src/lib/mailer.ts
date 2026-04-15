import nodemailer from "nodemailer";

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

  const transporter = nodemailer.createTransport({
    host: getRequired("SMTP_HOST"),
    port: Number(getRequired("SMTP_PORT")),
    secure: getRequired("SMTP_SECURE").toLowerCase() === "true",
    auth: {
      user: getRequired("SMTP_USER"),
      pass: getRequired("SMTP_PASS"),
    },
    tls: {
      rejectUnauthorized:
        (process.env.SMTP_ALLOW_SELF_SIGNED || "").toLowerCase() === "true" ? false : true,
    },
  });

  await transporter.sendMail({
    from: getRequired("EMAIL_FROM"),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

function getRequired(name: string) {
  return process.env[name]?.trim() || "";
}

export function hasMailerConfig() {
  return Boolean(getRequired("RESEND_API_KEY") && getRequired("EMAIL_FROM"));
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
  if (!hasMailerConfig()) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

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

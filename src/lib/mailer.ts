function getRequired(name: string) {
  return process.env[name]?.trim() || "";
}

export function hasMailerConfig() {
  return Boolean(getRequired("RESEND_API_KEY") && getRequired("EMAIL_FROM"));
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

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getRequired("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getRequired("EMAIL_FROM"),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RESEND_SEND_FAILED: ${response.status} ${errorText}`);
  }
}

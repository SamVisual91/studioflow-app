export type PaymentOption = {
  id: string;
  label: string;
  description: string;
  href?: string;
  detail?: string;
};

function getEnv(name: string) {
  return process.env[name]?.trim() || "";
}

export function getPaymentOptions(): PaymentOption[] {
  const options: PaymentOption[] = [];

  const venmoHandle = getEnv("PAYMENT_VENMO_HANDLE");
  if (venmoHandle) {
    options.push({
      id: "venmo",
      label: "Venmo",
      description: "Pay with Venmo using the handle below.",
      href: `https://account.venmo.com/u/${venmoHandle.replace(/^@/, "")}`,
      detail: `@${venmoHandle.replace(/^@/, "")}`,
    });
  }

  const bankName = getEnv("PAYMENT_BANK_NAME");
  const accountLast4 = getEnv("PAYMENT_BANK_ACCOUNT_LAST4");
  const routingLast4 = getEnv("PAYMENT_BANK_ROUTING_LAST4");
  if (bankName || accountLast4 || routingLast4) {
    options.push({
      id: "bank",
      label: "Bank transfer",
      description: "Send a direct bank transfer using these details.",
      detail: [bankName, accountLast4 ? `Acct •••• ${accountLast4}` : "", routingLast4 ? `Routing •••• ${routingLast4}` : ""]
        .filter(Boolean)
        .join(" | "),
    });
  }

  return options;
}

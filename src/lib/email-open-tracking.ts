function getAppOrigin() {
  const configuredOrigin = String(process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");

  if (!configuredOrigin) {
    return "";
  }

  try {
    return new URL(configuredOrigin).origin;
  } catch {
    return "";
  }
}

export function getEmailOpenTrackingPixel(input: { messageId: string; token: string }) {
  const origin = getAppOrigin();

  if (!origin || !input.messageId || !input.token) {
    return "";
  }

  const trackingUrl = new URL("/api/email-open", origin);
  trackingUrl.searchParams.set("message", input.messageId);
  trackingUrl.searchParams.set("token", input.token);

  return `<img src="${trackingUrl.toString()}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;opacity:0;" />`;
}

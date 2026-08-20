export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export const shortDateWithYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const dateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function parseStoredDate(value: string) {
  if (!value) {
    return null;
  }

  const normalizedValue = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)
    ? new Date(`${normalizedValue}T00:00:00`)
    : new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatStoredShortDate(value: string) {
  const date = parseStoredDate(value);
  return date ? shortDate.format(date) : value;
}

export function formatStoredShortDateWithYear(value: string) {
  const date = parseStoredDate(value);
  return date ? shortDateWithYear.format(date) : value;
}

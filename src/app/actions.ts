"use server";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canCreateProjects,
  clearUserSession,
  createUserSession,
  normalizeUserRole,
  requireSuperAdmin,
  requireUser,
  type UserRole,
  validateUserCredentials,
} from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { ensureDefaultPackagePresets, getDb } from "@/lib/db";
import { ensureProjectDeliverablesTable } from "@/lib/deliverables";
import { currencyFormatter } from "@/lib/formatters";
import {
  createLedgerTransaction,
  ledgerCategories,
  recordInvoicePaymentToLedger,
  suggestLedgerImportMatch,
} from "@/lib/ledger";
import { sendProposalEmail } from "@/lib/mailer";
import { getProjectFileTemplate } from "@/lib/project-files";
import { getStripe } from "@/lib/stripe";
import { ensureDocumentTemplatesTable } from "@/lib/templates";
import {
  getUploadPublicPath,
  getUploadStorageDir,
  resolveUploadStoragePath,
} from "@/lib/storage";
import { createVideoPaywallToken, ensureVideoPaywallsTable } from "@/lib/video-paywalls";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getUserRole(formData: FormData, key = "role"): UserRole | null {
  const rawRole = getString(formData, key);

  if (!rawRole || !["SUPER_ADMIN", "ADMIN", "USER"].includes(rawRole)) {
    return null;
  }

  return normalizeUserRole(rawRole);
}

function parseInvoiceLineItems(input: string) {
  try {
    const parsed = JSON.parse(input) as Array<Record<string, unknown>>;
    return parsed
      .map((item) => ({
        title: String(item.title || "").trim(),
        description: String(item.description || "").trim(),
        image: String(item.image || "").trim(),
        amount: Number(item.amount || 0),
      }))
      .filter((item) => item.title && !Number.isNaN(item.amount));
  } catch {
    return [];
  }
}

function parsePaymentSchedule(input: string) {
  try {
    const parsed = JSON.parse(input) as Array<Record<string, unknown>>;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return parsed
      .map((item, index) => {
        const dueDate = String(item.dueDate || "").trim();
        const rawStatus = String(item.status || "").trim().toUpperCase();
        const due = dueDate ? new Date(`${dueDate}T00:00:00`) : null;
        const status =
          rawStatus === "PAID"
            ? "PAID"
            : due && !Number.isNaN(due.getTime()) && due.getTime() < today.getTime()
              ? "OVERDUE"
              : "UPCOMING";

        return {
          id: String(item.id || randomUUID()),
          amount: Number(item.amount || 0),
          dueDate,
          status,
          invoiceNumber:
            String(item.invoiceNumber || "").trim() ||
            `#${String(item.id || "draft").slice(0, 6).toUpperCase()}-${String(index + 1).padStart(2, "0")}`,
        };
      })
      .filter((item) => item.dueDate && !Number.isNaN(item.amount));
  } catch {
    return [];
  }
}

function parseLineItems(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, description, amount] = line.split("|").map((part) => part.trim());
      return {
        title: title || "Line item",
        description: description || "",
        amount: Number(amount || 0),
      };
    })
    .filter((item) => item.title && !Number.isNaN(item.amount));
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

async function parseBankStatementCsv(file: File) {
  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});

    const rawAmount = Number(
      String(row.amount ?? row.total ?? row.value ?? "0")
        .replaceAll("$", "")
        .replaceAll(",", "")
    );
    const normalizedDate =
      row.date ||
      row.transaction_date ||
      row.posted_date ||
      row.posted ||
      "";

    return {
      transactionDate: normalizedDate,
      description: row.description || row.memo || row.details || "Bank import",
      amount: rawAmount,
      counterparty: row.counterparty || row.vendor || row.payee || "",
      paymentMethod: row.account || row.method || "Bank statement",
    };
  });
}

function parseSelectedProjectIds(formData: FormData) {
  return formData
    .getAll("projectIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function deleteProjectRecords(
  db: ReturnType<typeof getDb>,
  project: { id: string; name: string; client: string; public_portal_token?: string | null }
) {
  db.prepare("DELETE FROM project_contacts WHERE project_id = ?").run(project.id);
  db.prepare("DELETE FROM client_uploads WHERE project_id = ?").run(project.id);
  db.prepare("DELETE FROM video_paywalls WHERE project_id = ?").run(project.id);
  db.prepare("DELETE FROM package_brochures WHERE project_id = ?").run(project.id);
  db.prepare("DELETE FROM package_brochure_responses WHERE project_id = ?").run(project.id);
  db.prepare("DELETE FROM project_files WHERE project_id = ?").run(project.id);
  db.prepare("DELETE FROM messages WHERE project_id = ? OR client_name = ?").run(project.id, project.client);
  db.prepare("DELETE FROM schedule_items WHERE client = ?").run(project.client);
  db.prepare("DELETE FROM proposals WHERE client = ?").run(project.client);
  db.prepare("DELETE FROM invoices WHERE client = ?").run(project.client);
  db.prepare("DELETE FROM clients WHERE name = ? OR project = ?").run(project.client, project.name);
  db.prepare("DELETE FROM projects WHERE id = ?").run(project.id);
}

function getUploadFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function getUploadFiles(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is File => value instanceof File && value.size > 0);
}

function getSelectedValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function parsePackageOverridesInput(input: string) {
  if (!input) {
    return {};
  }

  try {
    const parsed = JSON.parse(input) as Record<
      string,
      {
        name?: string;
        description?: string;
        amount?: number | string;
      }
    >;

    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [
        key,
        {
          name: String(value?.name || "").trim(),
          description: String(value?.description || "").trim(),
          amount: Number(value?.amount || 0),
        },
      ])
    );
  } catch {
    return {};
  }
}

async function savePackageCover(file: File) {
  const safeBaseName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "package-cover";
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${safeBaseName}-${randomUUID()}.${extension}`;
  const publicDir = getUploadStorageDir("package-covers");
  const filePath = join(publicDir, fileName);

  await mkdir(publicDir, { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return getUploadPublicPath("package-covers", fileName);
}

async function saveClientUploadImage(file: File) {
  const safeBaseName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "client-upload";
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${safeBaseName}-${randomUUID()}.${extension}`;
  const publicDir = getUploadStorageDir("client-uploads");
  const filePath = join(publicDir, fileName);

  await mkdir(publicDir, { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return getUploadPublicPath("client-uploads", fileName);
}

async function saveLedgerReceipt(file: File) {
  const safeBaseName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "ledger-receipt";
  const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const fileName = `${safeBaseName}-${randomUUID()}.${extension}`;
  const publicDir = getUploadStorageDir("ledger-receipts");
  const filePath = join(publicDir, fileName);

  await mkdir(publicDir, { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return getUploadPublicPath("ledger-receipts", fileName);
}

async function saveProjectDeliverableFile(file: File, mediaType: "VIDEO" | "PHOTO") {
  const safeBaseName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "deliverable";
  const extension = file.name.split(".").pop()?.toLowerCase() || (mediaType === "VIDEO" ? "mp4" : "jpg");
  const fileName = `${safeBaseName}-${randomUUID()}.${extension}`;
  const publicDir = getUploadStorageDir("project-deliverables", mediaType.toLowerCase());
  const filePath = join(publicDir, fileName);

  await mkdir(publicDir, { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return getUploadPublicPath("project-deliverables", mediaType.toLowerCase(), fileName);
}

async function saveProjectDeliverableThumbnail(file: File) {
  const safeBaseName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "deliverable-thumbnail";
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${safeBaseName}-${randomUUID()}.${extension}`;
  const publicDir = getUploadStorageDir("project-deliverables", "thumbnails");
  const filePath = join(publicDir, fileName);

  await mkdir(publicDir, { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return getUploadPublicPath("project-deliverables", "thumbnails", fileName);
}

async function saveProjectDeliverableBanner(file: File) {
  const safeBaseName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "deliverable-banner";
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${safeBaseName}-${randomUUID()}.${extension}`;
  const publicDir = getUploadStorageDir("project-deliverables", "banners");
  const filePath = join(publicDir, fileName);

  await mkdir(publicDir, { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return getUploadPublicPath("project-deliverables", "banners", fileName);
}

async function saveProjectHeroBanner(file: File) {
  const safeBaseName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "project-banner";
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${safeBaseName}-${randomUUID()}.${extension}`;
  const publicDir = getUploadStorageDir("project-banners");
  const filePath = join(publicDir, fileName);

  await mkdir(publicDir, { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return getUploadPublicPath("project-banners", fileName);
}

async function saveUserAvatar(file: File) {
  const safeBaseName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "user-avatar";
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${safeBaseName}-${randomUUID()}.${extension}`;
  const publicDir = getUploadStorageDir("user-avatars");
  const filePath = join(publicDir, fileName);

  await mkdir(publicDir, { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return getUploadPublicPath("user-avatars", fileName);
}

async function deleteProjectHeroBannerIfLocal(path: string) {
  if (!path || !path.startsWith("/uploads/project-banners/")) {
    return;
  }

  const filePath = resolveUploadStoragePath(path);

  try {
    await unlink(filePath);
  } catch {
    // Ignore missing files to keep banner updates resilient.
  }
}

async function deleteUserAvatarIfLocal(path: string) {
  if (!path || !path.startsWith("/uploads/user-avatars/")) {
    return;
  }

  const filePath = resolveUploadStoragePath(path);

  try {
    await unlink(filePath);
  } catch {
    // Ignore missing files so avatar updates remain resilient.
  }
}

async function deletePackageCoverIfLocal(coverImage: string) {
  if (!coverImage || !coverImage.startsWith("/uploads/package-covers/")) {
    return;
  }

  const filePath = resolveUploadStoragePath(coverImage);

  try {
    await unlink(filePath);
  } catch {
    // Ignore missing files so package cleanup remains resilient.
  }
}

function createRecentActivity(label: string, timestamp: string) {
  return `${label} on ${new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function logProjectMessage(db: ReturnType<typeof getDb>, input: {
  sender: string;
  clientName: string;
  projectId: string;
  direction: "INBOUND" | "OUTBOUND";
  channel: string;
  time: string;
  subject: string;
  preview: string;
  unread: number;
}) {
  db.prepare(
    "INSERT INTO messages (id, sender, client_name, project_id, direction, channel, time, subject, preview, unread, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    input.sender,
    input.clientName,
    input.projectId,
    input.direction,
    input.channel,
    input.time,
    input.subject,
    input.preview,
    input.unread,
    input.time,
    input.time
  );
}

function updateProjectRecentActivity(
  db: ReturnType<typeof getDb>,
  projectId: string,
  recentActivity: string,
  timestamp: string
) {
  db.prepare("UPDATE projects SET recent_activity = ?, updated_at = ? WHERE id = ?").run(
    recentActivity,
    timestamp,
    projectId
  );
}

function normalizePackageBrochureCoverImage(input: string) {
  const value = input.trim();

  if (!value) {
    return "";
  }

  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) ? value : "";
  } catch {
    return "";
  }
}

function normalizePackageCategoryValue(input: string) {
  const value = input.trim().toLowerCase();

  if (value === "wedding" || value === "weddings") {
    return "Wedding";
  }

  if (value === "business" || value === "businesses" || value === "brand" || value === "commercial") {
    return "Business";
  }

  return "Others";
}

function getPackageCategoryAliases(category: string) {
  const normalized = normalizePackageCategoryValue(category);

  if (normalized === "Wedding") {
    return ["Wedding", "Weddings"];
  }

  if (normalized === "Business") {
    return ["Business", "Businesses"];
  }

  return ["Others", "Other"];
}

function upsertPackageBrochureSettings(
  db: ReturnType<typeof getDb>,
  input: {
    projectId: string;
    category: string;
    selectedPackageIds: string[];
    packageOverrides: Record<string, { name: string; description: string; amount: number }>;
    title: string;
    intro: string;
    closingNote: string;
    coverImage: string;
  }
) {
  const timestamp = new Date().toISOString();
  const existing = db
    .prepare(
      "SELECT id, public_token FROM package_brochures WHERE project_id = ? AND category = ? LIMIT 1"
    )
    .get(input.projectId, input.category) as { id?: string; public_token?: string } | undefined;

  const publicToken = existing?.public_token ? String(existing.public_token) : randomUUID();

  if (existing?.id) {
    db.prepare(
      "UPDATE package_brochures SET selected_package_ids = ?, package_overrides = ?, title = ?, intro = ?, closing_note = ?, cover_image = ?, updated_at = ? WHERE id = ?"
    ).run(
      JSON.stringify(input.selectedPackageIds),
      JSON.stringify(input.packageOverrides),
      input.title,
      input.intro,
      input.closingNote,
      input.coverImage,
      timestamp,
      existing.id
    );
  } else {
    db.prepare(
      "INSERT INTO package_brochures (id, project_id, category, public_token, selected_package_ids, package_overrides, title, intro, closing_note, cover_image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      randomUUID(),
      input.projectId,
      input.category,
      publicToken,
      JSON.stringify(input.selectedPackageIds),
      JSON.stringify(input.packageOverrides),
      input.title,
      input.intro,
      input.closingNote,
      input.coverImage,
      timestamp,
      timestamp
    );
  }

  return publicToken;
}

export async function loginAction(formData: FormData) {
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const user = await validateUserCredentials(email, password);

  if (!user) {
    redirect("/login?error=invalid");
  }

  await createUserSession(user.id);
  redirect("/overview");
}

export async function logoutAction() {
  await clearUserSession();
  redirect("/login");
}

export async function createPublicInquiryAction(formData: FormData) {
  const name = getString(formData, "name");
  const email = getString(formData, "email").toLowerCase();
  const service = getString(formData, "service") || "Wedding";
  const eventDate = getString(formData, "eventDate");
  const source = getString(formData, "source") || "Website";
  const notes = getString(formData, "notes");
  const budgetInput = getString(formData, "budget");
  const venueLocation = getString(formData, "venueLocation");
  const companyName = getString(formData, "companyName");
  const projectGoal = getString(formData, "projectGoal");
  const businessLink = getString(formData, "businessLink");
  const projectType = getString(formData, "projectType");
  const projectName = getString(formData, "projectName");
  const budgetValue = budgetInput ? Number(budgetInput.replace(/[^0-9.-]/g, "")) : 0;
  const inquiryRecipient = "contactme@samthao.com";
  const backupInquiryRecipient = process.env.INQUIRY_BACKUP_EMAIL?.trim().toLowerCase() || "";
  const inquiryRecipients = [inquiryRecipient, backupInquiryRecipient]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);

  if (!name || !email || !service || !notes) {
    redirect("/contact?error=missing");
  }

  if (!email.includes("@")) {
    redirect("/contact?error=email");
  }

  const extraDetails = [
    venueLocation ? `Venue location: ${venueLocation}` : "",
    companyName ? `Company / brand name: ${companyName}` : "",
    projectGoal ? `Business need: ${projectGoal}` : "",
    businessLink ? `Website / social link: ${businessLink}` : "",
    projectType ? `Project type: ${projectType}` : "",
    projectName ? `Project / artist / brand: ${projectName}` : "",
  ].filter(Boolean);

  const combinedNotes = extraDetails.length ? `${notes}\n\n${extraDetails.join("\n")}` : notes;
  const eventDateLine = eventDate ? `Project date: ${eventDate}` : "";
  const budgetLine = budgetInput ? `Budget: ${budgetInput}` : "";
  const detailsBlock = [eventDateLine, budgetLine, `Source: ${source}`, ...extraDetails].filter(Boolean);
  const subject = `[Website Inquiry] ${service} inquiry from ${name}`;
  const plainText = [
    "New website inquiry received.",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Service: ${service}`,
    ...detailsBlock,
    "",
    "Project details:",
    combinedNotes,
    "",
    "Reply directly to this email to respond to the inquiry sender.",
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #1f1b18;">
      <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #8f6b39;">Website inquiry notification</p>
      <h2 style="margin-bottom: 14px;">${subject}</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Service:</strong> ${service}</p>
      ${eventDateLine ? `<p><strong>Project date:</strong> ${eventDate}</p>` : ""}
      ${budgetLine ? `<p><strong>Budget:</strong> ${budgetInput}</p>` : ""}
      <p><strong>Source:</strong> ${source}</p>
      ${
        extraDetails.length
          ? `<div style="margin-top: 12px;">${extraDetails
              .map((detail) => `<p style="margin: 0 0 8px;"><strong>${detail.split(":")[0]}:</strong> ${detail.split(":").slice(1).join(":").trim()}</p>`)
              .join("")}</div>`
          : ""
      }
      <div style="margin-top: 18px;">
        <p><strong>Project details:</strong></p>
        <p>${combinedNotes.replace(/\n/g, "<br />")}</p>
      </div>
      <p style="margin-top: 20px; font-size: 13px; color: #5c554e;">
        Reply directly to this email to respond to ${name}.
      </p>
    </div>
  `;

  const db = getDb();
  const timestamp = new Date().toISOString();
  db.prepare(
    "INSERT INTO leads (id, name, service, stage, value, event_date, source, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    name,
    service,
    "INQUIRY",
    Number.isNaN(budgetValue) ? 0 : budgetValue,
    eventDate || timestamp.slice(0, 10),
    source,
    `${combinedNotes}\n\nEmail: ${email}\nSent to: ${inquiryRecipient}`,
    timestamp,
    timestamp
  );

  revalidatePath("/overview");
  revalidatePath("/projects");
  revalidatePath("/crm");

  try {
    await sendProposalEmail({
      to: inquiryRecipients,
      replyTo: email,
      subject,
      text: plainText,
      html,
    });
  } catch (error) {
    console.error("Public inquiry email failed", error);
    const reason =
      error instanceof Error && error.message === "SMTP_NOT_CONFIGURED"
        ? "smtp-missing"
        : "send-failed";
    redirect(`/contact?sent=1&error=${reason}`);
  }

  redirect("/contact?sent=1");
}

export async function deleteLeadAction(formData: FormData) {
  await requireUser();

  const leadId = getString(formData, "leadId");

  if (!leadId) {
    redirect("/leads?error=lead-delete-invalid");
  }

  const db = getDb();
  const existingLead = db.prepare("SELECT id FROM leads WHERE id = ? LIMIT 1").get(leadId) as
    | { id: string }
    | undefined;

  if (!existingLead) {
    redirect("/leads?error=lead-delete-missing");
  }

  db.prepare("DELETE FROM leads WHERE id = ?").run(leadId);

  revalidatePath("/overview");
  revalidatePath("/leads");
  redirect("/leads?leadDeleted=1");
}

export async function createUserAccountAction(formData: FormData) {
  await requireSuperAdmin();

  const name = getString(formData, "name");
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");
  const role = getUserRole(formData);

  if (!name || !email || !password || !confirmPassword || !role) {
    redirect("/users?error=user-missing");
  }

  if (!email.includes("@")) {
    redirect("/users?error=user-email-invalid");
  }

  if (password.length < 8) {
    redirect("/users?error=user-password-weak");
  }

  if (password !== confirmPassword) {
    redirect("/users?error=user-password-mismatch");
  }

  const db = getDb();
  const existingUser = db
    .prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1")
    .get(email) as { id: string } | undefined;

  if (existingUser) {
    redirect("/users?error=user-email-taken");
  }

  const timestamp = new Date().toISOString();
  db.prepare(
    "INSERT INTO users (id, email, name, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(randomUUID(), email, name, role, hashPassword(password), timestamp, timestamp);

  revalidatePath("/users");
  redirect("/users?userCreated=1");
}

export async function updateUserProfileAction(formData: FormData) {
  const currentUser = await requireUser();

  const name = getString(formData, "name");
  const email = getString(formData, "email").toLowerCase();

  if (!name || !email) {
    redirect("/users?error=user-profile-missing");
  }

  if (!email.includes("@")) {
    redirect("/users?error=user-email-invalid");
  }

  const db = getDb();
  const conflictingUser = db
    .prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ? LIMIT 1")
    .get(email, currentUser.id) as { id: string } | undefined;

  if (conflictingUser) {
    redirect("/users?error=user-email-taken");
  }

  db.prepare("UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?").run(
    name,
    email,
    new Date().toISOString(),
    currentUser.id
  );

  revalidatePath("/users");
  redirect("/users?profileUpdated=1");
}

export async function updateUserPasswordAction(formData: FormData) {
  await requireSuperAdmin();

  const userId = getString(formData, "userId");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (!userId || !password || !confirmPassword) {
    redirect("/users?error=password-missing");
  }

  if (password.length < 8) {
    redirect("/users?error=user-password-weak");
  }

  if (password !== confirmPassword) {
    redirect("/users?error=user-password-mismatch");
  }

  const db = getDb();
  const existingUser = db.prepare("SELECT id FROM users WHERE id = ? LIMIT 1").get(userId) as
    | { id: string }
    | undefined;

  if (!existingUser) {
    redirect("/users?error=user-missing-record");
  }

  db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(
    hashPassword(password),
    new Date().toISOString(),
    userId
  );

  revalidatePath("/users");
  redirect("/users?passwordUpdated=1");
}

export async function updateUserRoleAction(formData: FormData) {
  await requireSuperAdmin();

  const userId = getString(formData, "userId");
  const role = getUserRole(formData);

  if (!userId || !role) {
    redirect("/users?error=user-role-invalid");
  }

  const db = getDb();
  const existingUser = db.prepare("SELECT id, role FROM users WHERE id = ? LIMIT 1").get(userId) as
    | { id: string; role?: string | null }
    | undefined;

  if (!existingUser) {
    redirect("/users?error=user-missing-record");
  }

  const currentRole = normalizeUserRole(existingUser.role);

  if (currentRole === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    const otherSuperAdminCount = db.prepare(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'SUPER_ADMIN' AND id != ?"
    ).get(userId) as { count?: number } | undefined;

    if (Number(otherSuperAdminCount?.count ?? 0) === 0) {
      redirect("/users?error=user-last-super-admin");
    }
  }

  db.prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?").run(
    role,
    new Date().toISOString(),
    userId
  );

  revalidatePath("/users");
  redirect("/users?roleUpdated=1");
}

export async function deleteUserAccountAction(formData: FormData) {
  const currentUser = await requireSuperAdmin();
  const userId = getString(formData, "userId");

  if (!userId) {
    redirect("/users?error=user-delete-invalid");
  }

  if (userId === currentUser.id) {
    redirect("/users?error=user-delete-self");
  }

  const db = getDb();
  const userCountRow = db.prepare("SELECT COUNT(*) AS count FROM users").get() as
    | { count: number }
    | undefined;
  const userCount = Number(userCountRow?.count ?? 0);

  if (userCount <= 1) {
    redirect("/users?error=user-delete-last");
  }

  const existingUser = db.prepare("SELECT id, role FROM users WHERE id = ? LIMIT 1").get(userId) as
    | { id: string; role?: string | null }
    | undefined;

  if (!existingUser) {
    redirect("/users?error=user-missing-record");
  }

  if (normalizeUserRole(existingUser.role) === "SUPER_ADMIN") {
    const otherSuperAdminCount = db.prepare(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'SUPER_ADMIN' AND id != ?"
    ).get(userId) as { count?: number } | undefined;

    if (Number(otherSuperAdminCount?.count ?? 0) === 0) {
      redirect("/users?error=user-last-super-admin");
    }
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(userId);

  revalidatePath("/users");
  redirect("/users?userDeleted=1");
}

export async function updateUserAvatarAction(formData: FormData) {
  const user = await requireUser();

  const avatarFile = getUploadFile(formData, "avatar");
  const returnPath = getString(formData, "returnPath") || "/overview";

  if (!avatarFile) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=avatar-missing`);
  }

  if (!avatarFile.type.startsWith("image/")) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=avatar-invalid`);
  }

  const db = getDb();
  const existingUser = db
    .prepare("SELECT avatar_image FROM users WHERE id = ? LIMIT 1")
    .get(user.id) as { avatar_image?: string | null } | undefined;
  const nextAvatarImage = await saveUserAvatar(avatarFile);
  await deleteUserAvatarIfLocal(String(existingUser?.avatar_image || ""));

  db.prepare("UPDATE users SET avatar_image = ?, updated_at = ? WHERE id = ?").run(
    nextAvatarImage,
    new Date().toISOString(),
    user.id
  );

  revalidatePath(returnPath.split("?")[0]);
  revalidatePath("/projects");
  redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}avatarUpdated=1`);
}

export async function createLeadAction(formData: FormData) {
  await requireUser();

  const name = getString(formData, "name");
  const service = getString(formData, "service");
  const source = getString(formData, "source");
  const notes = getString(formData, "notes");
  const eventDate = getString(formData, "eventDate");
  const value = Number(getString(formData, "value"));

  if (!name || !service || !source || !notes || !eventDate || Number.isNaN(value)) {
    redirect("/crm?error=lead-invalid");
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  db.prepare(
    "INSERT INTO leads (id, name, service, stage, value, event_date, source, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    name,
    service,
    "INQUIRY",
    value,
    eventDate,
    source,
    notes,
    timestamp,
    timestamp
  );

  revalidatePath("/crm");
  revalidatePath("/overview");
  redirect("/crm");
}

export async function createGearItemAction(formData: FormData) {
  await requireUser();

  const name = getString(formData, "name");
  const category = getString(formData, "category");
  const barcode = getString(formData, "barcode");
  const serialNumber = getString(formData, "serialNumber");
  const condition = getString(formData, "condition") || "Ready";
  const notes = getString(formData, "notes");
  const dailyRate = Number(getString(formData, "dailyRate") || "0");
  const replacementValue = Number(getString(formData, "replacementValue") || "0");

  if (!name || !category || Number.isNaN(dailyRate) || Number.isNaN(replacementValue)) {
    redirect("/crm?error=gear-invalid");
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  const normalizedBarcode = barcode || `SFG-${randomUUID().slice(0, 8).toUpperCase()}`;
  db.prepare(
    `INSERT INTO gear_inventory (
      id, name, category, barcode, serial_number, status, condition, daily_rate, replacement_value,
      current_holder, checked_out_at, due_back_at, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    name,
    category,
    normalizedBarcode,
    serialNumber,
    "AVAILABLE",
    condition,
    dailyRate,
    replacementValue,
    "",
    "",
    "",
    notes,
    timestamp,
    timestamp
  );

  revalidatePath("/crm");
  redirect("/crm?gearCreated=1");
}

export async function checkoutGearAction(formData: FormData) {
  await requireUser();

  const gearId = getString(formData, "gearId");
  const checkoutType = getString(formData, "checkoutType").toUpperCase();
  const projectId = getString(formData, "projectId");
  const renterName = getString(formData, "renterName");
  const renterEmail = getString(formData, "renterEmail");
  const startsAt = getString(formData, "startsAt");
  const dueAt = getString(formData, "dueAt");
  const notes = getString(formData, "notes");

  if (!gearId || !startsAt || !dueAt || !["PROJECT", "RENTAL"].includes(checkoutType)) {
    redirect("/crm?error=gear-checkout-invalid");
  }

  if (checkoutType === "PROJECT" && !projectId) {
    redirect("/crm?error=gear-checkout-invalid");
  }

  if (checkoutType === "RENTAL" && !renterName) {
    redirect("/crm?error=gear-checkout-invalid");
  }

  const db = getDb();
  const gear = db
    .prepare("SELECT id, name, status FROM gear_inventory WHERE id = ? LIMIT 1")
    .get(gearId) as { id: string; name: string; status: string } | undefined;

  if (!gear || gear.status !== "AVAILABLE") {
    redirect("/crm?error=gear-unavailable");
  }

  const timestamp = new Date().toISOString();
  const project =
    checkoutType === "PROJECT"
      ? (db.prepare("SELECT id, client, name FROM projects WHERE id = ? LIMIT 1").get(projectId) as
          | { id: string; client: string; name: string }
          | undefined)
      : undefined;
  const holder =
    checkoutType === "PROJECT"
      ? `${project?.client || "Project use"}${project?.name ? ` • ${project.name}` : ""}`
      : renterName;

  db.prepare(
    `INSERT INTO gear_checkouts (
      id, gear_id, checkout_type, project_id, renter_name, renter_email, starts_at, due_at,
      returned_at, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    gearId,
    checkoutType,
    projectId || "",
    checkoutType === "PROJECT" ? project?.client || "" : renterName,
    renterEmail,
    startsAt,
    dueAt,
    "",
    "ACTIVE",
    notes,
    timestamp,
    timestamp
  );

  db.prepare(
    "UPDATE gear_inventory SET status = ?, current_holder = ?, checked_out_at = ?, due_back_at = ?, updated_at = ? WHERE id = ?"
  ).run(checkoutType === "PROJECT" ? "ON_PROJECT" : "OUT_ON_RENTAL", holder, startsAt, dueAt, timestamp, gearId);

  if (project?.id) {
    updateProjectRecentActivity(
      db,
      project.id,
      createRecentActivity(`${gear.name} checked out`, timestamp),
      timestamp
    );
    revalidatePath(`/projects/${project.id}`);
  }

  revalidatePath("/crm");
  redirect("/crm?gearCheckedOut=1");
}

export async function checkInGearAction(formData: FormData) {
  await requireUser();

  const gearId = getString(formData, "gearId");
  const checkoutId = getString(formData, "checkoutId");
  const condition = getString(formData, "condition") || "Ready";

  if (!gearId || !checkoutId) {
    redirect("/crm?error=gear-checkin-invalid");
  }

  const db = getDb();
  const checkout = db
    .prepare("SELECT project_id FROM gear_checkouts WHERE id = ? AND gear_id = ? LIMIT 1")
    .get(checkoutId, gearId) as { project_id?: string } | undefined;
  const gear = db
    .prepare("SELECT name FROM gear_inventory WHERE id = ? LIMIT 1")
    .get(gearId) as { name?: string } | undefined;

  if (!checkout || !gear) {
    redirect("/crm?error=gear-checkin-invalid");
  }

  const timestamp = new Date().toISOString();
  db.prepare("UPDATE gear_checkouts SET returned_at = ?, status = ?, updated_at = ? WHERE id = ?").run(
    timestamp,
    "RETURNED",
    timestamp,
    checkoutId
  );
  db.prepare(
    "UPDATE gear_inventory SET status = ?, condition = ?, current_holder = ?, checked_out_at = ?, due_back_at = ?, updated_at = ? WHERE id = ?"
  ).run("AVAILABLE", condition, "", "", "", timestamp, gearId);

  if (checkout.project_id) {
    updateProjectRecentActivity(
      db,
      checkout.project_id,
      createRecentActivity(`${gear.name || "Gear"} checked in`, timestamp),
      timestamp
    );
    revalidatePath(`/projects/${checkout.project_id}`);
  }

  revalidatePath("/crm");
  redirect("/crm?gearCheckedIn=1");
}

export async function deleteGearItemAction(formData: FormData) {
  await requireUser();

  const gearId = getString(formData, "gearId");

  if (!gearId) {
    redirect("/crm?error=gear-delete-invalid");
  }

  const db = getDb();
  const activeCheckout = db
    .prepare("SELECT id FROM gear_checkouts WHERE gear_id = ? AND status = 'ACTIVE' LIMIT 1")
    .get(gearId) as { id?: string } | undefined;

  if (activeCheckout?.id) {
    redirect("/crm?error=gear-delete-active");
  }

  db.prepare("DELETE FROM gear_checkouts WHERE gear_id = ?").run(gearId);
  db.prepare("DELETE FROM gear_inventory WHERE id = ?").run(gearId);

  revalidatePath("/crm");
  redirect("/crm?gearDeleted=1");
}

export async function createLedgerTransactionAction(formData: FormData) {
  await requireUser();

  const transactionDate = getString(formData, "transactionDate");
  const direction = getString(formData, "direction").toUpperCase();
  const selectedCategory = getString(formData, "category").toUpperCase();
  const customCategory = getString(formData, "customCategory");
  const category = customCategory || selectedCategory;
  const amount = Number(getString(formData, "amount"));
  const description = getString(formData, "description");
  const paymentMethod = getString(formData, "paymentMethod");
  const counterparty = getString(formData, "counterparty");
  const projectId = getString(formData, "projectId");
  const reconciliationNote = getString(formData, "reconciliationNote");
  const receiptFile = getUploadFile(formData, "receipt");

  const categoryMeta = ledgerCategories.find((item) => item.value === selectedCategory);

  if (
    !transactionDate ||
    (direction !== "INCOME" && direction !== "EXPENSE") ||
    !category ||
    (!customCategory && !categoryMeta) ||
    Number.isNaN(amount) ||
    amount <= 0 ||
    !description
  ) {
    redirect("/ledger/transactions?error=transaction-invalid");
  }

  createLedgerTransaction({
    transactionDate: `${transactionDate}T12:00:00.000Z`,
    direction: direction as "INCOME" | "EXPENSE",
    category,
    amount,
    description,
    paymentMethod,
    counterparty,
    projectId,
    sourceType: "MANUAL_LEDGER",
    sourceId: randomUUID(),
    taxCategory: categoryMeta?.taxCategory || (direction === "INCOME" ? "Gross receipts" : "Other expenses"),
    receiptPath: receiptFile ? await saveLedgerReceipt(receiptFile) : "",
    reconciliationNote,
  });

  revalidatePath("/ledger");
  revalidatePath("/ledger/transactions");
  revalidatePath("/ledger/reports");
  redirect("/ledger/transactions?saved=1");
}

export async function reconcileLedgerTransactionAction(formData: FormData) {
  await requireUser();

  const transactionId = getString(formData, "transactionId");
  const reconciliationNote = getString(formData, "reconciliationNote");

  if (!transactionId) {
    redirect("/ledger?error=transaction-invalid");
  }

  const db = getDb();
  db.prepare(
    "UPDATE ledger_transactions SET reconciled_at = ?, reconciliation_note = ?, updated_at = ? WHERE id = ?"
  ).run(new Date().toISOString(), reconciliationNote, new Date().toISOString(), transactionId);

  revalidatePath("/ledger");
  redirect("/ledger?reconciled=1");
}

export async function deleteLedgerTransactionsAction(formData: FormData) {
  await requireUser();

  const transactionIds = formData
    .getAll("transactionIds")
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (transactionIds.length === 0) {
    redirect("/ledger/transactions?error=transaction-invalid");
  }

  const db = getDb();
  const deleteTransaction = db.prepare("DELETE FROM ledger_transactions WHERE id = ?");

  for (const transactionId of transactionIds) {
    deleteTransaction.run(transactionId);
  }

  revalidatePath("/ledger");
  revalidatePath("/ledger/transactions");
  revalidatePath("/ledger/reports");
  revalidatePath("/ledger/reconciliation");
  redirect("/ledger/transactions?deleted=1");
}

export async function updateLedgerTransactionAction(formData: FormData) {
  await requireUser();

  const transactionId = getString(formData, "transactionId");
  const transactionDate = getString(formData, "transactionDate");
  const direction = getString(formData, "direction").toUpperCase();
  const category = getString(formData, "category").toUpperCase();
  const amount = Number(getString(formData, "amount"));
  const description = getString(formData, "description");
  const paymentMethod = getString(formData, "paymentMethod");
  const projectId = getString(formData, "projectId");
  const receiptFile = getUploadFile(formData, "receipt");
  const categoryMeta = ledgerCategories.find((item) => item.value === category);

  if (
    !transactionId ||
    !transactionDate ||
    (direction !== "INCOME" && direction !== "EXPENSE") ||
    !categoryMeta ||
    Number.isNaN(amount) ||
    amount <= 0 ||
    !description
  ) {
    redirect("/ledger/transactions?error=transaction-invalid");
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT receipt_path FROM ledger_transactions WHERE id = ? LIMIT 1")
    .get(transactionId) as { receipt_path?: string | null } | undefined;

  if (!existing) {
    redirect("/ledger/transactions?error=transaction-invalid");
  }

  const receiptPath = receiptFile ? await saveLedgerReceipt(receiptFile) : existing.receipt_path || "";
  const timestamp = new Date().toISOString();
  db.prepare(
    `UPDATE ledger_transactions
     SET transaction_date = ?, direction = ?, category = ?, amount = ?, description = ?,
         payment_method = ?, project_id = ?, tax_category = ?, receipt_path = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    `${transactionDate}T12:00:00.000Z`,
    direction,
    category,
    amount,
    description,
    paymentMethod,
    projectId,
    categoryMeta.taxCategory,
    receiptPath,
    timestamp,
    transactionId
  );

  revalidatePath("/ledger");
  revalidatePath("/ledger/transactions");
  revalidatePath("/ledger/reports");
  revalidatePath("/ledger/reconciliation");
  redirect("/ledger/transactions?updated=1");
}

export async function createRecurringLedgerRuleAction(formData: FormData) {
  await requireUser();

  const name = getString(formData, "name");
  const direction = getString(formData, "direction").toUpperCase();
  const category = getString(formData, "category").toUpperCase();
  const amount = Number(getString(formData, "amount"));
  const paymentMethod = getString(formData, "paymentMethod");
  const counterparty = getString(formData, "counterparty");
  const description = getString(formData, "description");
  const dayOfMonth = Number(getString(formData, "dayOfMonth"));
  const projectId = getString(formData, "projectId");

  const categoryMeta = ledgerCategories.find((item) => item.value === category);

  if (
    !name ||
    (direction !== "INCOME" && direction !== "EXPENSE") ||
    !categoryMeta ||
    Number.isNaN(amount) ||
    amount <= 0 ||
    !description ||
    Number.isNaN(dayOfMonth) ||
    dayOfMonth < 1 ||
    dayOfMonth > 31
  ) {
    redirect("/ledger?error=transaction-invalid");
  }

  const now = new Date();
  const currentMonthRun = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), Math.min(dayOfMonth, 28), 12));
  const nextRunDate =
    currentMonthRun.getTime() > now.getTime()
      ? currentMonthRun.toISOString()
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, Math.min(dayOfMonth, 28), 12)).toISOString();
  const timestamp = new Date().toISOString();
  const db = getDb();

  db.prepare(
    `INSERT INTO recurring_ledger_rules (
      id, name, direction, category, amount, payment_method, counterparty, description, day_of_month,
      project_id, tax_category, active, next_run_date, last_run_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    name,
    direction,
    category,
    amount,
    paymentMethod,
    counterparty,
    description,
    dayOfMonth,
    projectId,
    categoryMeta.taxCategory,
    1,
    nextRunDate,
    null,
    timestamp,
    timestamp
  );

  revalidatePath("/ledger");
  redirect("/ledger?recurring=1");
}

export async function updateRecurringLedgerRuleAction(formData: FormData) {
  await requireUser();

  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const direction = getString(formData, "direction").toUpperCase();
  const category = getString(formData, "category").toUpperCase();
  const amount = Number(getString(formData, "amount"));
  const paymentMethod = getString(formData, "paymentMethod");
  const counterparty = getString(formData, "counterparty");
  const description = getString(formData, "description");
  const dayOfMonth = Number(getString(formData, "dayOfMonth"));
  const projectId = getString(formData, "projectId");

  const categoryMeta = ledgerCategories.find((item) => item.value === category);

  if (
    !id ||
    !name ||
    (direction !== "INCOME" && direction !== "EXPENSE") ||
    !categoryMeta ||
    Number.isNaN(amount) ||
    amount <= 0 ||
    !description ||
    Number.isNaN(dayOfMonth) ||
    dayOfMonth < 1 ||
    dayOfMonth > 31
  ) {
    redirect("/ledger?error=transaction-invalid");
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT active, last_run_date FROM recurring_ledger_rules WHERE id = ? LIMIT 1")
    .get(id) as { active?: number; last_run_date?: string | null } | undefined;

  if (!existing) {
    redirect("/ledger?error=transaction-invalid");
  }

  const baseDate = existing.last_run_date ? new Date(existing.last_run_date) : new Date();
  const nextRunDate = new Date(
    Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + 1, Math.min(dayOfMonth, 28), 12)
  ).toISOString();

  db.prepare(
    `UPDATE recurring_ledger_rules
     SET name = ?, direction = ?, category = ?, amount = ?, payment_method = ?, counterparty = ?,
         description = ?, day_of_month = ?, project_id = ?, tax_category = ?, next_run_date = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    name,
    direction,
    category,
    amount,
    paymentMethod,
    counterparty,
    description,
    dayOfMonth,
    projectId,
    categoryMeta.taxCategory,
    nextRunDate,
    new Date().toISOString(),
    id
  );

  revalidatePath("/ledger");
  redirect("/ledger?recurring=1");
}

export async function toggleRecurringLedgerRuleAction(formData: FormData) {
  await requireUser();

  const id = getString(formData, "id");
  const nextActive = getString(formData, "nextActive") === "1" ? 1 : 0;

  if (!id) {
    redirect("/ledger?error=transaction-invalid");
  }

  const db = getDb();
  db.prepare("UPDATE recurring_ledger_rules SET active = ?, updated_at = ? WHERE id = ?").run(
    nextActive,
    new Date().toISOString(),
    id
  );

  revalidatePath("/ledger");
  redirect("/ledger?recurring=1");
}

export async function deleteRecurringLedgerRuleAction(formData: FormData) {
  await requireUser();

  const id = getString(formData, "id");

  if (!id) {
    redirect("/ledger?error=transaction-invalid");
  }

  const db = getDb();
  db.prepare("DELETE FROM recurring_ledger_rules WHERE id = ?").run(id);

  revalidatePath("/ledger");
  redirect("/ledger?recurring=1");
}

export async function importBankStatementAction(formData: FormData) {
  await requireUser();

  const statementFile = getUploadFile(formData, "statement");
  const defaultCategory = getString(formData, "defaultCategory").toUpperCase() || "OTHER_EXPENSE";
  const paymentMethod = getString(formData, "paymentMethod") || "Bank statement";
  const projectId = getString(formData, "projectId");
  const categoryMeta = ledgerCategories.find((item) => item.value === defaultCategory);

  if (!statementFile || !categoryMeta) {
    redirect("/ledger?error=transaction-invalid");
  }

  const db = getDb();
  const existingImportHash = db.prepare(
    "SELECT id FROM ledger_transactions WHERE import_hash = ? LIMIT 1"
  );
  const importedRows = await parseBankStatementCsv(statementFile);

  if (importedRows.length === 0) {
    redirect("/ledger?error=transaction-invalid");
  }

  for (const [index, row] of importedRows.entries()) {
    const parsedAmount = Number(row.amount || 0);
    if (Number.isNaN(parsedAmount) || !row.transactionDate) {
      continue;
    }

    const direction = parsedAmount >= 0 ? "INCOME" : "EXPENSE";
    const amount = Math.abs(parsedAmount);
    const category =
      direction === "INCOME" ? "OTHER_INCOME" : defaultCategory;
    const matchingCategoryMeta = ledgerCategories.find((item) => item.value === category);
    const suggestion = suggestLedgerImportMatch({
      amount,
      description: row.description,
      counterparty: row.counterparty,
      paymentMethod,
      defaultCategory: category,
    });
    const finalCategory =
      direction === "INCOME" ? "OTHER_INCOME" : suggestion.category || category;
    const finalCategoryMeta = ledgerCategories.find((item) => item.value === finalCategory);

    const importHash = createHash("sha1")
      .update(
        [
          statementFile.name,
          row.transactionDate,
          row.description,
          row.counterparty,
          amount.toFixed(2),
        ].join("|")
      )
      .digest("hex");

    const existingDuplicate = existingImportHash.get(importHash) as { id?: string } | undefined;
    if (existingDuplicate?.id) {
      continue;
    }

    createLedgerTransaction({
      transactionDate: row.transactionDate.includes("T") ? row.transactionDate : `${row.transactionDate}T12:00:00.000Z`,
      direction,
      category: finalCategory,
      amount,
      description: row.description || `Imported bank row ${index + 1}`,
      paymentMethod: suggestion.paymentMethod || paymentMethod,
      counterparty: row.counterparty,
      projectId: suggestion.projectId || projectId,
      sourceType: "BANK_IMPORT",
      sourceId: `${statementFile.name}:${index}:${row.transactionDate}:${amount}`,
      taxCategory: finalCategoryMeta?.taxCategory || matchingCategoryMeta?.taxCategory,
      receiptPath: suggestion.receiptPath,
      matchReference: suggestion.matchReference,
      matchConfidence: suggestion.matchConfidence,
      reconciliationNote: suggestion.matchReference ? `Suggested match: ${suggestion.matchReference}` : "",
      importHash,
    });
  }

  revalidatePath("/ledger");
  redirect("/ledger?saved=1");
}

export async function createProjectClientAction(formData: FormData) {
  const user = await requireUser();

  if (!canCreateProjects(user.role)) {
    redirect("/projects?error=project-create-forbidden");
  }

  const clientName = getString(formData, "clientName");
  const projectName = getString(formData, "projectName");
  const contactEmail = getString(formData, "contactEmail").toLowerCase();
  const category = getString(formData, "category");
  const packageName = getString(formData, "packageName");
  const projectDate = getString(formData, "projectDate");
  const location = getString(formData, "location");
  const leadSource = getString(formData, "leadSource");
  const description = getString(formData, "description");
  const totalValueInput = getString(formData, "totalValue");
  const totalValue = totalValueInput ? Number(totalValueInput) : 0;
  const resolvedClientName = clientName || projectName;
  const resolvedPackageName = packageName || "Custom project";
  const resolvedLocation = location || "TBD";
  const resolvedLeadSource = leadSource || "Direct";
  const resolvedDescription = description || "Project created from the Projects page.";

  if (
    !projectName ||
    !contactEmail ||
    !category ||
    !projectDate ||
    Number.isNaN(totalValue)
  ) {
    redirect("/projects?error=project-invalid");
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  const publicPortalToken = randomUUID();
  const nextTouchpoint = projectDate;
  const firstTask = `Prepare kickoff for ${projectName}`;
  const firstMilestone = `Confirm details for ${projectDate}`;

  db.prepare(
    "INSERT INTO clients (id, name, category, project, package_name, contact_email, total_value, balance, next_touchpoint, health, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    resolvedClientName,
    category,
    projectName,
    resolvedPackageName,
    contactEmail,
    totalValue,
    totalValue,
    nextTouchpoint,
    "ON_TRACK",
    timestamp,
    timestamp
  );

  db.prepare(
    "INSERT INTO projects (id, name, client, progress, phase, public_portal_token, project_type, project_date, location, description, file_notes, lead_source, stage_moved_at, recent_activity, next_milestone, tasks, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    projectName,
    resolvedClientName,
    0,
    "Inquiry",
    publicPortalToken,
    category,
    projectDate,
    resolvedLocation,
    resolvedDescription,
    "Client portal created and kickoff files are ready to organize.",
    resolvedLeadSource,
    timestamp,
    "New client added from Projects.",
    firstMilestone,
    JSON.stringify([firstTask]),
    timestamp,
    timestamp
  );

  revalidatePath("/projects");
  revalidatePath("/crm");
  revalidatePath("/overview");
  redirect("/projects?created=1");
}

export async function updateProjectClientAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const clientName = getString(formData, "clientName");
  const projectName = getString(formData, "projectName");
  const contactEmail = getString(formData, "contactEmail").toLowerCase();
  const category = getString(formData, "category");
  const projectDate = getString(formData, "projectDate");
  const location = getString(formData, "location");
  const leadSource = getString(formData, "leadSource");
  const description = getString(formData, "description");

  if (!projectId || !projectName || !contactEmail || !category || !projectDate) {
    redirect("/projects?error=project-invalid");
  }

  const db = getDb();
  const existingProject = db
    .prepare("SELECT id, name, client FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as { id?: string; name?: string; client?: string } | undefined;

  if (!existingProject?.id) {
    redirect("/projects?error=project-invalid");
  }

  const resolvedClientName = clientName || existingProject.client || projectName;
  const resolvedLocation = location || "TBD";
  const resolvedLeadSource = leadSource || "Direct";
  const resolvedDescription = description || "Project updated from the Projects page.";
  const timestamp = new Date().toISOString();

  db.prepare(
    "UPDATE projects SET name = ?, client = ?, project_type = ?, project_date = ?, location = ?, description = ?, lead_source = ?, updated_at = ? WHERE id = ?"
  ).run(
    projectName,
    resolvedClientName,
    category,
    projectDate,
    resolvedLocation,
    resolvedDescription,
    resolvedLeadSource,
    timestamp,
    projectId
  );

  db.prepare(
    "UPDATE clients SET name = ?, category = ?, project = ?, contact_email = ?, updated_at = ? WHERE project = ? OR name = ?"
  ).run(
    resolvedClientName,
    category,
    projectName,
    contactEmail,
    timestamp,
    existingProject.name || "",
    existingProject.client || ""
  );

  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity("Project details updated", timestamp),
    timestamp
  );

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/overview");
  redirect("/projects?created=1");
}

export async function sendProjectMessageAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const clientName = getString(formData, "clientName");
  const recipientEmail = getString(formData, "recipientEmail").toLowerCase();
  const subject = getString(formData, "subject");
  const body = getString(formData, "body");

  if (!projectId || !clientName || !recipientEmail || !subject || !body) {
    redirect(`/projects/${projectId || ""}?tab=activity&error=message-invalid`);
  }

  try {
    await sendProposalEmail({
      to: recipientEmail,
      subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1b18;">${body.replace(/\n/g, "<br />")}</div>`,
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "SMTP_NOT_CONFIGURED"
        ? "smtp-missing"
        : "message-send-failed";
    redirect(`/projects/${projectId}?tab=activity&error=${reason}`);
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  logProjectMessage(db, {
    sender: "Sam Visual",
    clientName,
    projectId,
    direction: "OUTBOUND",
    channel: "Email",
    time: timestamp,
    subject,
    preview: body,
    unread: 0,
  });
  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity("You emailed the client", timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/messages");
  redirect(`/projects/${projectId}?tab=activity&email=1`);
}

export async function scheduleZoomMeetingAction(formData: FormData) {
  await requireUser();

  const contactKey = getString(formData, "contactKey");
  const title = getString(formData, "title");
  const startsAt = getString(formData, "startsAt");
  const zoomUrl = getString(formData, "zoomUrl");
  const notes = getString(formData, "notes");
  const [projectId, clientName, recipientEmail] = contactKey.split("|").map((value) => value.trim());

  if (
    !projectId ||
    !clientName ||
    !recipientEmail ||
    !title ||
    !startsAt ||
    !zoomUrl ||
    !zoomUrl.startsWith("http")
  ) {
    redirect("/schedule?error=zoom-invalid");
  }

  const meetingDate = new Date(startsAt);
  const readableDate = Number.isNaN(meetingDate.getTime())
    ? startsAt
    : meetingDate.toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
  const subject = `${title} Zoom call`;
  const body = [
    `Hi ${clientName},`,
    "",
    `I scheduled our Zoom call for ${readableDate}.`,
    "",
    `Join Zoom: ${zoomUrl}`,
    notes ? "" : null,
    notes || null,
    "",
    "If you need to adjust the time, just reply to this email and I can update it.",
    "",
    "Thanks,",
    "Sam Visual",
  ]
    .filter((line) => line !== null)
    .join("\n");

  try {
    await sendProposalEmail({
      to: recipientEmail,
      subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1b18;">${body.replace(/\n/g, "<br />")}</div>`,
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "SMTP_NOT_CONFIGURED"
        ? "smtp-missing"
        : "zoom-send-failed";
    redirect(`/schedule?error=${reason}`);
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  db.prepare(
    "INSERT INTO schedule_items (id, title, client, starts_at, type, sync, recipient_email, meeting_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    title,
    clientName,
    startsAt,
    "Zoom Call",
    `Zoom link sent to ${recipientEmail}`,
    recipientEmail,
    zoomUrl,
    timestamp,
    timestamp
  );
  logProjectMessage(db, {
    sender: "Sam Visual",
    clientName,
    projectId,
    direction: "OUTBOUND",
    channel: "Email",
    time: timestamp,
    subject,
    preview: body,
    unread: 0,
  });
  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity("Zoom meeting scheduled", timestamp),
    timestamp
  );

  revalidatePath("/schedule");
  revalidatePath(`/projects/${projectId}`);
  redirect("/schedule?zoom=1");
}

export async function sendFollowUpMessageAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const projectName = getString(formData, "projectName");
  const clientName = getString(formData, "clientName");
  const recipientEmail = getString(formData, "recipientEmail").toLowerCase();
  const subject = getString(formData, "subject");
  const body = getString(formData, "body");

  if (!projectId || !projectName || !clientName || !recipientEmail || !subject || !body) {
    redirect("/follow-ups?error=follow-up-invalid");
  }

  const db = getDb();
  const project = db
    .prepare("SELECT id FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as { id: string } | undefined;

  if (!project) {
    redirect("/follow-ups?error=follow-up-invalid");
  }

  try {
    await sendProposalEmail({
      to: recipientEmail,
      subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1b18;">${body.replace(/\n/g, "<br />")}</div>`,
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "SMTP_NOT_CONFIGURED"
        ? "smtp-missing"
        : "follow-up-send-failed";
    redirect(`/follow-ups?error=${reason}`);
  }

  const timestamp = new Date().toISOString();
  logProjectMessage(db, {
    sender: "Sam Visual",
    clientName,
    projectId,
    direction: "OUTBOUND",
    channel: "Email",
    time: timestamp,
    subject,
    preview: body,
    unread: 0,
  });
  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity("Follow-up email sent", timestamp),
    timestamp
  );

  revalidatePath("/follow-ups");
  revalidatePath("/overview");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/messages");
  redirect("/follow-ups?sent=1");
}

export async function sendProjectPortalLinkAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const projectName = getString(formData, "projectName");
  const clientName = getString(formData, "clientName");
  const recipientEmail = getString(formData, "recipientEmail").toLowerCase();
  const portalUrl = getString(formData, "portalUrl");

  if (!projectId || !projectName || !clientName || !recipientEmail || !portalUrl) {
    redirect(`/projects/${projectId || ""}?tab=activity&error=portal-invalid`);
  }

  const subject = `${projectName} client portal access`;
  const body = [
    `Hi ${clientName},`,
    "",
    `Here is your private client portal for ${projectName}. Inside the portal you can review your project details, proposals, contract, invoices, schedule, and message history in one place.`,
    "",
    `Open your portal: ${portalUrl}`,
    "",
    "If you have any questions, just reply to this email and I will update everything from my side.",
    "",
    "Thanks,",
    "Sam Visual",
  ].join("\n");

  try {
    await sendProposalEmail({
      to: recipientEmail,
      subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1b18;">${body.replace(/\n/g, "<br />")}</div>`,
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "SMTP_NOT_CONFIGURED"
        ? "smtp-missing"
        : "portal-send-failed";
    redirect(`/projects/${projectId}?tab=activity&error=${reason}`);
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  logProjectMessage(db, {
    sender: "Sam Visual",
    clientName,
    projectId,
    direction: "OUTBOUND",
    channel: "Email",
    time: timestamp,
    subject,
    preview: `Shared private client portal: ${portalUrl}`,
    unread: 0,
  });
  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity("Client portal emailed", timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/client-portal/${portalUrl.split("/").pop()}`);
  revalidatePath("/messages");
  redirect(`/projects/${projectId}?tab=activity&portal=1`);
}

export async function sendProjectMediaGalleryAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const returnPath = getString(formData, "returnPath");
  const safeReturnPath =
    projectId && returnPath.startsWith(`/projects/${projectId}/deliverables`)
      ? returnPath
      : projectId
        ? `/projects/${projectId}/deliverables`
        : "/projects";
  const redirectWithStatus = (key: string, value: string): never => {
    redirect(`${safeReturnPath}${safeReturnPath.includes("?") ? "&" : "?"}${key}=${value}`);
  };

  if (!projectId) {
    redirectWithStatus("error", "gallery-send-invalid");
  }

  const db = getDb();
  const project = db
    .prepare("SELECT id, name, client, public_portal_token FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as
    | {
        id: string;
        name: string;
        client: string;
        public_portal_token: string | null;
      }
    | undefined;

  if (!project || !project.public_portal_token) {
    return redirectWithStatus("error", "gallery-send-invalid");
  }

  const projectName = project.name;
  const clientName = project.client;
  const portalToken = project.public_portal_token;

  const client = db
    .prepare("SELECT contact_email FROM clients WHERE name = ? LIMIT 1")
    .get(clientName) as { contact_email?: string | null } | undefined;
  const projectContact = db
    .prepare("SELECT email FROM project_contacts WHERE project_id = ? ORDER BY created_at ASC LIMIT 1")
    .get(projectId) as { email?: string | null } | undefined;
  const recipientEmail = String(client?.contact_email || projectContact?.email || "").trim().toLowerCase();

  if (!recipientEmail) {
    redirectWithStatus("error", "gallery-email-missing");
  }

  const galleryUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/client-portal/${portalToken}?tab=buy-videos`;
  const subject = `${projectName} media gallery is ready`;
  const body = [
    `Hi ${clientName},`,
    "",
    `Your private media gallery for ${projectName} is ready to view.`,
    "",
    "Inside the gallery you can view your delivered photos and videos, download what you need, and unlock any paid add-on videos if they are available.",
    "",
    `Open your media gallery: ${galleryUrl}`,
    "",
    "Thanks,",
    "Sam Visual",
  ].join("\n");

  try {
    await sendProposalEmail({
      to: recipientEmail,
      subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1b18;">${body.replace(/\n/g, "<br />")}</div>`,
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "SMTP_NOT_CONFIGURED"
        ? "smtp-missing"
        : "gallery-send-failed";
    redirectWithStatus("error", reason);
  }

  const timestamp = new Date().toISOString();
  logProjectMessage(db, {
    sender: "Sam Visual",
    clientName,
    projectId,
    direction: "OUTBOUND",
    channel: "Email",
    time: timestamp,
    subject,
    preview: `Shared media gallery: ${galleryUrl}`,
    unread: 0,
  });
  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity("Media gallery emailed", timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/deliverables`);
  revalidatePath(`/client-portal/${portalToken}`);
  revalidatePath("/messages");
  redirectWithStatus("gallerySent", "1");
}

export async function sendVideoPaywallToClientAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const paywallId = getString(formData, "paywallId");
  const returnPath = getString(formData, "returnPath");
  const safeReturnPath =
    projectId && returnPath.startsWith(`/projects/${projectId}/deliverables`)
      ? returnPath
      : projectId
        ? `/projects/${projectId}/deliverables`
        : "/projects";
  const redirectWithStatus = (key: string, value: string): never => {
    redirect(`${safeReturnPath}${safeReturnPath.includes("?") ? "&" : "?"}${key}=${value}`);
  };

  if (!projectId || !paywallId) {
    redirectWithStatus("error", "paywall-send-invalid");
  }

  const db = getDb();
  const project = db
    .prepare("SELECT id, name, client FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as { id: string; name: string; client: string } | undefined;
  const paywall = db
    .prepare("SELECT id, title, public_token, price FROM video_paywalls WHERE id = ? AND project_id = ? LIMIT 1")
    .get(paywallId, projectId) as
    | { id: string; title: string; public_token: string | null; price: number | null }
    | undefined;

  if (!project || !paywall?.public_token) {
    redirectWithStatus("error", "paywall-send-invalid");
  }

  const resolvedProject = project!;
  const resolvedPaywall = paywall!;

  const client = db
    .prepare("SELECT contact_email FROM clients WHERE name = ? LIMIT 1")
    .get(resolvedProject.client) as { contact_email?: string | null } | undefined;
  const projectContact = db
    .prepare("SELECT email FROM project_contacts WHERE project_id = ? ORDER BY created_at ASC LIMIT 1")
    .get(projectId) as { email?: string | null } | undefined;
  const recipientEmail = String(client?.contact_email || projectContact?.email || "").trim().toLowerCase();

  if (!recipientEmail) {
    redirectWithStatus("error", "paywall-email-missing");
  }

  const paywallUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/video-paywall/${resolvedPaywall.public_token}`;
  const subject = `${resolvedProject.name} add-on video is ready to purchase`;
  const priceText = currencyFormatter.format(Number(resolvedPaywall.price || 0));
  const body = [
    `Hi ${resolvedProject.client},`,
    "",
    `Your add-on video "${resolvedPaywall.title}" is ready to view and purchase.`,
    "",
    `Price: ${priceText}`,
    "",
    `Open the purchase page: ${paywallUrl}`,
    "",
    "Thanks,",
    "Sam Visual",
  ].join("\n");

  try {
    await sendProposalEmail({
      to: recipientEmail,
      subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1b18;">${body.replace(/\n/g, "<br />")}</div>`,
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "SMTP_NOT_CONFIGURED"
        ? "smtp-missing"
        : "paywall-send-failed";
    redirectWithStatus("error", reason);
  }

  const timestamp = new Date().toISOString();
  logProjectMessage(db, {
    sender: "Sam Visual",
    clientName: resolvedProject.client,
    projectId,
    direction: "OUTBOUND",
    channel: "Email",
    time: timestamp,
    subject,
    preview: `Shared add-on video purchase page: ${paywallUrl}`,
    unread: 0,
  });
  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity(`${resolvedPaywall.title} purchase page emailed`, timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/deliverables`);
  revalidatePath(`/video-paywall/${resolvedPaywall.public_token}`);
  revalidatePath("/messages");
  redirectWithStatus("paywallSent", "1");
}

export async function sendPackageBrochureAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const category = normalizePackageCategoryValue(getString(formData, "category"));
  const returnPath = getString(formData, "returnPath");
  const title = getString(formData, "title");
  const intro = getString(formData, "intro");
  const closingNote = getString(formData, "closingNote");
  const requestedRecipientEmail = getString(formData, "recipientEmail").toLowerCase();
  const selectedPackageIds = getSelectedValues(formData, "selectedPackageIds");
  const selectionIntent = getString(formData, "selectionIntent");
  const packageOverrides = parsePackageOverridesInput(getString(formData, "packageOverrides"));
  const coverImage = normalizePackageBrochureCoverImage(getString(formData, "coverImage"));
  const safeReturnPath =
    projectId && returnPath.startsWith(`/projects/${projectId}`)
      ? returnPath
      : projectId
        ? `/projects/${projectId}`
        : "/projects";
  const redirectWithStatus = (key: string, value: string): never => {
    redirect(`${safeReturnPath}${safeReturnPath.includes("?") ? "&" : "?"}${key}=${value}`);
  };

  if (!projectId || !["Wedding", "Business", "Others"].includes(category)) {
    redirectWithStatus("error", "package-brochure-invalid");
  }

  const db = getDb();
  const project = db
    .prepare("SELECT id, name, client FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as { id: string; name: string; client: string } | undefined;

  if (!project) {
    redirectWithStatus("error", "package-brochure-invalid");
  }

  const projectRecord = project as { id: string; name: string; client: string };
  const projectName = projectRecord.name;
  const clientName = projectRecord.client;

  const packageCategoryAliases = getPackageCategoryAliases(category);
  const packagePresets = db
    .prepare(
      "SELECT id, name, description, amount, sections, line_items FROM package_presets WHERE category IN (?, ?) ORDER BY amount ASC, created_at ASC"
    )
    .all(packageCategoryAliases[0], packageCategoryAliases[1]) as Array<{
      id: string;
      name: string;
      description: string;
      amount: number;
      sections: string;
      line_items: string;
    }>;

  if (packagePresets.length === 0) {
    redirectWithStatus("error", "package-brochure-empty");
  }

  if (selectionIntent === "custom" && selectedPackageIds.length === 0) {
    redirectWithStatus("error", "package-brochure-selection-missing");
  }

  const chosenPackageIds = selectedPackageIds.length > 0 ? new Set(selectedPackageIds) : null;
  const filteredPackagePresets = chosenPackageIds
    ? packagePresets.filter((preset) => chosenPackageIds.has(preset.id))
    : packagePresets;

  if (filteredPackagePresets.length === 0) {
    redirectWithStatus("error", "package-brochure-empty");
  }

  const client = db
    .prepare("SELECT contact_email FROM clients WHERE name = ? LIMIT 1")
    .get(clientName) as { contact_email?: string | null } | undefined;
  const projectContact = db
    .prepare("SELECT email FROM project_contacts WHERE project_id = ? ORDER BY created_at ASC LIMIT 1")
    .get(projectId) as { email?: string | null } | undefined;
  const recipientEmail = String(
    requestedRecipientEmail || client?.contact_email || projectContact?.email || ""
  )
    .trim()
    .toLowerCase();

  if (!recipientEmail) {
    redirectWithStatus("error", "package-brochure-email-missing");
  }

  const fallbackIntro = `${clientName}, here is the current ${category.toLowerCase()} package brochure. Everything on this page stays synced with the latest package templates, so you are always seeing the current lineup.`;
  const fallbackClosingNote =
    "Reply directly to your email thread when you are ready, and I can tailor the right collection around your priorities, timeline, or coverage needs.";
  const brochureTitleText = title || projectName;
  const brochureIntroText = intro || fallbackIntro;
  const brochureClosingNote = closingNote || fallbackClosingNote;
  const token = upsertPackageBrochureSettings(db, {
    projectId,
    category,
    selectedPackageIds: filteredPackagePresets.map((preset) => preset.id),
    packageOverrides,
    title: brochureTitleText,
    intro: brochureIntroText,
    closingNote: brochureClosingNote,
    coverImage,
  });

  if (requestedRecipientEmail) {
    db.prepare("UPDATE clients SET contact_email = ?, updated_at = ? WHERE name = ?").run(
      recipientEmail,
      new Date().toISOString(),
      clientName
    );
  }

  const brochureUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/package-brochure/${token}`;
  const brochureTitle = `${category} packages brochure`;
  const subject = `${projectName} ${category.toLowerCase()} packages`;
  const plainText = [
    `Hi ${clientName},`,
    "",
    `I put together your ${category.toLowerCase()} packages brochure for ${projectName}.`,
    "",
    "Inside you'll see the full package lineup, what's included in each collection, and the current pricing.",
    "",
    ...filteredPackagePresets.map((preset) => `- ${preset.name}: ${currencyFormatter.format(Number(preset.amount || 0))}`),
    "",
    `Open your brochure: ${brochureUrl}`,
    "",
    "If you'd like, just reply and I can tailor one of these packages for you.",
    "",
    "Thanks,",
    "Sam Visual",
  ].join("\n");
  const html = `
    <div style="background:#f6f0e8; padding:40px 16px; font-family:Arial, sans-serif; color:#1f1b18;">
      <div style="max-width:720px; margin:0 auto; background:#fffdf9; border:1px solid rgba(31,27,24,0.08); padding:40px 36px;">
        <p style="margin:0; font-size:11px; letter-spacing:0.28em; text-transform:uppercase; color:#9a8f86;">Package brochure</p>
        <h1 style="margin:18px 0 12px; font-size:34px; line-height:1.08;">${projectName}</h1>
        <p style="margin:0 0 24px; font-size:17px; line-height:1.8; color:#5f5248;">
          Your ${category.toLowerCase()} package brochure is ready. I included the full collection lineup so you can review every option in one place.
        </p>

        <div style="display:grid; gap:12px; margin:0 0 28px;">
          ${filteredPackagePresets
            .map(
              (preset) => `
                <div style="border:1px solid rgba(31,27,24,0.08); background:#ffffff; padding:16px 18px;">
                  <div style="display:flex; justify-content:space-between; gap:16px; align-items:flex-start;">
                    <div>
                      <p style="margin:0; font-size:18px; font-weight:700;">${preset.name}</p>
                      <p style="margin:8px 0 0; font-size:14px; line-height:1.7; color:#6f655d;">${
                        preset.description || "Review the full brochure for package details."
                      }</p>
                    </div>
                    <p style="margin:0; font-size:15px; font-weight:700; color:#cf724f;">${currencyFormatter.format(
                      Number(preset.amount || 0)
                    )}</p>
                  </div>
                </div>
              `
            )
            .join("")}
        </div>

        <a href="${brochureUrl}" style="display:inline-block; padding:14px 24px; background:#1f1b18; color:#ffffff; text-decoration:none; font-size:14px; font-weight:700;">
          Open package brochure
        </a>

        <p style="margin:24px 0 0; font-size:13px; line-height:1.8; color:#9a8f86;">
          If you'd like, just reply and I can adjust one of these collections to better fit your day.
        </p>
      </div>
    </div>
  `;

  try {
    await sendProposalEmail({
      to: recipientEmail,
      subject,
      text: plainText,
      html,
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "SMTP_NOT_CONFIGURED"
        ? "smtp-missing"
        : "package-brochure-send-failed";
    redirectWithStatus("error", reason);
  }

  const timestamp = new Date().toISOString();
  const brochurePath = `/package-brochure/${token}`;
  const summary = `Shared ${category.toLowerCase()} package brochure with ${filteredPackagePresets.length} package option${
    filteredPackagePresets.length === 1 ? "" : "s"
  }.`;
  const body = filteredPackagePresets
    .map((preset) => `${preset.name} - ${currencyFormatter.format(Number(preset.amount || 0))}`)
    .join("\n");
  const existingProjectFile = db
    .prepare("SELECT id FROM project_files WHERE project_id = ? AND type = 'PACKAGES' AND linked_path = ? LIMIT 1")
    .get(projectId, brochurePath) as { id?: string } | undefined;

  if (existingProjectFile?.id) {
    db.prepare(
      "UPDATE project_files SET title = ?, summary = ?, status = ?, visibility = ?, body = ?, updated_at = ? WHERE id = ?"
    ).run(brochureTitle, summary, "Shared", "Shared", body, timestamp, existingProjectFile.id);
  } else {
    db.prepare(
      "INSERT INTO project_files (id, project_id, type, title, summary, status, visibility, linked_path, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(randomUUID(), projectId, "PACKAGES", brochureTitle, summary, "Shared", "Shared", brochurePath, body, timestamp, timestamp);
  }

  logProjectMessage(db, {
    sender: "Sam Visual",
    clientName,
    projectId,
    direction: "OUTBOUND",
    channel: "Email",
    time: timestamp,
    subject,
    preview: `Shared package brochure: ${brochureUrl}`,
    unread: 0,
  });
  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity("Package brochure emailed", timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/packages");
  revalidatePath(`/package-brochure/${token}`);
  revalidatePath("/messages");
  redirectWithStatus("brochureSent", "1");
}

export async function savePackageBrochureAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const category = normalizePackageCategoryValue(getString(formData, "category"));
  const returnPath = getString(formData, "returnPath");
  const title = getString(formData, "title");
  const intro = getString(formData, "intro");
  const closingNote = getString(formData, "closingNote");
  const recipientEmail = getString(formData, "recipientEmail").toLowerCase();
  const selectedPackageIds = getSelectedValues(formData, "selectedPackageIds");
  const selectionIntent = getString(formData, "selectionIntent");
  const packageOverrides = parsePackageOverridesInput(getString(formData, "packageOverrides"));
  const coverImage = normalizePackageBrochureCoverImage(getString(formData, "coverImage"));

  if (!projectId || !["Wedding", "Business", "Others"].includes(category) || !returnPath) {
    redirect(`/projects/${projectId || ""}?error=package-brochure-invalid`);
  }

  const db = getDb();
  const project = db
    .prepare("SELECT name, client FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as { name?: string; client?: string } | undefined;

  if (!project?.name || !project.client) {
    redirect(`/projects/${projectId}?error=package-brochure-invalid`);
  }

  if (selectionIntent === "custom" && selectedPackageIds.length === 0) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=package-brochure-selection-missing`);
  }

  upsertPackageBrochureSettings(db, {
    projectId,
    category,
    selectedPackageIds,
    packageOverrides,
    title: title || project.name,
    intro:
      intro ||
      `${project.client}, here is the current ${category.toLowerCase()} package brochure. Everything on this page stays synced with the latest package templates, so you are always seeing the current lineup.`,
    closingNote:
      closingNote ||
      "Reply directly to your email thread when you are ready, and I can tailor the right collection around your priorities, timeline, or coverage needs.",
    coverImage,
  });

  if (recipientEmail) {
    db.prepare("UPDATE clients SET contact_email = ?, updated_at = ? WHERE name = ?").run(
      recipientEmail,
      new Date().toISOString(),
      project.client
    );
  }

  revalidatePath(returnPath.split("?")[0]);
  redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}saved=1`);
}

export async function submitPackageBrochureSelectionAction(formData: FormData) {
  const token = getString(formData, "token");
  const packageId = getString(formData, "packageId");
  const clientName = getString(formData, "clientName");
  const clientEmail = getString(formData, "clientEmail").toLowerCase();
  const clientNote = getString(formData, "clientNote");

  const redirectWithStatus = (key: string, value: string): never => {
    redirect(`/package-brochure/${token || ""}?${key}=${value}`);
  };

  if (!token || !packageId || !clientName || !clientEmail) {
    redirectWithStatus("error", "package-selection-invalid");
  }

  const db = getDb();
  const brochure = db
    .prepare(
      `SELECT
        package_brochures.*,
        projects.name AS project_name,
        projects.client AS project_client
      FROM package_brochures
      JOIN projects ON projects.id = package_brochures.project_id
      WHERE package_brochures.public_token = ?
      LIMIT 1`
    )
    .get(token) as
    | {
        id: string;
        project_id: string;
        category: string;
        selected_package_ids?: string | null;
        package_overrides?: string | null;
        project_name: string;
        project_client: string;
      }
    | undefined;

  if (!brochure) {
    redirectWithStatus("error", "package-selection-invalid");
  }

  const resolvedBrochure = brochure!;
  const packageCategoryAliases = getPackageCategoryAliases(resolvedBrochure.category);
  const packagePresets = db
    .prepare(
      "SELECT id, name, description, amount FROM package_presets WHERE category IN (?, ?) ORDER BY amount ASC, created_at ASC"
    )
    .all(packageCategoryAliases[0], packageCategoryAliases[1]) as Array<{
      id: string;
      name: string;
      description: string;
      amount: number;
    }>;

  const selectedPackageIds = (() => {
    try {
      const parsed = JSON.parse(String(resolvedBrochure.selected_package_ids || "[]")) as string[];
      return parsed.filter(Boolean);
    } catch {
      return [];
    }
  })();

  const packageOverrides = (() => {
    try {
      return JSON.parse(String(resolvedBrochure.package_overrides || "{}")) as Record<
        string,
        { name?: string; description?: string; amount?: number }
      >;
    } catch {
      return {};
    }
  })();

  const allowedPackages =
    selectedPackageIds.length > 0
      ? packagePresets.filter((preset) => selectedPackageIds.includes(preset.id))
      : packagePresets;
  const selectedPackage = allowedPackages.find((preset) => preset.id === packageId);

  if (!selectedPackage) {
    redirectWithStatus("error", "package-selection-invalid");
  }

  const resolvedSelectedPackage = selectedPackage!;
  const selectedPackageName = packageOverrides[resolvedSelectedPackage.id]?.name || resolvedSelectedPackage.name;
  const selectedPackageAmount =
    typeof packageOverrides[resolvedSelectedPackage.id]?.amount === "number"
      ? Number(packageOverrides[resolvedSelectedPackage.id]?.amount || 0)
      : Number(resolvedSelectedPackage.amount || 0);

  const owner = db
    .prepare("SELECT email, name FROM users ORDER BY created_at ASC LIMIT 1")
    .get() as { email?: string | null; name?: string | null } | undefined;
  const ownerEmail = String(owner?.email || process.env.EMAIL_FROM || process.env.SMTP_USER || "").trim();

  if (!ownerEmail) {
    redirectWithStatus("error", "package-selection-send-failed");
  }

  const brochureUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/package-brochure/${token}`;
  const subject = `${clientName} selected ${selectedPackageName}`;
  const plainText = [
    `Hi ${String(owner?.name || "there").trim() || "there"},`,
    "",
    `${clientName} selected a package from the brochure for ${resolvedBrochure.project_name}.`,
    "",
    `Selected package: ${selectedPackageName}`,
    `Amount: ${currencyFormatter.format(selectedPackageAmount)}`,
    `Client email: ${clientEmail}`,
    clientNote ? `Note: ${clientNote}` : "",
    "",
    `Open brochure: ${brochureUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await sendProposalEmail({
      to: ownerEmail,
      subject,
      text: plainText,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1b18;">${plainText.replace(/\n/g, "<br />")}</div>`,
    });
  } catch {
    redirectWithStatus("error", "package-selection-send-failed");
  }

  const timestamp = new Date().toISOString();
  db.prepare(
    "INSERT INTO package_brochure_responses (id, brochure_id, project_id, package_id, client_name, client_email, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    resolvedBrochure.id,
    resolvedBrochure.project_id,
    resolvedSelectedPackage.id,
    clientName,
    clientEmail,
    clientNote,
    timestamp,
    timestamp
  );

  logProjectMessage(db, {
    sender: clientName,
    clientName: resolvedBrochure.project_client,
    projectId: resolvedBrochure.project_id,
    direction: "INBOUND",
    channel: "Email",
    time: timestamp,
    subject: `Package selected: ${selectedPackageName}`,
    preview: clientNote || `${clientName} selected ${selectedPackageName}.`,
    unread: 1,
  });
  updateProjectRecentActivity(
    db,
    resolvedBrochure.project_id,
    createRecentActivity(`${selectedPackageName} selected`, timestamp),
    timestamp
  );

  revalidatePath(`/projects/${resolvedBrochure.project_id}`);
  revalidatePath("/projects");
  revalidatePath("/overview");
  revalidatePath("/messages");
  revalidatePath(`/package-brochure/${token}`);
  redirectWithStatus("selected", "1");
}

export async function sendProjectInvoiceEmailAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const invoiceId = getString(formData, "invoiceId");

  if (!projectId || !invoiceId) {
    redirect(`/projects/${projectId || ""}/invoices/${invoiceId || ""}?error=invoice-send-failed`);
  }

  const db = getDb();
  const invoice = db
    .prepare("SELECT * FROM invoices WHERE id = ? LIMIT 1")
    .get(invoiceId) as Record<string, unknown> | undefined;
  const project = db
    .prepare("SELECT * FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as Record<string, unknown> | undefined;

  if (!invoice || !project) {
    redirect(`/projects/${projectId}/invoices/${invoiceId}?error=invoice-send-failed`);
  }

  const clientName = String(project.client || invoice.client || "").trim();
  const client = db
    .prepare("SELECT * FROM clients WHERE name = ? LIMIT 1")
    .get(clientName) as Record<string, unknown> | undefined;
  const recipientEmail = String(client?.contact_email || "").trim().toLowerCase();

  if (!clientName || !recipientEmail) {
    redirect(`/projects/${projectId}/invoices/${invoiceId}?error=invoice-send-invalid`);
  }

  const label = String(invoice.label || "Invoice");
  const dueDate = String(invoice.due_date || "");
  const method = String(invoice.method || "");
  const taxRate = Number(invoice.tax_rate ?? 3);
  const lineItems = parseInvoiceLineItems(String(invoice.line_items ?? "[]"));
  const paymentSchedule = parsePaymentSchedule(String(invoice.payment_schedule ?? "[]"));
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const taxAmount = Math.round(subtotal * (Number.isNaN(taxRate) ? 0 : taxRate)) / 100;
  const grandTotal = subtotal + taxAmount;
  const publicToken = String(invoice.public_token || "").trim();
  const invoiceUrl = publicToken
    ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invoice/${publicToken}`
    : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/projects/${projectId}/invoices/${invoiceId}`;
  const subject = `${label} from StudioFlow`;
  const plainText = [
    `Hi ${clientName},`,
    "",
    `Your invoice "${label}" is ready.`,
    `Due date: ${dueDate}`,
    `Payment method: ${method}`,
    "",
    "Line items:",
    ...lineItems.map((item) => `- ${item.title}: ${item.description} ($${item.amount})`),
    "",
    `Subtotal: $${subtotal}`,
    `Tax (${taxRate}%): $${taxAmount}`,
    `Grand total: $${grandTotal}`,
      "",
      "Payment plan:",
      ...paymentSchedule.map(
        (item) => `- ${item.invoiceNumber}: ${item.dueDate} - $${item.amount} (${item.status})`
      ),
    "",
    `Review your invoice: ${invoiceUrl}`,
  ].join("\n");
  const html = `
    <div style="margin:0; padding:32px 0; background:#f6f1ea; font-family:Arial, sans-serif; color:#1f1b18;">
      <div style="max-width:760px; margin:0 auto; background:#ffffff; border:1px solid rgba(31,27,24,0.08); border-radius:28px; overflow:hidden; box-shadow:0 24px 60px rgba(58,34,17,0.10);">
        <div style="padding:18px 28px; background:#1f1b18; color:#f8f4ef;">
          <div style="font-size:11px; letter-spacing:0.28em; text-transform:uppercase; opacity:0.72;">StudioFlow invoice</div>
        </div>

        <div style="padding:36px 36px 28px; background:linear-gradient(135deg, rgba(31,27,24,0.92), rgba(67,49,37,0.72)); color:#ffffff;">
          <div style="font-size:13px; letter-spacing:0.22em; text-transform:uppercase; opacity:0.72;">For ${clientName}</div>
          <h1 style="margin:12px 0 10px; font-size:36px; line-height:1.08; font-weight:700;">${label}</h1>
          <p style="margin:0; max-width:520px; font-size:15px; line-height:1.7; color:rgba(255,255,255,0.82);">
            Your invoice is ready. Review the summary below and use the button to open the live invoice page anytime.
          </p>

          <div style="margin-top:26px; display:flex; flex-wrap:wrap; gap:12px;">
            <div style="min-width:160px; padding:14px 16px; border-radius:18px; background:rgba(255,255,255,0.10);">
              <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; opacity:0.68;">Due date</div>
              <div style="margin-top:8px; font-size:20px; font-weight:700;">${dueDate}</div>
            </div>
            <div style="min-width:160px; padding:14px 16px; border-radius:18px; background:rgba(255,255,255,0.10);">
              <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; opacity:0.68;">Grand total</div>
              <div style="margin-top:8px; font-size:20px; font-weight:700;">$${grandTotal}</div>
            </div>
            <div style="min-width:160px; padding:14px 16px; border-radius:18px; background:rgba(255,255,255,0.10);">
              <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; opacity:0.68;">Method</div>
              <div style="margin-top:8px; font-size:20px; font-weight:700;">${method}</div>
            </div>
          </div>
        </div>

        <div style="padding:32px 36px;">
          <p style="margin:0 0 18px; font-size:16px; line-height:1.7;">Hi ${clientName},</p>
          <p style="margin:0 0 28px; font-size:15px; line-height:1.8; color:#5e5248;">
            Here’s the current invoice breakdown and payment plan. If anything needs to be adjusted, just reply to this email and I can update it for you.
          </p>

          <div style="border:1px solid rgba(31,27,24,0.08); border-radius:22px; overflow:hidden;">
            <div style="padding:18px 22px; background:#fbf8f4; border-bottom:1px solid rgba(31,27,24,0.08); font-size:12px; letter-spacing:0.22em; text-transform:uppercase; color:#7b7067; font-weight:700;">
              Invoice items
            </div>
            <div style="padding:10px 22px 6px;">
              ${lineItems
                .map(
                  (item) => `
                    <div style="padding:16px 0; border-bottom:1px solid rgba(31,27,24,0.08);">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding:0; vertical-align:top;">
                            <div style="font-size:17px; font-weight:700; color:#1f1b18;">${item.title}</div>
                            <div style="margin-top:6px; font-size:14px; line-height:1.6; color:#7b7067;">${item.description || "No description"}</div>
                          </td>
                          <td style="padding:0; text-align:right; vertical-align:top; white-space:nowrap; font-size:18px; font-weight:700; color:#1f1b18;">
                            $${item.amount}
                          </td>
                        </tr>
                      </table>
                    </div>
                  `
                )
                .join("")}
            </div>
            <div style="padding:20px 22px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:6px 0; font-size:14px; color:#7b7067;">Subtotal</td>
                  <td style="padding:6px 0; text-align:right; font-size:14px; color:#1f1b18;">$${subtotal}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-size:14px; color:#7b7067;">Tax (${taxRate}%)</td>
                  <td style="padding:6px 0; text-align:right; font-size:14px; color:#1f1b18;">$${taxAmount}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:10px; border-top:2px solid #1f1b18;"></td>
                </tr>
                <tr>
                  <td style="padding-top:12px; font-size:24px; font-weight:700; color:#1f1b18;">Grand total</td>
                  <td style="padding-top:12px; text-align:right; font-size:24px; font-weight:700; color:#1f1b18;">$${grandTotal}</td>
                </tr>
              </table>
            </div>
          </div>

          <div style="margin-top:26px; border:1px solid rgba(31,27,24,0.08); border-radius:22px; overflow:hidden;">
            <div style="padding:18px 22px; background:#fbf8f4; border-bottom:1px solid rgba(31,27,24,0.08); font-size:12px; letter-spacing:0.22em; text-transform:uppercase; color:#7b7067; font-weight:700;">
              Payment plan
            </div>
            <div style="padding:12px 22px 8px;">
              ${paymentSchedule
                .map(
                  (item) => `
                    <div style="padding:14px 0; border-bottom:1px solid rgba(31,27,24,0.08);">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding:0; vertical-align:top;">
                            <div style="font-size:16px; font-weight:700; color:#1f1b18;">$${item.amount}</div>
                            <div style="margin-top:6px; font-size:14px; color:#7b7067;">${item.dueDate}</div>
                            <div style="margin-top:6px; font-size:13px; color:#9a8f86;">${item.invoiceNumber}</div>
                          </td>
                          <td style="padding:0; text-align:right; vertical-align:top;">
                            <span style="display:inline-block; padding:8px 12px; border-radius:999px; background:${
                              item.status === "PAID"
                                ? "rgba(47,125,92,0.12)"
                                : item.status === "OVERDUE"
                                  ? "rgba(122,27,27,0.12)"
                                  : "rgba(207,114,79,0.12)"
                            }; color:${
                              item.status === "PAID"
                                ? "#2f7d5c"
                                : item.status === "OVERDUE"
                                  ? "#7a1b1b"
                                  : "#cf724f"
                            }; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">
                              ${item.status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>

          <div style="margin-top:30px;">
            <a href="${invoiceUrl}" style="display:inline-block; padding:14px 24px; border-radius:999px; background:#1f1b18; color:#ffffff; text-decoration:none; font-size:14px; font-weight:700;">
              Open invoice
            </a>
          </div>

          <p style="margin:24px 0 0; font-size:13px; line-height:1.7; color:#9a8f86;">
            If you have any questions, just reply to this email and I can update the invoice for you.
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendProposalEmail({
      to: recipientEmail,
      subject,
      text: plainText,
      html,
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "SMTP_NOT_CONFIGURED"
        ? "smtp-missing"
        : "invoice-send-failed";
    redirect(`/projects/${projectId}/invoices/${invoiceId}?error=${reason}`);
  }

  const timestamp = new Date().toISOString();
  logProjectMessage(db, {
    sender: "Sam Visual",
    clientName,
    projectId,
    direction: "OUTBOUND",
    channel: "Email",
    time: timestamp,
    subject,
    preview: `Invoice emailed: ${label}`,
    unread: 0,
  });
  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity("Invoice emailed", timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/invoices/${invoiceId}`);
  if (publicToken) {
    revalidatePath(`/invoice/${publicToken}`);
  }
  revalidatePath("/messages");
  redirect(`/projects/${projectId}/invoices/${invoiceId}?emailed=1`);
}

export async function payClientInvoiceAction(formData: FormData) {
  const token = getString(formData, "token");
  const paymentId = getString(formData, "paymentId");

  if (!token || !paymentId) {
    redirect(`/invoice/${token || ""}?error=payment-invalid`);
  }

  const db = getDb();
  const invoice = db
    .prepare("SELECT * FROM invoices WHERE public_token = ? LIMIT 1")
    .get(token) as Record<string, unknown> | undefined;

  if (!invoice) {
    redirect(`/invoice/${token}?error=payment-invalid`);
  }

  const paymentSchedule = parsePaymentSchedule(String(invoice.payment_schedule ?? "[]"));
  const nextPaymentSchedule = paymentSchedule.map((item) =>
    item.id === paymentId
        ? {
            ...item,
            status: "PAID",
          }
      : item
  );

  if (!nextPaymentSchedule.some((item) => item.id === paymentId)) {
    redirect(`/invoice/${token}?error=payment-invalid`);
  }

  const nextStatus = nextPaymentSchedule.every((item) => item.status === "PAID") ? "PAID" : "DUE_SOON";
  const timestamp = new Date().toISOString();
  db.prepare(
    "UPDATE invoices SET status = ?, payment_schedule = ?, updated_at = ? WHERE id = ?"
  ).run(nextStatus, JSON.stringify(nextPaymentSchedule), timestamp, String(invoice.id));

  const project = db
    .prepare("SELECT id, client FROM projects WHERE client = ? ORDER BY updated_at DESC LIMIT 1")
    .get(String(invoice.client)) as { id: string; client: string } | undefined;

  if (project) {
    logProjectMessage(db, {
      sender: String(invoice.client),
      clientName: project.client,
      projectId: project.id,
      direction: "INBOUND",
      channel: "Portal payment",
      time: timestamp,
      subject: String(invoice.label),
      preview: "A payment was submitted from the client invoice page.",
      unread: 1,
    });
    updateProjectRecentActivity(
      db,
      project.id,
      createRecentActivity("Client payment received", timestamp),
      timestamp
    );
    revalidatePath(`/projects/${project.id}`);
  }

  revalidatePath(`/invoice/${token}`);
  revalidatePath("/invoices");
  revalidatePath("/overview");
  redirect(`/invoice/${token}?paid=1`);
}

export async function submitClientExternalPaymentAction(formData: FormData) {
  const token = getString(formData, "token");
  const paymentId = getString(formData, "paymentId");
  const paymentMethod = getString(formData, "paymentMethod");
  if (!token || !paymentId || !paymentMethod) {
    redirect(`/invoice/${token || ""}?error=payment-invalid`);
  }

  const db = getDb();
  const invoice = db
    .prepare("SELECT * FROM invoices WHERE public_token = ? LIMIT 1")
    .get(token) as Record<string, unknown> | undefined;

  if (!invoice) {
    redirect(`/invoice/${token}?error=payment-invalid`);
  }

  const paymentSchedule = parsePaymentSchedule(String(invoice.payment_schedule ?? "[]"));
  const nextPaymentSchedule = paymentSchedule.map((item) =>
    item.id === paymentId
        ? {
            ...item,
            status: "PAID",
          }
        : item
  );

  if (!nextPaymentSchedule.some((item) => item.id === paymentId)) {
    redirect(`/invoice/${token}?error=payment-invalid`);
  }

  const timestamp = new Date().toISOString();
  const nextStatus = nextPaymentSchedule.every((item) => item.status === "PAID") ? "PAID" : "DUE_SOON";
  db.prepare("UPDATE invoices SET status = ?, payment_schedule = ?, updated_at = ? WHERE id = ?").run(
    nextStatus,
    JSON.stringify(nextPaymentSchedule),
    timestamp,
    String(invoice.id)
  );

  const paidScheduleItem = nextPaymentSchedule.find((item) => item.id === paymentId);
  if (paidScheduleItem) {
    recordInvoicePaymentToLedger({
      invoiceId: String(invoice.id),
      paymentId,
      paymentAmount: Number(paidScheduleItem.amount || 0),
      paymentDate: timestamp,
      paymentMethod,
      invoiceLabel: String(invoice.label || ""),
      invoiceNumber: String(paidScheduleItem.invoiceNumber || ""),
      clientName: String(invoice.client || ""),
      sourceType: "MANUAL_CLIENT_PAYMENT",
    });
  }

  const project = db
    .prepare("SELECT id, client FROM projects WHERE client = ? ORDER BY updated_at DESC LIMIT 1")
    .get(String(invoice.client)) as { id: string; client: string } | undefined;

  if (project) {
    logProjectMessage(db, {
      sender: String(invoice.client),
      clientName: project.client,
      projectId: project.id,
      direction: "INBOUND",
      channel: "Payment update",
      time: timestamp,
      subject: String(invoice.label),
        preview: `Client marked payment sent via ${paymentMethod}.`,
      unread: 1,
    });
    updateProjectRecentActivity(
      db,
      project.id,
      createRecentActivity(`Client marked payment sent via ${paymentMethod}`, timestamp),
      timestamp
    );
    revalidatePath(`/projects/${project.id}`);
  }

  revalidatePath(`/invoice/${token}`);
  revalidatePath("/invoices");
  revalidatePath("/overview");
  revalidatePath("/ledger");
  redirect(`/invoice/${token}?submitted=1`);
}

export async function createStripeCheckoutAction(formData: FormData) {
  const token = getString(formData, "token");
  const paymentId = getString(formData, "paymentId");

  if (!token || !paymentId) {
    redirect(`/invoice/${token || ""}?error=payment-invalid`);
  }

  const db = getDb();
  const invoice = db
    .prepare("SELECT * FROM invoices WHERE public_token = ? LIMIT 1")
    .get(token) as Record<string, unknown> | undefined;

  if (!invoice) {
    redirect(`/invoice/${token}?error=payment-invalid`);
  }

  const paymentSchedule = parsePaymentSchedule(String(invoice.payment_schedule ?? "[]"));
  const payment = paymentSchedule.find((item) => item.id === paymentId);

  if (!payment) {
    redirect(`/invoice/${token}?error=payment-invalid`);
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED"
        ? "stripe-missing"
        : "payment-invalid";
    redirect(`/invoice/${token}?error=${reason}`);
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/invoice/${token}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/invoice/${token}?canceled=1`,
    metadata: {
      invoiceId: String(invoice.id),
      paymentId: payment.id,
      token,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(payment.amount || 0) * 100),
          product_data: {
              name: `${String(invoice.label)} payment`,
              description: `${payment.invoiceNumber} due ${payment.dueDate}`,
            },
        },
      },
    ],
  });

  redirect(session.url || `/invoice/${token}?error=payment-invalid`);
}

export async function createVideoPaywallCheckoutAction(formData: FormData) {
  const token = getString(formData, "token");

  if (!token) {
    redirect("/video-paywall/not-found?error=payment-invalid");
  }

  const db = getDb();
  ensureVideoPaywallsTable();
  const paywall = db
    .prepare(
      `SELECT video_paywalls.*, projects.client
       FROM video_paywalls
       JOIN projects ON projects.id = video_paywalls.project_id
       WHERE video_paywalls.public_token = ?
       LIMIT 1`
    )
    .get(token) as Record<string, unknown> | undefined;

  if (!paywall) {
    redirect(`/video-paywall/${token}?error=payment-invalid`);
  }

  if (String(paywall.status) === "PAID") {
    redirect(`/video-paywall/${token}/download`);
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED"
        ? "stripe-missing"
        : "payment-invalid";
    redirect(`/video-paywall/${token}?error=${reason}`);
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/video-paywall/${token}/download?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/video-paywall/${token}?canceled=1`,
    customer_email: String(paywall.buyer_email || "").trim() || undefined,
    metadata: {
      paywallId: String(paywall.id),
      projectId: String(paywall.project_id),
      token,
      productType: "video-paywall",
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(paywall.price || 0) * 100),
          product_data: {
            name: String(paywall.title || "Client video download"),
            description: String(paywall.description || "Private video download"),
            images: String(paywall.cover_image || "").startsWith("http") ? [String(paywall.cover_image)] : undefined,
          },
        },
      },
    ],
  });

  db.prepare("UPDATE video_paywalls SET stripe_checkout_session_id = ?, updated_at = ? WHERE id = ?").run(
    session.id,
    new Date().toISOString(),
    String(paywall.id)
  );

  redirect(session.url || `/video-paywall/${token}?error=payment-invalid`);
}

export async function createPhotoDeliverableCheckoutAction(formData: FormData) {
  const token = getString(formData, "photoToken");
  const returnPath = getString(formData, "returnPath");

  if (!token || !returnPath) {
    redirect("/projects?error=payment-invalid");
  }

  const db = getDb();
  ensureProjectDeliverablesTable();
  const deliverable = db
    .prepare(
      `SELECT project_deliverables.*, projects.client
       FROM project_deliverables
       JOIN projects ON projects.id = project_deliverables.project_id
       WHERE project_deliverables.public_token = ? AND project_deliverables.media_type = 'PHOTO'
       LIMIT 1`
    )
    .get(token) as Record<string, unknown> | undefined;

  if (!deliverable) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=payment-invalid`);
  }

  if (String(deliverable.access_type || "FREE") !== "PAID") {
    redirect(returnPath);
  }

  if (String(deliverable.purchased_at || "").trim()) {
    redirect(returnPath);
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED"
        ? "stripe-missing"
        : "payment-invalid";
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=${reason}`);
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}${returnPath}${returnPath.includes("?") ? "&" : "?"}photo_session_id={CHECKOUT_SESSION_ID}&photo_token=${token}`,
    cancel_url: `${origin}${returnPath}${returnPath.includes("?") ? "&" : "?"}photo_canceled=1`,
    customer_email: String(deliverable.buyer_email || "").trim() || undefined,
    metadata: {
      deliverableId: String(deliverable.id),
      projectId: String(deliverable.project_id),
      photoToken: token,
      productType: "photo-deliverable",
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(deliverable.price || 0) * 100),
          product_data: {
            name: String(deliverable.title || "Photo download"),
            description: String(deliverable.caption || "Private photo download"),
          },
        },
      },
    ],
  });

  db.prepare("UPDATE project_deliverables SET stripe_checkout_session_id = ?, updated_at = ? WHERE id = ?").run(
    session.id,
    new Date().toISOString(),
    String(deliverable.id)
  );

  redirect(session.url || `${returnPath}${returnPath.includes("?") ? "&" : "?"}error=payment-invalid`);
}

export async function createStripeAutopaySetupAction(formData: FormData) {
  const token = getString(formData, "token");

  if (!token) {
    redirect(`/invoice/${token || ""}?error=payment-invalid`);
  }

  const db = getDb();
  const invoice = db
    .prepare("SELECT * FROM invoices WHERE public_token = ? LIMIT 1")
    .get(token) as Record<string, unknown> | undefined;

  if (!invoice) {
    redirect(`/invoice/${token}?error=payment-invalid`);
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED"
        ? "stripe-missing"
        : "payment-invalid";
    redirect(`/invoice/${token}?error=${reason}`);
  }

  const client = db
    .prepare("SELECT contact_email FROM clients WHERE name = ? LIMIT 1")
    .get(String(invoice.client)) as { contact_email?: string } | undefined;

  const existingCustomerId = String(invoice.stripe_customer_id || "").trim();
  let customerId = existingCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: String(invoice.client || "StudioFlow client"),
      email: String(client?.contact_email || "").trim() || undefined,
      metadata: {
        invoiceId: String(invoice.id),
        client: String(invoice.client || ""),
      },
    });
    customerId = customer.id;
    db.prepare("UPDATE invoices SET stripe_customer_id = ?, updated_at = ? WHERE id = ?").run(
      customerId,
      new Date().toISOString(),
      String(invoice.id)
    );
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    success_url: `${origin}/invoice/${token}?autopay_session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/invoice/${token}?autopay_canceled=1`,
    metadata: {
      invoiceId: String(invoice.id),
      token,
      intent: "autopay-setup",
    },
  });

  redirect(session.url || `/invoice/${token}?error=payment-invalid`);
}

export async function disableInvoiceAutopayAction(formData: FormData) {
  const token = getString(formData, "token");

  if (!token) {
    redirect(`/invoice/${token || ""}?error=payment-invalid`);
  }

  const db = getDb();
  const invoice = db
    .prepare("SELECT id FROM invoices WHERE public_token = ? LIMIT 1")
    .get(token) as { id?: string } | undefined;

  if (!invoice?.id) {
    redirect(`/invoice/${token}?error=payment-invalid`);
  }

  db.prepare(
    "UPDATE invoices SET auto_pay_enabled = 0, stripe_payment_method_id = NULL, auto_pay_last4 = NULL, updated_at = ? WHERE id = ?"
  ).run(new Date().toISOString(), invoice.id);

  revalidatePath(`/invoice/${token}`);
  revalidatePath("/invoices");
  redirect(`/invoice/${token}?autopay_disabled=1`);
}

export async function logClientReplyAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const clientName = getString(formData, "clientName");
  const subject = getString(formData, "subject");
  const body = getString(formData, "body");

  if (!projectId || !clientName || !subject || !body) {
    redirect(`/projects/${projectId || ""}?tab=activity&error=reply-invalid`);
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  logProjectMessage(db, {
    sender: clientName,
    clientName,
    projectId,
    direction: "INBOUND",
    channel: "Email",
    time: timestamp,
    subject,
    preview: body,
    unread: 1,
  });
  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity("Client emailed you", timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/messages");
  redirect(`/projects/${projectId}?tab=activity&reply=1`);
}

export async function deleteProjectMessageAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const messageId = getString(formData, "messageId");

  if (!projectId || !messageId) {
    redirect(`/projects/${projectId || ""}?tab=activity&error=message-invalid`);
  }

  const db = getDb();
  const project = db
    .prepare("SELECT client FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as { client?: string | null } | undefined;
  const message = db
    .prepare("SELECT id, project_id, client_name FROM messages WHERE id = ? LIMIT 1")
    .get(messageId) as
    | { id?: string | null; project_id?: string | null; client_name?: string | null }
    | undefined;
  const normalizedProjectClient = String(project?.client || "").trim().toLowerCase();
  const normalizedMessageClient = String(message?.client_name || "").trim().toLowerCase();
  const belongsToThread =
    String(message?.project_id || "") === projectId ||
    (!!normalizedProjectClient && normalizedMessageClient === normalizedProjectClient);

  if (message?.id && belongsToThread) {
    const timestamp = new Date().toISOString();
    db.prepare("UPDATE messages SET deleted_at = ?, unread = 0, updated_at = ? WHERE id = ?").run(
      timestamp,
      timestamp,
      messageId
    );
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/overview");
  revalidatePath("/messages");
  redirect(`/projects/${projectId}?tab=activity&messageDeleted=1`);
}

export async function openNotificationMessageAction(formData: FormData) {
  await requireUser();

  const messageId = getString(formData, "messageId");
  const projectId = getString(formData, "projectId");

  if (!messageId) {
    redirect("/projects");
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  db.prepare("UPDATE messages SET unread = 0, updated_at = ? WHERE id = ?").run(timestamp, messageId);

  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/overview");
    redirect(`/projects/${projectId}?tab=activity`);
  }

  revalidatePath("/overview");
  redirect("/projects");
}

export async function markProjectMessageReadAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const messageId = getString(formData, "messageId");

  if (!projectId || !messageId) {
    return;
  }

  const db = getDb();
  const project = db
    .prepare("SELECT client FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as { client?: string | null } | undefined;
  const message = db
    .prepare("SELECT id, project_id, client_name, direction, unread, deleted_at FROM messages WHERE id = ? LIMIT 1")
    .get(messageId) as
    | {
        id?: string | null;
        project_id?: string | null;
        client_name?: string | null;
        direction?: string | null;
        unread?: number | null;
        deleted_at?: string | null;
      }
    | undefined;

  const normalizedProjectClient = String(project?.client || "").trim().toLowerCase();
  const normalizedMessageClient = String(message?.client_name || "").trim().toLowerCase();
  const belongsToThread =
    String(message?.project_id || "") === projectId ||
    (!!normalizedProjectClient && normalizedMessageClient === normalizedProjectClient);

  if (
    message?.id &&
    !message.deleted_at &&
    belongsToThread &&
    String(message.direction || "").toUpperCase() === "INBOUND" &&
    Number(message.unread || 0) === 1
  ) {
    const timestamp = new Date().toISOString();
    db.prepare("UPDATE messages SET unread = 0, updated_at = ? WHERE id = ?").run(timestamp, messageId);
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/overview");
}

export async function updateProjectMetaAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const clientName = getString(formData, "clientName");
  const projectName = getString(formData, "projectName");
  const description = getString(formData, "description");
  const phase = getString(formData, "phase");
  const leadSource = getString(formData, "leadSource");

  if (!projectId || !clientName || !projectName || !description || !phase || !leadSource) {
    redirect(`/projects/${projectId || ""}?error=project-meta-invalid`);
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  db.prepare(
    "UPDATE projects SET name = ?, description = ?, phase = ?, lead_source = ?, stage_moved_at = ?, updated_at = ? WHERE id = ?"
  ).run(projectName, description, phase, leadSource, timestamp, timestamp, projectId);
  db.prepare("UPDATE clients SET project = ?, updated_at = ? WHERE name = ?").run(
    projectName,
    timestamp,
    clientName
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/crm");
  redirect(`/projects/${projectId}?updated=1`);
}

export async function updateProjectPipelineAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const phase = getString(formData, "phase");

  if (!projectId || !phase) {
    redirect("/projects?error=project-phase-invalid");
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  const recentLabel =
    phase === "Completed"
      ? "Project moved to completed"
      : `Project moved to ${phase}`;

  db.prepare(
    "UPDATE projects SET phase = ?, stage_moved_at = ?, recent_activity = ?, updated_at = ? WHERE id = ?"
  ).run(
    phase,
    timestamp,
    createRecentActivity(recentLabel, timestamp),
    timestamp,
    projectId
  );

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  redirect("/projects?pipeline=1");
}

export async function updateProjectDescriptionAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const description = getString(formData, "description");

  if (!projectId || !description) {
    redirect("/projects?error=project-description-invalid");
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  db.prepare("UPDATE projects SET description = ?, updated_at = ? WHERE id = ?").run(
    description,
    timestamp,
    projectId
  );

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  redirect("/projects?description=1");
}

export async function updateProjectTypeAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const projectType = getString(formData, "projectType");
  const validTypes = ["Business", "Wedding", "Others"];

  if (!projectId || !validTypes.includes(projectType)) {
    redirect("/projects?error=project-type-invalid");
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  db.prepare(
    "UPDATE projects SET project_type = ?, recent_activity = ?, updated_at = ? WHERE id = ?"
  ).run(
    projectType,
    createRecentActivity(`Project type changed to ${projectType}`, timestamp),
    timestamp,
    projectId
  );

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/ledger/reports");
  revalidatePath("/ledger/accounts-receivable");
  redirect("/projects?typeUpdated=1");
}

export async function deleteProjectAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");

  if (!projectId) {
    redirect("/projects?error=project-delete-invalid");
  }

  const db = getDb();
  const project = db
    .prepare("SELECT id, name, client, public_portal_token FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as
    | { id: string; name: string; client: string; public_portal_token?: string | null }
    | undefined;

  if (!project) {
    redirect("/projects?error=project-delete-invalid");
  }

  deleteProjectRecords(db, project);

  revalidatePath("/projects");
  revalidatePath("/crm");
  revalidatePath("/overview");
  revalidatePath("/messages");
  revalidatePath("/proposals");
  revalidatePath("/invoices");
  revalidatePath("/schedule");

  if (project.public_portal_token) {
    revalidatePath(`/client-portal/${project.public_portal_token}`);
  }

  redirect("/projects?deleted=1");
}

export async function archiveProjectsAction(formData: FormData) {
  await requireUser();

  const projectIds = parseSelectedProjectIds(formData);

  if (projectIds.length === 0) {
    redirect("/projects?error=project-archive-invalid");
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  const updateProject = db.prepare(
    "UPDATE projects SET archived_at = ?, recent_activity = ?, updated_at = ? WHERE id = ?"
  );

  projectIds.forEach((projectId) => {
    updateProject.run(
      timestamp,
      createRecentActivity("Project archived", timestamp),
      timestamp,
      projectId
    );
    revalidatePath(`/projects/${projectId}`);
  });

  revalidatePath("/projects");
  revalidatePath("/overview");
  redirect("/projects?archived=1&view=archived");
}

export async function bulkDeleteProjectsAction(formData: FormData) {
  await requireUser();

  const projectIds = parseSelectedProjectIds(formData);

  if (projectIds.length === 0) {
    redirect("/projects?error=project-delete-invalid");
  }

  const db = getDb();
  const projects = db
    .prepare(
      `SELECT id, name, client, public_portal_token FROM projects WHERE id IN (${projectIds
        .map(() => "?")
        .join(",")})`
    )
    .all(...projectIds) as Array<{
    id: string;
    name: string;
    client: string;
    public_portal_token?: string | null;
  }>;

  if (projects.length === 0) {
    redirect("/projects?error=project-delete-invalid");
  }

  projects.forEach((project) => {
    deleteProjectRecords(db, project);
    revalidatePath(`/projects/${project.id}`);

    if (project.public_portal_token) {
      revalidatePath(`/client-portal/${project.public_portal_token}`);
    }
  });

  revalidatePath("/projects");
  revalidatePath("/crm");
  revalidatePath("/overview");
  revalidatePath("/messages");
  revalidatePath("/proposals");
  revalidatePath("/invoices");
  revalidatePath("/schedule");
  redirect("/projects?deleted=1");
}

export async function updateProjectFilesAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const fileNotes = getString(formData, "fileNotes");

  if (!projectId || !fileNotes) {
    redirect(`/projects/${projectId || ""}?tab=files&error=files-invalid`);
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  db.prepare("UPDATE projects SET file_notes = ?, updated_at = ? WHERE id = ?").run(
    fileNotes,
    timestamp,
    projectId
  );

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}?tab=files&files=1`);
}

export async function updateProjectTasksAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const nextMilestone = getString(formData, "nextMilestone");
  const progress = Number(getString(formData, "progress"));
  const tasksInput = getString(formData, "tasks");

  if (!projectId || !nextMilestone || Number.isNaN(progress) || !tasksInput) {
    redirect(`/projects/${projectId || ""}?tab=tasks&error=tasks-invalid`);
  }

  const tasks = tasksInput
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (tasks.length === 0) {
    redirect(`/projects/${projectId}?tab=tasks&error=tasks-invalid`);
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  db.prepare(
    "UPDATE projects SET next_milestone = ?, progress = ?, tasks = ?, recent_activity = ?, updated_at = ? WHERE id = ?"
  ).run(
    nextMilestone,
    Math.min(Math.max(progress, 0), 100),
    JSON.stringify(tasks),
    `Project tasks updated on ${new Date(timestamp).toLocaleDateString("en-US")}.`,
    timestamp,
    projectId
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  redirect(`/projects/${projectId}?tab=tasks&tasks=1`);
}

export async function createProjectInvoiceAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const clientName = getString(formData, "clientName");
  const label = getString(formData, "label");
  const dueDate = getString(formData, "dueDate");
  const method = getString(formData, "method");
  const taxRate = Number(getString(formData, "taxRate") || "0");
  const lineItems = parseInvoiceLineItems(getString(formData, "lineItems"));
  const paymentSchedule = parsePaymentSchedule(getString(formData, "paymentSchedule"));
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const taxAmount = Math.round(subtotal * (Number.isNaN(taxRate) ? 0 : taxRate)) / 100;
  const amount = subtotal + taxAmount;

  if (
    !projectId ||
    !clientName ||
    !label ||
    !dueDate ||
    !method ||
    Number.isNaN(taxRate) ||
    lineItems.length === 0 ||
    paymentSchedule.length === 0 ||
    Number.isNaN(amount)
  ) {
    redirect(`/projects/${projectId || ""}/invoices/new?error=invoice-invalid`);
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  const invoiceId = randomUUID();
  const publicToken = randomUUID();
  db.prepare(
    "INSERT INTO invoices (id, client, label, status, due_date, amount, method, public_token, tax_rate, line_items, payment_schedule, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    invoiceId,
    clientName,
    label,
    "DUE_SOON",
    dueDate,
    amount,
    method,
    publicToken,
    taxRate,
    JSON.stringify(lineItems),
    JSON.stringify(paymentSchedule),
    timestamp,
    timestamp
  );
  db.prepare(
    "INSERT INTO project_files (id, project_id, type, title, summary, status, visibility, linked_path, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    projectId,
    "INVOICE",
    label,
    `Invoice due ${dueDate}`,
    "Awaiting payment",
    "Shared",
    `/projects/${projectId}/invoices/${invoiceId}`,
    `Invoice: ${label}\nDue date: ${dueDate}\nMethod: ${method}\nTax rate: ${taxRate}%\n\nLine items:\n${lineItems
      .map((item) => `- ${item.title}: ${item.description} ($${item.amount})`)
      .join("\n")}\n\nPayment plan:\n${paymentSchedule
        .map((item) => `- ${item.invoiceNumber}: ${item.dueDate} - $${item.amount} (${item.status})`)
        .join("\n")}\n\nGrand total: $${amount}`,
    timestamp,
    timestamp
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/invoices/${invoiceId}`);
  revalidatePath(`/invoice/${publicToken}`);
  revalidatePath("/invoices");
  revalidatePath("/overview");
  redirect(`/projects/${projectId}/invoices/${invoiceId}`);
}

export async function updateProjectInvoiceAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const invoiceId = getString(formData, "invoiceId");
  const previousLabel = getString(formData, "previousLabel");
  const label = getString(formData, "label");
  const dueDate = getString(formData, "dueDate");
  const method = getString(formData, "method");
  const status = getString(formData, "status") || "DUE_SOON";
  const taxRate = Number(getString(formData, "taxRate") || "0");
  const lineItems = parseInvoiceLineItems(getString(formData, "lineItems"));
  const paymentSchedule = parsePaymentSchedule(getString(formData, "paymentSchedule"));
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const taxAmount = Math.round(subtotal * (Number.isNaN(taxRate) ? 0 : taxRate)) / 100;
  const amount = subtotal + taxAmount;

  if (
    !projectId ||
    !invoiceId ||
    !label ||
    !dueDate ||
    !method ||
    !status ||
    Number.isNaN(taxRate) ||
    lineItems.length === 0 ||
    paymentSchedule.length === 0 ||
    Number.isNaN(amount)
  ) {
    redirect(`/projects/${projectId || ""}/invoices/${invoiceId || ""}?error=invoice-invalid`);
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  db.prepare(
    "UPDATE invoices SET label = ?, status = ?, due_date = ?, amount = ?, method = ?, tax_rate = ?, line_items = ?, payment_schedule = ?, updated_at = ? WHERE id = ?"
  ).run(
    label,
    status,
    dueDate,
    amount,
    method,
    taxRate,
    JSON.stringify(lineItems),
    JSON.stringify(paymentSchedule),
    timestamp,
    invoiceId
  );

  db.prepare(
    "UPDATE project_files SET title = ?, summary = ?, body = ?, updated_at = ? WHERE project_id = ? AND type = 'INVOICE' AND (title = ? OR title = ?)"
  ).run(
    label,
    `Invoice due ${dueDate}`,
    `Invoice: ${label}\nDue date: ${dueDate}\nMethod: ${method}\nTax rate: ${taxRate}%\n\nLine items:\n${lineItems
      .map((item) => `- ${item.title}: ${item.description} ($${item.amount})`)
      .join("\n")}\n\nPayment plan:\n${paymentSchedule
        .map((item) => `- ${item.invoiceNumber}: ${item.dueDate} - $${item.amount} (${item.status})`)
        .join("\n")}\n\nGrand total: $${amount}`,
    timestamp,
    projectId,
    previousLabel || label,
    label
  );

  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity(`${label} updated`, timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/overview");
  redirect(`/projects/${projectId}/invoices/${invoiceId}?updated=1`);
}

export async function updateProjectDetailsAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const clientName = getString(formData, "clientName");
  const contactEmail = getString(formData, "contactEmail").toLowerCase();
  const projectName = getString(formData, "projectName");
  const projectType = getString(formData, "projectType");
  const projectDate = getString(formData, "projectDate");
  const location = getString(formData, "location");
  const packageName = getString(formData, "packageName");
  const description = getString(formData, "description");

  if (
    !projectId ||
    !clientName ||
    !contactEmail ||
    !projectName ||
    !projectType ||
    !projectDate ||
    !location ||
    !packageName ||
    !description
  ) {
    redirect(`/projects/${projectId || ""}?tab=details&error=details-invalid`);
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  db.prepare(
    "UPDATE projects SET name = ?, project_type = ?, project_date = ?, location = ?, description = ?, updated_at = ? WHERE id = ?"
  ).run(projectName, projectType, projectDate, location, description, timestamp, projectId);
  db.prepare(
    "UPDATE clients SET project = ?, category = ?, package_name = ?, contact_email = ?, updated_at = ? WHERE name = ?"
  ).run(projectName, projectType, packageName, contactEmail, timestamp, clientName);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/crm");
  redirect(`/projects/${projectId}?tab=details&details=1`);
}

export async function updateProjectHeroBannerAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const coverPosition = getString(formData, "coverPosition") || "50% 50%";
  const coverFile = getUploadFile(formData, "coverFile");

  if (!projectId) {
    redirect("/projects?error=project-missing");
  }

  const db = getDb();
  const project = db
    .prepare("SELECT id, project_cover FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as { id?: string; project_cover?: string | null } | undefined;

  if (!project?.id) {
    redirect("/projects?error=project-missing");
  }

  let nextCover = String(project.project_cover || "");
  if (coverFile) {
    const uploadedCover = await saveProjectHeroBanner(coverFile);
    await deleteProjectHeroBannerIfLocal(nextCover);
    nextCover = uploadedCover;
  }

  const timestamp = new Date().toISOString();
  db.prepare(
    "UPDATE projects SET project_cover = ?, project_cover_position = ?, updated_at = ? WHERE id = ?"
  ).run(nextCover, coverPosition, timestamp, projectId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/overview");
}

export async function updateProjectContactAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const clientName = getString(formData, "clientName");
  const nextClientName = getString(formData, "nextClientName");
  const contactEmail = getString(formData, "contactEmail").toLowerCase();
  const returnTab = getString(formData, "returnTab") || "activity";
  const returnFile = getString(formData, "returnFile");

  if (!projectId || !clientName || !nextClientName || !contactEmail) {
    redirect(`/projects/${projectId || ""}?tab=${returnTab}&error=contact-invalid`);
  }

  const db = getDb();
  const timestamp = new Date().toISOString();

  db.prepare("UPDATE projects SET client = ?, updated_at = ? WHERE id = ?").run(
    nextClientName,
    timestamp,
    projectId
  );
  db.prepare("UPDATE clients SET name = ?, contact_email = ?, updated_at = ? WHERE name = ?").run(
    nextClientName,
    contactEmail,
    timestamp,
    clientName
  );
  db.prepare("UPDATE proposals SET client = ?, recipient_email = ?, updated_at = ? WHERE client = ?").run(
    nextClientName,
    contactEmail,
    timestamp,
    clientName
  );
  db.prepare("UPDATE invoices SET client = ?, updated_at = ? WHERE client = ?").run(
    nextClientName,
    timestamp,
    clientName
  );
  db.prepare("UPDATE schedule_items SET client = ?, updated_at = ? WHERE client = ?").run(
    nextClientName,
    timestamp,
    clientName
  );
  db.prepare("UPDATE messages SET client_name = ?, updated_at = ? WHERE client_name = ?").run(
    nextClientName,
    timestamp,
    clientName
  );
  db.prepare("UPDATE messages SET sender = ?, updated_at = ? WHERE sender = ?").run(
    nextClientName,
    timestamp,
    clientName
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/crm");
  revalidatePath("/messages");
  revalidatePath("/proposals");
  revalidatePath("/invoices");
  revalidatePath("/schedule");

  const fileSuffix = returnTab === "files" && returnFile ? `&file=${returnFile}` : "";
  redirect(`/projects/${projectId}?tab=${returnTab}${fileSuffix}&contact=1`);
}

export async function addProjectContactAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const name = getString(formData, "name");
  const email = getString(formData, "email").toLowerCase();
  const returnTab = getString(formData, "returnTab") || "activity";
  const returnFile = getString(formData, "returnFile");

  if (!projectId || !name || !email) {
    redirect(`/projects/${projectId || ""}?tab=${returnTab}&error=participant-invalid`);
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  db.prepare(
    "INSERT INTO project_contacts (id, project_id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(randomUUID(), projectId, name, email, timestamp, timestamp);

  revalidatePath(`/projects/${projectId}`);
  const fileSuffix = returnTab === "files" && returnFile ? `&file=${returnFile}` : "";
  redirect(`/projects/${projectId}?tab=${returnTab}${fileSuffix}&participant=1`);
}

export async function updateAdditionalProjectContactAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const contactId = getString(formData, "contactId");
  const name = getString(formData, "name");
  const email = getString(formData, "email").toLowerCase();
  const returnTab = getString(formData, "returnTab") || "activity";
  const returnFile = getString(formData, "returnFile");

  if (!projectId || !contactId || !name || !email) {
    redirect(`/projects/${projectId || ""}?tab=${returnTab}&error=participant-invalid`);
  }

  const db = getDb();
  db.prepare("UPDATE project_contacts SET name = ?, email = ?, updated_at = ? WHERE id = ?").run(
    name,
    email,
    new Date().toISOString(),
    contactId
  );

  revalidatePath(`/projects/${projectId}`);
  const fileSuffix = returnTab === "files" && returnFile ? `&file=${returnFile}` : "";
  redirect(`/projects/${projectId}?tab=${returnTab}${fileSuffix}&participant=1`);
}

export async function uploadClientPortalImageAction(formData: FormData) {
  const token = getString(formData, "token");
  const caption = getString(formData, "caption");
  const imageFile = getUploadFile(formData, "image");

  if (!token || !imageFile) {
    redirect(`/client-portal/${token || ""}?tab=details&error=upload-invalid`);
  }

  if (!imageFile.type.startsWith("image/")) {
    redirect(`/client-portal/${token}?tab=details&error=upload-type`);
  }

  const db = getDb();
  const project = db
    .prepare("SELECT id, client FROM projects WHERE public_portal_token = ? LIMIT 1")
    .get(token) as { id: string; client: string } | undefined;

  if (!project) {
    redirect("/overview");
  }

  const timestamp = new Date().toISOString();
  const imagePath = await saveClientUploadImage(imageFile);
  db.prepare(
    "INSERT INTO client_uploads (id, project_id, client_name, image_path, caption, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(randomUUID(), project.id, project.client, imagePath, caption, timestamp, timestamp);
  updateProjectRecentActivity(
    db,
    project.id,
    createRecentActivity("Client uploaded images", timestamp),
    timestamp
  );

  revalidatePath(`/client-portal/${token}`);
  revalidatePath(`/projects/${project.id}`);
  redirect(`/client-portal/${token}?tab=details&uploaded=1`);
}

export async function uploadProjectDeliverableAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const mediaType = getString(formData, "mediaType").toUpperCase() === "VIDEO" ? "VIDEO" : "PHOTO";
  const rawTitle = getString(formData, "title");
  const caption = getString(formData, "caption");
  const files = getUploadFiles(formData, "file");
  const file = files[0] ?? null;
  const thumbnail = getUploadFile(formData, "thumbnail");
  const synologyUrl = getString(formData, "synologyUrl");
  const albumTitle = getString(formData, "albumTitle");
  const albumSection = getString(formData, "albumSection");
  const albumDownloadUrl = getString(formData, "albumDownloadUrl");
  const accessType = getString(formData, "accessType").toUpperCase() === "PAID" ? "PAID" : "FREE";
  const rawPrice = getString(formData, "price");
  const photoPrice = rawPrice ? Number(rawPrice) : 0;
  const returnPath = getString(formData, "returnPath");
  const fallbackPath = projectId ? `/projects/${projectId}?tab=deliverables` : "/projects";
  const safeReturnPath = projectId && returnPath.startsWith(`/projects/${projectId}`)
    ? returnPath
    : fallbackPath;
  const redirectWithStatus = (key: string, value: string): never => {
    redirect(`${safeReturnPath}${safeReturnPath.includes("?") ? "&" : "?"}${key}=${value}`);
  };

  if (!projectId) {
    redirectWithStatus("error", "deliverable-invalid");
  }

  if (!file && !synologyUrl) {
    redirectWithStatus("error", "deliverable-invalid");
  }

  if (albumDownloadUrl) {
    try {
      const parsedUrl = new URL(albumDownloadUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        redirectWithStatus("error", "deliverable-link-invalid");
      }
    } catch {
      redirectWithStatus("error", "deliverable-link-invalid");
    }
  }

  if (mediaType === "PHOTO" && accessType === "PAID" && (!rawPrice || Number.isNaN(photoPrice) || photoPrice <= 0)) {
    redirectWithStatus("error", "deliverable-price-invalid");
  }

  const db = getDb();
  ensureProjectDeliverablesTable();
  const project = db
    .prepare("SELECT id, client FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as { id: string; client?: string } | undefined;

  if (!project) {
    redirect("/projects?error=project-missing");
  }

  const title =
    rawTitle ||
    (mediaType === "VIDEO"
      ? `${project.client || "Client"} Video Deliverable`
      : `${project.client || "Client"} Photo Deliverable`);

  const timestamp = new Date().toISOString();

  if (mediaType === "PHOTO" && files.length > 1) {
    if (synologyUrl) {
      redirectWithStatus("error", "deliverable-invalid");
    }

    for (const photoFile of files) {
      if (!photoFile.type.startsWith("image/")) {
        redirectWithStatus("error", "deliverable-photo-type");
      }
    }

    const insertDeliverable = db.prepare(
      "INSERT INTO project_deliverables (id, project_id, media_type, title, caption, file_path, source_type, thumbnail_path, album_title, album_section, album_download_url, access_type, price, public_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    for (const [index, photoFile] of files.entries()) {
      const filePath = await saveProjectDeliverableFile(photoFile, "PHOTO");
      insertDeliverable.run(
        randomUUID(),
        projectId,
        "PHOTO",
        `${title} ${index + 1}`,
        caption,
        filePath,
        "UPLOAD",
        "",
        albumTitle || "Final Gallery",
        albumSection,
        albumDownloadUrl,
        accessType,
        accessType === "PAID" ? photoPrice : 0,
        randomUUID(),
        timestamp,
        timestamp
      );
    }

    updateProjectRecentActivity(
      db,
      projectId,
      createRecentActivity(`${files.length} photo deliverables uploaded`, timestamp),
      timestamp
    );

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/deliverables`);
    redirectWithStatus("deliverableUploaded", "1");
  }

  const hasSynologyUrl = Boolean(synologyUrl);
  let filePath = synologyUrl;
  const sourceType = hasSynologyUrl ? "SYNOLOGY" : "UPLOAD";

  if (hasSynologyUrl) {
    try {
      const parsedUrl = new URL(synologyUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        redirectWithStatus("error", "deliverable-link-invalid");
      }
    } catch {
      redirectWithStatus("error", "deliverable-link-invalid");
    }
  } else {
    const deliverableFile = file as File;

    if (mediaType === "VIDEO" && !deliverableFile.type.startsWith("video/")) {
      redirectWithStatus("error", "deliverable-video-type");
    }

    if (mediaType === "PHOTO" && !deliverableFile.type.startsWith("image/")) {
      redirectWithStatus("error", "deliverable-photo-type");
    }

    filePath = await saveProjectDeliverableFile(deliverableFile, mediaType);
  }

  let thumbnailPath = "";
  if (thumbnail) {
    if (!thumbnail.type.startsWith("image/")) {
      redirectWithStatus("error", "deliverable-thumbnail-type");
    }

    thumbnailPath = await saveProjectDeliverableThumbnail(thumbnail);
  }

  db.prepare(
    "INSERT INTO project_deliverables (id, project_id, media_type, title, caption, file_path, source_type, thumbnail_path, album_title, album_section, album_download_url, access_type, price, public_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    projectId,
    mediaType,
    title,
    caption,
    filePath,
    sourceType,
    thumbnailPath,
    mediaType === "PHOTO" ? albumTitle || "Final Gallery" : "",
    mediaType === "PHOTO" ? albumSection : "",
    mediaType === "PHOTO" ? albumDownloadUrl : "",
    mediaType === "PHOTO" ? accessType : "FREE",
    mediaType === "PHOTO" && accessType === "PAID" ? photoPrice : 0,
    mediaType === "PHOTO" ? randomUUID() : "",
    timestamp,
    timestamp
  );

  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity(`${mediaType === "VIDEO" ? "Video" : "Photo"} deliverable uploaded`, timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/deliverables`);
  redirectWithStatus("deliverableUploaded", "1");
}

export async function updateProjectDeliverablesGalleryAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const title = getString(formData, "galleryTitle");
  const intro = getString(formData, "galleryIntro");
  const cover = getString(formData, "galleryCover");
  const coverFile = getUploadFile(formData, "galleryCoverFile");
  const returnPath = getString(formData, "returnPath");
  const fallbackPath = projectId ? `/projects/${projectId}/deliverables` : "/projects";
  const safeReturnPath =
    projectId && (returnPath.startsWith("/client-portal/") || returnPath.startsWith(`/projects/${projectId}`))
      ? returnPath
      : fallbackPath;
  const withStatus = (path: string, key: string, value: string) =>
    `${path}${path.includes("?") ? "&" : "?"}${key}=${value}`;

  if (!projectId || !title) {
    redirect(withStatus(safeReturnPath, "error", "gallery-invalid"));
  }

  const db = getDb();
  ensureProjectDeliverablesTable();
  const project = db
    .prepare("SELECT id FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as { id: string } | undefined;

  if (!project) {
    redirect("/projects?error=project-missing");
  }

  const timestamp = new Date().toISOString();
  let nextCover = cover;
  if (coverFile) {
    if (!coverFile.type.startsWith("image/")) {
      redirect(withStatus(safeReturnPath, "error", "gallery-cover-type"));
    }
    nextCover = await saveProjectDeliverableBanner(coverFile);
  }

  db.prepare(
    "UPDATE projects SET deliverables_gallery_title = ?, deliverables_gallery_intro = ?, deliverables_gallery_cover = ?, updated_at = ? WHERE id = ?"
  ).run(title, intro, nextCover, timestamp, projectId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/deliverables`);
  if (safeReturnPath.startsWith("/client-portal/")) {
    revalidatePath(safeReturnPath.split("?")[0]);
  }
  redirect(withStatus(safeReturnPath, "gallerySaved", "1"));
}

export async function updateClientPortalHeroAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const title = getString(formData, "portalTitle");
  const intro = getString(formData, "portalIntro");
  const cover = getString(formData, "portalCover");
  const coverFile = getUploadFile(formData, "portalCoverFile");
  const returnPath = getString(formData, "returnPath");
  const fallbackPath = projectId ? `/projects/${projectId}/deliverables` : "/projects";
  const safeReturnPath =
    projectId && (returnPath.startsWith("/client-portal/") || returnPath.startsWith(`/projects/${projectId}`))
      ? returnPath
      : fallbackPath;
  const withStatus = (path: string, key: string, value: string) =>
    `${path}${path.includes("?") ? "&" : "?"}${key}=${value}`;

  if (!projectId || !title) {
    redirect(withStatus(safeReturnPath, "error", "portal-invalid"));
  }

  const db = getDb();
  ensureProjectDeliverablesTable();
  const project = db
    .prepare("SELECT id FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as { id: string } | undefined;

  if (!project) {
    redirect("/projects?error=project-missing");
  }

  const timestamp = new Date().toISOString();
  let nextCover = cover;
  if (coverFile) {
    if (!coverFile.type.startsWith("image/")) {
      redirect(withStatus(safeReturnPath, "error", "portal-cover-type"));
    }
    nextCover = await saveProjectDeliverableBanner(coverFile);
  }

  db.prepare(
    "UPDATE projects SET client_portal_title = ?, client_portal_intro = ?, client_portal_cover = ?, updated_at = ? WHERE id = ?"
  ).run(title, intro, nextCover, timestamp, projectId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/deliverables`);
  if (safeReturnPath.startsWith("/client-portal/")) {
    revalidatePath(safeReturnPath.split("?")[0]);
  }
  redirect(withStatus(safeReturnPath, "portalSaved", "1"));
}

export async function updateProjectDeliverableAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const deliverableId = getString(formData, "deliverableId");
  const rawTitle = getString(formData, "title");
  const caption = getString(formData, "caption");
  const synologyUrl = getString(formData, "synologyUrl");
  const albumTitle = getString(formData, "albumTitle");
  const albumSection = getString(formData, "albumSection");
  const albumDownloadUrl = getString(formData, "albumDownloadUrl");
  const accessType = getString(formData, "accessType").toUpperCase() === "PAID" ? "PAID" : "FREE";
  const rawPrice = getString(formData, "price");
  const photoPrice = rawPrice ? Number(rawPrice) : 0;
  const thumbnail = getUploadFile(formData, "thumbnail");

  if (!projectId || !deliverableId) {
    redirect(`/projects/${projectId || ""}/deliverables?error=deliverable-invalid`);
  }

  const db = getDb();
  ensureProjectDeliverablesTable();
  const deliverable = db
    .prepare("SELECT * FROM project_deliverables WHERE id = ? AND project_id = ? LIMIT 1")
    .get(deliverableId, projectId) as
    | {
        id: string;
        project_id: string;
        media_type: string;
        title: string;
        file_path: string;
        source_type: string | null;
        thumbnail_path: string | null;
        public_token: string | null;
      }
    | undefined;

  if (!deliverable) {
    redirect(`/projects/${projectId}/deliverables?error=deliverable-missing`);
  }

  const title = rawTitle || deliverable.title || "Deliverable";

  let filePath = deliverable.file_path;
  if (deliverable.source_type === "SYNOLOGY" && synologyUrl) {
    try {
      const parsedUrl = new URL(synologyUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        redirect(`/projects/${projectId}/deliverables?error=deliverable-link-invalid`);
      }
      filePath = synologyUrl;
    } catch {
      redirect(`/projects/${projectId}/deliverables?error=deliverable-link-invalid`);
    }
  }

  let thumbnailPath = deliverable.thumbnail_path || "";
  const publicToken = deliverable.public_token || randomUUID();
  if (thumbnail) {
    if (!thumbnail.type.startsWith("image/")) {
      redirect(`/projects/${projectId}/deliverables?error=deliverable-thumbnail-type`);
    }
    thumbnailPath = await saveProjectDeliverableThumbnail(thumbnail);
  }

  if (albumDownloadUrl) {
    try {
      const parsedUrl = new URL(albumDownloadUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        redirect(`/projects/${projectId}/deliverables?error=deliverable-link-invalid`);
      }
    } catch {
      redirect(`/projects/${projectId}/deliverables?error=deliverable-link-invalid`);
    }
  }

  if (deliverable.media_type === "PHOTO" && accessType === "PAID" && (!rawPrice || Number.isNaN(photoPrice) || photoPrice <= 0)) {
    redirect(`/projects/${projectId}/deliverables?error=deliverable-price-invalid`);
  }

  const timestamp = new Date().toISOString();
  db.prepare(
    "UPDATE project_deliverables SET title = ?, caption = ?, file_path = ?, thumbnail_path = ?, album_title = ?, album_section = ?, album_download_url = ?, access_type = ?, price = ?, public_token = ?, updated_at = ? WHERE id = ? AND project_id = ?"
  ).run(
    title,
    caption,
    filePath,
    thumbnailPath,
    deliverable.media_type === "PHOTO" ? albumTitle || "Final Gallery" : "",
    deliverable.media_type === "PHOTO" ? albumSection : "",
    deliverable.media_type === "PHOTO" ? albumDownloadUrl : "",
    deliverable.media_type === "PHOTO" ? accessType : "FREE",
    deliverable.media_type === "PHOTO" && accessType === "PAID" ? photoPrice : 0,
    deliverable.media_type === "PHOTO" ? publicToken : String(deliverable.public_token || ""),
    timestamp,
    deliverableId,
    projectId
  );

  revalidatePath(`/projects/${projectId}/deliverables`);
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}/deliverables?deliverableUpdated=1`);
}

export async function updateProjectPhotoAlbumCoverAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const albumTitle = getString(formData, "albumTitle");
  const returnPath = getString(formData, "returnPath") || `/projects/${projectId}/deliverables`;
  const coverFile = getUploadFile(formData, "albumCoverFile");

  if (!projectId || !albumTitle || !coverFile) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=deliverable-invalid`);
  }

  if (!coverFile.type.startsWith("image/")) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=gallery-cover-type`);
  }

  const db = getDb();
  ensureProjectDeliverablesTable();
  const existing = db
    .prepare(
      "SELECT COUNT(*) as count FROM project_deliverables WHERE project_id = ? AND media_type = 'PHOTO' AND COALESCE(album_title, 'Final Gallery') = ?"
    )
    .get(projectId, albumTitle) as { count?: number } | undefined;

  if (!existing?.count) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=deliverable-missing`);
  }

  const coverPath = await saveProjectDeliverableBanner(coverFile);
  const timestamp = new Date().toISOString();
  db.prepare(
    "UPDATE project_deliverables SET album_cover_image = ?, updated_at = ? WHERE project_id = ? AND media_type = 'PHOTO' AND COALESCE(album_title, 'Final Gallery') = ?"
  ).run(coverPath, timestamp, projectId, albumTitle);

  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity(`${albumTitle} cover updated`, timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}/deliverables`);
  revalidatePath(`/projects/${projectId}`);
  if (returnPath.startsWith("/client-portal/")) {
    revalidatePath(returnPath.split("?")[0]);
  }
  redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}deliverableUpdated=1`);
}

export async function updateProjectPhotoAlbumAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const albumTitle = getString(formData, "albumTitle");
  const nextAlbumTitle = getString(formData, "nextAlbumTitle");
  const downloadAllUrl = getString(formData, "albumDownloadUrl");
  const returnPath = getString(formData, "returnPath") || `/projects/${projectId}/deliverables`;
  const coverFile = getUploadFile(formData, "albumCoverFile");

  if (!projectId || !albumTitle) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=deliverable-invalid`);
  }

  if (downloadAllUrl) {
    try {
      const parsed = new URL(downloadAllUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=deliverable-link-invalid`);
      }
    } catch {
      redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=deliverable-link-invalid`);
    }
  }

  if (coverFile && !coverFile.type.startsWith("image/")) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=gallery-cover-type`);
  }

  const db = getDb();
  ensureProjectDeliverablesTable();
  const existing = db
    .prepare(
      "SELECT COUNT(*) as count FROM project_deliverables WHERE project_id = ? AND media_type = 'PHOTO' AND COALESCE(album_title, 'Final Gallery') = ?"
    )
    .get(projectId, albumTitle) as { count?: number } | undefined;

  if (!existing?.count) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=deliverable-missing`);
  }

  const normalizedAlbumTitle = nextAlbumTitle || albumTitle;
  const timestamp = new Date().toISOString();
  let nextCoverPath = "";

  if (coverFile) {
    nextCoverPath = await saveProjectDeliverableBanner(coverFile);
  }

  db.prepare(
    `UPDATE project_deliverables
      SET album_title = ?,
          album_download_url = ?,
          album_cover_image = CASE WHEN ? != '' THEN ? ELSE album_cover_image END,
          updated_at = ?
      WHERE project_id = ? AND media_type = 'PHOTO' AND COALESCE(album_title, 'Final Gallery') = ?`
  ).run(
    normalizedAlbumTitle,
    downloadAllUrl,
    nextCoverPath,
    nextCoverPath,
    timestamp,
    projectId,
    albumTitle
  );

  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity(`${normalizedAlbumTitle} gallery updated`, timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}/deliverables`);
  revalidatePath(`/projects/${projectId}`);
  if (returnPath.startsWith("/client-portal/")) {
    revalidatePath(returnPath.split("?")[0]);
  }
  redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}deliverableUpdated=1`);
}

export async function updatePhotoAlbumCategoriesAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const category = getString(formData, "category");
  const assignmentsJson = getString(formData, "assignments");
  const returnPath = getString(formData, "returnPath");
  const fallbackPath = projectId ? `/projects/${projectId}/deliverables` : "/projects";
  const safeReturnPath =
    projectId && (returnPath.startsWith("/client-portal/") || returnPath.startsWith(`/projects/${projectId}`))
      ? returnPath
      : fallbackPath;
  const redirectWithStatus = (key: string, value: string): never => {
    redirect(`${safeReturnPath}${safeReturnPath.includes("?") ? "&" : "?"}${key}=${value}`);
  };

  if (!projectId || !category || !assignmentsJson) {
    redirectWithStatus("error", "album-category-invalid");
  }

  let photoIds: string[] = [];
  try {
    const parsed = JSON.parse(assignmentsJson) as unknown;
    if (Array.isArray(parsed)) {
      photoIds = parsed.map((item) => String(item)).filter(Boolean);
    }
  } catch {
    redirectWithStatus("error", "album-category-invalid");
  }

  if (photoIds.length === 0) {
    redirectWithStatus("error", "album-category-invalid");
  }

  const db = getDb();
  ensureProjectDeliverablesTable();
  const timestamp = new Date().toISOString();
  const updateSection = db.prepare(
    "UPDATE project_deliverables SET album_section = ?, updated_at = ? WHERE id = ? AND project_id = ? AND media_type = ?"
  );

  for (const photoId of photoIds) {
    updateSection.run(category, timestamp, photoId, projectId, "PHOTO");
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/deliverables`);
  if (safeReturnPath.startsWith("/client-portal/")) {
    revalidatePath(safeReturnPath.split("?")[0]);
  }
  redirectWithStatus("categorySaved", "1");
}

export async function deleteProjectDeliverableAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const deliverableId = getString(formData, "deliverableId");
  const returnPath = getString(formData, "returnPath") || `/projects/${projectId}/deliverables`;

  if (!projectId || !deliverableId) {
    redirect(`/projects/${projectId || ""}/deliverables?error=deliverable-invalid`);
  }

  const db = getDb();
  ensureProjectDeliverablesTable();
  const deliverable = db
    .prepare("SELECT title FROM project_deliverables WHERE id = ? AND project_id = ? LIMIT 1")
    .get(deliverableId, projectId) as { title?: string } | undefined;

  if (!deliverable) {
    redirect(`/projects/${projectId}/deliverables?error=deliverable-missing`);
  }

  const timestamp = new Date().toISOString();
  db.prepare("DELETE FROM project_deliverables WHERE id = ? AND project_id = ?").run(deliverableId, projectId);
  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity(`${deliverable.title || "Deliverable"} deleted`, timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}/deliverables`);
  revalidatePath(`/projects/${projectId}`);
  const safeReturnPath =
    returnPath.startsWith(`/projects/${projectId}`) || returnPath.startsWith("/client-portal/")
      ? returnPath
      : `/projects/${projectId}/deliverables`;
  if (safeReturnPath.startsWith("/client-portal/")) {
    revalidatePath(safeReturnPath.split("?")[0]);
  }
  redirect(`${safeReturnPath}${safeReturnPath.includes("?") ? "&" : "?"}deliverableDeleted=1`);
}

export async function deleteProjectPhotoAlbumAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const albumTitle = getString(formData, "albumTitle");
  const returnPath = getString(formData, "returnPath") || `/projects/${projectId}/deliverables`;

  if (!projectId || !albumTitle) {
    redirect(`/projects/${projectId || ""}/deliverables?error=deliverable-invalid`);
  }

  const db = getDb();
  ensureProjectDeliverablesTable();
  const existing = db
    .prepare(
      "SELECT COUNT(*) as count FROM project_deliverables WHERE project_id = ? AND media_type = 'PHOTO' AND COALESCE(album_title, 'Final Gallery') = ?"
    )
    .get(projectId, albumTitle) as { count?: number } | undefined;

  if (!existing?.count) {
    redirect(`/projects/${projectId}/deliverables?error=deliverable-missing`);
  }

  const timestamp = new Date().toISOString();
  db.prepare(
    "DELETE FROM project_deliverables WHERE project_id = ? AND media_type = 'PHOTO' AND COALESCE(album_title, 'Final Gallery') = ?"
  ).run(projectId, albumTitle);
  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity(`${albumTitle} deleted`, timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}/deliverables`);
  revalidatePath(`/projects/${projectId}`);
  const safeReturnPath =
    returnPath.startsWith(`/projects/${projectId}`) || returnPath.startsWith("/client-portal/")
      ? returnPath
      : `/projects/${projectId}/deliverables`;
  if (safeReturnPath.startsWith("/client-portal/")) {
    revalidatePath(safeReturnPath.split("?")[0]);
  }
  redirect(`${safeReturnPath}${safeReturnPath.includes("?") ? "&" : "?"}deliverableDeleted=1`);
}

export async function createProjectFileAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const fileType = getString(formData, "fileType").toUpperCase();
  const customTitle = getString(formData, "title");
  const customSummary = getString(formData, "summary");

  if (!projectId || !fileType) {
    redirect(`/projects/${projectId || ""}?tab=files&error=smart-file-invalid`);
  }

  const template = getProjectFileTemplate(fileType);
  const title = customTitle || template.title;
  const summary = customSummary || template.summary;
  const timestamp = new Date().toISOString();
  const db = getDb();
  const newFileId = randomUUID();

  db.prepare(
    "INSERT INTO project_files (id, project_id, type, title, summary, status, visibility, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    newFileId,
    projectId,
    fileType,
    title,
    summary,
    template.status,
    template.visibility,
    template.body,
    timestamp,
    timestamp
  );

  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity(`${title} created`, timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}/files/${newFileId}?created=1`);
}

export async function saveProjectFileAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const fileId = getString(formData, "fileId");
  const fileType = getString(formData, "fileType").toUpperCase();
  const title = getString(formData, "title");
  const summary = getString(formData, "summary");
  const status = getString(formData, "status");
  const visibility = getString(formData, "visibility");
  const body = getString(formData, "body");

  if (!projectId || !title || !summary || !status || !visibility || !body) {
    redirect(`/projects/${projectId || ""}?tab=files&error=smart-file-invalid`);
  }

  const db = getDb();
  const timestamp = new Date().toISOString();

  if (fileId) {
    db.prepare(
      "UPDATE project_files SET title = ?, summary = ?, status = ?, visibility = ?, body = ?, updated_at = ? WHERE id = ? AND project_id = ?"
    ).run(title, summary, status, visibility, body, timestamp, fileId, projectId);
    updateProjectRecentActivity(
      db,
      projectId,
      createRecentActivity(`${title} updated`, timestamp),
      timestamp
    );
    revalidatePath(`/projects/${projectId}`);
    redirect(`/projects/${projectId}/files/${fileId}?saved=1`);
  }

  const template = getProjectFileTemplate(fileType);
  const newFileId = randomUUID();
  db.prepare(
    "INSERT INTO project_files (id, project_id, type, title, summary, status, visibility, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    newFileId,
    projectId,
    fileType,
    title,
    summary,
    status || template.status,
    visibility || template.visibility,
    body,
    timestamp,
    timestamp
  );

  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity(`${title} created`, timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}/files/${newFileId}?created=1`);
}

export async function saveVideoPaywallAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const paywallId = getString(formData, "paywallId");
  const rawTitle = getString(formData, "title");
  const rawDescription = getString(formData, "description");
  const price = Number(getString(formData, "price"));
  const coverImage = getString(formData, "coverImage");
  const coverImageFile = getUploadFile(formData, "coverImageFile");
  const synologyDownloadUrl = getString(formData, "synologyDownloadUrl");
  const returnPath = getString(formData, "returnPath");
  const fallbackPath = paywallId
    ? `/projects/${projectId || ""}/video-paywalls/${paywallId}`
    : `/projects/${projectId || ""}/video-paywalls/new`;
  const safeReturnPath =
    projectId && returnPath && (returnPath.startsWith(`/projects/${projectId}`) || returnPath.startsWith("/client-portal/"))
      ? returnPath
      : fallbackPath;
  const withStatus = (path: string, key: string, value: string) =>
    `${path}${path.includes("?") ? "&" : "?"}${key}=${value}`;

  if (!projectId || Number.isNaN(price) || price <= 0 || !synologyDownloadUrl) {
    redirect(withStatus(fallbackPath, "error", "paywall-invalid"));
  }

  const db = getDb();
  ensureVideoPaywallsTable();
  const project = db
    .prepare("SELECT id, client FROM projects WHERE id = ? LIMIT 1")
    .get(projectId) as { id: string; client: string } | undefined;

  if (!project) {
    redirect("/projects?error=project-missing");
  }

  const title = rawTitle || `${project.client} Bonus Film`;
  const description = rawDescription || "A premium add-on film available for purchase.";

  const timestamp = new Date().toISOString();
  let nextCoverImage = coverImage;
  if (coverImageFile) {
    if (!coverImageFile.type.startsWith("image/")) {
      redirect(withStatus(safeReturnPath, "error", "gallery-cover-type"));
    }
    nextCoverImage = await saveProjectDeliverableBanner(coverImageFile);
  }

  if (paywallId) {
    const existing = db
      .prepare("SELECT public_token, status FROM video_paywalls WHERE id = ? AND project_id = ? LIMIT 1")
      .get(paywallId, projectId) as { public_token?: string; status?: string } | undefined;

    if (!existing?.public_token) {
      redirect(`/projects/${projectId}/video-paywalls/new?error=paywall-invalid`);
    }

    db.prepare(
      "UPDATE video_paywalls SET title = ?, description = ?, price = ?, cover_image = ?, synology_download_url = ?, updated_at = ? WHERE id = ? AND project_id = ?"
    ).run(title, description, price, nextCoverImage, synologyDownloadUrl, timestamp, paywallId, projectId);
    db.prepare(
      "UPDATE project_files SET title = ?, summary = ?, status = ?, linked_path = ?, body = ?, updated_at = ? WHERE project_id = ? AND type = 'VIDEO_PAYWALL' AND linked_path = ?"
    ).run(
      title,
      `Paid video download for ${project.client}`,
      existing.status === "PAID" ? "Paid" : "Ready to sell",
      `/projects/${projectId}/video-paywalls/${paywallId}`,
      `Video paywall: ${title}\nPrice: $${price}\nPublic link: /video-paywall/${existing.public_token}`,
      timestamp,
      projectId,
      `/projects/${projectId}/video-paywalls/${paywallId}`
    );

    updateProjectRecentActivity(db, projectId, createRecentActivity(`${title} paywall updated`, timestamp), timestamp);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/video-paywalls/${paywallId}`);
    revalidatePath(`/projects/${projectId}/deliverables`);
    revalidatePath(`/video-paywall/${existing.public_token}`);
    if (safeReturnPath.startsWith("/client-portal/")) {
      revalidatePath(safeReturnPath.split("?")[0]);
    }
    redirect(withStatus(safeReturnPath, "paywallSaved", "1"));
  }

  const newPaywallId = randomUUID();
  const publicToken = createVideoPaywallToken();
  db.prepare(
    "INSERT INTO video_paywalls (id, project_id, title, description, price, cover_image, synology_download_url, public_token, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    newPaywallId,
    projectId,
    title,
    description,
    price,
    nextCoverImage,
    synologyDownloadUrl,
    publicToken,
    "READY",
    timestamp,
    timestamp
  );
  db.prepare(
    "INSERT INTO project_files (id, project_id, type, title, summary, status, visibility, linked_path, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    projectId,
    "VIDEO_PAYWALL",
    title,
    `Paid video download for ${project.client}`,
    "Ready to sell",
    "Shared",
    `/projects/${projectId}/video-paywalls/${newPaywallId}`,
    `Video paywall: ${title}\nPrice: $${price}\nPublic link: /video-paywall/${publicToken}`,
    timestamp,
    timestamp
  );

  updateProjectRecentActivity(db, projectId, createRecentActivity(`${title} paywall created`, timestamp), timestamp);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/video-paywalls/${newPaywallId}`);
  revalidatePath(`/projects/${projectId}/deliverables`);
  revalidatePath(`/video-paywall/${publicToken}`);
  if (safeReturnPath.startsWith("/client-portal/")) {
    revalidatePath(safeReturnPath.split("?")[0]);
  }
  redirect(withStatus(safeReturnPath, "paywallCreated", "1"));
}

export async function deleteVideoPaywallAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const paywallId = getString(formData, "paywallId");
  const returnPath = getString(formData, "returnPath");

  if (!projectId || !paywallId) {
    redirect(`/projects/${projectId || ""}?tab=buy-videos&error=paywall-invalid`);
  }

  const db = getDb();
  ensureVideoPaywallsTable();
  const existing = db
    .prepare("SELECT title, public_token FROM video_paywalls WHERE id = ? AND project_id = ? LIMIT 1")
    .get(paywallId, projectId) as { title?: string; public_token?: string } | undefined;

  if (!existing) {
    redirect(`/projects/${projectId}?tab=buy-videos&error=paywall-invalid`);
  }

  const timestamp = new Date().toISOString();
  db.prepare("DELETE FROM video_paywalls WHERE id = ? AND project_id = ?").run(paywallId, projectId);
  db.prepare("DELETE FROM project_files WHERE project_id = ? AND type = 'VIDEO_PAYWALL' AND linked_path = ?").run(
    projectId,
    `/projects/${projectId}/video-paywalls/${paywallId}`
  );
  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity(`${existing.title || "Video paywall"} deleted`, timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/deliverables`);
  if (existing.public_token) {
    revalidatePath(`/video-paywall/${existing.public_token}`);
  }
  const safeReturnPath =
    returnPath && (returnPath.startsWith(`/projects/${projectId}`) || returnPath.startsWith("/client-portal/"))
      ? returnPath
      : `/projects/${projectId}?tab=buy-videos`;
  if (safeReturnPath.startsWith("/client-portal/")) {
    revalidatePath(safeReturnPath.split("?")[0]);
  }
  redirect(`${safeReturnPath}${safeReturnPath.includes("?") ? "&" : "?"}paywallDeleted=1`);
}

export async function deleteProjectFileAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const fileId = getString(formData, "fileId");

  if (!projectId || !fileId) {
    redirect(`/projects/${projectId || ""}?tab=files&error=smart-file-invalid`);
  }

  const db = getDb();
  const timestamp = new Date().toISOString();

  if (fileId.startsWith("invoice-file-")) {
    const invoiceId = fileId.replace("invoice-file-", "");
    const invoice = db
      .prepare("SELECT id, label, public_token FROM invoices WHERE id = ? LIMIT 1")
      .get(invoiceId) as { id: string; label?: string; public_token?: string | null } | undefined;

    if (!invoice) {
      redirect(`/projects/${projectId}?tab=files&error=smart-file-invalid`);
    }

    db.prepare("DELETE FROM invoices WHERE id = ?").run(invoiceId);
    db.prepare("DELETE FROM project_files WHERE project_id = ? AND type = 'INVOICE' AND linked_path = ?").run(
      projectId,
      `/projects/${projectId}/invoices/${invoiceId}`
    );
    updateProjectRecentActivity(
      db,
      projectId,
      createRecentActivity(`${invoice.label || "Invoice"} deleted`, timestamp),
      timestamp
    );

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/invoices");
    revalidatePath("/overview");
    if (invoice.public_token) {
      revalidatePath(`/invoice/${invoice.public_token}`);
    }
    redirect(`/projects/${projectId}?tab=files&fileDeleted=1`);
  }

  const existingFile = db
    .prepare("SELECT title, type, linked_path FROM project_files WHERE id = ? AND project_id = ? LIMIT 1")
    .get(fileId, projectId) as { title?: string; type?: string; linked_path?: string | null } | undefined;

  if (!existingFile) {
    redirect(`/projects/${projectId}?tab=files&error=smart-file-invalid`);
  }

  if (existingFile.type === "VIDEO_PAYWALL" && existingFile.linked_path) {
    const paywallId = existingFile.linked_path.split("/").filter(Boolean).at(-1) || "";
    if (paywallId) {
      db.prepare("DELETE FROM video_paywalls WHERE id = ? AND project_id = ?").run(paywallId, projectId);
    }
  }

  db.prepare("DELETE FROM project_files WHERE id = ? AND project_id = ?").run(fileId, projectId);
  updateProjectRecentActivity(
    db,
    projectId,
    createRecentActivity(`${existingFile.title || "Project file"} deleted`, timestamp),
    timestamp
  );

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}?tab=files&fileDeleted=1`);
}

export async function createProposalAction(formData: FormData) {
  await requireUser();

  const projectId = getString(formData, "projectId");
  const client = getString(formData, "client");
  const recipientEmail = getString(formData, "recipientEmail");
  const title = getString(formData, "title");
  const amount = Number(getString(formData, "amount"));
  const expiresDate = getString(formData, "expiresDate");
  const sectionsInput = getString(formData, "sections");
  const lineItemsInput = getString(formData, "lineItems");
  const emailSubject = getString(formData, "emailSubject");
  const emailBody = getString(formData, "emailBody");

  if (
    !client ||
    !recipientEmail ||
    !title ||
    Number.isNaN(amount) ||
    !expiresDate ||
    !sectionsInput ||
    !lineItemsInput ||
    !emailSubject ||
    !emailBody
  ) {
    redirect("/proposals?error=proposal-invalid");
  }

  const sections = sectionsInput
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (sections.length === 0) {
    redirect("/proposals?error=proposal-invalid");
  }

  const lineItems = parseLineItems(lineItemsInput);

  if (lineItems.length === 0) {
    redirect("/proposals?error=proposal-invalid");
  }

  const proposalId = randomUUID();
  const publicToken = randomUUID();
  const timestamp = new Date().toISOString();
  const db = getDb();
  const existingProject = projectId
    ? ((db
        .prepare("SELECT id FROM projects WHERE id = ? LIMIT 1")
        .get(projectId) as { id?: string } | undefined) ??
      undefined)
    : ((db
        .prepare("SELECT id FROM projects WHERE client = ? ORDER BY updated_at DESC LIMIT 1")
        .get(client) as { id?: string } | undefined) ??
      undefined);
  const existingClient = db
    .prepare("SELECT id FROM clients WHERE name = ? LIMIT 1")
    .get(client) as { id?: string } | undefined;

  const proposalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/p/${publicToken}`;
  const plainText = `${emailBody}\n\nProposal: ${title}\nAmount: $${amount}\nReview your proposal: ${proposalUrl}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1b18;">
      <h2 style="margin-bottom: 12px;">${title}</h2>
      <p>${emailBody.replace(/\n/g, "<br />")}</p>
      <p style="margin-top: 20px;"><strong>Client:</strong> ${client}</p>
      <p><strong>Amount:</strong> $${amount}</p>
      <p><strong>Expires:</strong> ${expiresDate}</p>
      <p><strong>Sections:</strong> ${sections.join(", ")}</p>
      <ul>
        ${lineItems
          .map(
            (item) =>
              `<li><strong>${item.title}</strong> - ${item.description} ($${item.amount})</li>`
          )
          .join("")}
      </ul>
      <p style="margin-top: 20px;">
        Review your proposal: <a href="${proposalUrl}">${proposalUrl}</a>
      </p>
    </div>
  `;

  try {
    await sendProposalEmail({
      to: recipientEmail,
      subject: emailSubject,
      text: plainText,
      html,
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "SMTP_NOT_CONFIGURED"
        ? "smtp-missing"
        : "send-failed";
    redirect(`/proposals?error=${reason}`);
  }

  db.prepare(
    "INSERT INTO proposals (id, title, client, status, amount, sent_date, expires_date, sections, line_items, recipient_email, email_subject, email_body, public_token, client_comment, signature_name, signed_at, rejected_at, sent_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    proposalId,
    title,
    client,
    "SENT",
    amount,
    timestamp,
    expiresDate,
    JSON.stringify(sections),
    JSON.stringify(lineItems),
    recipientEmail,
    emailSubject,
    emailBody,
    publicToken,
    "",
    "",
    null,
    null,
    timestamp,
    timestamp,
    timestamp
  );

  if (existingProject?.id) {
    db.prepare(
      "INSERT INTO project_files (id, project_id, type, title, summary, status, visibility, linked_path, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      randomUUID(),
      existingProject.id,
      "PROPOSAL",
      title,
      `Proposal sent to ${client} for ${currencyFormatter.format(amount)}.`,
      "Sent",
      "Shared",
      `/p/${publicToken}`,
      `${emailBody}\n\nSections: ${sections.join(", ")}\n\nLine items:\n${lineItems
        .map((item) => `- ${item.title}: ${item.description} ($${item.amount})`)
        .join("\n")}\n\nPublic link: ${proposalUrl}`,
      timestamp,
      timestamp
    );
    logProjectMessage(db, {
      sender: "Sam Visual",
      clientName: client,
      projectId: existingProject.id,
      direction: "OUTBOUND",
      channel: "Email",
      time: timestamp,
      subject: emailSubject,
      preview: emailBody,
      unread: 0,
    });
    updateProjectRecentActivity(
      db,
      existingProject.id,
      createRecentActivity("Proposal emailed", timestamp),
      timestamp
    );
    revalidatePath(`/projects/${existingProject.id}`);
  }

  if (existingClient?.id) {
    db.prepare(
      "UPDATE clients SET contact_email = COALESCE(NULLIF(contact_email, ''), ?), updated_at = ? WHERE id = ?"
    ).run(recipientEmail, timestamp, existingClient.id);
  }

  revalidatePath("/proposals");
  revalidatePath("/overview");
  redirect("/proposals?sent=1");
}

export async function createPackagePresetAction(formData: FormData) {
  await requireUser();

  const category = getString(formData, "category");
  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const proposalTitle = getString(formData, "proposalTitle");
  const amount = Number(getString(formData, "amount"));
  const sectionsInput = getString(formData, "sections");
  const lineItemsInput = getString(formData, "lineItems");
  const emailSubject = getString(formData, "emailSubject");
  const emailBody = getString(formData, "emailBody");
  const coverImageFile = getUploadFile(formData, "coverImage");

  if (
    !category ||
    !name ||
    !proposalTitle ||
    Number.isNaN(amount) ||
    !sectionsInput ||
    !lineItemsInput ||
    !emailSubject ||
    !emailBody
  ) {
    redirect("/packages?error=preset-invalid");
  }

  const sections = sectionsInput
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const lineItems = parseLineItems(lineItemsInput);

  if (sections.length === 0 || lineItems.length === 0) {
    redirect("/packages?error=preset-invalid");
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  const coverImage = coverImageFile ? await savePackageCover(coverImageFile) : "";
  const createdId = randomUUID();
  const nextLibraryOrder =
    Number(
      (
        db.prepare("SELECT COALESCE(MAX(template_library_order), -1) AS max_order FROM package_presets").get() as {
          max_order?: number | null;
        }
      )?.max_order ?? -1
    ) + 1;
  db.prepare(
    "INSERT INTO package_presets (id, template_set_id, template_set_name, template_set_order, template_library_order, category, name, description, proposal_title, amount, sections, line_items, cover_image, email_subject, email_body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    createdId,
    createdId,
    name,
    0,
    nextLibraryOrder,
    category,
    name,
    description,
    proposalTitle,
    amount,
    JSON.stringify(sections),
    JSON.stringify(lineItems),
    coverImage,
    emailSubject,
    emailBody,
    timestamp,
    timestamp
  );

  revalidatePath("/proposals");
  revalidatePath("/packages");
  revalidatePath(`/packages/${createdId}`);
  redirect(
    `/packages/${encodeURIComponent(createdId)}?saved=1`
  );
}

export async function createPackageTemplateBundleAction(formData: FormData) {
  await requireUser();

  const category = getString(formData, "category");
  const bundleInput = getString(formData, "packageBundle");
  const templateSetName = getString(formData, "templateSetName");
  const templateSetId = getString(formData, "templateSetId");
  const templateSetCoverPosition = getString(formData, "templateSetCoverPosition") || "50% 50%";
  const representativeId = getString(formData, "representativeId");
  const templateSetCoverImageFile = getUploadFile(formData, "templateSetCoverImage");
  if (!category || !bundleInput) {
    redirect("/packages/new?error=preset-invalid");
  }

    let packageBundle: Array<{
      name?: string;
      subtitle?: string;
      description?: string;
    proposalTitle?: string;
    amount?: number | string;
    coverPosition?: string;
    sections?: string[];
    lineItems?: Array<{ title?: string; description?: string; amount?: number | string }>;
    emailSubject?: string;
    emailBody?: string;
  }> = [];

  try {
    packageBundle = JSON.parse(bundleInput);
  } catch {
    redirect("/packages/new?error=preset-invalid");
  }

    const normalizedBundle = packageBundle
      .map((item) => ({
        name: String(item.name || "").trim(),
        subtitle: String(item.subtitle || "").trim(),
        description: String(item.description || "").trim(),
        proposalTitle: String(item.proposalTitle || "").trim(),
      amount: Number(item.amount || 0),
      coverPosition: String(item.coverPosition || "50% 50%").trim() || "50% 50%",
      sections: Array.isArray(item.sections)
        ? item.sections.map((section) => String(section || "").trim()).filter(Boolean)
        : [],
      lineItems: Array.isArray(item.lineItems)
        ? item.lineItems
            .map((lineItem) => ({
              title: String(lineItem.title || "").trim(),
              description: String(lineItem.description || "").trim(),
              amount: Number(lineItem.amount || 0),
            }))
            .filter((lineItem) => lineItem.title && !Number.isNaN(lineItem.amount))
        : [],
      emailSubject: String(item.emailSubject || "").trim(),
      emailBody: String(item.emailBody || "").trim(),
    }))
    .filter(
      (item) =>
        item.name &&
        item.proposalTitle &&
        !Number.isNaN(item.amount) &&
        item.sections.length > 0 &&
        item.lineItems.length > 0 &&
        item.emailSubject &&
        item.emailBody
    );

  if (normalizedBundle.length === 0) {
    redirect("/packages/new?error=preset-invalid");
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  const normalizedCategory = normalizePackageCategoryValue(category);
  const nextTemplateSetName = templateSetName || `${normalizedCategory} package template`;
  const nextLibraryOrder =
    Number(
      (
        db.prepare("SELECT COALESCE(MAX(template_library_order), -1) AS max_order FROM package_presets").get() as {
          max_order?: number | null;
        }
      )?.max_order ?? -1
    ) + 1;
  const resolvedTemplateSetId =
    templateSetId ||
    (representativeId
      ? String(
          (
            db
              .prepare("SELECT template_set_id FROM package_presets WHERE id = ? LIMIT 1")
              .get(representativeId) as { template_set_id?: string | null } | undefined
          )?.template_set_id || ""
        )
      : "") ||
    randomUUID();

  const existingSetPresets = (
    resolvedTemplateSetId
        ? (db
            .prepare(
              "SELECT id, cover_image, template_set_cover_image, template_set_cover_position, template_set_order FROM package_presets WHERE template_set_id = ? ORDER BY template_set_order ASC, amount ASC"
            )
            .all(resolvedTemplateSetId) as Array<{
              id: string;
              cover_image?: string | null;
              template_set_cover_image?: string | null;
              template_set_cover_position?: string | null;
              template_set_order?: number | null;
              template_library_order?: number | null;
            }>)
      : []
  ).sort(
    (left, right) => Number(left.template_set_order || 0) - Number(right.template_set_order || 0)
    );

      const insertPreset = db.prepare(
    "INSERT INTO package_presets (id, template_set_id, template_set_name, template_set_cover_image, template_set_cover_position, template_set_order, template_library_order, category, name, subtitle, description, proposal_title, amount, sections, line_items, cover_image, cover_position, email_subject, email_body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const updatePreset = db.prepare(
    "UPDATE package_presets SET template_set_id = ?, template_set_name = ?, template_set_cover_image = ?, template_set_cover_position = ?, template_set_order = ?, template_library_order = ?, category = ?, name = ?, subtitle = ?, description = ?, proposal_title = ?, amount = ?, sections = ?, line_items = ?, cover_image = ?, cover_position = ?, email_subject = ?, email_body = ?, updated_at = ? WHERE id = ?"
    );
    const resolvedLibraryOrder =
      existingSetPresets.length > 0
        ? Number(existingSetPresets[0]?.template_library_order ?? nextLibraryOrder)
        : nextLibraryOrder;
    let templateSetCoverImage = String(existingSetPresets[0]?.template_set_cover_image ?? "");
    const resolvedTemplateSetCoverPosition =
      templateSetCoverPosition || String(existingSetPresets[0]?.template_set_cover_position ?? "50% 50%");

  if (templateSetCoverImageFile) {
    const nextTemplateSetCoverImage = await savePackageCover(templateSetCoverImageFile);
    await deletePackageCoverIfLocal(templateSetCoverImage);
    templateSetCoverImage = nextTemplateSetCoverImage;
  }

  for (const [index, item] of normalizedBundle.entries()) {
    const uploadedCoverImage = getUploadFile(formData, `coverImage_${index}`);
    const existingPreset = existingSetPresets[index];
    let coverImage = String(existingPreset?.cover_image ?? "");

    if (uploadedCoverImage) {
      const nextCoverImage = await savePackageCover(uploadedCoverImage);
      await deletePackageCoverIfLocal(coverImage);
      coverImage = nextCoverImage;
    }

      if (existingPreset?.id) {
        updatePreset.run(
          resolvedTemplateSetId,
          nextTemplateSetName,
          templateSetCoverImage,
          resolvedTemplateSetCoverPosition,
          index,
          resolvedLibraryOrder,
          normalizedCategory,
          item.name,
          item.subtitle,
          item.description,
          item.proposalTitle,
        item.amount,
        JSON.stringify(item.sections),
        JSON.stringify(item.lineItems),
        coverImage,
        item.coverPosition,
        item.emailSubject,
        item.emailBody,
        timestamp,
        existingPreset.id
      );
      continue;
    }

      insertPreset.run(
        randomUUID(),
        resolvedTemplateSetId,
        nextTemplateSetName,
        templateSetCoverImage,
        resolvedTemplateSetCoverPosition,
        index,
        resolvedLibraryOrder,
        normalizedCategory,
        item.name,
        item.subtitle,
        item.description,
        item.proposalTitle,
      item.amount,
      JSON.stringify(item.sections),
      JSON.stringify(item.lineItems),
      coverImage,
      item.coverPosition,
      item.emailSubject,
      item.emailBody,
      timestamp,
      timestamp
    );
  }

  const stalePresets = existingSetPresets.slice(normalizedBundle.length);
  for (const stalePreset of stalePresets) {
    await deletePackageCoverIfLocal(String(stalePreset.cover_image ?? ""));
    db.prepare("DELETE FROM package_presets WHERE id = ?").run(stalePreset.id);
  }

  revalidatePath("/proposals");
  revalidatePath("/packages");
  revalidatePath(`/packages/new?templateSetId=${encodeURIComponent(resolvedTemplateSetId)}`);
  redirect(`/packages?category=${encodeURIComponent(normalizedCategory)}&saved=1`);
}

export async function createDocumentTemplateAction(formData: FormData) {
  await requireUser();

  const name = getString(formData, "name");
  const clientType = getString(formData, "clientType");
  const templateType = getString(formData, "templateType");
  const summary = getString(formData, "summary");
  const body = getString(formData, "body");
  const returnTo = getString(formData, "returnTo");

  if (!name || !clientType || !templateType || !summary || !body) {
    redirect("/templates?error=template-invalid");
  }

  ensureDocumentTemplatesTable();
  const timestamp = new Date().toISOString();
  getDb()
    .prepare(
      "INSERT INTO document_templates (id, name, client_type, template_type, summary, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(randomUUID(), name, clientType, templateType, summary, body, timestamp, timestamp);

  revalidatePath("/templates");
  redirect(returnTo.startsWith("/templates/") ? `${returnTo}?saved=1` : "/templates?saved=1");
}

export async function createInvoiceTemplateAction(formData: FormData) {
  await requireUser();

  const templateId = getString(formData, "templateId");
  const label = getString(formData, "label");
  const clientType = getString(formData, "clientType") || "Wedding";
  const dueDate = getString(formData, "dueDate");
  const method = getString(formData, "method");
  const taxRate = Number(getString(formData, "taxRate") || "0");
  const lineItems = parseInvoiceLineItems(getString(formData, "lineItems"));
  const paymentSchedule = parsePaymentSchedule(getString(formData, "paymentSchedule"));
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const taxAmount = Math.round(subtotal * (Number.isNaN(taxRate) ? 0 : taxRate)) / 100;
  const amount = subtotal + taxAmount;

  if (
    !label ||
    !dueDate ||
    !method ||
    Number.isNaN(taxRate) ||
    lineItems.length === 0 ||
    paymentSchedule.length === 0 ||
    Number.isNaN(amount)
  ) {
    redirect("/templates/invoice?error=template-invalid");
  }

  ensureDocumentTemplatesTable();
  const timestamp = new Date().toISOString();
  const body = JSON.stringify({
    label,
    dueDate,
    method,
    taxRate,
    lineItems,
    paymentSchedule,
    amount,
  });

  const summary = `Invoice template with ${lineItems.length} item${lineItems.length === 1 ? "" : "s"} and ${paymentSchedule.length} payment${paymentSchedule.length === 1 ? "" : "s"}.`;
  const db = getDb();

  if (templateId) {
    db.prepare(
      "UPDATE document_templates SET name = ?, client_type = ?, template_type = ?, summary = ?, body = ?, updated_at = ? WHERE id = ?"
    ).run(label, clientType, "Invoice", summary, body, timestamp, templateId);
  } else {
    db.prepare(
      "INSERT INTO document_templates (id, name, client_type, template_type, summary, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(randomUUID(), label, clientType, "Invoice", summary, body, timestamp, timestamp);
  }

  revalidatePath("/templates");
  revalidatePath("/templates/invoice");
  redirect("/templates/invoice?saved=1");
}

export async function deleteDocumentTemplateAction(formData: FormData) {
  await requireUser();

  const id = getString(formData, "id");
  const returnTo = getString(formData, "returnTo");

  if (!id) {
    redirect("/templates?error=template-invalid");
  }

  ensureDocumentTemplatesTable();
  getDb().prepare("DELETE FROM document_templates WHERE id = ?").run(id);

  revalidatePath("/templates");
  redirect(returnTo.startsWith("/templates/") ? `${returnTo}?deleted=1` : "/templates?deleted=1");
}

export async function updatePackagePresetAction(formData: FormData) {
  await requireUser();

  const id = getString(formData, "id");
  const category = getString(formData, "category");
  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const proposalTitle = getString(formData, "proposalTitle");
  const amount = Number(getString(formData, "amount"));
  const sectionsInput = getString(formData, "sections");
  const lineItemsInput = getString(formData, "lineItems");
  const emailSubject = getString(formData, "emailSubject");
  const emailBody = getString(formData, "emailBody");
  const coverImageFile = getUploadFile(formData, "coverImage");
  const removeCoverImage = getString(formData, "removeCoverImage") === "1";

  if (
    !id ||
    !category ||
    !name ||
    !proposalTitle ||
    Number.isNaN(amount) ||
    !sectionsInput ||
    !lineItemsInput ||
    !emailSubject ||
    !emailBody
  ) {
    redirect("/packages?error=preset-invalid");
  }

  const sections = sectionsInput
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const lineItems = parseLineItems(lineItemsInput);

  if (sections.length === 0 || lineItems.length === 0) {
    redirect("/packages?error=preset-invalid");
  }

  const db = getDb();
  const existingPreset = db
    .prepare("SELECT cover_image FROM package_presets WHERE id = ?")
    .get(id) as { cover_image?: string } | undefined;
  let nextCoverImage = String(existingPreset?.cover_image ?? "");

  if (coverImageFile) {
    const uploadedCoverImage = await savePackageCover(coverImageFile);
    await deletePackageCoverIfLocal(nextCoverImage);
    nextCoverImage = uploadedCoverImage;
  } else if (removeCoverImage) {
    await deletePackageCoverIfLocal(nextCoverImage);
    nextCoverImage = "";
  }

  db.prepare(
    "UPDATE package_presets SET category = ?, name = ?, description = ?, proposal_title = ?, amount = ?, sections = ?, line_items = ?, cover_image = ?, email_subject = ?, email_body = ?, updated_at = ? WHERE id = ?"
  ).run(
    category,
    name,
    description,
    proposalTitle,
    amount,
    JSON.stringify(sections),
    JSON.stringify(lineItems),
    nextCoverImage,
    emailSubject,
    emailBody,
    new Date().toISOString(),
    id
  );

  revalidatePath("/proposals");
  revalidatePath("/packages");
  revalidatePath(`/packages/${id}`);
  redirect(
    `/packages/${encodeURIComponent(id)}?updated=1`
  );
}

export async function deletePackagePresetAction(formData: FormData) {
  await requireUser();

  const id = getString(formData, "id");
  const activeCategory = normalizePackageCategoryValue(getString(formData, "activeCategory"));

  if (!id) {
    redirect("/packages?error=preset-invalid");
  }

  const db = getDb();
  const existingPreset = db
    .prepare("SELECT cover_image FROM package_presets WHERE id = ?")
    .get(id) as { cover_image?: string } | undefined;
  await deletePackageCoverIfLocal(String(existingPreset?.cover_image ?? ""));
  db.prepare("DELETE FROM package_presets WHERE id = ?").run(id);

  revalidatePath("/proposals");
  revalidatePath("/packages");
  redirect(`/packages?category=${encodeURIComponent(activeCategory || "Wedding")}&deleted=1`);
}

export async function deletePackageTemplateSetAction(formData: FormData) {
  await requireUser();

  const templateSetId = getString(formData, "resolvedTemplateSetId") || getString(formData, "templateSetId");
  const representativeId = getString(formData, "representativeId");
  const activeCategory = normalizePackageCategoryValue(getString(formData, "activeCategory"));

  if (!templateSetId && !representativeId) {
    redirect("/packages?error=preset-invalid");
  }

  const db = getDb();
  let presetsToDelete = templateSetId
    ? (db
        .prepare("SELECT id, cover_image FROM package_presets WHERE template_set_id = ?")
        .all(templateSetId) as Array<{ id: string; cover_image?: string | null }>)
    : (db
        .prepare("SELECT id, cover_image FROM package_presets WHERE id = ?")
        .all(representativeId) as Array<{ id: string; cover_image?: string | null }>);

  if (presetsToDelete.length === 0 && representativeId) {
    presetsToDelete = db
      .prepare("SELECT id, cover_image FROM package_presets WHERE id = ?")
      .all(representativeId) as Array<{ id: string; cover_image?: string | null }>;
  }

  for (const preset of presetsToDelete) {
    await deletePackageCoverIfLocal(String(preset.cover_image ?? ""));
    db.prepare("DELETE FROM package_presets WHERE id = ?").run(preset.id);
  }

  revalidatePath("/proposals");
  revalidatePath("/packages");
  redirect(`/packages?category=${encodeURIComponent(activeCategory || "Wedding")}&deleted=1`);
}

export async function updatePackageTemplateSetOrderAction(formData: FormData) {
  await requireUser();

  const activeCategory = normalizePackageCategoryValue(getString(formData, "activeCategory"));
  const orderedTemplateSetIds = getSelectedValues(formData, "orderedTemplateSetIds");
  const orderedRepresentativeIds = getSelectedValues(formData, "orderedRepresentativeIds");

  if (orderedTemplateSetIds.length === 0 && orderedRepresentativeIds.length === 0) {
    redirect(`/packages?category=${encodeURIComponent(activeCategory || "Wedding")}`);
  }

  const db = getDb();
  const updateByTemplateSet = db.prepare(
    "UPDATE package_presets SET template_library_order = ?, updated_at = ? WHERE template_set_id = ?"
  );
  const updateByRepresentative = db.prepare(
    "UPDATE package_presets SET template_library_order = ?, updated_at = ? WHERE id = ?"
  );
  const timestamp = new Date().toISOString();

  orderedTemplateSetIds.forEach((templateSetId, index) => {
    if (templateSetId) {
      updateByTemplateSet.run(index, timestamp, templateSetId);
    }
  });

  orderedRepresentativeIds.forEach((representativeId, index) => {
    if (representativeId) {
      updateByRepresentative.run(index, timestamp, representativeId);
    }
  });

  revalidatePath("/packages");
  redirect(`/packages?category=${encodeURIComponent(activeCategory || "Wedding")}`);
}

export async function restoreDefaultPackagePresetsAction() {
  await requireUser();

  const db = getDb();
  ensureDefaultPackagePresets(db);

  revalidatePath("/proposals");
  revalidatePath("/packages");
  redirect("/packages?restored=1");
}

export async function respondToProposalAction(formData: FormData) {
  const token = getString(formData, "token");
  const intent = getString(formData, "intent");
  const signatureName = getString(formData, "signatureName");
  const clientComment = getString(formData, "clientComment");

  if (!token) {
    redirect("/overview");
  }

  const db = getDb();
  const proposal = db.prepare("SELECT id FROM proposals WHERE public_token = ?").get(token) as
    | { id?: string }
    | undefined;

  if (!proposal?.id) {
    redirect("/overview");
  }

  const timestamp = new Date().toISOString();

  if (intent === "accept") {
    if (!signatureName) {
      redirect(`/p/${token}?error=signature`);
    }

    db.prepare(
      "UPDATE proposals SET status = ?, client_comment = ?, signature_name = ?, signed_at = ?, updated_at = ? WHERE id = ?"
    ).run("SIGNED", clientComment, signatureName, timestamp, timestamp, proposal.id);

    revalidatePath("/proposals");
    redirect(`/p/${token}?accepted=1`);
  }

  if (intent === "reject") {
    if (!clientComment) {
      redirect(`/p/${token}?error=comment`);
    }

    db.prepare(
      "UPDATE proposals SET status = ?, client_comment = ?, rejected_at = ?, updated_at = ? WHERE id = ?"
    ).run("REJECTED", clientComment, timestamp, timestamp, proposal.id);

    revalidatePath("/proposals");
    redirect(`/p/${token}?declined=1`);
  }

  if (!clientComment) {
    redirect(`/p/${token}?error=comment`);
  }

  db.prepare("UPDATE proposals SET client_comment = ?, updated_at = ? WHERE id = ?").run(
    clientComment,
    timestamp,
    proposal.id
  );

  revalidatePath("/proposals");
  redirect(`/p/${token}?commented=1`);
}

export async function sendTestEmailAction(formData: FormData) {
  await requireUser();

  const testEmail = getString(formData, "testEmail");

  if (!testEmail) {
    redirect("/proposals?error=test-invalid");
  }

  try {
    await sendProposalEmail({
      to: testEmail,
      subject: "StudioFlow Gmail SMTP test",
      text:
        "This is a StudioFlow SMTP test email. If you received this, your Gmail SMTP configuration is working.",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1b18;">
          <h2>StudioFlow SMTP Test</h2>
          <p>If you received this email, your Gmail SMTP configuration is working.</p>
          <p>You can now send real proposals from the StudioFlow proposals page.</p>
        </div>
      `,
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "SMTP_NOT_CONFIGURED"
        ? "smtp-missing"
        : "test-failed";
    redirect(`/proposals?error=${reason}`);
  }

  redirect("/proposals?test=1");
}

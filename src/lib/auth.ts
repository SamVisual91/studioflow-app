import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import {
  canAccessPath,
  canAccessBackOffice,
  canManageUsers,
  canManageProjectFiles,
  canViewProjectFinancials,
  getDefaultAppPath,
  normalizeUserRole,
  type CurrentUser,
} from "@/lib/roles";

const SESSION_COOKIE = "studioflow_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type SessionRow = {
  token: string;
  user_id: string;
  expires_at: number;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  avatar_image?: string | null;
  password_hash: string;
};

export async function findUserByEmail(email: string) {
  const db = getDb();
  return (db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined) ?? null;
}

export async function validateUserCredentials(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  return user;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const db = getDb();
  const session = (db
    .prepare("SELECT token, user_id, expires_at FROM sessions WHERE token = ?")
    .get(token) as SessionRow | undefined) ?? null;

  if (!session || session.expires_at < Date.now()) {
    return null;
  }

  return (
    (() => {
      const user = (db
        .prepare("SELECT id, email, name, role, avatar_image FROM users WHERE id = ?")
        .get(session.user_id) as
        | { id: string; email: string; name: string; role?: string | null; avatar_image?: string | null }
        | undefined) ?? null;

      if (!user) {
        return null;
      }

      return {
        ...user,
        role: normalizeUserRole(user.role),
      } satisfies CurrentUser;
    })()
  );
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();

  if (!canManageUsers(user.role)) {
    redirect(getDefaultAppPath(user.role));
  }

  return user;
}

export async function requireBackOfficeAccess() {
  const user = await requireUser();

  if (!canAccessBackOffice(user.role)) {
    redirect(getDefaultAppPath(user.role));
  }

  return user;
}

export async function requireProjectFinancialAccess() {
  const user = await requireUser();

  if (!canViewProjectFinancials(user.role)) {
    redirect(getDefaultAppPath(user.role));
  }

  return user;
}

export async function requireProjectFileManagement() {
  const user = await requireUser();

  if (!canManageProjectFiles(user.role)) {
    redirect(getDefaultAppPath(user.role));
  }

  return user;
}

export async function requirePathAccess(pathname: string) {
  if (pathname === "/login") {
    return null;
  }

  const user = await requireUser();

  if (!canAccessPath(user.role, pathname)) {
    redirect(getDefaultAppPath(user.role));
  }

  return user;
}

export async function createUserSession(userId: string) {
  const db = getDb();
  const token = randomUUID();
  const expiresAt = Date.now() + SESSION_TTL_MS;

  db.prepare(
    "INSERT INTO sessions (id, token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(randomUUID(), token, userId, expiresAt, new Date().toISOString());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }

  cookieStore.delete(SESSION_COOKIE);
}

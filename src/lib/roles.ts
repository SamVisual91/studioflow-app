export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_image?: string | null;
};

const userAllowedPrefixes = ["/projects", "/schedule", "/crm", "/templates", "/packages"];

export function normalizeUserRole(value?: string | null): UserRole {
  if (value === "ADMIN" || value === "USER" || value === "SUPER_ADMIN") {
    return value;
  }

  return "SUPER_ADMIN";
}

export function canManageUsers(role: UserRole) {
  return role === "SUPER_ADMIN";
}

export function canAccessBackOffice(role: UserRole) {
  return role !== "USER";
}

export function canManageProjectBulkActions(role: UserRole) {
  return role !== "USER";
}

export function canCreateProjects(role: UserRole) {
  return role !== "USER";
}

export function canViewProjectFinancials(role: UserRole) {
  return role !== "USER";
}

export function canManageProjectFiles(role: UserRole) {
  return role !== "USER";
}

export function getDefaultAppPath(role: UserRole) {
  return role === "USER" ? "/projects" : "/overview";
}

export function canAccessPath(role: UserRole, pathname: string) {
  if (!pathname || pathname === "/login") {
    return true;
  }

  if (role === "SUPER_ADMIN") {
    return true;
  }

  if (role === "ADMIN") {
    return !pathname.startsWith("/users");
  }

  if (
    pathname.startsWith("/projects/") &&
    (pathname.includes("/invoices") ||
      pathname.includes("/package-brochure") ||
      pathname.includes("/video-paywalls"))
  ) {
    return false;
  }

  return userAllowedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

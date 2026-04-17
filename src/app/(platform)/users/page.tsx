import {
  createUserAccountAction,
  deleteUserAccountAction,
  updateUserProfileAction,
  updateUserPasswordAction,
} from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionHeader } from "@/components/dashboard-ui";
import { UserRoleForm } from "@/components/user-role-form";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getDb } from "@/lib/db";
import { type UserRole } from "@/lib/roles";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

const roleOptions: Array<{ value: UserRole; label: string; description: string }> = [
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    description: "Full access to the app and user management.",
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "Full app access except user management.",
  },
  {
    value: "USER",
    label: "User",
    description: "Projects, Schedule, Production, and Templates only.",
  },
];

function formatRoleLabel(role: UserRole) {
  return role === "SUPER_ADMIN" ? "Super Admin" : role === "ADMIN" ? "Admin" : "User";
}

function getRoleTheme(role: UserRole) {
  if (role === "SUPER_ADMIN") {
    return {
      badge: "bg-[rgba(207,114,79,0.12)] text-[var(--accent)] ring-1 ring-[rgba(207,114,79,0.16)]",
      panel: "border-[rgba(207,114,79,0.14)] bg-[rgba(207,114,79,0.045)]",
      marker: "bg-[var(--accent)]",
      title: "text-[var(--accent)]",
    };
  }

  if (role === "ADMIN") {
    return {
      badge: "bg-[rgba(47,125,92,0.12)] text-[var(--forest)] ring-1 ring-[rgba(47,125,92,0.18)]",
      panel: "border-[rgba(47,125,92,0.14)] bg-[rgba(47,125,92,0.05)]",
      marker: "bg-[var(--forest)]",
      title: "text-[var(--forest)]",
    };
  }

  return {
    badge: "bg-[rgba(15,23,42,0.08)] text-[var(--ink)] ring-1 ring-[rgba(15,23,42,0.08)]",
    panel: "border-[rgba(15,23,42,0.08)] bg-[rgba(15,23,42,0.03)]",
    marker: "bg-[var(--ink)]",
    title: "text-[var(--ink)]",
  };
}

function getRoleSelectClass(role: UserRole) {
  if (role === "SUPER_ADMIN") {
    return "border-[rgba(207,114,79,0.24)] bg-[rgba(207,114,79,0.04)] text-[var(--accent)]";
  }

  if (role === "ADMIN") {
    return "border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.05)] text-[var(--forest)]";
  }

  return "border-[rgba(15,23,42,0.12)] bg-[rgba(15,23,42,0.03)] text-[var(--ink)]";
}

function formatErrorMessage(error: string | undefined) {
  switch (error) {
    case "user-missing":
      return "Fill out every user field before saving.";
    case "user-email-invalid":
      return "Use a valid email address for the new user.";
    case "user-password-weak":
      return "Passwords must be at least 8 characters long.";
    case "user-password-mismatch":
      return "The password and confirmation did not match.";
    case "user-email-taken":
      return "That email already belongs to another StudioFlow user.";
    case "password-missing":
      return "Enter and confirm the new password before saving.";
    case "user-delete-invalid":
      return "That user could not be deleted.";
    case "user-delete-self":
      return "Sign in as a different admin before deleting your own account.";
    case "user-delete-last":
      return "StudioFlow must keep at least one login account.";
    case "user-last-super-admin":
      return "StudioFlow must keep at least one Super Admin account.";
    case "user-missing-record":
      return "That account no longer exists.";
    case "user-profile-missing":
      return "Enter both a name and email before saving profile changes.";
    case "user-role-invalid":
      return "Choose a valid role before saving.";
    default:
      return "";
  }
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, data } = await getDashboardPageData();
  const params = searchParams ? await searchParams : {};
  const db = getDb();
  const users = db
    .prepare("SELECT id, name, email, created_at, updated_at, role FROM users ORDER BY created_at ASC")
    .all() as UserRow[];

  const userCreated = params?.userCreated === "1";
  const profileUpdated = params?.profileUpdated === "1";
  const passwordUpdated = params?.passwordUpdated === "1";
  const roleUpdated = params?.roleUpdated === "1";
  const userDeleted = params?.userDeleted === "1";
  const errorMessage = formatErrorMessage(typeof params?.error === "string" ? params.error : undefined);

  return (
    <DashboardShell
      currentPath="/users"
      summary={{
        weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        tasksDue: data.stats.tasksDue,
        eventCount: data.schedule.length,
      }}
      user={user}
    >
      <section className="grid gap-7">
        <SectionHeader
          eyebrow="Users"
          title="Login accounts"
          copy="Create separate StudioFlow logins for your team, update passwords when needed, and remove old accounts without touching the rest of the business data."
        />

        {userCreated ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            New user added successfully.
          </div>
        ) : null}
        {profileUpdated ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Your profile was updated successfully.
          </div>
        ) : null}
        {passwordUpdated ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Password updated successfully.
          </div>
        ) : null}
        {roleUpdated ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            User role updated successfully.
          </div>
        ) : null}
        {userDeleted ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            User deleted successfully.
          </div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-[1.5rem] border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
            {errorMessage}
          </div>
        ) : null}

        <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Role guide</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">What each role can do</h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {roleOptions.map((role) => {
              const theme = getRoleTheme(role.value);

              return (
                <article className={`rounded-[1.2rem] border px-5 py-4 ${theme.panel}`} key={role.value}>
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${theme.marker}`} />
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${theme.badge}`}
                    >
                      {role.label}
                    </span>
                  </div>
                  <p className={`mt-3 text-sm font-semibold ${theme.title}`}>{role.description}</p>
                  <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--muted)]">
                    {role.value === "SUPER_ADMIN" ? (
                      <>
                        <li>Full access to every page in StudioFlow.</li>
                        <li>Can create users, change roles, reset passwords, and delete accounts.</li>
                      </>
                    ) : null}
                    {role.value === "ADMIN" ? (
                      <>
                        <li>Full access to the operational app.</li>
                        <li>Cannot open the Users page or change anyone&apos;s password.</li>
                      </>
                    ) : null}
                    {role.value === "USER" ? (
                      <>
                        <li>Can only see Projects, Schedule, Production, and Templates.</li>
                        <li>Cannot create new projects, view project financials, or use admin-only pages.</li>
                      </>
                    ) : null}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
          <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Your account</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Update your login</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Change the Sam Visual display name or login email here before creating additional team accounts.
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Current role</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getRoleTheme(user.role).badge}`}>
                {formatRoleLabel(user.role)}
              </span>
              <p className="text-sm text-[var(--muted)]">
                {roleOptions.find((role) => role.value === user.role)?.description}
              </p>
            </div>
            <form action={updateUserProfileAction} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                Display name
                <input
                  className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3"
                  defaultValue={user.name}
                  name="name"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                Login email
                <input
                  className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3"
                  defaultValue={user.email}
                  name="email"
                  required
                  type="email"
                />
              </label>
              <button className="mt-2 rounded-full border border-black/[0.08] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--forest)] hover:text-[var(--forest)]">
                Save profile changes
              </button>
            </form>
          </section>

          <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Add user</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Create a new login</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Each person gets their own email and password, so you no longer need to share the seeded account.
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Pick the role now so the right pages are shown as soon as they sign in.
            </p>
            <form action={createUserAccountAction} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                Full name
                <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="name" required />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                Email
                <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="email" required type="email" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                Role
                <select
                  className={`rounded-2xl border px-4 py-3 ${getRoleSelectClass("USER")}`}
                  defaultValue="USER"
                  name="role"
                  required
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                Password
                <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="password" required type="password" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                Confirm password
                <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="confirmPassword" required type="password" />
              </label>
              <button className="mt-2 rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(47,125,92,0.22)] transition hover:brightness-110">
                Create user
              </button>
            </form>
          </section>

          <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)] xl:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Account list</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Manage existing users</h2>
              </div>
              <p className="text-sm text-[var(--muted)]">{users.length} total logins</p>
            </div>

            <div className="mt-6 grid gap-3">
              {users.map((account) => {
                const isCurrentUser = account.id === user.id;
                const theme = getRoleTheme(account.role);

                return (
                  <article className={`border bg-white px-5 py-4 shadow-[0_8px_26px_rgba(31,27,24,0.04)] ${theme.panel}`} key={account.id}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${theme.marker}`} />
                          <p className="text-lg font-semibold text-[var(--ink)]">{account.name}</p>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${theme.badge}`}
                          >
                            {formatRoleLabel(account.role)}
                          </span>
                          {isCurrentUser ? (
                            <span className="rounded-full bg-[rgba(47,125,92,0.1)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--forest)]">
                              Current
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">{account.email}</p>
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          Created {new Date(account.created_at).toLocaleString("en-US")}
                        </p>
                      </div>

                      <div className="flex w-full max-w-[360px] flex-col gap-3">
                        <div className="grid gap-2">
                          <UserRoleForm
                            options={roleOptions.map(({ value, label }) => ({ value, label }))}
                            role={account.role}
                            selectClassName={getRoleSelectClass(account.role)}
                            userId={account.id}
                          />
                          <p className="px-1 text-xs leading-5 text-[var(--muted)]">
                            {roleOptions.find((role) => role.value === account.role)?.description}
                          </p>
                        </div>

                        <details className="group rounded-[1.1rem] border border-black/[0.06] bg-[#fbf8f3]">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[var(--ink)]">
                            <span>Reset password</span>
                            <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] transition group-open:rotate-180">
                              +
                            </span>
                          </summary>
                          <form action={updateUserPasswordAction} className="grid gap-3 border-t border-black/[0.06] p-4">
                            <input name="userId" type="hidden" value={account.id} />
                            <input
                              className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-sm"
                              name="password"
                              placeholder="New password"
                              required
                              type="password"
                            />
                            <input
                              className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-sm"
                              name="confirmPassword"
                              placeholder="Confirm new password"
                              required
                              type="password"
                            />
                            <button className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--forest)] hover:text-[var(--forest)]">
                              Save password
                            </button>
                          </form>
                        </details>

                        {!isCurrentUser ? (
                          <form action={deleteUserAccountAction}>
                            <input name="userId" type="hidden" value={account.id} />
                            <button className="rounded-full border border-[rgba(207,114,79,0.2)] bg-[rgba(207,114,79,0.08)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.14)]">
                              Delete user
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </DashboardShell>
  );
}

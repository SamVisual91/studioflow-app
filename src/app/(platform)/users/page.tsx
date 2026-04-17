import {
  createUserAccountAction,
  deleteUserAccountAction,
  updateUserPasswordAction,
} from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionHeader } from "@/components/dashboard-ui";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getDb } from "@/lib/db";

type UserRow = {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
};

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
    case "user-missing-record":
      return "That account no longer exists.";
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
    .prepare("SELECT id, name, email, created_at, updated_at FROM users ORDER BY created_at ASC")
    .all() as UserRow[];

  const userCreated = params?.userCreated === "1";
  const passwordUpdated = params?.passwordUpdated === "1";
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
        {passwordUpdated ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Password updated successfully.
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

        <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
          <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Add user</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Create a new login</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Each person gets their own email and password, so you no longer need to share the seeded account.
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

          <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Account list</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Manage existing users</h2>
              </div>
              <p className="text-sm text-[var(--muted)]">{users.length} total logins</p>
            </div>

            <div className="mt-6 grid gap-4">
              {users.map((account) => {
                const isCurrentUser = account.id === user.id;

                return (
                  <article className="border border-black/[0.06] bg-white p-5 shadow-[0_8px_26px_rgba(31,27,24,0.04)]" key={account.id}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-xl font-semibold text-[var(--ink)]">{account.name}</p>
                          {isCurrentUser ? (
                            <span className="rounded-full bg-[rgba(47,125,92,0.1)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--forest)]">
                              Signed in now
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm text-[var(--muted)]">{account.email}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                          Created {new Date(account.created_at).toLocaleString("en-US")}
                        </p>
                      </div>

                      <div className="grid gap-4 lg:min-w-[320px]">
                        <form action={updateUserPasswordAction} className="grid gap-3 rounded-[1.1rem] border border-black/[0.06] bg-[#fbf8f3] p-4">
                          <input name="userId" type="hidden" value={account.id} />
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Reset password</p>
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

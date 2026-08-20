import { markProjectMessageReadAction, sendProjectMessageAction } from "@/app/actions";
import { dateTime } from "@/lib/formatters";
import { type ProjectCommunicationThread } from "@/lib/project-activity";
import { ProjectEmailComposerFields } from "@/components/project-email-composer-fields";

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("") || "SV"
  ).toUpperCase();
}

function formatRecipientList(thread: ProjectCommunicationThread) {
  const latestOutbound = [...thread.messages]
    .reverse()
    .find((message) => message.direction === "OUTBOUND" && message.recipients.length > 0);

  return latestOutbound
    ? latestOutbound.recipients
        .filter((recipient) => recipient.type === "TO")
        .map((recipient) => recipient.email)
        .join(", ")
    : "";
}

function getReplyDefaults(thread: ProjectCommunicationThread, primaryContactEmail: string) {
  const latestMessage = thread.messages[thread.messages.length - 1];

  if (!latestMessage) {
    return {
      bcc: "",
      cc: "",
      subject: `Re: ${thread.subject}`,
      to: primaryContactEmail,
    };
  }

  if (latestMessage.direction === "INBOUND") {
    return {
      bcc: "",
      cc: "",
      subject: /^re:/i.test(thread.subject) ? thread.subject : `Re: ${thread.subject}`,
      to: latestMessage.senderEmail || primaryContactEmail,
    };
  }

  return {
    bcc: latestMessage.recipients
      .filter((recipient) => recipient.type === "BCC")
      .map((recipient) => recipient.email)
      .join(", "),
    cc: latestMessage.recipients
      .filter((recipient) => recipient.type === "CC")
      .map((recipient) => recipient.email)
      .join(", "),
    subject: /^re:/i.test(thread.subject) ? thread.subject : `Re: ${thread.subject}`,
    to:
      latestMessage.recipients
        .filter((recipient) => recipient.type === "TO")
        .map((recipient) => recipient.email)
        .join(", ") || primaryContactEmail,
  };
}

type Props = {
  clientName: string;
  primaryContactEmail: string;
  projectId: string;
  thread: ProjectCommunicationThread;
  userAvatar?: string;
};

export function ProjectCommunicationThreadCard({
  clientName,
  primaryContactEmail,
  projectId,
  thread,
  userAvatar = "",
}: Props) {
  const lastMessage = thread.messages[thread.messages.length - 1];
  const replyDefaults = getReplyDefaults(thread, primaryContactEmail);
  const recipientSummary = formatRecipientList(thread);

  return (
    <details
      className="rounded-[1.6rem] border border-black/[0.08] bg-[rgba(247,241,232,0.52)]"
      open={thread.unreadCount > 0}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4 px-5 py-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            <span>Email thread</span>
            <span>{thread.messages.length} message{thread.messages.length === 1 ? "" : "s"}</span>
            {thread.unreadCount > 0 ? (
              <span className="rounded-full bg-[rgba(207,114,79,0.14)] px-2 py-1 text-[var(--accent)]">
                {thread.unreadCount} unread
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-xl font-semibold text-[var(--ink)]">{thread.subject}</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {recipientSummary ? `To ${recipientSummary}` : "Project conversation"}
          </p>
          {lastMessage ? (
            <p className="mt-3 line-clamp-2 text-sm leading-7 text-[var(--ink)]">
              <span className="font-semibold">{lastMessage.senderName || (lastMessage.direction === "OUTBOUND" ? "You" : clientName)}:</span>{" "}
              {lastMessage.bodyText || "Open thread to view the latest message."}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-[var(--ink)]">
            {lastMessage ? dateTime.format(new Date(lastMessage.createdAt)) : "No messages yet"}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{thread.status}</p>
        </div>
      </summary>

      <div className="border-t border-black/[0.08] px-5 py-5">
        <div className="grid gap-4">
          {thread.messages.map((message) => {
            const isOutbound = message.direction === "OUTBOUND";
            const toRecipients = message.recipients
              .filter((recipient) => recipient.type === "TO")
              .map((recipient) => recipient.email)
              .join(", ");
            const ccRecipients = message.recipients
              .filter((recipient) => recipient.type === "CC")
              .map((recipient) => recipient.email)
              .join(", ");

            return (
              <article
                key={message.id}
                className={`rounded-[1.45rem] border px-4 py-4 ${
                  isOutbound
                    ? "border-[rgba(24,39,66,0.10)] bg-white"
                    : "border-[rgba(207,114,79,0.14)] bg-[rgba(255,251,246,0.98)]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${
                        isOutbound ? "bg-[var(--sidebar)] text-white" : "bg-[rgba(207,114,79,0.14)] text-[var(--accent)]"
                      }`}
                      style={
                        isOutbound && userAvatar
                          ? {
                              backgroundImage: `url(${userAvatar})`,
                              backgroundPosition: "center",
                              backgroundSize: "cover",
                            }
                          : undefined
                      }
                    >
                      {isOutbound && userAvatar ? "" : getInitials(message.senderName || clientName)}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--ink)]">
                          {message.senderName || (isOutbound ? "You" : clientName)}
                        </p>
                        <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                          {isOutbound ? message.status || "SENT" : message.isRead ? "READ" : "NEW"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {message.senderEmail || (isOutbound ? "StudioFlow mailer" : primaryContactEmail || "Client reply")}
                      </p>
                      {toRecipients ? (
                        <p className="mt-2 text-xs text-[var(--muted)]">To: {toRecipients}</p>
                      ) : null}
                      {ccRecipients ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">CC: {ccRecipients}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-[var(--ink)]">{dateTime.format(new Date(message.createdAt))}</p>
                    {!isOutbound && !message.isRead ? (
                      <form action={markProjectMessageReadAction} className="mt-3">
                        <input name="projectId" type="hidden" value={projectId} />
                        <input name="messageId" type="hidden" value={message.id} />
                        <button
                          className="rounded-full border border-[rgba(207,114,79,0.18)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.08)]"
                          type="submit"
                        >
                          Mark read
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 rounded-[1.2rem] bg-[rgba(17,15,14,0.03)] px-4 py-4">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    {message.subject}
                  </p>
                  <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-[var(--ink)]">
                    {message.bodyText || "No message body was captured for this email."}
                  </pre>
                </div>

                {message.attachments.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.attachments.map((attachment) =>
                      attachment.storagePath ? (
                        <a
                          key={`${message.id}-${attachment.fileName}`}
                          className="rounded-full border border-black/[0.08] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                          href={attachment.storagePath}
                          target="_blank"
                        >
                          {attachment.fileName}
                        </a>
                      ) : (
                        <span
                          key={`${message.id}-${attachment.fileName}`}
                          className="rounded-full border border-black/[0.08] bg-white px-3 py-2 text-xs font-semibold text-[var(--muted)]"
                        >
                          {attachment.fileName}
                        </span>
                      )
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <details className="mt-5 rounded-[1.4rem] border border-black/[0.08] bg-white">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-[var(--ink)]">
            Reply to this thread
          </summary>
          <form action={sendProjectMessageAction} className="border-t border-black/[0.08] px-5 py-5">
            <input name="projectId" type="hidden" value={projectId} />
            <input name="clientName" type="hidden" value={clientName} />
            <input name="threadId" type="hidden" value={thread.id} />
            <input name="recipientEmail" type="hidden" value={replyDefaults.to} />
            <ProjectEmailComposerFields
              clientName={clientName}
              compact
              defaultBcc={replyDefaults.bcc}
              defaultCc={replyDefaults.cc}
              defaultSubject={replyDefaults.subject}
              defaultTo={replyDefaults.to}
            />
            <div className="mt-5 flex justify-end">
              <button className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                Send reply
              </button>
            </div>
          </form>
        </details>
      </div>
    </details>
  );
}

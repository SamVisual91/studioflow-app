import { markProjectMessageReadAction, sendProjectMessageAction } from "@/app/actions";
import { dateTime } from "@/lib/formatters";
import { type ProjectCommunicationMessage, type ProjectCommunicationThread } from "@/lib/project-activity";
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

function splitQuotedEmailBody(value: string) {
  const lines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
  const quotedStart = lines.findIndex((line) =>
    /^(?:\s*>+|\s*On .+ wrote:\s*$|\s*From:\s|\s*Sent:\s|\s*-----Original Message-----)/i.test(line)
  );

  if (quotedStart < 0) {
    return { quoted: "", visible: lines.join("\n").trim() };
  }

  return {
    quoted: lines.slice(quotedStart).join("\n").trim(),
    visible: lines.slice(0, quotedStart).join("\n").trim(),
  };
}

function getMessagePreview(value: string) {
  const { visible } = splitQuotedEmailBody(value);
  return visible || "Quoted email history. Open the message to review it.";
}

function ThreadMessageCard({
  clientName,
  initiallyOpen = false,
  message,
  primaryContactEmail,
  projectId,
  userAvatar,
}: {
  clientName: string;
  initiallyOpen?: boolean;
  message: ProjectCommunicationMessage;
  primaryContactEmail: string;
  projectId: string;
  userAvatar: string;
}) {
  const isOutbound = message.direction === "OUTBOUND";
  const toRecipients = message.recipients
    .filter((recipient) => recipient.type === "TO")
    .map((recipient) => recipient.email)
    .join(", ");
  const ccRecipients = message.recipients
    .filter((recipient) => recipient.type === "CC")
    .map((recipient) => recipient.email)
    .join(", ");
  const body = splitQuotedEmailBody(message.bodyText);
  const displayBody = body.visible || "No new message text was captured for this email.";

  return (
    <details
      className={`min-w-0 max-w-full overflow-hidden rounded-[1.35rem] border ${
        isOutbound
          ? "border-[rgba(48,83,121,0.20)] bg-[rgba(235,243,250,0.86)]"
          : "border-[rgba(207,114,79,0.22)] bg-[rgba(255,248,240,0.96)]"
      }`}
      open={initiallyOpen}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 px-4 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words text-sm font-semibold text-[var(--ink)]">
              {message.senderName || (isOutbound ? "You" : clientName)}
            </p>
            <span
              className={`rounded-full px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] ${
                isOutbound
                  ? "bg-[rgba(48,83,121,0.12)] text-[#315473]"
                  : "bg-[rgba(207,114,79,0.13)] text-[var(--accent)]"
              }`}
            >
              {isOutbound ? "You" : "Client"}
            </span>
            {isOutbound ? (
              <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                {message.openedAt ? "Opened" : message.status || "Sent"}
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-1 break-words text-sm text-[var(--muted)]">{getMessagePreview(message.bodyText)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-[var(--muted)]">{dateTime.format(new Date(message.createdAt))}</p>
          <span className="mt-2 inline-block text-sm leading-none text-[var(--muted)]" aria-hidden="true">
            v
          </span>
        </div>
      </summary>

      <div className="min-w-0 border-t border-black/[0.08] px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
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
            <div className="min-w-0">
              <p className="break-words text-xs text-[var(--muted)]">
                {message.senderEmail || (isOutbound ? "StudioFlow mailer" : primaryContactEmail || "Client reply")}
              </p>
              {toRecipients ? <p className="mt-1 break-words text-xs text-[var(--muted)]">To: {toRecipients}</p> : null}
              {ccRecipients ? <p className="mt-1 break-words text-xs text-[var(--muted)]">CC: {ccRecipients}</p> : null}
            </div>
          </div>

          {!isOutbound && !message.isRead ? (
            <form action={markProjectMessageReadAction}>
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

        <div className={`mt-4 min-w-0 max-w-full rounded-[1.15rem] px-4 py-4 ${isOutbound ? "bg-white/70" : "bg-white/58"}`}>
          <p className="break-words text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            {message.subject}
          </p>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--ink)] [overflow-wrap:anywhere]">
            {displayBody}
          </p>
          {body.quoted ? (
            <details className="mt-4 max-w-full rounded-xl border border-black/[0.08] bg-white/70">
              <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-[var(--muted)]">
                Show quoted email history
              </summary>
              <pre className="max-h-64 max-w-full overflow-auto border-t border-black/[0.08] p-3 whitespace-pre-wrap break-words font-sans text-xs leading-6 text-[var(--muted)] [overflow-wrap:anywhere]">
                {body.quoted}
              </pre>
            </details>
          ) : null}
        </div>

        {message.attachments.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.attachments.map((attachment) =>
              attachment.storagePath ? (
                <a
                  key={`${message.id}-${attachment.fileName}`}
                  className="max-w-full truncate rounded-full border border-black/[0.08] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                  href={attachment.storagePath}
                  target="_blank"
                >
                  {attachment.fileName}
                </a>
              ) : (
                <span
                  key={`${message.id}-${attachment.fileName}`}
                  className="max-w-full truncate rounded-full border border-black/[0.08] bg-white px-3 py-2 text-xs font-semibold text-[var(--muted)]"
                >
                  {attachment.fileName}
                </span>
              )
            )}
          </div>
        ) : null}
      </div>
    </details>
  );
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
  const earlierMessages = thread.messages.slice(0, -1);
  const replyDefaults = getReplyDefaults(thread, primaryContactEmail);
  const recipientSummary = formatRecipientList(thread);

  return (
    <details
      className="min-w-0 max-w-full overflow-hidden rounded-[1.6rem] border border-black/[0.08] bg-[rgba(247,241,232,0.52)]"
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
            <p className="mt-3 line-clamp-2 break-words text-sm leading-7 text-[var(--ink)] [overflow-wrap:anywhere]">
              <span className="font-semibold">{lastMessage.senderName || (lastMessage.direction === "OUTBOUND" ? "You" : clientName)}:</span>{" "}
              {getMessagePreview(lastMessage.bodyText)}
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
          {lastMessage ? (
            <ThreadMessageCard
              clientName={clientName}
              initiallyOpen
              message={lastMessage}
              primaryContactEmail={primaryContactEmail}
              projectId={projectId}
              userAvatar={userAvatar}
            />
          ) : null}

          {earlierMessages.length > 0 ? (
            <details className="min-w-0 max-w-full rounded-[1.25rem] border border-black/[0.08] bg-white/70">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--ink)]">
                Show {earlierMessages.length} earlier message{earlierMessages.length === 1 ? "" : "s"}
              </summary>
              <div className="grid gap-3 border-t border-black/[0.08] p-3">
                {earlierMessages.map((message) => (
                  <ThreadMessageCard
                    clientName={clientName}
                    key={message.id}
                    message={message}
                    primaryContactEmail={primaryContactEmail}
                    projectId={projectId}
                    userAvatar={userAvatar}
                  />
                ))}
              </div>
            </details>
          ) : null}
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

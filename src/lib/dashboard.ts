import { getDb, parseJsonList } from "@/lib/db";

const stageLabels: Record<string, string> = {
  INQUIRY: "Inquiry",
  FOLLOW_UP: "Follow-up",
  PROPOSAL_SENT: "Proposal sent",
};

const healthLabels: Record<string, string> = {
  ON_TRACK: "On track",
  NEEDS_REVIEW: "Needs review",
};

const proposalStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  SIGNED: "Signed",
  REJECTED: "Declined",
};

const invoiceStatusLabels: Record<string, string> = {
  PAID: "Paid",
  DUE_SOON: "Due soon",
  OVERDUE: "Overdue",
};

const automationStatusLabels: Record<string, string> = {
  ACTIVE: "Active",
  DRAFT: "Draft",
};

export async function getDashboardData() {
  const db = getDb();

  const leads = db.prepare("SELECT * FROM leads ORDER BY event_date ASC").all() as Array<Record<string, unknown>>;
  const clients = db.prepare("SELECT * FROM clients ORDER BY next_touchpoint ASC").all() as Array<Record<string, unknown>>;
  const proposals = db.prepare("SELECT * FROM proposals ORDER BY sent_date DESC").all() as Array<Record<string, unknown>>;
  const invoices = db.prepare("SELECT * FROM invoices ORDER BY due_date ASC").all() as Array<Record<string, unknown>>;
  const schedule = db.prepare("SELECT * FROM schedule_items ORDER BY starts_at ASC").all() as Array<Record<string, unknown>>;
  const messages = db
    .prepare("SELECT * FROM messages WHERE deleted_at IS NULL ORDER BY time DESC")
    .all() as Array<Record<string, unknown>>;
  const projects = db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as Array<Record<string, unknown>>;
  const automations = db.prepare("SELECT * FROM automations ORDER BY created_at ASC").all() as Array<Record<string, unknown>>;
  const packagePresets = db.prepare("SELECT * FROM package_presets ORDER BY created_at ASC").all() as Array<Record<string, unknown>>;

  const pipelineValue =
    leads.reduce((sum, item) => sum + Number(item.value), 0) +
    proposals.reduce((sum, item) => sum + Number(item.amount), 0);
  const bookedRevenue = clients.reduce((sum, item) => sum + Number(item.total_value), 0);
  const outstandingRevenue = invoices
    .filter((item) => item.status !== "PAID")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const tasksDue = projects.reduce((sum, item) => sum + parseJsonList(String(item.tasks)).length, 0);
  const unreadMessages = messages.filter((item) => Number(item.unread) === 1).length;
  const responseRate = messages.length === 0 ? 100 : Math.round(((messages.length - unreadMessages) / messages.length) * 100);

  return {
    stats: {
      pipelineValue,
      bookedRevenue,
      outstandingRevenue,
      activeProjects: projects.length,
      tasksDue,
      responseRate,
    },
    leads: leads.map((item) => ({
      id: String(item.id),
      name: String(item.name),
      service: String(item.service),
      stage: String(item.stage),
      stageLabel: stageLabels[String(item.stage)],
      value: Number(item.value),
      eventDate: String(item.event_date),
      source: String(item.source),
      notes: String(item.notes),
    })),
    clients: clients.map((item) => ({
      id: String(item.id),
      name: String(item.name),
      category: String(item.category),
      project: String(item.project),
      packageName: String(item.package_name),
      contactEmail: String(item.contact_email ?? ""),
      totalValue: Number(item.total_value),
      balance: Number(item.balance),
      nextTouchpoint: String(item.next_touchpoint),
      health: String(item.health),
      healthLabel: healthLabels[String(item.health)],
    })),
    proposals: proposals.map((item) => ({
      id: String(item.id),
      title: String(item.title),
      client: String(item.client),
      status: String(item.status),
      statusLabel: proposalStatusLabels[String(item.status)],
      amount: Number(item.amount),
      sentDate: String(item.sent_date),
      expiresDate: String(item.expires_date),
      sections: parseJsonList(String(item.sections)),
      lineItems: parseJsonList(String(item.line_items ?? "[]")) as unknown as Array<{
        title: string;
        description: string;
        image?: string;
        amount: number;
      }>,
      recipientEmail: String(item.recipient_email ?? ""),
      emailSubject: String(item.email_subject ?? ""),
      emailBody: String(item.email_body ?? ""),
      publicToken: String(item.public_token ?? ""),
      clientComment: String(item.client_comment ?? ""),
      signatureName: String(item.signature_name ?? ""),
      signedAt: item.signed_at ? String(item.signed_at) : null,
      rejectedAt: item.rejected_at ? String(item.rejected_at) : null,
      sentAt: item.sent_at ? String(item.sent_at) : null,
    })),
    invoices: invoices.map((item) => ({
      id: String(item.id),
      client: String(item.client),
      label: String(item.label),
      publicToken: String(item.public_token ?? ""),
      status: String(item.status),
      statusLabel: invoiceStatusLabels[String(item.status)],
      dueDate: String(item.due_date),
      amount: Number(item.amount),
      method: String(item.method),
      taxRate: Number(item.tax_rate ?? 3),
      autoPayEnabled: Number(item.auto_pay_enabled ?? 0) === 1,
      autoPayLast4: String(item.auto_pay_last4 ?? ""),
      lineItems: parseJsonList(String(item.line_items ?? "[]")) as unknown as Array<{
        title: string;
        description: string;
        amount: number;
      }>,
      paymentSchedule: parseJsonList(String(item.payment_schedule ?? "[]")) as unknown as Array<{
        id: string;
        amount: number;
        dueDate: string;
        status: string;
        invoiceNumber: string;
      }>,
    })),
    schedule: schedule.map((item) => ({
      id: String(item.id),
      title: String(item.title),
      client: String(item.client),
      startsAt: String(item.starts_at),
      type: String(item.type),
      sync: String(item.sync),
      recipientEmail: String(item.recipient_email ?? ""),
      meetingUrl: String(item.meeting_url ?? ""),
    })),
    messages: messages.map((item) => ({
      id: String(item.id),
      from: String(item.sender),
      clientName: String(item.client_name ?? ""),
      projectId: String(item.project_id ?? ""),
      direction: String(item.direction ?? ""),
      channel: String(item.channel),
      time: String(item.time),
      subject: String(item.subject),
      preview: String(item.preview),
      unread: Number(item.unread) === 1,
    })),
    projects: projects.map((item) => ({
      id: String(item.id),
      name: String(item.name),
      client: String(item.client),
      progress: Number(item.progress),
      phase: String(item.phase),
      archivedAt: item.archived_at ? String(item.archived_at) : "",
      publicPortalToken: String(item.public_portal_token ?? ""),
      type: String(item.project_type ?? ""),
      projectDate: String(item.project_date ?? ""),
      location: String(item.location ?? ""),
      description: String(item.description ?? ""),
      projectCover: String(item.project_cover ?? ""),
      projectCoverPosition: String(item.project_cover_position ?? "50% 50%"),
      fileNotes: String(item.file_notes ?? ""),
      leadSource: String(item.lead_source ?? ""),
      stageMovedAt: String(item.stage_moved_at ?? ""),
      recentActivity: String(item.recent_activity ?? ""),
      nextMilestone: String(item.next_milestone),
      tasks: parseJsonList(String(item.tasks)),
    })),
    automations: automations.map((item) => ({
      id: String(item.id),
      name: String(item.name),
      trigger: String(item.trigger),
      status: String(item.status),
      statusLabel: automationStatusLabels[String(item.status)],
      actions: parseJsonList(String(item.actions)),
    })),
    packagePresets: packagePresets.map((item) => ({
        id: String(item.id),
        templateSetId: String(item.template_set_id ?? ""),
        templateSetName: String(item.template_set_name ?? ""),
        templateSetCoverImage: String(item.template_set_cover_image ?? ""),
        templateSetCoverPosition: String(item.template_set_cover_position ?? "50% 50%"),
        templateSetOrder: Number(item.template_set_order ?? 0),
        templateLibraryOrder: Number(item.template_library_order ?? 0),
        category: String(item.category ?? "Wedding") || "Wedding",
        name: String(item.name),
        subtitle: String(item.subtitle ?? ""),
        description: String(item.description ?? ""),
      proposalTitle: String(item.proposal_title),
      amount: Number(item.amount),
      sections: parseJsonList(String(item.sections)),
      lineItems: parseJsonList(String(item.line_items ?? "[]")) as unknown as Array<{
        title: string;
        description: string;
        amount: number;
        }>,
        coverImage: String(item.cover_image ?? ""),
        coverPosition: String(item.cover_position ?? ""),
        emailSubject: String(item.email_subject),
        emailBody: String(item.email_body),
        createdAt: String(item.created_at ?? ""),
    })),
  };
}

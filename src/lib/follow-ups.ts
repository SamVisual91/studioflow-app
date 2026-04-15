type FollowUpData = {
  clients: Array<{
    name: string;
    contactEmail: string;
  }>;
  invoices: Array<{
    client: string;
    status: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    client: string;
    archivedAt: string;
    phase: string;
    projectDate: string;
    type: string;
    recentActivity: string;
    nextMilestone: string;
  }>;
  proposals: Array<{
    client: string;
    status: string;
  }>;
};

export function getFollowUpProjects(data: FollowUpData) {
  return data.projects
    .filter((project) => {
      const hasSignedContract = data.proposals.some(
        (proposal) => proposal.client === project.client && proposal.status === "SIGNED"
      );
      const hasPaidInvoice = data.invoices.some(
        (invoice) => invoice.client === project.client && invoice.status === "PAID"
      );

      return !project.archivedAt && !hasSignedContract && !hasPaidInvoice;
    })
    .map((project) => {
      const client = data.clients.find((item) => item.name === project.client);

      return {
        ...project,
        contactEmail: client?.contactEmail || "",
      };
    });
}

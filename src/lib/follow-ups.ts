type FollowUpData = {
  clients: Array<{
    name: string;
    contactEmail: string;
  }>;
  invoices: Array<{
    projectId: string;
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
    projectId: string;
    client: string;
    status: string;
  }>;
};

export function getFollowUpProjects(data: FollowUpData) {
  return data.projects
    .filter((project) => {
      const siblingProjectCount = data.projects.filter(
        (candidate) => candidate.client === project.client
      ).length;
      const canUseLegacyClientScope = siblingProjectCount === 1;
      const hasSignedContract = data.proposals.some(
        (proposal) =>
          proposal.status === "SIGNED" &&
          (proposal.projectId === project.id ||
            (!proposal.projectId && canUseLegacyClientScope && proposal.client === project.client))
      );
      const hasPaidInvoice = data.invoices.some(
        (invoice) =>
          invoice.status === "PAID" &&
          (invoice.projectId === project.id ||
            (!invoice.projectId && canUseLegacyClientScope && invoice.client === project.client))
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

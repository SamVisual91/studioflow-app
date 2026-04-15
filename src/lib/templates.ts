import { getDb } from "@/lib/db";

export const templateClientTypes = ["Business", "Wedding", "Others"] as const;

export const templateTypes = [
  "Proposal",
  "Contract",
  "Invoice",
  "Questionnaire",
  "Services guide",
  "Timeline planner",
  "Shot list",
  "Mood board",
  "Welcome guide",
] as const;

export type TemplateClientType = (typeof templateClientTypes)[number];
export type TemplateType = (typeof templateTypes)[number];

const templatePresetBodies: Record<TemplateType, string> = {
  Proposal: `Project overview
- Client goals:
- Coverage or deliverables:
- Timeline:
- Investment:

Next steps
1. Review the proposal.
2. Ask any questions.
3. Accept the proposal so we can move into contract and payment.`,
  Contract: `Service agreement

This agreement is between Sam Visual and the client listed on this project.

Scope of work
- Services provided:
- Event or production date:
- Deliverables:
- Delivery timeline:

Payment terms
- Retainer/deposit:
- Remaining balance:
- Late payment policy:

Client responsibilities
- Confirm timeline and location details.
- Provide accurate contact and event information.
- Communicate requested changes in writing.

Usage and delivery
- Final deliverables may be used by the client for personal or business use.
- Sam Visual may use selected work for portfolio and marketing unless otherwise agreed in writing.

Cancellation and rescheduling
- Rescheduling is subject to availability.
- Cancellation terms should be confirmed before signature.

Signature
Client name:
Date:`,
  Invoice: `Invoice overview

Bill to:
Project:
Invoice date:
Due date:

Items
- Service/package:
- Add-ons:
- Discount:
- Tax:

Payment schedule
- Retainer:
- Remaining balance:
- Final payment:

Payment notes
Please complete payment by the due date listed above. Reach out if you need help with payment options.`,
  Questionnaire: `Client questionnaire

Contact details
- Best email:
- Best phone:
- Preferred communication method:

Project details
- Date:
- Location:
- Timeline:
- Must-have moments or deliverables:

Style and priorities
- What matters most to you?
- Are there examples you love?
- Anything you want us to avoid?

Logistics
- Key people involved:
- Vendor/team contacts:
- Access, parking, or venue notes:`,
  "Services guide": `Services guide

Welcome
Thank you for considering Sam Visual. This guide explains how we work and what is included.

Services
- Wedding films and photography
- Business photo/video campaigns
- Events and branded content
- Add-ons and custom coverage

Process
1. Inquiry and discovery
2. Proposal and contract
3. Planning and prep
4. Shoot day
5. Editing and delivery

What clients can expect
- Clear communication
- Intentional planning
- Professional capture
- Thoughtful delivery`,
  "Timeline planner": `Timeline planner

Project date:
Location:
Primary contact:

Timeline
- Arrival/setup:
- First major moment:
- Key coverage window:
- Breaks or transitions:
- Final capture:
- Wrap time:

Important notes
- Travel/parking:
- Vendor contacts:
- Backup location:
- Must-have shots or scenes:`,
  "Shot list": `Shot list

Priority moments
- 
- 
- 

People or products
- 
- 
- 

Creative details
- 
- 
- 

Do not miss
- 
- 
- `,
  "Mood board": `Mood board

Creative direction
- Overall tone:
- Color palette:
- Lighting style:
- Pacing and mood:

References
- Photo/video inspiration:
- Brand or wedding inspiration:
- Music or story references:

Notes
- What should this feel like?
- What should this not feel like?`,
  "Welcome guide": `Welcome guide

Welcome
We are excited to work with you. This guide explains what happens next and how to prepare.

Next steps
1. Confirm your project details.
2. Review the proposal/contract.
3. Complete payment setup.
4. Fill out any questionnaires.
5. Finalize timeline and creative notes.

What we need from you
- Accurate project details
- Key contacts
- Timeline/location notes
- Any must-have requests

How to reach us
Reply by email anytime with questions or updates.`,
};

export function getTemplateSlug(type: string) {
  return type.toLowerCase().replaceAll(" ", "-");
}

export function getTemplateTypeFromSlug(slug: string) {
  return templateTypes.find((type) => getTemplateSlug(type) === slug) ?? null;
}

export function getTemplatePresetBody(type: TemplateType) {
  return templatePresetBodies[type];
}

export function ensureDocumentTemplatesTable() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS document_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_type TEXT NOT NULL,
      template_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export function getTemplateLibraryData() {
  ensureDocumentTemplatesTable();
  const db = getDb();
  const templates = db
    .prepare("SELECT * FROM document_templates ORDER BY updated_at DESC")
    .all() as Array<Record<string, unknown>>;

  return templates.map((template) => ({
    id: String(template.id),
    name: String(template.name),
    clientType: String(template.client_type),
    templateType: String(template.template_type),
    summary: String(template.summary),
    body: String(template.body),
    updatedAt: String(template.updated_at),
  }));
}

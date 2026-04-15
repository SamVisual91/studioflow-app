export const smartFileTypes = [
  { value: "CONTRACT", label: "Contract" },
  { value: "PACKAGES", label: "Packages" },
  { value: "INVOICE", label: "Invoice" },
  { value: "VIDEO_PAYWALL", label: "Video Paywall" },
  { value: "QUESTIONNAIRE", label: "Questionnaire" },
  { value: "SERVICES", label: "Services Guide" },
  { value: "TIMELINE", label: "Timeline Planner" },
  { value: "SHOT_LIST", label: "Shot List" },
  { value: "MOOD_BOARD", label: "Mood Board" },
  { value: "WELCOME_GUIDE", label: "Welcome Guide" },
] as const;

export type SmartFileType = (typeof smartFileTypes)[number]["value"];

export type ProjectFileTemplate = {
  title: string;
  summary: string;
  status: string;
  visibility: string;
  body: string;
};

export function getProjectFileTemplate(type: string): ProjectFileTemplate {
  const templates: Record<string, ProjectFileTemplate> = {
    CONTRACT: {
      title: "Client Contract",
      summary: "Core agreement with deliverables, payment terms, cancellation policy, and usage rights.",
      status: "Draft",
      visibility: "Shared",
      body:
        "Project scope\n- Deliverables\n- Coverage hours\n- Delivery timeline\n\nPayment terms\n- Retainer due\n- Installment schedule\n- Final payment date\n\nPolicies\n- Rescheduling\n- Cancellation\n- Usage rights",
    },
    PACKAGES: {
      title: "Package Library",
      summary: "Open the package manager to choose, refine, and reuse your pricing collections.",
      status: "Active",
      visibility: "Internal",
      body:
        "Package manager\n- Wedding packages\n- Business packages\n- Other packages\n\nUse the Packages page to maintain your pricing collections and reuse them across proposals.",
    },
    INVOICE: {
      title: "Invoice Packet",
      summary: "Client payment file for deposit, milestone, or final balance collection.",
      status: "Draft",
      visibility: "Shared",
      body:
        "Invoice details\n- Invoice number\n- Due date\n- Amount due\n\nLine items\n- Service\n- Quantity\n- Total\n\nPayment instructions\n- Accepted methods\n- Late fee policy",
    },
    VIDEO_PAYWALL: {
      title: "Video Paywall",
      summary: "Sell a completed video with a private checkout page and Synology download unlock.",
      status: "Draft",
      visibility: "Shared",
      body:
        "Paywall details\n- Video title\n- Price\n- Synology download link\n\nClient flow\n- Private sales page\n- Stripe checkout\n- Download unlock after payment",
    },
    QUESTIONNAIRE: {
      title: "Client Questionnaire",
      summary: "Collect key planning details, preferences, timeline notes, and must-have moments.",
      status: "Draft",
      visibility: "Shared",
      body:
        "Planning questions\n- Event details\n- Key contacts\n- Preferred coverage\n- Must-have moments\n- Family groupings\n- Music preferences",
    },
    SERVICES: {
      title: "Services Guide",
      summary: "Show available services, add-ons, coverage options, and recommended upgrades.",
      status: "Draft",
      visibility: "Shared",
      body:
        "Services overview\n- Core packages\n- Add-ons\n- Delivery options\n- Travel coverage\n- Album or reel upgrades",
    },
    TIMELINE: {
      title: "Timeline Planner",
      summary: "Organize the shoot day schedule, prep windows, travel, and delivery milestones.",
      status: "In progress",
      visibility: "Shared",
      body:
        "Timeline\n- Prep start\n- First look\n- Ceremony\n- Portraits\n- Reception highlights\n- Delivery milestones",
    },
    SHOT_LIST: {
      title: "Shot List",
      summary: "Track priority moments, family groupings, location notes, and creative direction.",
      status: "In progress",
      visibility: "Internal",
      body:
        "Priority shots\n- Couple portraits\n- Family groupings\n- Ceremony details\n- Reception moments\n- Brand/product details",
    },
    MOOD_BOARD: {
      title: "Mood Board",
      summary: "Visual inspiration deck for colors, composition, styling, and storytelling direction.",
      status: "Draft",
      visibility: "Shared",
      body:
        "Visual direction\n- Color palette\n- Lighting inspiration\n- Framing references\n- Wardrobe/styling notes\n- Editing feel",
    },
    WELCOME_GUIDE: {
      title: "Welcome Guide",
      summary: "Onboarding file with what to expect, communication steps, and planning flow.",
      status: "Draft",
      visibility: "Shared",
      body:
        "Welcome\n- What happens next\n- Communication flow\n- Scheduling process\n- Delivery expectations\n- Helpful preparation tips",
    },
  };

  return (
    templates[type] || {
      title: "Project File",
      summary: "Custom project file created from the client landing page.",
      status: "Draft",
      visibility: "Shared",
      body: "Add the sections, questions, and notes needed for this custom file.",
    }
  );
}

type ContractSignature = {
  name: string;
  signedAt: string;
  email: string;
};

type ContractSection = {
  heading: string;
  body: string;
};

export type ContractDocument = {
  layoutVersion: 1;
  contractLabel: string;
  contractTitle: string;
  agreementTitle: string;
  heroImage: string;
  businessName: string;
  businessOwner: string;
  businessEmail: string;
  businessAddress: string;
  businessPhone: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone: string;
  enteredOn: string;
  eventDate: string;
  venue: string;
  serviceType: string;
  packageName: string;
  packageOverview: string;
  deliverables: string[];
  packagePrice: string;
  creditAmount: string;
  addOnAmount: string;
  travelAmount: string;
  retainerPercent: string;
  retainerDueToday: string;
  remainingBalance: string;
  finalPaymentDue: string;
  vendorSignature: ContractSignature;
  clientSignature: ContractSignature;
  sections: ContractSection[];
};

const defaultContractSections: ContractSection[] = [
  {
    heading: "Agreement / Jurisdiction",
    body:
      "The client agrees that Sam Visual will provide the services described in this agreement. This agreement contains the full understanding between the parties. North Carolina law governs this agreement, and any dispute or arbitration will take place in Burke County.",
  },
  {
    heading: "Terms",
    body:
      "The vendor agrees to provide the services identified in this agreement. The client agrees to complete payment and provide planning details before the event. Final delivery is typically completed within 30 to 90 business days after the event date or final payment, whichever is later.",
  },
  {
    heading: "Cost, Fees and Payment",
    body:
      "The total package price, retainer, and remaining balance are listed in this agreement. The retainer reserves the date and is non-refundable unless otherwise stated in writing. The remaining balance is due by the final payment date listed here.",
  },
  {
    heading: "Cancellation",
    body:
      "If the client cancels, Sam Visual may retain the retainer as liquidated damages for the reserved date. Additional cancellation terms may apply based on notice timing and any balances already paid.",
  },
  {
    heading: "Reschedule",
    body:
      "If the client reschedules the event and the vendor is available for the new date, the retainer may transfer once. New pricing or a replacement agreement may be required if the new date changes the scope or season.",
  },
  {
    heading: "Exclusivity",
    body:
      "The client understands that Sam Visual is being hired exclusively for the contracted services. Guests may take photos or videos, but the client is responsible for preventing interference with the contracted coverage.",
  },
  {
    heading: "Intellectual Property",
    body:
      "All work created by the vendor remains the copyright of the vendor. The client receives a personal-use license unless broader rights are granted in writing. The vendor may use selected work for portfolio and marketing unless otherwise agreed in writing.",
  },
  {
    heading: "Artistic Release",
    body:
      "The client has reviewed the vendor’s work and understands the final edit is guided by the vendor’s artistic judgment. Reasonable requests and priorities will be considered, but exact replication of reference work is not guaranteed.",
  },
  {
    heading: "Limit of Liability",
    body:
      "If the vendor cannot perform due to causes beyond reasonable control, liability is limited to the total amount paid under this agreement, less any non-recoverable expenses. No further liability will be owed beyond that amount.",
  },
  {
    heading: "Force Majeure / General Provisions",
    body:
      "Either party may be excused from performance because of natural disaster, severe illness, government restriction, or similar force majeure events. Any amendment to this agreement must be in writing and approved by both parties.",
  },
];

const defaultHeroImage =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80";

function cleanDate(value: string) {
  return String(value || "").trim();
}

function cleanText(value: string, fallback = "") {
  return String(value || "").trim() || fallback;
}

function cleanList(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((value) => cleanText(String(value || ""))).filter(Boolean);
}

function cleanSections(values: unknown) {
  if (!Array.isArray(values)) {
    return defaultContractSections;
  }

  const sections = values
    .map((value) => {
      if (!value || typeof value !== "object") {
        return null;
      }

      const candidate = value as { heading?: unknown; body?: unknown };
      return {
        heading: cleanText(String(candidate.heading || "")),
        body: cleanText(String(candidate.body || "")),
      };
    })
    .filter((value): value is ContractSection => Boolean(value?.heading || value?.body));

  return sections.length > 0 ? sections : defaultContractSections;
}

function cleanSignature(value: unknown, fallbackEmail = ""): ContractSignature {
  const candidate =
    value && typeof value === "object"
      ? (value as { name?: unknown; signedAt?: unknown; email?: unknown })
      : {};

  return {
    name: cleanText(String(candidate.name || "")),
    signedAt: cleanText(String(candidate.signedAt || "")),
    email: cleanText(String(candidate.email || ""), fallbackEmail),
  };
}

export function getContractTemplateClientType(projectType: string) {
  const normalized = cleanText(projectType, "Others").toLowerCase();

  if (normalized === "wedding") {
    return "Wedding";
  }

  if (normalized === "business") {
    return "Business";
  }

  return "Others";
}

export function createDefaultContractDocument(input?: Partial<ContractDocument>): ContractDocument {
  const businessName = cleanText(input?.businessName || "Sam Visual");
  const businessOwner = cleanText(input?.businessOwner || "Samuel Thao");
  const businessEmail = cleanText(input?.businessEmail || "contactme@samthao.com");
  const clientName = cleanText(input?.clientName || "Client Name");
  const clientEmail = cleanText(input?.clientEmail || "");

  return {
    layoutVersion: 1,
    contractLabel: cleanText(input?.contractLabel || "CONTRACT"),
    contractTitle: cleanText(input?.contractTitle || "Wedding Contract"),
    agreementTitle: cleanText(input?.agreementTitle || "Client Service Agreement"),
    heroImage: cleanText(input?.heroImage || defaultHeroImage),
    businessName,
    businessOwner,
    businessEmail,
    businessAddress: cleanText(input?.businessAddress || "800 Wilson Ave SW, Valdese, NC 28690"),
    businessPhone: cleanText(input?.businessPhone || "828-502-9251"),
    clientName,
    clientEmail,
    clientAddress: cleanText(input?.clientAddress || ""),
    clientPhone: cleanText(input?.clientPhone || ""),
    enteredOn: cleanDate(input?.enteredOn || new Date().toISOString().slice(0, 10)),
    eventDate: cleanDate(input?.eventDate || ""),
    venue: cleanText(input?.venue || ""),
    serviceType: cleanText(input?.serviceType || "Wedding"),
    packageName: cleanText(input?.packageName || "Signature Collection"),
    packageOverview: cleanText(
      input?.packageOverview ||
        "Coverage, deliverables, payment schedule, and usage rights are all outlined in this agreement."
    ),
    deliverables: (() => {
      const deliverables = cleanList(input?.deliverables);
      return deliverables.length > 0
        ? deliverables
        : [
            "8 hours of coverage",
            "Cinematic highlight film",
            "Ceremony and speeches coverage",
            "Online delivery gallery",
          ];
    })(),
    packagePrice: cleanText(input?.packagePrice || "0"),
    creditAmount: cleanText(input?.creditAmount || "0"),
    addOnAmount: cleanText(input?.addOnAmount || "0"),
    travelAmount: cleanText(input?.travelAmount || "0"),
    retainerPercent: cleanText(input?.retainerPercent || "50"),
    retainerDueToday: cleanText(input?.retainerDueToday || "0"),
    remainingBalance: cleanText(input?.remainingBalance || "0"),
    finalPaymentDue: cleanDate(input?.finalPaymentDue || ""),
    vendorSignature: cleanSignature(input?.vendorSignature, businessEmail),
    clientSignature: cleanSignature(input?.clientSignature, clientEmail),
    sections: cleanSections(input?.sections),
  };
}

export function parseContractDocument(
  body: string,
  fallback?: Partial<ContractDocument>
): ContractDocument {
  const raw = cleanText(body);

  if (!raw) {
    return createDefaultContractDocument(fallback);
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ContractDocument>;

    if (parsed && Number(parsed.layoutVersion || 0) === 1) {
      return createDefaultContractDocument({
        ...fallback,
        ...parsed,
      });
    }
  } catch {
    // Fall back to a generated contract document below.
  }

  return createDefaultContractDocument({
    ...fallback,
    sections: [
      {
        heading: "Agreement",
        body: raw,
      },
    ],
  });
}

export function serializeContractDocument(document: ContractDocument) {
  return JSON.stringify(createDefaultContractDocument(document));
}

export function getContractDocumentSummary(document: ContractDocument) {
  const clientName = cleanText(document.clientName, "Client");
  const serviceType = cleanText(document.serviceType, "Project");
  const eventDate = cleanText(document.eventDate);

  return eventDate
    ? `${serviceType} contract for ${clientName} on ${eventDate}.`
    : `${serviceType} contract for ${clientName}.`;
}

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
      "The person or persons whose signatures appear on this agreement, known as the Client, agree that Samuel Thao / Sam Visual shall provide services relating to the Client's event and related coverage to the best of vendor's abilities, in the manner described in this document. This is a binding agreement and contains the entire understanding between the parties. Any changes or modifications must be made in writing and signed by all parties. The laws of the State of North Carolina govern this agreement, and any resulting arbitration shall take place within Burke County. Client assumes responsibility for collection costs and legal fees incurred should enforcement of this agreement become necessary.\n\nIf any part of this agreement is found invalid or unenforceable, the remainder shall remain valid and enforceable. Any failure by one or all parties to enforce a provision of this agreement shall not constitute a waiver of any other portion of the agreement.",
  },
  {
    heading: "Terms",
    body:
      "The vendor agrees to provide the services identified within this agreement. The client agrees to provide payment, event details, and a list of important shots or priorities prior to the final event filmed.\n\nProjects generally finish within 30 to 90 business days following either the event date or the date payment is received, whichever is later. However, the vendor reserves the right to adjust the completion date based on workload and order needs. The client understands there may be a waiting period until the project is fully finished and delivered. No refund will be issued based on time required to finish the project or on artistic preferences.\n\nDrone coverage is included only when conditions allow. Coverage may be unavailable because of weather, nearby airports, government buildings, estates, national parks, venue restrictions, or other no-fly limitations. Music chosen to appear in the final wedding film may be selected by the client only when proper licensing is available. If special songs are requested and a license cannot be obtained, the vendor cannot use those songs. Coverage will be captured in high quality, and final delivery may include multiple export sizes for different uses.",
  },
  {
    heading: "Services / Breakdown",
    body:
      "Services to be provided by Sam Visual should be listed in the editable fields above, including coverage hours, films, speeches, drone coverage, gallery delivery, and turnaround promises. The breakdown should include the package amount, credit or discount, add-ons total, travel fees, retainer due today, and the remaining total after retainer.\n\nIf a USB or physical delivery item is promised, the vendor will notify the client if any expected delay arises. A digital download link may be provided first, with physical delivery following afterward.",
  },
  {
    heading: "Cost, Fees and Payment",
    body:
      "Payment schedule and method should be agreed to in advance. Services or merchandise not included in the initial agreement will be billed at current pricing when added. Credit vouchers hold no intrinsic cash value and may only be applied toward products or services purchased from the vendor.\n\nReservation, retainer, and payment: Client shall reserve the time and date of services by signing and returning this agreement along with a non-refundable, non-transferable reservation retainer. No date is reserved until the agreement and retainer are both received unless otherwise stated in writing. The remaining balance must be paid in full by the final due date listed in this agreement. Returned checks may be assessed a non-sufficient funds fee, and future purchases or payments may be required by cashier's check. Unless the agreement is cancelled, the retainer fee shall be applied to the total fee.",
  },
  {
    heading: "Cancellation",
    body:
      "If the client cancels this agreement, the client agrees that the photographer / videographer has lost the opportunity to offer services to others and may incur additional costs while attempting to book another event for the reserved date. Client agrees that the exact amount of damage may be difficult to determine and that this liquidated damages clause is a reasonable effort by both parties.\n\nNotice of cancellation received within the initial cancellation window may result in a partial refund of the total paid, excluding any non-refundable retainer already earned. Notice of cancellation received after that window may result in no refund of the total, and any monies already retained or paid may be kept as liquidated damages. Notice of cancellation must be made in writing, signed by the original party, and sent by an approved written notice method.",
  },
  {
    heading: "Illness / Emergency / Assigned Schedules",
    body:
      "If the assigned photographer, videographer, or editor becomes sick, has an emergency, or is otherwise unable to perform, Sam Visual will make a reasonable effort to provide a qualified replacement or team member to fulfill coverage obligations. These employees or replacements are not associate shooters under a separate client agreement; they are fulfilling this agreement on behalf of the vendor brand.",
  },
  {
    heading: "Reschedule",
    body:
      "If the client reschedules the event and the vendor is available for the new event date, the retainer may be transferred to the new date once. A new agreement may be required, and the new event price will reflect pricing in effect when the date change occurs. If the vendor is not available for the rescheduled date, the client forfeits the retainer fee and any monies already retained or paid as liquidated damages.",
  },
  {
    heading: "Exclusivity",
    body:
      "The client understands and agrees that Sam Visual is being hired exclusively for the services outlined in this agreement. No other service providers, assistants, or third parties hired by the client may provide the same or similar contracted services for pay unless otherwise approved in writing.\n\nWedding guests may take photos or videos, but it is the client's responsibility to prevent family and friends from interfering with the vendor's duties. The vendor is not responsible for compromised coverage caused by other people's cameras, phone flashes, lateness, venue restrictions, poor lighting, schedule complications, or interference from other parties. All desired shots should be given to the vendor in a questionnaire or shot list before the event.",
  },
  {
    heading: "Intellectual Property",
    body:
      "Copyright ownership: Any and all work created as a result of the services provided under this agreement remains the copyright of the vendor whether registered or unregistered. The client receives a non-exclusive personal-use license to the delivered work unless broader rights are granted separately in writing.\n\nPermitted uses: The client may share delivered work with family and friends and use it for personal websites or normal personal display. The vendor may use selected work for portfolio, social media, website, advertising, competition, or promotional use so long as the client is presented in a positive light.\n\nThe client is responsible for archiving digital files after delivery. The vendor does not permanently archive every raw or delivered file forever and is not responsible for unreadable media, technology changes, or the client's failure to back up files appropriately.",
  },
  {
    heading: "Artistic Release",
    body:
      "Style and coverage are based on the vendor's portfolio and artistic judgment. Every client and event is different, and photography / videography services are inherently subjective. The vendor will use reasonable efforts to incorporate the client's suggestions, but the vendor will have final say regarding aesthetic judgment and artistic quality. Dissatisfaction with artistic judgment alone is not valid grounds for termination or refund.\n\nThe client understands that all delivered files should be downloaded and saved in a personal archive after delivery. This agreement also serves as a model release allowing the vendor to use created work for social media, websites, advertising, trade, promotion, exhibition, and related lawful purposes unless otherwise agreed in writing.",
  },
  {
    heading: "Limit of Liability / Responsibility",
    body:
      "If the vendor is unable to perform any or all duties under this agreement because of illness, accident, technical problem, transportation issue, act of God, or similar circumstance beyond reasonable control, the vendor may either provide notice and arrange a qualified replacement, issue a reasonable refund or credit based on services rendered, or excuse the client from any remaining performance and payment obligations.\n\nThe sole remedy for any claim under this agreement will be limited to a refund amount that cannot exceed the total monies paid by the client under this agreement before the date on which liability arises. No further liability will be held against the vendor beyond that amount.",
  },
  {
    heading: "Force Majeure / General Provisions",
    body:
      "Either party may be excused from further performance obligations in the event of a disaster outside the control of either party, including but not limited to fire, hurricane, flooding, storm, infestation, war, invasion, embargo, riot, disorder, terrorism, hazardous situation, nuclear leak, explosion, government restriction, or similar emergency.\n\nIf a force majeure event occurs, any outstanding balances may be cancelled. If all payments have already been made, the client may be eligible for a refund based on the final payment and timing of the event. Postponing the event to a later date may be discussed but is not guaranteed.\n\nGeneral provisions: This agreement is the complete and exclusive statement of understanding between the parties. Notices may be given by approved written delivery methods including email. This agreement may be amended only through written consent by all parties. Any additions, deletions, or revisions must be made in writing and approved by all responsible parties.",
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
            "10 hours of coverage",
            "7 to 9 minute wedding highlight film",
            "60 second wedding trailer",
            "Vows and speeches interwoven in highlight film",
            "Online gallery delivery",
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

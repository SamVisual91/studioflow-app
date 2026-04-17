import { getDb } from "@/lib/db";

export type MileageTripType = "ONE_WAY" | "ROUND_TRIP";

type MileageLogRow = {
  id: string;
  trip_date: string;
  origin_label: string | null;
  origin_address: string;
  destination_label: string | null;
  destination_address: string;
  trip_type: string;
  one_way_miles: number;
  total_miles: number;
  project_id: string | null;
  purpose: string;
  notes: string | null;
  calculation_source: string | null;
  created_at: string;
  updated_at: string;
};

function safeDate(input: string) {
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function roundMiles(value: number) {
  return Math.round((Number.isNaN(value) ? 0 : value) * 10) / 10;
}

export function getMileageData() {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM ledger_mileage_logs ORDER BY trip_date DESC, created_at DESC")
    .all() as MileageLogRow[];

  const entries = rows.map((row) => ({
    id: row.id,
    tripDate: row.trip_date,
    originLabel: row.origin_label || "",
    originAddress: row.origin_address,
    destinationLabel: row.destination_label || "",
    destinationAddress: row.destination_address,
    tripType: (row.trip_type === "ROUND_TRIP" ? "ROUND_TRIP" : "ONE_WAY") as MileageTripType,
    oneWayMiles: roundMiles(Number(row.one_way_miles || 0)),
    totalMiles: roundMiles(Number(row.total_miles || 0)),
    projectId: row.project_id || "",
    purpose: row.purpose,
    notes: row.notes || "",
    calculationSource: row.calculation_source || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthEntries = entries.filter((entry) => {
    const date = safeDate(entry.tripDate);
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  });
  const yearEntries = entries.filter((entry) => safeDate(entry.tripDate).getFullYear() === currentYear);

  return {
    entries,
    summary: {
      monthMiles: roundMiles(monthEntries.reduce((sum, entry) => sum + entry.totalMiles, 0)),
      yearMiles: roundMiles(yearEntries.reduce((sum, entry) => sum + entry.totalMiles, 0)),
      roundTrips: entries.filter((entry) => entry.tripType === "ROUND_TRIP").length,
      totalTrips: entries.length,
    },
  };
}

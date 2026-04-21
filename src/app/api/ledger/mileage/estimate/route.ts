import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessBackOffice } from "@/lib/roles";

type GeocodeResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

async function geocodeAddress(address: string) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`,
    {
      headers: {
        "User-Agent": "StudioFlow/1.0 mileage-tracker",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Address lookup is unavailable right now.");
  }

  const payload = (await response.json()) as GeocodeResult[];
  const match = payload[0];

  if (!match?.lat || !match?.lon) {
    throw new Error(`We could not find a driving route for "${address}".`);
  }

  return {
    lat: Number(match.lat),
    lon: Number(match.lon),
    label: match.display_name || address,
  };
}

function toMiles(meters: number) {
  return Math.round((meters / 1609.344) * 10) / 10;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessBackOffice(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      originAddress?: string;
      destinationAddress?: string;
      tripType?: string;
    };
    const originAddress = String(body.originAddress || "").trim();
    const destinationAddress = String(body.destinationAddress || "").trim();
    const tripType = body.tripType === "ONE_WAY" ? "ONE_WAY" : "ROUND_TRIP";

    if (!originAddress || !destinationAddress) {
      return NextResponse.json({ error: "Both addresses are required." }, { status: 400 });
    }

    const [origin, destination] = await Promise.all([
      geocodeAddress(originAddress),
      geocodeAddress(destinationAddress),
    ]);

    const routeResponse = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=false`,
      { cache: "no-store" }
    );

    if (!routeResponse.ok) {
      throw new Error("Driving route lookup is unavailable right now.");
    }

    const routePayload = (await routeResponse.json()) as {
      routes?: Array<{ distance?: number }>;
    };
    const distanceMeters = Number(routePayload.routes?.[0]?.distance || 0);

    if (!distanceMeters) {
      throw new Error("We could not calculate a drivable route between those addresses.");
    }

    const oneWayMiles = toMiles(distanceMeters);
    const totalMiles = tripType === "ROUND_TRIP" ? toMiles(distanceMeters * 2) : oneWayMiles;

    return NextResponse.json({
      originLabel: origin.label,
      destinationLabel: destination.label,
      oneWayMiles,
      totalMiles,
      calculationSource: "OpenStreetMap + OSRM route estimate",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to calculate mileage right now.",
      },
      { status: 502 }
    );
  }
}

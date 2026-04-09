import { NextRequest, NextResponse } from "next/server";
import { VINData } from "@/app/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vin = searchParams.get("vin");

  if (!vin || vin.length !== 17) {
    return NextResponse.json({ error: "Invalid VIN (must be 17 characters)" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`
    );
    const data = await res.json();
    const r = data.Results?.[0];

    if (!r || r.ErrorCode !== "0") {
      return NextResponse.json({ isValid: false });
    }

    const vinData: VINData = {
      isValid: true,
      year: parseInt(r.ModelYear) || undefined,
      make: r.Make || undefined,
      model: r.Model || undefined,
      series: r.Series || undefined,
      trim: r.Trim || undefined,
      bodyClass: r.BodyClass || undefined,
      engineSize: r.DisplacementL ? `${parseFloat(r.DisplacementL).toFixed(1)}L` : undefined,
      fuelType: r.FuelTypePrimary || undefined,
      isSalvage: false, // NHTSA doesn't provide title status; would need CARFAX/VinAudit
    };

    return NextResponse.json(vinData);
  } catch (error) {
    console.error("VIN lookup error:", error);
    return NextResponse.json({ error: "VIN lookup failed" }, { status: 500 });
  }
}

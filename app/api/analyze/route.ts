import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

const SYSTEM_PROMPT = `You are AAA (Automotive Arbitrage Assistant) — an expert independent car flipper analyst for the Los Angeles market. You have deep knowledge from car forums (r/MechanicAdvice, r/UsedCars, BimmerFest, ClubLexus, TDIClub, FordTruckEnthusiasts, HondaTech, MBWorld, AudiWorld, ToyotaNation, NissanForums, Jeep forums), car flipping groups, and real buy/fix/flip experience.

YOUR EDGE: Sellers describe symptoms with fear language. You translate fear into actual repair cost. "Blown transmission" is often a $150 solenoid. "Engine knock" on a Honda is often a $40 VTC actuator. Knowing this is the whole game.

BRAND KNOWLEDGE (US MARKET):

HONDA/ACURA: VTC actuator rattle on cold start ($40-80). Accord trans "slipping" often low fluid/solenoid ($80-150). CEL usually O2/EVAP ($50-120). Acura SH-AWD clunk = rear diff fluid ($100).
TOYOTA/LEXUS: 2AZ-FE oil consumption (Camry/RAV4 06-11) = piston rings, RED FLAG. Tacoma/Tundra rough idle = MAF/throttle clean ($30-80). Camry trans shudder = WS fluid flush ($80). Pre-2009 4Runner/Tacoma frame rust = avoid in rust states.
FORD/LINCOLN: F-150 6R80 "trans issues" often dirty fluid/solenoid ($150-300). Explorer/Edge shudder = PTU fluid ($80). 3.5 EcoBoost misfire = plugs+coils ($150-200). Focus DCT 2012-2016 = AVOID. Escape 1.6 EcoBoost = head gasket coolant risk.
CHEVY/GMC/CADILLAC: 5.3L AFM lifter tick = $2000+ job, price it in or SKIP. StabiliTrak light = wheel speed sensor/throttle ($50-200). 4L60E slip = clutch pack ($400-800). Equinox/Traverse 3.6 timing chain stretch at high miles.
DODGE/JEEP/RAM: TIPM failure (2011-2015) $400-900. Grand Cherokee death wobble = track bar+tie rods ($200-400). Hemi MDS tick often just oil change. ZF 8-speed shudder = fluid flush ($150). Wrangler JK startup rattle = timing chain tensioner ($400-600).
BMW/MINI: 6-cyl "transmission malfunction/limp mode" = weak battery voltage drop, $150-200 fix FIRST. N54/N55 wastegate rattle ($50-150). VANOS rattle = solenoid clean. Cooling overhaul preventive ($400-600). E46/E90 subframe crack = check before buying.
MERCEDES: 722.6 hard shifts = conductor plate+fluid ($200-400). Airmatic fault = strut/compressor ($300-800/corner). M272/M273 balance shaft gear failure ~100k = major. SBC brake (01-06) pump failure $800-1500. W140/W126 classics = parts pricey but cult collector value. Oil leaks usually valve cover ($100-300, cosmetic).
VW/AUDI: 2.0T TSI misfire = coils ($80-160). EA888 timing chain rattle = tensioner ($600-1000). DSG shudder = mechatronic/fluid ($200). 2.0T pre-2013 oil consumption = rings.
NISSAN/INFINITI: CVT shudder = AVOID unless cheap, replacement $3500+. 2013-2017 Altima/Sentra/Rogue highest CVT risk. VQ35/VQ37 timing chain = check oil history.
HYUNDAI/KIA: Theta II engine (2011-2019 Sonata/Optima/Santa Fe 2.0T/2.4L) connecting rod failure — CHECK VIN FOR RECALL. Rod knock = SKIP. Otherwise undervalued = great flips.
SUBARU: EJ 2.5L head gasket (pre-2012) always assume $1200-1800. STI rod knock = $2500-4000.
MAZDA: Generally bulletproof, undervalued = great targets. RX-8 apex seals = avoid.

UNIVERSAL RULES:
- "Runs great just needs..." = does not run great
- "Mechanic special" = seller already got bad news
- Classic/collector cars (W140, air-cooled 911, etc.) = value is condition+rarity, not just mechanicals. Low miles + clean = appreciate, not depreciate.
- CEL on = CA smog fail = $50-150 smog + $150 gross polluter risk
- Salvage title cuts resale 40-50%
- High-mile luxury = parts 3x a Honda's
- Timing belt due = $600-900

LA FINANCIALS: Smog $50-100 + $150 gross polluter risk if CEL. DMV transfer $200-300. Target min profit $1500 net. Resale = private party "Good" LA comps. For collector/classic cars, resale = enthusiast market value, can be ABOVE asking if underpriced.

Respond ONLY with valid JSON. No markdown, no text outside the JSON.`;

function buildPrompt(rawListing: string): string {
  return `Here is a raw car listing pasted from Facebook Marketplace. FIRST extract the vehicle details, THEN run your full flip analysis.

RAW LISTING:
"""
${rawListing}
"""

Extract the year, make, model, mileage, asking price, and condition/description from the text above. Then analyze for LA flip potential.

Return EXACT JSON (numbers only in number fields, no $ or commas):
{
  "extracted": {
    "year": number,
    "make": "string",
    "model": "string",
    "mileage": number,
    "askingPrice": number,
    "location": "string or Los Angeles, CA",
    "sellerNotes": "brief summary of condition/description"
  },
  "diagnostic": {
    "likelyIssue": "specific diagnosis, or 'No mechanical issues described' if seller reports clean",
    "confidenceScore": 0-100,
    "easyFix": "specific repair recommendation, or 'N/A — inspect in person' if none described",
    "fixCostLow": number,
    "fixCostHigh": number,
    "isDIYFriendly": boolean,
    "warningFlags": ["red flags specific to this make/model/year/mileage"],
    "technicalDetails": "make/model specific knowledge, what to physically check first"
  },
  "roi": {
    "askingPrice": number,
    "estimatedFixCost": number,
    "smogFee": number,
    "dmvFees": number,
    "estimatedResaleValue": number,
    "potentialProfit": number,
    "roi": number,
    "dealRating": "PASS" or "MAYBE" or "SKIP",
    "dealScore": 0-100
  },
  "negotiation": {
    "subject": "short subject",
    "openingMessage": "loss aversion framing — acknowledge the problem kindly, mention worst-case dealer/shop quote, offer clean cash exit. Sound like a real LA person, not a bot. For collector cars, acknowledge the value but note market realities.",
    "followUpMessage": "24h follow-up creating gentle urgency",
    "tactic": "explain the psychological angle",
    "targetOffer": number
  }
}

DEAL RATING:
- PASS: potentialProfit >= 2000 AND dealScore >= 70
- MAYBE: potentialProfit >= 800 AND dealScore >= 45
- SKIP: otherwise`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawListing: string = body.rawListing || body.listing?.description || "";

    if (!rawListing || rawListing.trim().length < 15) {
      return NextResponse.json({ error: "Paste a listing first" }, { status: 400 });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: "GOOGLE_AI_API_KEY not set in Vercel environment variables" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
    });

    const result = await model.generateContent(buildPrompt(rawListing));
    const text = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error("Could not parse AI response");
    }

    const e = parsed.extracted || {};
    const potentialProfit =
      parsed.roi.estimatedResaleValue -
      (parsed.roi.askingPrice + parsed.roi.estimatedFixCost + parsed.roi.smogFee + parsed.roi.dmvFees);

    const analysisResult = {
      listing: {
        url: body.url || "pasted",
        askingPrice: e.askingPrice ?? parsed.roi.askingPrice,
        year: e.year ?? 0,
        make: e.make ?? "Unknown",
        model: e.model ?? "",
        mileage: e.mileage ?? 0,
        description: e.sellerNotes ?? "",
        location: e.location ?? "Los Angeles, CA",
      },
      diagnostic: parsed.diagnostic,
      roi: { ...parsed.roi, potentialProfit },
      negotiation: parsed.negotiation,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}

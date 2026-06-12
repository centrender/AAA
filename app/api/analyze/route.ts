import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_AI_API_KEY || "";
const MODEL = "gemini-2.5-flash";
const BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Strip seller hype words so the analysis reads cold facts only
function stripHype(text: string): string {
  const hypeWords = [
    "legendary", "iconic", "timeless", "exceptional", "rare opportunity", "rare",
    "museum", "museum-grade", "collector", "collectors", "collector's", "enthusiast",
    "pristine", "immaculate", "flawless", "mint", "gem", "stunning", "beautiful",
    "gorgeous", "head-turner", "showroom", "unmatched", "unmistakable", "respected",
    "desirable", "increasingly desirable", "hard to find", "becoming harder to find",
    "overbuilt", "best in class", "one of the best", "grail", "unicorn", "investment",
    "appreciating", "appreciate", "garage kept", "garage-kept", "babied", "pampered",
    "must see", "must-see", "wont last", "won't last", "priced to sell", "clean title gem",
    "rare find", "true flagship", "presence", "craftsmanship", "engineering excellence",
  ];
  let cleaned = text;
  for (const w of hypeWords) {
    cleaned = cleaned.replace(new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), "");
  }
  return cleaned.replace(/\s{2,}/g, " ").trim();
}

async function callGemini(body: object) {
  const res = await fetch(`${BASE}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini ${res.status}: ${txt.slice(0, 300)}`);
  }
  return res.json();
}

function extractText(data: { candidates?: { content?: { parts?: { text?: string }[] } }[] }): string {
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
}

function parseJSON(text: string) {
  try { return JSON.parse(text); }
  catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Could not parse AI response");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawListing: string = body.rawListing || "";

    if (!rawListing || rawListing.trim().length < 15) {
      return NextResponse.json({ error: "Paste a listing first" }, { status: 400 });
    }
    if (!API_KEY) {
      return NextResponse.json({ error: "GOOGLE_AI_API_KEY not set in Vercel environment variables" }, { status: 500 });
    }

    const cleanListing = stripHype(rawListing);

    // ── STEP 1: Extract the vehicle basics (no hype) ──
    const extractData = await callGemini({
      contents: [{ parts: [{ text:
`Extract ONLY the factual vehicle data from this car listing. Ignore all marketing adjectives. Return JSON only.

LISTING:
"""${cleanListing}"""

Return: {"year": number, "make": "string", "model": "string", "trim": "string or empty", "mileage": number, "askingPrice": number, "location": "string", "listedAgo": "exactly what the listing says about how long it's been listed, e.g. 'Listed 4 weeks ago' or '2 days ago', or 'unknown'", "daysOnMarket": number (your best estimate of days listed from the listedAgo text, 0 if unknown), "describedProblems": "only actual mechanical issues/conditions the seller stated, or 'none stated'"}` }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json" },
    });
    const v = parseJSON(extractText(extractData));

    // ── STEP 2: Grounded market value lookup via Google Search ──
    const searchData = await callGemini({
      contents: [{ parts: [{ text:
`Search for the REAL current private-party market value of a ${v.year} ${v.make} ${v.model} ${v.trim || ""} with ${v.mileage} miles in the Los Angeles / California used car market as of 2026.

Use actual sold prices and listings from KBB, Edmunds, Classic.com, Cars & Bids, Bring a Trailer, CarGurus, and Autotrader. Do NOT use the seller's asking price as a reference. Do NOT inflate for "collector" or "rare" claims.

Return JSON only:
{"marketValueLow": number, "marketValueTypical": number, "marketValueHigh": number, "valueBasis": "one sentence on what data you found and from where", "isClassicOrCollector": boolean, "demandNote": "brief note on actual demand/liquidity for this car in LA"}` }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.1 },
    });
    let market;
    try {
      market = parseJSON(extractText(searchData));
    } catch {
      // If grounding returns prose, do a fallback estimate without search
      const fb = await callGemini({
        contents: [{ parts: [{ text: `Estimate conservative private-party market value for a ${v.year} ${v.make} ${v.model} with ${v.mileage} miles in LA. Be realistic, ignore collector hype. Return JSON: {"marketValueLow": number, "marketValueTypical": number, "marketValueHigh": number, "valueBasis": "estimate", "isClassicOrCollector": false, "demandNote": "string"}` }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      });
      market = parseJSON(extractText(fb));
    }

    // ── STEP 3: Flip analysis using REAL market value, not asking price ──
    const analysisData = await callGemini({
      contents: [{ parts: [{ text:
`You are an experienced LA car flipper. Analyze this deal using the REAL market data provided. 

THE GOLDEN RULE: You offer a percentage of what the car is WORTH, never a percentage of what the seller is ASKING. If the car is worth $11,000 and they ask $18,000, your offer is based on $11,000.

VEHICLE (facts only, hype removed):
${JSON.stringify(v, null, 2)}

REAL MARKET VALUE (from actual sold comps, ignore seller's hype):
${JSON.stringify(market, null, 2)}

FLIPPER MATH:
- DAYS ON MARKET IS A WEAPON. This car has been listed for ${v.daysOnMarket || 0} days (${v.listedAgo || "unknown"}). The longer it sits unsold at its current price, the more the market has REJECTED that price and the more motivated/tired the seller is. Use this:
  * 0-7 days: fresh listing, seller still hopeful, less negotiating room, don't tip your hand
  * 8-21 days: starting to sit, seller getting realistic, moderate leverage
  * 22-45 days: market rejected this price, strong leverage, seller likely frustrated
  * 45+ days: stale, seller probably desperate, lowball with confidence
  Factor DOM into both your target offer AND the negotiation message tone. A car sitting 4+ weeks justifies a more aggressive offer and you can gently reference that it's "been up a while."
- True resale (what YOU could sell it for after fixing) = marketValueTypical, maybe marketValueHigh only if genuinely clean
- Your max buy price = roughly 70-80% of true resale MINUS reconditioning costs
- Costs: reconditioning/fixes + smog ($50-100, +$150 gross polluter risk if CEL) + DMV/title ($200-300)
- A real flip needs $1,500+ net profit AND reasonable liquidity (can you actually sell it fast in LA?)
- If asking price is already at or above true market value, this is usually a SKIP regardless of how nice the car sounds
- Classic/older luxury: low liquidity, long hold times, expensive surprise repairs. Be MORE conservative, not less.

Return JSON only:
{
  "diagnostic": {
    "likelyIssue": "specific mechanical concern based on described problems + known issues for this exact model/year/mileage, or 'No issues described — budget for inspection' if seller stated none",
    "confidenceScore": 0-100,
    "easyFix": "specific repair guidance or 'Inspect in person before committing'",
    "fixCostLow": number,
    "fixCostHigh": number,
    "isDIYFriendly": boolean,
    "warningFlags": ["real risks: liquidity, age, known expensive failures, asking-over-market, etc"],
    "technicalDetails": "what to physically check, known failure points for this model"
  },
  "roi": {
    "askingPrice": ${v.askingPrice},
    "trueMarketValue": ${market.marketValueTypical},
    "estimatedFixCost": number,
    "smogFee": number,
    "dmvFees": number,
    "estimatedResaleValue": number,
    "potentialProfit": number,
    "roi": number,
    "dealRating": "PASS" or "MAYBE" or "SKIP",
    "dealScore": 0-100,
    "daysOnMarket": ${v.daysOnMarket || 0},
    "domLeverage": "one short phrase on how stale this listing is and what leverage it gives, e.g. 'Sitting 4 weeks — strong leverage' or 'Fresh listing — play it cool'",
    "verdict": "one blunt sentence: is this a real flip or is the seller dreaming?"
  },
  "negotiation": {
    "subject": "string",
    "targetOffer": number,
    "openingMessage": "Real LA flipper tone. Reference real comps casually ('similar ones are going for X'). Acknowledge problems plainly. Offer based on WORTH not asking. Never repeat the seller's hype back to them. Make a clean cash offer.",
    "followUpMessage": "24h nudge, light urgency",
    "tactic": "explain your angle and why this offer is grounded in real value"
  }
}

DEAL RATING:
- PASS: potentialProfit >= 2000 AND good liquidity AND dealScore >= 70
- MAYBE: potentialProfit >= 800 AND dealScore >= 45
- SKIP: thin margin, asking >= market value, low liquidity, or risky` }] }],
      generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
    });
    const a = parseJSON(extractText(analysisData));

    const potentialProfit =
      a.roi.estimatedResaleValue -
      (a.negotiation.targetOffer + a.roi.estimatedFixCost + a.roi.smogFee + a.roi.dmvFees);

    return NextResponse.json({
      listing: {
        url: "pasted",
        askingPrice: v.askingPrice,
        year: v.year,
        make: v.make,
        model: `${v.model}${v.trim ? " " + v.trim : ""}`,
        mileage: v.mileage,
        description: v.describedProblems,
        location: v.location || "Los Angeles, CA",
      },
      market,
      diagnostic: a.diagnostic,
      roi: { ...a.roi, potentialProfit },
      negotiation: a.negotiation,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}

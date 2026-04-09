export interface ListingData {
  url: string;
  askingPrice: number;
  year: number;
  make: string;
  model: string;
  mileage: number;
  description: string;
  vin?: string;
  location?: string;
}

export interface DiagnosticResult {
  likelyIssue: string;
  confidenceScore: number;
  easyFix: string;
  fixCostLow: number;
  fixCostHigh: number;
  isDIYFriendly: boolean;
  warningFlags: string[];
  technicalDetails: string;
}

export interface ROIResult {
  askingPrice: number;
  estimatedFixCost: number;
  smogFee: number;
  dmvFees: number;
  estimatedResaleValue: number;
  potentialProfit: number;
  roi: number;
  dealRating: "PASS" | "MAYBE" | "SKIP";
  dealScore: number;
}

export interface NegotiationScript {
  subject: string;
  openingMessage: string;
  followUpMessage: string;
  tactic: string;
  targetOffer: number;
}

export interface VINData {
  isValid: boolean;
  isSalvage?: boolean;
  year?: number;
  make?: string;
  model?: string;
  series?: string;
  trim?: string;
  bodyClass?: string;
  engineSize?: string;
  fuelType?: string;
}

export interface AnalysisResult {
  listing: ListingData;
  diagnostic: DiagnosticResult;
  roi: ROIResult;
  negotiation: NegotiationScript;
  vin?: VINData;
  analyzedAt: string;
}

import { ITK_KNOWLEDGE } from "../data/itk-knowledge";
import { evaluateSpraySafety, isValidCoordinate } from "../utils/voiceSafety";
import type { AgroCareContext } from "./context";

export type AgroCareTool = {
  name: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  timeoutMs: number;
  execute: (input: Record<string, unknown>, context: AgroCareContext) => Promise<unknown>;
};

export type ToolRuntime = {
  supplierSearch?: (latitude: number, longitude: number) => Promise<unknown>;
};

function itkMatches(query: string) {
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2).slice(0, 8);
  return ITK_KNOWLEDGE.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("-"))
    .map((entry) => ({ entry: entry.slice(1).trim(), score: terms.reduce((n, term) => n + (entry.toLowerCase().includes(term) ? 1 : 0), 0) }))
    .filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map((item) => item.entry);
}

export function createToolRegistry(runtime: ToolRuntime = {}): Map<string, AgroCareTool> {
  return new Map([
    ["get_weather", { name: "get_weather", description: "Get current weather and spray safety.", riskLevel: "medium", timeoutMs: 8000, execute: async (input) => {
      const latitude = input.latitude; const longitude = input.longitude;
      if (!isValidCoordinate(latitude, -90, 90) || !isValidCoordinate(longitude, -180, 180)) throw new Error("A valid latitude and longitude are required");
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m&daily=precipitation_probability_max&timezone=auto`);
        if (!response.ok) throw new Error("Open-Meteo unavailable");
        const weather = await response.json() as any; const current = weather.current || {};
        const precipitationProbability = Number(weather.daily?.precipitation_probability_max?.[0] ?? 0);
        const result = { available: true, source: "Open-Meteo", temperatureC: Number(current.temperature_2m), humidity: Number(current.relative_humidity_2m), rainMm: Number(current.rain), windKph: Number(current.wind_speed_10m), precipitationProbability };
        return { ...result, spraySafety: evaluateSpraySafety({ rain: result.rainMm, wind: result.windKph, precipitationProbability }) };
      } catch { return { available: false, spraySafety: evaluateSpraySafety(null) }; }
    }}],
    ["search_itk", { name: "search_itk", description: "Search AgroCare indigenous knowledge.", riskLevel: "medium", timeoutMs: 2000, execute: async (input) => {
      const query = typeof input.query === "string" ? input.query.trim().slice(0, 300) : "";
      if (!query) throw new Error("A knowledge query is required");
      const matches = itkMatches(query); return { available: matches.length > 0, matches, caution: "Traditional practices must not replace label instructions or expert advice for high-risk cases." };
    }}],
    ["get_crop_diagnosis", { name: "get_crop_diagnosis", description: "Read current image diagnosis context.", riskLevel: "high", timeoutMs: 1000, execute: async (input) => {
      const raw = input.diagnosis && typeof input.diagnosis === "object" ? input.diagnosis as Record<string, unknown> : {};
      const clean = (value: unknown, max = 100) => typeof value === "string" ? value.replace(/[\r\n]+/g, " ").trim().slice(0, max) : "";
      const crop = clean(raw.crop); const disease = clean(raw.disease); const confidence = typeof raw.confidence === "number" ? Math.max(0, Math.min(100, raw.confidence)) : 0;
      if (raw.diagnosisStatus === "UNAVAILABLE" || !crop || !disease || disease.toLowerCase() === "unable to diagnose") return { available: false, message: "No confirmed diagnosis is available." };
      return { available: true, crop, disease, severity: clean(raw.severity, 30) || "Unknown", confidence };
    }}],
    ["find_supplier", { name: "find_supplier", description: "Find nearby agricultural suppliers.", riskLevel: "low", timeoutMs: 10000, execute: async (input) => {
      const latitude = input.latitude; const longitude = input.longitude;
      if (!isValidCoordinate(latitude, -90, 90) || !isValidCoordinate(longitude, -180, 180)) throw new Error("A valid latitude and longitude are required");
      return runtime.supplierSearch ? runtime.supplierSearch(latitude as number, longitude as number) : { available: false, suppliers: [], message: "Supplier search is unavailable." };
    }}],
    ["check_scheme", { name: "check_scheme", description: "Find possible scheme matches.", riskLevel: "low", timeoutMs: 1000, execute: async (input) => {
      const farmerType = typeof input.farmerType === "string" ? input.farmerType : "All"; const landSize = typeof input.landSize === "number" && Number.isFinite(input.landSize) ? input.landSize : null;
      const candidates = [{ name: "PM-KISAN", benefit: "6000/year direct income support", eligible: farmerType === "Small" || farmerType === "Marginal" || farmerType === "All", link: "https://pmkisan.gov.in/" }, { name: "PMFBY", benefit: "Crop insurance for notified crops", eligible: true, link: "https://pmfby.gov.in/" }, { name: "Kisan Credit Card", benefit: "Subsidized agricultural credit", eligible: true, link: "https://sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card" }].filter((scheme) => scheme.eligible && (scheme.name !== "PM-KISAN" || landSize === null || landSize <= 5));
      return { available: true, candidates, caution: "Verify requirements on the official portal or with the local agriculture office." };
    }}],
  ]);
}

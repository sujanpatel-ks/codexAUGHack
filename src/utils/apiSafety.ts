export const MAX_RELIABLE_DIAGNOSIS_CONFIDENCE = 85;

const DEFAULT_STRING_LIMIT = 500;

export function clampDiagnosisConfidence(value: unknown, max = MAX_RELIABLE_DIAGNOSIS_CONFIDENCE): number {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(0, Math.min(max, Math.round(numericValue)));
}

function cleanString(value: unknown, fallback: string, maxLength = DEFAULT_STRING_LIMIT): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
}

function cleanStringArray(value: unknown, fallback: string[], maxItems = 8): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function createUnableToDiagnoseResult(reason = "The AI diagnosis service is unavailable or the image could not be assessed reliably.") {
  return {
    crop: "Unknown",
    disease: "Unable to Diagnose",
    diseaseHi: "Unable to Diagnose",
    diseaseKn: "Unable to Diagnose",
    confidence: 0,
    description: reason,
    symptoms: ["No reliable visual diagnosis was produced."],
    prevention: {
      immediate: ["Retake a clear, well-lit photo showing the affected plant part."],
      longTerm: ["Confirm treatment decisions with a local agricultural extension expert before applying inputs."]
    },
    treatment: {
      organic: {
        name: "No treatment recommended without diagnosis",
        nameHi: "No treatment recommended without diagnosis",
        dosage: "N/A",
        frequency: "N/A",
        precautions: "Do not apply pesticide or fungicide based only on an unavailable AI result.",
        costEstimate: "N/A"
      },
      chemical: {
        name: "No chemical treatment recommended without diagnosis",
        nameHi: "No chemical treatment recommended without diagnosis",
        dosage: "N/A",
        frequency: "N/A",
        precautions: "Consult a qualified agronomist before chemical application.",
        costEstimate: "N/A"
      }
    },
    severity: "Low" as const,
    actionRequired: "Retake the image or request expert review before taking treatment action.",
    diagnosisStatus: "UNAVAILABLE" as const
  };
}

export function normalizeSeverity(value: unknown): "Low" | "Medium" | "High" {
  return value === "High" || value === "Medium" || value === "Low" ? value : "Low";
}

export function sanitizeDiagnosisRecord(input: unknown, userId: string, now = new Date()) {
  const source = input && typeof input === "object" ? input as Record<string, any> : {};
  const fallback = createUnableToDiagnoseResult();
  const sanitized = {
    userId,
    crop: cleanString(source.crop, fallback.crop, 100),
    disease: cleanString(source.disease, fallback.disease, 120),
    confidence: clampDiagnosisConfidence(source.confidence),
    severity: normalizeSeverity(source.severity),
    timestamp: now.toISOString(),
    description: cleanString(source.description, fallback.description, 1000),
    symptoms: cleanStringArray(source.symptoms, fallback.symptoms),
    prevention: source.prevention && typeof source.prevention === "object" ? source.prevention : fallback.prevention,
    treatment: source.treatment && typeof source.treatment === "object" ? source.treatment : fallback.treatment,
    actionRequired: cleanString(source.actionRequired, fallback.actionRequired, 1000),
    diagnosisStatus: cleanString(source.diagnosisStatus, "AI_GENERATED", 60)
  };

  if (Array.isArray(source.boundingBox) && source.boundingBox.length === 4 && source.boundingBox.every((n) => typeof n === "number" && Number.isFinite(n))) {
    return { ...sanitized, boundingBox: source.boundingBox.map((n) => Math.max(0, Math.min(1000, Math.round(n)))) };
  }

  return sanitized;
}

const PROFILE_FIELDS = ["name", "email", "address", "phone", "size", "crops", "soilType", "irrigation"] as const;
const PRIVILEGED_USER_FIELDS = new Set(["role", "roles", "claims", "permissions", "isAdmin", "admin"]);

export function containsPrivilegedUserFields(input: unknown): boolean {
  if (!input || typeof input !== "object") return false;
  return Object.keys(input).some((key) => PRIVILEGED_USER_FIELDS.has(key));
}

export function sanitizeProfileInput(input: unknown) {
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const sanitized: Record<string, string> = {};

  for (const field of PROFILE_FIELDS) {
    if (typeof source[field] === "string") {
      const cleaned = source[field].trim().slice(0, field === "email" ? 254 : 200);
      if (cleaned) sanitized[field] = cleaned;
    }
  }

  return sanitized;
}

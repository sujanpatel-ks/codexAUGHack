export type AgroCareContext = {
  userId: string;
  language?: string;
  location?: { latitude?: number; longitude?: number; city?: string; state?: string };
  currentDiagnosis?: unknown;
  taskIntent?: string;
  safetyConstraints?: string[];
};

export function buildAgroCareContext(input: {
  userId: string;
  language?: unknown;
  location?: unknown;
  currentDiagnosis?: unknown;
  taskIntent?: string;
}): AgroCareContext {
  const location = input.location && typeof input.location === "object"
    ? input.location as Record<string, unknown>
    : undefined;
  return {
    userId: input.userId,
    language: typeof input.language === "string" ? input.language.slice(0, 20) : undefined,
    location: location ? {
      latitude: typeof location.latitude === "number" ? location.latitude : undefined,
      longitude: typeof location.longitude === "number" ? location.longitude : undefined,
      city: typeof location.city === "string" ? location.city.slice(0, 100) : undefined,
      state: typeof location.state === "string" ? location.state.slice(0, 100) : undefined,
    } : undefined,
    currentDiagnosis: input.currentDiagnosis,
    taskIntent: input.taskIntent,
    safetyConstraints: ["Do not provide precise treatment or spray advice without sufficient evidence."],
  };
}

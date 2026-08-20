export type SpraySafety = {
  status: 'safe' | 'unsafe' | 'unknown';
  reason: string;
};

/**
 * Deterministic guardrail used by the voice tool. The model may request weather,
 * but it cannot override this evaluation when suggesting a spray window.
 */
export function evaluateSpraySafety(weather: {
  rain?: number;
  wind?: number;
  precipitationProbability?: number;
} | null | undefined): SpraySafety {
  if (!weather || !Number.isFinite(weather.rain) || !Number.isFinite(weather.wind)) {
    return {
      status: 'unknown',
      reason: 'Current weather could not be verified. Do not recommend spraying until conditions are checked.',
    };
  }

  if ((weather.rain ?? 0) > 0 || (weather.precipitationProbability ?? 0) >= 40) {
    return {
      status: 'unsafe',
      reason: 'Rain is present or likely soon, so spraying may wash off and should be delayed.',
    };
  }

  if ((weather.wind ?? 0) >= 20) {
    return {
      status: 'unsafe',
      reason: 'Wind is too strong for safe, targeted spraying. Wait for a calmer period.',
    };
  }

  return {
    status: 'safe',
    reason: 'No rain is currently reported and wind is below the safety threshold. Follow the product label and local guidance.',
  };
}

export function isValidCoordinate(value: unknown, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

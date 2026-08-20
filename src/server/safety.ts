import { evaluateSpraySafety } from "../utils/voiceSafety";
import { MAX_RELIABLE_DIAGNOSIS_CONFIDENCE } from "../utils/apiSafety";

export type SafetyDecision =
  | { action: "ALLOW"; reason: string }
  | { action: "MODIFY"; reason: string }
  | { action: "DEFER"; reason: string }
  | { action: "ESCALATE"; reason: string };

export function validateToolResult(toolName: string, result: any): SafetyDecision {
  if (toolName === "get_crop_diagnosis") {
    if (!result?.available || Number(result.confidence) < MAX_RELIABLE_DIAGNOSIS_CONFIDENCE) {
      return { action: "ESCALATE", reason: "There is not enough reliable diagnosis evidence for treatment advice." };
    }
  }
  if (toolName === "get_weather") {
    const status = result?.spraySafety?.status;
    if (status === "unsafe") return { action: "DEFER", reason: result.spraySafety.reason };
    if (status === "unknown") return { action: "DEFER", reason: result.spraySafety.reason };
  }
  return { action: "ALLOW", reason: "The tool result passed the current deterministic safety checks." };
}

export function validateSprayRecommendation(weather: Parameters<typeof evaluateSpraySafety>[0]): SafetyDecision {
  const result = evaluateSpraySafety(weather);
  if (result.status !== "safe") return { action: "DEFER", reason: result.reason };
  return { action: "ALLOW", reason: result.reason };
}

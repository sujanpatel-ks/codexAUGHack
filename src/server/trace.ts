import { randomUUID } from "node:crypto";

export type AgroCareTrace = {
  traceId: string;
  requestId: string;
  userId: string;
  taskIntent?: string;
  toolsUsed: string[];
  startedAt: number;
  status?: string;
};

export function createTrace(userId: string, taskIntent?: string): AgroCareTrace {
  return { traceId: randomUUID(), requestId: randomUUID(), userId, taskIntent, toolsUsed: [], startedAt: Date.now() };
}

export function traceToolStart(trace: AgroCareTrace, toolName: string) {
  trace.toolsUsed.push(toolName);
  return Date.now();
}

export function traceToolEnd(trace: AgroCareTrace, toolName: string, startedAt: number, success: boolean) {
  console.info("[agrocare-trace] tool", { requestId: trace.requestId, tool: toolName, durationMs: Date.now() - startedAt, success });
}

export function traceComplete(trace: AgroCareTrace, status: string) {
  trace.status = status;
  console.info("[agrocare-trace] complete", { requestId: trace.requestId, traceId: trace.traceId, userId: trace.userId, toolsUsed: trace.toolsUsed, status, durationMs: Date.now() - trace.startedAt });
}

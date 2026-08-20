import type { AgroCareContext } from "./context";
import { buildAgroCareContext } from "./context";
import { createToolRegistry, type ToolRuntime } from "./tools";
import { createTrace, traceComplete, traceToolEnd, traceToolStart } from "./trace";
import { validateToolResult, type SafetyDecision } from "./safety";

export type AgroCareAgentRequest = { userId: string; toolName: string; input?: Record<string, unknown>; context?: Partial<AgroCareContext> };
export type AgroCareAgentResult = { status: "success" | "escalation" | "fallback"; result?: unknown; toolsUsed: string[]; safety?: SafetyDecision; traceId: string; requestId: string };

export async function runAgroCareAgent(request: AgroCareAgentRequest, runtime: ToolRuntime = {}): Promise<AgroCareAgentResult> {
  const context = buildAgroCareContext({ userId: request.userId, ...request.context, taskIntent: request.toolName });
  const trace = createTrace(context.userId, context.taskIntent); const tool = createToolRegistry(runtime).get(request.toolName);
  if (!tool) { traceComplete(trace, "fallback"); return { status: "fallback", toolsUsed: [], traceId: trace.traceId, requestId: trace.requestId }; }
  const startedAt = traceToolStart(trace, tool.name);
  try {
    const result = await Promise.race([tool.execute(request.input || {}, context), new Promise((_, reject) => setTimeout(() => reject(new Error("Tool timeout")), tool.timeoutMs))]);
    traceToolEnd(trace, tool.name, startedAt, true); const safety = validateToolResult(tool.name, result);
    const status = safety.action === "ESCALATE" ? "escalation" : "success"; traceComplete(trace, status);
    return { status, result, toolsUsed: trace.toolsUsed, safety, traceId: trace.traceId, requestId: trace.requestId };
  } catch { traceToolEnd(trace, tool.name, startedAt, false); traceComplete(trace, "fallback"); return { status: "fallback", toolsUsed: trace.toolsUsed, traceId: trace.traceId, requestId: trace.requestId };
  }
}

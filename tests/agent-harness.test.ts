import assert from "node:assert/strict";
import { test } from "node:test";
import { runAgroCareAgent } from "../src/server/agentHarness";

test("harness routes scheme lookup and returns a trace", async () => {
  const result = await runAgroCareAgent({ userId: "farmer-1", toolName: "check_scheme", input: { farmerType: "Small", landSize: 2 } });
  assert.equal(result.status, "success");
  assert.equal(result.toolsUsed[0], "check_scheme");
  assert.match(result.traceId, /^[0-9a-f-]{36}$/);
  assert.equal((result.result as any).available, true);
});

test("harness escalates an unavailable or low-confidence diagnosis", async () => {
  const result = await runAgroCareAgent({ userId: "farmer-1", toolName: "get_crop_diagnosis", input: { diagnosis: { crop: "Tomato", disease: "Early blight", confidence: 40 } } });
  assert.equal(result.status, "escalation");
  assert.equal(result.safety?.action, "ESCALATE");
});

test("harness returns a controlled fallback for unsupported tools", async () => {
  const result = await runAgroCareAgent({ userId: "farmer-1", toolName: "not-a-tool" });
  assert.equal(result.status, "fallback");
  assert.deepEqual(result.toolsUsed, []);
});

test("harness enforces weather safety in the structured result", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ current: { temperature_2m: 28, relative_humidity_2m: 80, rain: 2, wind_speed_10m: 8 }, daily: { precipitation_probability_max: [60] } }), { status: 200 });
  try {
    const result = await runAgroCareAgent({ userId: "farmer-1", toolName: "get_weather", input: { latitude: 12.9, longitude: 77.5 } });
    assert.equal(result.status, "success");
    assert.equal(result.safety?.action, "DEFER");
    assert.equal((result.result as any).spraySafety.status, "unsafe");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { getProductDetails } from '../src/utils/productImages';
import { getIsOnline } from '../src/services/connectivity';
import { getGemmaOfflineResponse } from '../src/services/gemma';
import { OFFLINE_DISEASE_LIBRARY, clearPendingOfflineActions, getPendingOfflineActions, queueOfflineAction } from '../src/utils/offlineStorage';
import {
  clampDiagnosisConfidence,
  containsPrivilegedUserFields,
  createUnableToDiagnoseResult,
  sanitizeDiagnosisRecord,
  sanitizeProfileInput,
} from '../src/utils/apiSafety';
import {
  getConfidenceLabel,
  getDiagnosisConfidencePercent,
  isDiagnosisUnavailable,
} from '../src/utils/diagnosisDisplay';
import { evaluateSpraySafety, isValidCoordinate } from '../src/utils/voiceSafety';

beforeEach(() => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  }});
});

test('known product lookup is case-insensitive', () => {
  const p = getProductDetails('Neem oil spray');
  assert.equal(p.name, 'Neem oil spray');
  assert.equal(p.category, 'Organic');
  assert.match(p.brand, /Neem/i);
});

test('unknown organic products use organic defaults', () => {
  const p = getProductDetails('botanical extract', true);
  assert.equal(p.category, 'Organic');
  assert.equal(p.packagingSize, '1 Litre Bottle');
});

test('empty product names use safe defaults', () => {
  const p = getProductDetails('', false);
  assert.equal(p.name, 'AgroCare Crop Care Product');
  assert.equal(p.category, 'Fungicide');
});

test('offline Gemma selects termite and localized branches', () => {
  const response = getGemmaOfflineResponse('How do I control termites?', 'en');
  assert.match(response, /Termite Management/);
  assert.match(response, /Corn Cob Traps/);
  assert.match(getGemmaOfflineResponse('aphid समस्या', 'hi'), /माहू/);
});

test('connectivity is online in non-browser runtime', () => assert.equal(getIsOnline(), true));

test('offline action queue persists and clears', async () => {
  clearPendingOfflineActions();
  await queueOfflineAction('SAVE_PROFILE', { farmerId: 'farmer-1' });
  const queued = getPendingOfflineActions();
  assert.equal(queued.length, 1);
  assert.equal(queued[0].type, 'SAVE_PROFILE');
  assert.deepEqual(queued[0].data, { farmerId: 'farmer-1' });
  clearPendingOfflineActions();
  assert.deepEqual(getPendingOfflineActions(), []);
});

test('offline library entries have treatment data', () => {
  assert.ok(OFFLINE_DISEASE_LIBRARY.length >= 5);
  for (const d of OFFLINE_DISEASE_LIBRARY) {
    assert.ok(d.id.startsWith('off-'));
    assert.ok(d.crop && d.disease);
    assert.ok(d.treatment.organic.name && d.treatment.chemical.name);
  }
});

test('diagnosis confidence is clamped to the reliable public cap', () => {
  assert.equal(clampDiagnosisConfidence(99), 85);
  assert.equal(clampDiagnosisConfidence(-10), 0);
  assert.equal(clampDiagnosisConfidence('72.4'), 72);
  assert.equal(clampDiagnosisConfidence('not-a-number'), 0);
});

test('unavailable diagnosis result does not invent a disease or treatment', () => {
  const result = createUnableToDiagnoseResult('Gemini is unavailable');
  assert.equal(result.crop, 'Unknown');
  assert.equal(result.disease, 'Unable to Diagnose');
  assert.equal(result.confidence, 0);
  assert.equal(result.diagnosisStatus, 'UNAVAILABLE');
  assert.match(result.treatment.chemical.precautions, /Consult/i);
});

test('unavailable diagnosis displays as failed instead of high confidence', () => {
  const result = createUnableToDiagnoseResult('Gemini is unavailable');

  assert.equal(isDiagnosisUnavailable(result), true);
  assert.equal(getDiagnosisConfidencePercent(result.confidence), 0);
  assert.equal(getConfidenceLabel(result.confidence, true, 'en'), 'Not Diagnosed');
  assert.equal(getDiagnosisConfidencePercent(0.82), 82);
  assert.equal(getDiagnosisConfidencePercent(95), 95);
});

test('stored diagnosis records are scoped to the authenticated user and capped', () => {
  const record = sanitizeDiagnosisRecord({
    userId: 'attacker',
    crop: ' Tomato ',
    disease: 'Early Blight',
    confidence: 98,
    severity: 'Critical',
    boundingBox: [-10, 25.2, 1200, 700],
  }, 'farmer-123', new Date('2026-08-15T00:00:00.000Z'));

  assert.equal(record.userId, 'farmer-123');
  assert.equal(record.crop, 'Tomato');
  assert.equal(record.confidence, 85);
  assert.equal(record.severity, 'Low');
  assert.equal('boundingBox' in record, true);
  if ('boundingBox' in record) {
    assert.deepEqual(record.boundingBox, [0, 25, 1000, 700]);
  }
});

test('profile sanitization rejects privilege fields', () => {
  const profile = sanitizeProfileInput({
    name: '  Farmer One  ',
    crops: 'Tomato',
    role: 'admin',
    claims: { admin: true },
  });

  assert.deepEqual(profile, { name: 'Farmer One', crops: 'Tomato' });
  assert.equal(containsPrivilegedUserFields({ role: 'admin' }), true);
  assert.equal(containsPrivilegedUserFields({ name: 'Farmer One' }), false);
});

test('voice spray safety is deterministic for rain, wind, and unknown weather', () => {
  assert.equal(evaluateSpraySafety({ rain: 0, wind: 12, precipitationProbability: 10 }).status, 'safe');
  assert.equal(evaluateSpraySafety({ rain: 0.2, wind: 8, precipitationProbability: 5 }).status, 'unsafe');
  assert.equal(evaluateSpraySafety({ rain: 0, wind: 24, precipitationProbability: 0 }).status, 'unsafe');
  assert.equal(evaluateSpraySafety(null).status, 'unknown');
});

test('voice tools reject invalid location coordinates', () => {
  assert.equal(isValidCoordinate(12.9716, -90, 90), true);
  assert.equal(isValidCoordinate(200, -90, 90), false);
  assert.equal(isValidCoordinate('12.9716', -90, 90), false);
});


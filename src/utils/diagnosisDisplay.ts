import type { Language } from '../types';

type DiagnosisLike = {
  confidence?: number | string | null;
  crop?: string | null;
  disease?: string | null;
  diagnosisStatus?: string | null;
};

export function getDiagnosisConfidencePercent(confidence: unknown): number {
  if (confidence === null || confidence === undefined || confidence === '') return 0;
  const numericValue = typeof confidence === 'number' ? confidence : Number(confidence);
  if (!Number.isFinite(numericValue)) return 0;

  const percent = numericValue > 0 && numericValue <= 1
    ? numericValue * 100
    : numericValue;

  return Math.max(0, Math.min(100, Math.round(percent)));
}

export function isDiagnosisUnavailable(result: DiagnosisLike | null | undefined): boolean {
  if (!result) return true;

  const status = String(result.diagnosisStatus || '').trim().toUpperCase();
  if (status === 'UNAVAILABLE') return true;

  const disease = String(result.disease || '').trim().toLowerCase();
  const crop = String(result.crop || '').trim().toLowerCase();
  return getDiagnosisConfidencePercent(result.confidence) === 0
    && (disease.includes('unable to diagnose') || crop === 'unknown');
}

export function getConfidenceLabel(confidence: unknown, isUnavailable: boolean, language: Language = 'en'): string {
  if (isUnavailable) {
    return language === 'hi'
      ? 'निदान उपलब्ध नहीं'
      : language === 'kn'
        ? 'ರೋಗನಿರ್ಣಯ ಲಭ್ಯವಿಲ್ಲ'
        : 'Not Diagnosed';
  }

  const percent = getDiagnosisConfidencePercent(confidence);
  if (percent >= 85) {
    return language === 'hi' ? 'उच्च सटीकता' : language === 'kn' ? 'ಹೆಚ್ಚಿನ ನಿಖರತೆ' : 'High Match';
  }
  if (percent >= 60) {
    return language === 'hi' ? 'संभावित' : language === 'kn' ? 'ಸಾಧ್ಯತೆ' : 'Possible Match';
  }
  return language === 'hi' ? 'कम सटीकता' : language === 'kn' ? 'ಕಡಿಮೆ ನಿಖರತೆ' : 'Low Confidence';
}

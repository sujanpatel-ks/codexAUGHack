import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Share2, Volume2, Droplets, Layers, Stethoscope, Store, Bot, CloudRain, CheckCircle, Clock, ChevronDown, Bug, Info, ShieldCheck, AlertTriangle, PhoneCall, MapPin, Calendar, Check, FileDown, Loader2, Bookmark, BookmarkCheck, ZoomIn, PackageCheck, X, Sparkles, WifiOff, RefreshCw, BookOpen, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DiagnosisResult, generateSpeech } from '../services/gemini';
import { Task, Language } from '../types';
import { LiveAudioChat } from './LiveAudioChat';
import WhatsAppShare from './WhatsAppShare';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthProvider';
import { toast } from 'sonner';
import { getProductDetails } from '../utils/productImages';
import { useConnectivity } from '../services/connectivity';
import { apiFetch } from '../services/apiClient';
import { getConfidenceLabel, getDiagnosisConfidencePercent, isDiagnosisUnavailable } from '../utils/diagnosisDisplay';
import { 
  saveDiagnosisOffline, 
  getLatestDiagnosisOffline, 
  OFFLINE_DISEASE_LIBRARY, 
  queueOfflineAction, 
  StoredDiagnosis 
} from '../utils/offlineStorage';

interface DiagnosisProps {
  result: DiagnosisResult | null;
  imageUrl: string | null;
  language: Language;
  onBack: () => void;
  onAskAI: () => void;
  onFindSupplier: (query?: string) => void;
  onSaveToCalendar: (task: Omit<Task, 'id' | 'completed'>) => void;
  onToggleLanguage: (lang?: Language) => void;
}

export const Diagnosis: React.FC<DiagnosisProps> = ({ 
  result: propResult, 
  imageUrl: propImageUrl, 
  language, 
  onBack, 
  onAskAI, 
  onFindSupplier, 
  onSaveToCalendar, 
  onToggleLanguage 
}) => {
  const { user } = useAuth();
  const isOnline = useConnectivity();

  // Active diagnosis state: Use propResult if provided, else fallback to offline cached diagnosis
  const [activeResult, setActiveResult] = useState<DiagnosisResult | null>(propResult);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(propImageUrl);
  const [isOfflineLibraryOpen, setIsOfflineLibraryOpen] = useState(false);

  const [savedTasks, setSavedTasks] = useState<Set<string>>(new Set());
  const [treatmentType, setTreatmentType] = useState<'organic' | 'chemical'>('organic');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLiveAudioOpen, setIsLiveAudioOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Sync prop changes and ensure offline persistence
  useEffect(() => {
    if (propResult) {
      setActiveResult(propResult);
      setActiveImageUrl(propImageUrl);
      // Persist to offline IndexedDB / LocalStorage cache automatically
      saveDiagnosisOffline(propResult, propImageUrl).catch(err => {
        console.warn('Failed to save diagnosis to offline cache:', err);
      });
    } else if (!activeResult) {
      // Load latest offline diagnosis if no prop was supplied
      getLatestDiagnosisOffline().then(cached => {
        if (cached) {
          setActiveResult(cached);
          if (cached.imageUrl) {
            setActiveImageUrl(cached.imageUrl);
          }
        }
      });
    }
  }, [propResult, propImageUrl]);

  const translations = {
    en: {
      title: "Diagnosis Dashboard",
      severity: "Severity",
      symptoms: "Symptoms",
      prevention: "Prevention Tips",
      immediate: "Immediate Actions",
      longTerm: "Long-term Measures",
      treatment: "Recommended Treatment",
      organic: "Organic",
      chemical: "Chemical",
      recommended: "RECOMMENDED",
      dosage: "Dosage",
      freq: "Freq",
      precaution: "Precaution",
      severeTitle: "Severe Infection Detected",
      severeDesc: "This case requires professional intervention to prevent crop loss.",
      contactExpert: "Contact Local Expert",
      findSupplier: "Find Nearby Supplier",
      askAI: "Deep Dive with AI",
      noDiagnosis: "No Diagnosis Yet",
      scanPrompt: "Scan a crop leaf or select from our Offline Disease Library.",
      goBack: "Go Back",
      pestDetected: "Pest Detected",
      cropHealth: "Crop Health",
      exportPDF: "Export PDF",
      saveToProfile: "Save to Profile",
      saving: "Saving...",
      saved: "Saved to Profile",
      offlineBadge: "Offline Persistence Active",
      offlineDesc: "Data loaded from local Service Worker cache. Full treatment, dosage & symptoms are accessible offline.",
      libraryBtn: "Browse Offline Guides",
      selectDisease: "Select a Crop to View Treatment Guide"
    },
    hi: {
      title: "फसल निदान डैशबोर्ड",
      severity: "गंभीरता",
      symptoms: "लक्षण",
      prevention: "बचाव के उपाय",
      immediate: "तत्काल कार्रवाई",
      longTerm: "दीर्घकालिक उपाय",
      treatment: "अनुशंसित उपचार",
      organic: "जैविक",
      chemical: "रासायनिक",
      recommended: "अनुशंसित",
      dosage: "खुराक",
      freq: "आवृत्ति",
      precaution: "सावधानी",
      severeTitle: "गंभीर संक्रमण का पता चला",
      severeDesc: "फसल के नुकसान को रोकने के लिए इस मामले में पेशेवर हस्तक्षेप की आवश्यकता है।",
      contactExpert: "स्थानीय विशेषज्ञ से संपर्क करें",
      findSupplier: "आस-पास के आपूर्तिकर्ता खोजें",
      askAI: "एआई के साथ गहराई से जानें",
      noDiagnosis: "अभी तक कोई निदान नहीं",
      scanPrompt: "पत्ती को स्कैन करें या हमारे ऑफ़लाइन रोग संग्रह से चुनें।",
      goBack: "वापस जाएं",
      pestDetected: "कीट/रोग का पता चला",
      cropHealth: "फसल स्वास्थ्य",
      exportPDF: "PDF निर्यात करें",
      saveToProfile: "प्रोफ़ाइल में सहेजें",
      saving: "सहेज रहा है...",
      saved: "प्रोफ़ाइल में सहेजा गया",
      offlineBadge: "ऑफ़लाइन मोड सक्रिय",
      offlineDesc: "सर्विस वर्कर कैश से लोड किया गया। उपचार, खुराक और लक्षण बिना इंटरनेट के उपलब्ध हैं।",
      libraryBtn: "ऑफ़लाइन गाइड देखें",
      selectDisease: "उपचार गाइड देखने के लिए फसल चुनें"
    },
    kn: {
      title: "ಬೆಳೆ ರೋಗನಿರ್ಣಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      severity: "ತೀವ್ರತೆ",
      symptoms: "ಲಕ್ಷಣಗಳು",
      prevention: "ತಡೆಗಟ್ಟುವ ಕ್ರಮಗಳು",
      immediate: "ತಕ್ಷಣದ ಕ್ರಮಗಳು",
      longTerm: "ದೀರ್ಘಕಾಲದ ಕ್ರಮಗಳು",
      treatment: "ಶಿಫಾರಸು ಮಾಡಿದ ಚಿಕಿತ್ಸೆ",
      organic: "ಸಾವಯವ",
      chemical: "ರಾಸಾಯನಿಕ",
      recommended: "ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ",
      dosage: "ಡೋಸೇಜ್",
      freq: "ಆವರ್ತನ",
      precaution: "ಮುನ್ನೆಚ್ಚರಿಕೆ",
      severeTitle: "ತೀವ್ರ ಸೋಂಕು ಪತ್ತೆಯಾಗಿದೆ",
      severeDesc: "ಬೆಳೆ ನಷ್ಟವನ್ನು ತಡೆಗಟ್ಟಲು ಈ ಸಂದರ್ಭದಲ್ಲಿ ವೃತ್ತಿಪರ ಹಸ್ತಕ್ಷೇಪದ ಅಗತ್ಯವಿದೆ.",
      contactExpert: "ಸ್ಥಾನಿಕ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ",
      findSupplier: "ಹತ್ತಿರದ ಸರಬರಾಜುದಾರರನ್ನು ಹುಡುಕಿ",
      askAI: "AI ನೊಂದಿಗೆ ಆಳವಾಗಿ ತಿಳಿಯಿರಿ",
      noDiagnosis: "ಇನ್ನೂ ಯಾವುದೇ ರೋಗನಿರ್ಣಯವಿಲ್ಲ",
      scanPrompt: "ಎಲೆಯನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ನಮ್ಮ ಆಫ್‌ಲೈನ್ ರೋಗ ಲೈಬ್ರರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ.",
      goBack: "ಹಿಂದಕ್ಕೆ ಹೋಗಿ",
      pestDetected: "ಕೀಟ/ರೋಗ ಪತ್ತೆಯಾಗಿದೆ",
      cropHealth: "ಬೆಳೆ ಆರೋಗ್ಯ",
      exportPDF: "PDF ರಫ್ತು ಮಾಡಿ",
      saveToProfile: "ಪ್ರೊಫೈಲ್‌ಗೆ ಉಳಿಸಿ",
      saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
      saved: "ಪ್ರೊಫೈಲ್‌ಗೆ ಉಳಿಸಲಾಗಿದೆ",
      offlineBadge: "ಆಫ್‌ಲೈನ್ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ",
      offlineDesc: "ಸರ್ವಿಸ್ ವರ್ಕರ್ ಕ್ಯಾಶ್‌ನಿಂದ ಲೋಡ್ ಮಾಡಲಾಗಿದೆ. ಚಿಕಿತ್ಸೆ ಮತ್ತು ಲಕ್ಷಣಗಳು ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆ ಲಭ್ಯವಿದೆ.",
      libraryBtn: "ಆಫ್‌ಲೈನ್ ಗೈಡ್‌ಗಳು",
      selectDisease: "ಚಿಕಿತ್ಸೆ ಮಾರ್ಗದರ್ಶಿಗಾಗಿ ಬೆಳೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ"
    }
  };

  const t = translations[language] || translations.en;

  // Fallback to offline library if no active result
  const result = activeResult || OFFLINE_DISEASE_LIBRARY[0];
  const currentImageUrl = activeImageUrl || (result === OFFLINE_DISEASE_LIBRARY[0] ? "https://images.unsplash.com/photo-1546554137-f86b9593a222?w=600&auto=format&fit=crop&q=80" : null);

  const isUnavailableDiagnosis = isDiagnosisUnavailable(result);
  const confValue = getDiagnosisConfidencePercent(result.confidence);
  const confidenceColor = isUnavailableDiagnosis ? 'text-slate-600' : confValue >= 85 ? 'text-emerald-600' : confValue >= 60 ? 'text-amber-600' : 'text-rose-600';
  const confidenceStroke = isUnavailableDiagnosis ? '#64748b' : confValue >= 85 ? '#10b981' : confValue >= 60 ? '#f59e0b' : '#f43f5e';
  const confidenceLabel = getConfidenceLabel(result.confidence, isUnavailableDiagnosis, language);

  const severityColor = 
    result.severity === 'High' ? 'bg-red-100 text-red-700 border-red-200' : 
    result.severity === 'Medium' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
    'bg-blue-100 text-blue-700 border-blue-200';

  // Audio speech playback with offline fallback
  const handleSpeak = async () => {
    if (isSpeaking) {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = language === 'hi' 
      ? `${result.crop} ${result.diseaseHi || result.disease}. ${result.description}`
      : language === 'kn'
      ? `${result.crop} ${result.diseaseKn || result.disease}. ${result.description}`
      : `${result.crop} ${result.disease}. ${result.description}`;

    setIsSpeaking(true);

    // Try online AI voice first if connected
    if (isOnline) {
      try {
        const base64Audio = await generateSpeech(textToSpeak);
        if (base64Audio) {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          audioContextRef.current = audioContext;
          
          const arrayBuffer = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)).buffer;
          const int16Array = new Int16Array(arrayBuffer);
          const float32Array = new Float32Array(int16Array.length);
          
          for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768;
          }
          
          const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
          audioBuffer.getChannelData(0).set(float32Array);
          
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.onended = () => {
            setIsSpeaking(false);
            audioContextRef.current = null;
          };
          source.start();
          return;
        }
      } catch (error) {
        console.warn("Online speech generation failed, falling back to browser synthesis:", error);
      }
    }

    // Offline Browser SpeechSynthesis Fallback
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN';
        utterance.rate = 0.95;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        return;
      } catch (synthErr) {
        console.error('Offline speech synthesis error:', synthErr);
      }
    }

    setIsSpeaking(false);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const imgData = await toPng(reportRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#FFFFFF',
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AgroCare_Diagnosis_${result.crop}_${result.disease}.pdf`);
      toast.success('Diagnosis PDF exported successfully!');
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveToProfile = async () => {
    if (!result) return;
    setIsSaving(true);

    // Save locally to offline database first
    await saveDiagnosisOffline(result, currentImageUrl);

    if (!user) {
      setIsSaved(true);
      setIsSaving(false);
      toast.success(language === 'hi' ? 'स्थानीय ऑफ़लाइन प्रोफ़ाइल में सहेजा गया' : language === 'kn' ? 'ಸ್ಥಳೀಯ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ' : 'Saved to offline local profile');
      return;
    }

    if (!isOnline) {
      // Queue action for syncing when online
      await queueOfflineAction('SAVE_DIAGNOSIS', {
        userId: user.uid,
        crop: result.crop,
        disease: result.disease,
        confidence: result.confidence,
        severity: result.severity,
        timestamp: new Date().toISOString(),
        imageUrl: currentImageUrl,
        diagnosis: result
      });
      setIsSaved(true);
      setIsSaving(false);
      toast.success(language === 'hi' ? 'ऑफ़लाइन सहेजा गया (ऑनलाइन होने पर सिंक होगा)' : language === 'kn' ? 'ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ' : 'Saved offline (will sync once online)');
      return;
    }

    const path = `users/${user.uid}/diagnoses`;
    try {
      if (user.isDemo) {
        const response = await apiFetch('/api/diagnoses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            crop: result.crop,
            disease: result.disease,
            confidence: result.confidence,
            severity: result.severity,
            imageUrl: currentImageUrl,
            diagnosis: result
          })
        });
        if (!response.ok) throw new Error('Failed to save demo diagnosis');
        setIsSaved(true);
        toast.success(t.saved);
        return;
      }

      await addDoc(collection(db, path), {
        userId: user.uid,
        crop: result.crop,
        disease: result.disease,
        confidence: result.confidence,
        severity: result.severity,
        timestamp: new Date().toISOString(),
        imageUrl: currentImageUrl,
        diagnosis: result
      });
      setIsSaved(true);
      toast.success(t.saved);
    } catch (error) {
      // Fallback: Queue offline
      await queueOfflineAction('SAVE_DIAGNOSIS', {
        userId: user.uid,
        crop: result.crop,
        disease: result.disease,
        confidence: result.confidence,
        severity: result.severity,
        timestamp: new Date().toISOString(),
        imageUrl: currentImageUrl,
        diagnosis: result
      });
      setIsSaved(true);
      toast.success('Saved to local offline cache.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa] w-full overflow-hidden relative">
      {/* Top Header */}
      <header className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20 pt-20 shadow-xs">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack} 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            title={t.goBack}
          >
            <ArrowLeft size={22} className="text-gray-700" />
          </button>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight flex items-center gap-1.5">
              <span>{t.title}</span>
            </h1>
            <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>ServiceWorker Verified</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Offline Guides Drawer Trigger */}
          <button
            onClick={() => setIsOfflineLibraryOpen(true)}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1B5E20] rounded-xl font-bold text-xs flex items-center gap-1 border border-emerald-200/90 transition-all cursor-pointer shadow-2xs"
            title="Browse Offline Knowledge"
          >
            <BookOpen size={14} className="text-emerald-700" />
            <span className="hidden sm:inline">{t.libraryBtn}</span>
          </button>

          {/* Save to Profile */}
          <button 
            onClick={handleSaveToProfile}
            disabled={isSaving || isSaved}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              isSaved 
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                : 'text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-200'
            }`}
            title={t.saveToProfile}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin text-primary" /> : isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>

          {/* Share */}
          <button 
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: isUnavailableDiagnosis ? 'AgroCare Diagnosis: Unable to Diagnose' : `AgroCare Diagnosis: ${result.crop} - ${result.disease}`,
                    text: isUnavailableDiagnosis
                      ? `AgroCare could not produce a reliable diagnosis from this image. ${result.description}`
                      : `Crop Health Diagnosis for ${result.crop}: ${result.disease} (${confValue}% Match).`,
                    url: window.location.href,
                  });
                } catch (e) {
                  console.log(e);
                }
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Diagnosis link copied to clipboard!');
              }
            }}
            className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors cursor-pointer"
            title="Share Diagnosis"
          >
            <Share2 size={18} />
          </button>
        </div>
      </header>

      {/* Offline Status & Persistence Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-900/90 text-amber-50 px-4 py-2 text-xs flex items-center justify-between gap-2 border-b border-amber-800">
          <div className="flex items-center gap-2">
            <WifiOff size={14} className="text-amber-300 shrink-0 animate-pulse" />
            <span className="font-medium">
              <strong className="font-black uppercase tracking-wider mr-1">{t.offlineBadge}:</strong>
              {t.offlineDesc}
            </span>
          </div>
          <button 
            onClick={() => setIsOfflineLibraryOpen(true)} 
            className="underline font-bold text-amber-200 hover:text-white shrink-0 cursor-pointer"
          >
            Change Crop
          </button>
        </div>
      )}

      {/* Main Diagnosis Content */}
      <main ref={reportRef} className="flex-1 overflow-y-auto pb-48 bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:p-6 p-4">
          
          {/* Left Column: Image, AI Confidence, Summary, Symptoms */}
          <div className="space-y-6">
            
            {/* Analyzed Leaf Image Container */}
            <div className="relative w-full h-72 lg:h-84 bg-black overflow-hidden rounded-2xl lg:rounded-3xl shadow-sm border border-gray-200/80">
              <img 
                src={currentImageUrl || "https://images.unsplash.com/photo-1546554137-f86b9593a222?w=600&auto=format&fit=crop&q=80"} 
                alt="Analyzed Leaf" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              
              {/* Scanning Grid Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-30"></div>

              {/* Technical Corner Markers */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-primary/70"></div>
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-primary/70"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-primary/70"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-primary/70"></div>

              {/* Scan Metadata Badge */}
              <div className="absolute bottom-4 left-4 text-[10px] font-mono text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>CACHE VERIFIED • PERSISTENT</span>
              </div>

              {/* Severity Pill */}
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-md backdrop-blur-md ${
                result.severity === 'High' ? 'bg-red-500/90 text-white border-red-400' :
                result.severity === 'Medium' ? 'bg-amber-500/90 text-white border-amber-400' :
                'bg-emerald-500/90 text-white border-emerald-400'
              }`}>
                {result.severity} {t.severity}
              </div>
            </div>

            {/* Disease Heading & Narration Card */}
            <div className="p-5 sm:p-6 bg-white border border-gray-200/80 shadow-xs rounded-2xl lg:rounded-3xl relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${isUnavailableDiagnosis ? 'bg-slate-400' : 'bg-primary animate-pulse'}`}></span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                      isUnavailableDiagnosis
                        ? 'text-slate-700 bg-slate-50 border-slate-200'
                        : 'text-emerald-800 bg-emerald-50 border-emerald-100'
                    }`}>
                      {isUnavailableDiagnosis ? '⚠️ NEEDS RETAKE' : `🌾 ${result.crop}`}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-earth leading-tight">
                    {isUnavailableDiagnosis
                      ? (language === 'hi' ? 'निदान नहीं हो पाया' : language === 'kn' ? 'ರೋಗನಿರ್ಣಯ ಸಾಧ್ಯವಾಗಲಿಲ್ಲ' : 'Unable to Diagnose')
                      : `${result.crop} ${result.disease}`}
                  </h2>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-600 mt-1.5 border-l-2 border-primary pl-2.5 py-0.5 bg-gray-50/80 rounded-r-md">
                    {isUnavailableDiagnosis
                      ? (language === 'hi' ? 'कोई रोग या उपचार अनुमानित नहीं किया गया।' : language === 'kn' ? 'ಯಾವುದೇ ರೋಗ ಅಥವಾ ಚಿಕಿತ್ಸೆ ಊಹಿಸಲಾಗಿಲ್ಲ.' : 'No disease or treatment was inferred from this image.')
                      : language === 'hi' && result.diseaseHi ? result.diseaseHi :
                        language === 'kn' && result.diseaseKn ? result.diseaseKn :
                        result.disease}
                  </h3>
                </div>
                
                {/* Audio Voice Narration Button (Online + Offline SpeechSynthesis) */}
                <button 
                  onClick={handleSpeak}
                  className={`p-3 rounded-2xl transition-all shadow-xs border shrink-0 cursor-pointer ${
                    isSpeaking 
                      ? 'bg-blue-600 text-white border-blue-700 animate-pulse ring-4 ring-blue-100' 
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  }`}
                  title="Listen to Diagnosis"
                >
                  <Volume2 size={20} />
                </button>
              </div>

              {/* Visual Confidence Gauge */}
              <div className={`mt-5 p-4 rounded-2xl border shadow-2xs ${
                isUnavailableDiagnosis
                  ? 'bg-gradient-to-br from-slate-50 via-white to-gray-50 border-slate-200'
                  : 'bg-gradient-to-br from-emerald-50/80 via-white to-green-50/50 border-emerald-100/90'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isUnavailableDiagnosis ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                      {isUnavailableDiagnosis ? <AlertTriangle size={15} /> : <Sparkles size={15} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">
                        {isUnavailableDiagnosis
                          ? (language === 'hi' ? 'निदान स्थिति' : language === 'kn' ? 'ರೋಗನಿರ್ಣಯ ಸ್ಥಿತಿ' : 'Diagnosis Status')
                          : (language === 'hi' ? 'एआई पहचान विश्वास स्तर' : language === 'kn' ? 'AI ಗುರುತಿಸುವಿಕೆಯ ವಿಶ್ವಾಸಾರ್ಹತೆ' : "AI Identification Confidence")}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-medium">
                        {isUnavailableDiagnosis
                          ? (language === 'hi' ? 'विश्वसनीय दृश्य निदान नहीं मिला' : language === 'kn' ? 'ನಂಬಲರ್ಹ ದೃಶ್ಯ ರೋಗನಿರ್ಣಯ ಸಿಗಲಿಲ್ಲ' : 'No reliable visual diagnosis was produced')
                          : (language === 'hi' ? 'स्पेक्ट्रल विश्लेषण मॉडल द्वारा सत्यापित' : language === 'kn' ? 'ಸ್ಪೆಕ್ಟ್ರಲ್ ವಿಶ್ಲೇಷಣೆ ಆಧಾರಿತ' : 'Verified by offline agricultural engine')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-base font-black font-mono tracking-tight ${confidenceColor}`}>
                      {confValue}%
                    </span>
                    <div className="mt-0.5">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        isUnavailableDiagnosis ? 'bg-slate-100 text-slate-700 border-slate-300' :
                        confValue >= 85 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        confValue >= 60 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {confidenceLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Track */}
                <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200/80 shadow-inner mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confValue}%` }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                    className={`h-full rounded-full shadow-xs ${
                      isUnavailableDiagnosis ? 'bg-gradient-to-r from-slate-400 to-slate-500' :
                      confValue >= 85 ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500' :
                      confValue >= 60 ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600' :
                      'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600'
                    }`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2.5">
                <button 
                  onClick={() => setIsLiveAudioOpen(true)}
                  className="flex-1 bg-blue-50 text-blue-800 border border-blue-200/90 font-bold py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 transition-all text-xs cursor-pointer shadow-2xs"
                >
                  <Bot size={16} className="text-blue-600" />
                  <span>Talk to AI</span>
                </button>
                <button 
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex-1 bg-white text-gray-700 border border-gray-200 font-bold py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all text-xs shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {isExporting ? <Loader2 className="animate-spin text-primary" size={16} /> : <FileDown size={16} className="text-primary" />}
                  <span>{t.exportPDF}</span>
                </button>
              </div>

              {/* Description Box */}
              <div className={`mt-4 p-4 rounded-xl border text-xs leading-relaxed font-medium ${
                isUnavailableDiagnosis
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/60 border-emerald-100 text-emerald-950'
              }`}>
                <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5 ${
                  isUnavailableDiagnosis ? 'text-amber-800' : 'text-emerald-800'
                }`}>
                  {isUnavailableDiagnosis ? <AlertTriangle size={12} className="text-amber-700" /> : <ShieldCheck size={12} className="text-emerald-700" />}
                  <span>{isUnavailableDiagnosis ? 'What happened' : 'Diagnostic Summary'}</span>
                </div>
                {result.description}
              </div>
            </div>

            {/* Weather Action Alert */}
            {result.actionRequired && (
              <div className="bg-orange-50 border border-orange-200/90 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
                <div className="bg-orange-100 p-2 rounded-xl text-orange-600 shrink-0">
                  <CloudRain size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-orange-900 text-xs uppercase tracking-wide">
                    Action Required: {result.actionRequired}
                  </h4>
                  <p className="text-xs text-orange-800 mt-1 font-medium">
                    {isUnavailableDiagnosis
                      ? 'Do not apply spray or pesticide from this result. Retake the photo or get expert review first.'
                      : 'Monitor weather changes before applying foliar spray. In rainy conditions, use sticker agents (Surfactant).'}
                  </p>
                </div>
              </div>
            )}

            {/* Symptoms Cards */}
            <div className="p-5 bg-white border border-gray-200/80 rounded-2xl lg:rounded-3xl shadow-xs">
              <h3 className="font-extrabold text-gray-900 text-base mb-3.5 flex items-center gap-2">
                <Bug className="text-primary" size={18} /> 
                <span>{t.symptoms}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {result.symptoms.map((symptom, i) => (
                  <div key={i} className="bg-emerald-50/30 border border-emerald-100/90 rounded-xl p-3 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#1B5E20] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                      {i + 1}
                    </div>
                    <span className="text-xs font-semibold text-gray-800 leading-snug">{symptom}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Treatments, Prevention & Supplier Integration */}
          <div className="space-y-6">

            {/* Recommended Treatments Card */}
            <div className="p-5 sm:p-6 bg-white border border-gray-200/80 rounded-2xl lg:rounded-3xl shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                  {isUnavailableDiagnosis ? <AlertTriangle className="text-amber-600" size={19} /> : <Stethoscope className="text-primary" size={19} />}
                  <span>{isUnavailableDiagnosis ? 'Safe Next Steps' : t.treatment}</span>
                </h3>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 uppercase tracking-wider ${
                  isUnavailableDiagnosis
                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                    : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                }`}>
                  {isUnavailableDiagnosis ? <Info size={13} className="text-amber-700" /> : <PackageCheck size={13} className="text-emerald-700" />}
                  <span>{isUnavailableDiagnosis ? 'No Treatment Inferred' : 'Verified Formulations'}</span>
                </span>
              </div>

              {isUnavailableDiagnosis ? (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <p className="text-sm font-bold text-amber-950 leading-relaxed">
                    AgroCare could not identify a reliable crop disease from this image, so no pesticide, fungicide, fertilizer, or dosage should be recommended yet.
                  </p>
                  <div className="mt-4 space-y-2.5">
                    {result.prevention.immediate.map((tip, i) => (
                      <div key={`safe-${i}`} className="flex items-start gap-2.5 bg-white/80 border border-amber-100 rounded-xl p-3">
                        <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 text-xs font-black">
                          {i + 1}
                        </span>
                        <p className="text-xs font-semibold text-gray-800 leading-snug">{tip}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={onBack}
                      className="flex-1 bg-[#1B5E20] hover:bg-[#144317] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition cursor-pointer"
                    >
                      <RefreshCw size={15} />
                      Retake Clear Photo
                    </button>
                    <a
                      href="tel:18001801551"
                      className="flex-1 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-black py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition cursor-pointer"
                    >
                      <PhoneCall size={15} />
                      Ask Expert
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  {/* Organic vs Chemical Switcher */}
                  <div className="bg-gray-100 p-1 rounded-xl flex mb-4">
                    <button 
                      onClick={() => setTreatmentType('organic')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        treatmentType === 'organic' 
                          ? 'bg-white text-primary shadow-xs' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <span>🌿 {t.organic}</span>
                    </button>
                    <button 
                      onClick={() => setTreatmentType('chemical')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        treatmentType === 'chemical' 
                          ? 'bg-white text-primary shadow-xs' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <span>🧪 {t.chemical}</span>
                    </button>
                  </div>

                  {/* Active Treatment Details */}
                  {(() => {
                const currentTreatment = result.treatment[treatmentType];
                const productInfo = getProductDetails(currentTreatment.name, treatmentType === 'organic');
                const displayProductImage = currentTreatment.imageUrl || productInfo.imageUrl;

                return (
                  <div className="bg-gradient-to-br from-white to-emerald-50/20 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 shadow-xs relative">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      
                      {/* Product Visual Photo */}
                      <div 
                        className="relative group shrink-0 cursor-pointer self-center sm:self-start" 
                        onClick={() => setPreviewImage(displayProductImage)}
                      >
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-50 p-1 ring-2 ring-emerald-500/30 shadow-md overflow-hidden relative">
                          <img 
                            src={displayProductImage} 
                            alt={currentTreatment.name}
                            className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1 backdrop-blur-[1px]">
                            <ZoomIn size={14} />
                            <span>Zoom</span>
                          </div>
                        </div>
                      </div>

                      {/* Product Specs */}
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
                            {productInfo.category}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500">
                            Pack: {currentTreatment.packagingSize || productInfo.packagingSize}
                          </span>
                        </div>

                        <h4 className="font-black text-sm sm:text-base text-gray-900 leading-snug">
                          {currentTreatment.name}
                        </h4>

                        <p className="text-xs text-emerald-800 font-bold mt-0.5 flex items-center gap-1">
                          <span>Brand:</span>
                          <span className="text-gray-800 font-medium">{currentTreatment.brand || productInfo.brand}</span>
                        </p>

                        {currentTreatment.nameHi && (
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">
                            {currentTreatment.nameHi}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[10px] bg-gray-100 px-2.5 py-1 rounded-lg font-bold text-gray-700 border border-gray-200">
                            <strong>{t.dosage}:</strong> {currentTreatment.dosage}
                          </span>
                          <span className="text-[10px] bg-blue-50 px-2.5 py-1 rounded-lg font-bold text-blue-700 border border-blue-100">
                            <strong>{t.freq}:</strong> {currentTreatment.frequency}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 gap-2">
                          <p className="text-xs sm:text-sm font-black text-primary">
                            Est: {currentTreatment.costEstimate}
                          </p>

                          <button 
                            onClick={() => {
                              onSaveToCalendar({
                                title: `Apply ${currentTreatment.name}`,
                                titleHi: 'उपचार लागू करें',
                                titleKn: 'ಚಿಕಿತ್ಸೆಯನ್ನು ಅನ್ವಯಿಸಿ',
                                description: `Apply ${currentTreatment.name} (${currentTreatment.dosage}). Freq: ${currentTreatment.frequency}. Precautions: ${currentTreatment.precautions}`,
                                icon: 'Stethoscope',
                                color: treatmentType === 'organic' ? 'blue' : 'red'
                              });
                              setSavedTasks(prev => new Set(prev).add(`treat-${treatmentType}`));
                              toast.success('Added to Farm Calendar Schedule');
                            }}
                            disabled={savedTasks.has(`treat-${treatmentType}`)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border shrink-0 cursor-pointer ${
                              savedTasks.has(`treat-${treatmentType}`) 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-emerald-50 text-[#1B5E20] border-emerald-300 hover:bg-emerald-100'
                            }`}
                          >
                            {savedTasks.has(`treat-${treatmentType}`) ? <Check size={14} /> : <Calendar size={14} />}
                            <span>{savedTasks.has(`treat-${treatmentType}`) ? 'Scheduled' : 'Add to Schedule'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Precaution Box */}
                    <div className="mt-3.5 p-3 bg-white rounded-xl border border-gray-200/80">
                      <div className="flex items-start gap-2">
                        <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                          <strong className="font-black uppercase tracking-wider mr-1">{t.precaution}:</strong>
                          {currentTreatment.precautions}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-dashed border-gray-200 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <CheckCircle className="text-primary" size={14} />
                        <span>Ready for application</span>
                      </div>
                      <button 
                        onClick={() => onFindSupplier(currentTreatment.name)}
                        className="font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Store size={13} />
                        <span>Find Suppliers &rarr;</span>
                      </button>
                    </div>
                  </div>
                );
                  })()}
                </>
              )}
            </div>

            {/* Prevention Measures */}
            <div className="p-5 sm:p-6 bg-white border border-gray-200/80 rounded-2xl lg:rounded-3xl shadow-xs">
              <h3 className="font-extrabold text-gray-900 text-base mb-4 flex items-center gap-2">
                <ShieldCheck className="text-green-600" size={19} />
                <span>{t.prevention}</span>
              </h3>
              
              <div className="space-y-4">
                {/* Immediate */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{t.immediate}</p>
                  <div className="space-y-2">
                    {result.prevention.immediate.map((tip, i) => (
                      <div 
                        key={`imm-${i}`}
                        className="flex items-center justify-between gap-2.5 bg-orange-50/60 p-2.5 rounded-xl border border-orange-100"
                      >
                        <p className="text-xs text-gray-800 font-medium leading-snug flex-1">{tip}</p>
                        <button 
                          onClick={() => {
                            onSaveToCalendar({
                              title: `Action: ${tip.substring(0, 25)}...`,
                              titleHi: 'तत्काल कार्रवाई',
                              titleKn: 'ತಕ್ಷಣದ ಕ್ರಮ',
                              description: tip,
                              icon: 'AlertTriangle',
                              color: 'orange'
                            });
                            setSavedTasks(prev => new Set(prev).add(`imm-${i}`));
                            toast.success('Task added to schedule');
                          }}
                          disabled={savedTasks.has(`imm-${i}`)}
                          className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
                            savedTasks.has(`imm-${i}`) 
                              ? 'bg-orange-200 text-orange-800' 
                              : 'bg-white text-gray-500 hover:text-primary border border-gray-200'
                          }`}
                        >
                          {savedTasks.has(`imm-${i}`) ? <Check size={14} /> : <Calendar size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Long Term */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{t.longTerm}</p>
                  <div className="space-y-2">
                    {result.prevention.longTerm.map((tip, i) => (
                      <div 
                        key={`lt-${i}`}
                        className="flex items-center justify-between gap-2.5 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100"
                      >
                        <p className="text-xs text-gray-800 font-medium leading-snug flex-1">{tip}</p>
                        <button 
                          onClick={() => {
                            onSaveToCalendar({
                              title: `Measure: ${tip.substring(0, 25)}...`,
                              titleHi: 'दीर्घकालिक उपाय',
                              titleKn: 'ದೀರ್ಘಕಾಲದ ಕ್ರಮ',
                              description: tip,
                              icon: 'ShieldCheck',
                              color: 'green'
                            });
                            setSavedTasks(prev => new Set(prev).add(`lt-${i}`));
                            toast.success('Task added to schedule');
                          }}
                          disabled={savedTasks.has(`lt-${i}`)}
                          className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
                            savedTasks.has(`lt-${i}`) 
                              ? 'bg-green-200 text-green-800' 
                              : 'bg-white text-gray-500 hover:text-primary border border-gray-200'
                          }`}
                        >
                          {savedTasks.has(`lt-${i}`) ? <Check size={14} /> : <Calendar size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Severe Infection Expert Helpline */}
            {result.severity === 'High' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4.5 flex flex-col gap-3.5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-xl text-red-600 shrink-0">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-red-900 text-sm">{t.severeTitle}</h4>
                    <p className="text-xs text-red-800 mt-0.5">{t.severeDesc}</p>
                  </div>
                </div>
                <a 
                  href="tel:18001801551"
                  className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer text-xs uppercase tracking-wider"
                >
                  <PhoneCall size={16} />
                  <span>{t.contactExpert} (1800-180-1551)</span>
                </a>
              </div>
            )}

            {/* WhatsApp Share Card */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
              <WhatsAppShare diagnosis={result} lang={language} />
            </div>

          </div>
        </div>
      </main>

      {/* Floating Bottom Quick Actions Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200/80 p-3 sm:p-4 pb-10 z-30 flex gap-2.5 max-w-4xl mx-auto inset-x-0">
        <button 
          onClick={() => {
            if (isUnavailableDiagnosis) {
              onBack();
              return;
            }
            const treatmentName = result?.treatment?.[treatmentType]?.name || result?.disease || 'Agro Store';
            onFindSupplier(treatmentName);
          }}
          className="flex-1 bg-primary hover:bg-[#144317] text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer text-xs sm:text-sm"
        >
          {isUnavailableDiagnosis ? <RefreshCw size={18} /> : <Store size={18} />}
          <span>{isUnavailableDiagnosis ? 'Retake Photo' : t.findSupplier}</span>
        </button>
        <button 
          onClick={onAskAI}
          className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs sm:text-sm cursor-pointer shadow-2xs"
        >
          <Bot size={18} className="text-blue-600" />
          <span>{t.askAI}</span>
        </button>
      </div>

      {/* Offline Disease Library Drawer / Modal */}
      <AnimatePresence>
        {isOfflineLibraryOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setIsOfflineLibraryOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden max-w-lg w-full p-5 sm:p-6 relative shadow-2xl flex flex-col max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#1B5E20] flex items-center justify-center font-bold">
                    <Database size={17} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 leading-tight">
                      {language === 'hi' ? 'ऑफ़लाइन फसल रोग संग्रह' : language === 'kn' ? 'ಆಫ್‌ಲೈನ್ ಬೆಳೆ ರೋಗ ಲೈಬ್ರರಿ' : 'Offline Crop Health Library'}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      Service Worker Pre-Cached
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOfflineLibraryOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs text-gray-600 my-3 font-medium">
                {t.selectDisease}
              </p>

              <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
                {OFFLINE_DISEASE_LIBRARY.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveResult(item);
                      setActiveImageUrl(null);
                      setIsOfflineLibraryOpen(false);
                      toast.success(`Loaded offline guide for ${item.crop}: ${item.disease}`);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      activeResult?.crop === item.crop && activeResult?.disease === item.disease
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
                        : 'bg-gray-50/80 hover:bg-emerald-50/40 border-gray-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                          🌾 {item.crop}
                        </span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                          item.severity === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-900 mt-0.5 truncate">
                        {language === 'hi' && item.diseaseHi ? item.diseaseHi :
                         language === 'kn' && item.diseaseKn ? item.diseaseKn :
                         item.disease}
                      </h4>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {item.treatment.organic.name}
                      </p>
                    </div>
                    <span className="text-primary font-bold text-xs shrink-0">View &rarr;</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Audio Chat Modal */}
      <AnimatePresence>
        {isLiveAudioOpen && (
          <LiveAudioChat 
            diagnosis={result} 
            onClose={() => setIsLiveAudioOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Product Image Lightbox Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden max-w-md w-full p-4 relative shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full z-10 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                <img 
                  src={previewImage} 
                  alt="Product Packaging Full View" 
                  className="w-full h-80 object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="mt-3 text-center">
                <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-wider inline-flex items-center gap-1">
                  <PackageCheck size={14} /> Verified Product Packaging
                </span>
                <p className="text-xs text-gray-500 mt-2">
                  Look for this exact packaging box / bottle when visiting your nearby agro retailer.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

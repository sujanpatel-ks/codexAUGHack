import React, { useState, useEffect, useRef } from 'react';
import { Bell, MapPin, Camera, Upload, Calendar as CalendarIcon, Store, X, Sprout, Users, TrendingUp, Beaker, Landmark, CloudRain, Sun, Wind, Droplets, RefreshCw, Loader2, Info, CheckCircle, AlertTriangle, AlertCircle, Thermometer, ChevronRight, MessageSquare, Sparkles, AlertOctagon, HelpCircle, Settings, Smartphone, Share2, Copy, Check, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUploader } from './FileUploader';
import { Language } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { useTranslation } from 'react-i18next';
import { Task, Screen } from '../types';
import { getConfidenceLabel, getDiagnosisConfidencePercent, isDiagnosisUnavailable } from '../utils/diagnosisDisplay';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
  onFileSelect: (file: File) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'completed'>) => void;
  language: Language;
  onToggleLanguage: (lang?: Language) => void;
  onCameraOpen: () => void;
  lastDiagnosis?: any;
}

interface WeatherSummaryData {
  temperature: number;
  humidity: number;
  rainVolume: number;
  rainProbability: number;
  maxRainProbability: number;
  windSpeed: number;
  weatherCode: number;
  summary: string;
  advice: string[];
  farmingIndex: 'Favorable' | 'Caution Required' | 'Hazardous';
}

const tWeather = {
  en: {
    weatherTitle: "Weather Summary",
    subtitle: "Precision Farm Forecast",
    temperature: "Temperature",
    rainProbability: "Rain Probability",
    humidity: "Humidity",
    windSpeed: "Wind Speed",
    farmingAdvice: "Smart Agro-Advice",
    farmingIndex: "Farming Index",
    favorable: "Favorable",
    caution: "Caution Required",
    hazardous: "Hazardous",
    fetching: "Updating farm forecast...",
    noLocation: "Enable GPS for precise localized advice.",
    retry: "Refresh Weather",
    todayMax: "Today's Max",
    cropsProfile: "Profile Context"
  },
  hi: {
    weatherTitle: "मौसम सारांश",
    subtitle: "सटीक कृषि पूर्वानुमान",
    temperature: "तापमान",
    rainProbability: "बारिश की संभावना",
    humidity: "आर्द्रता (नमी)",
    windSpeed: "हवा की गति",
    farmingAdvice: "कृषि-सलाह",
    farmingIndex: "खेती सूचकांक",
    favorable: "अनुकूल",
    caution: "सावधानी आवश्यक",
    hazardous: "जोखिम भरा",
    fetching: "मौसम अपडेट हो रहा है...",
    noLocation: "सटीक स्थानीय सलाह के लिए जीपीएस चालू करें।",
    retry: "मौसम रीफ्रेश करें",
    todayMax: "आज की अधिकतम",
    cropsProfile: "प्रोफाइल संदर्भ"
  },
  kn: {
    weatherTitle: "ಹವಾಮಾನ ಸಾರಾಂಶ",
    subtitle: "ನಿಖರ ಕೃಷಿ ಮುನ್ಸೂಚನೆ",
    temperature: "ತಾಪಮಾನ",
    rainProbability: "ಮಳೆಯ ಸಾಧ್ಯತೆ",
    humidity: "ಆರ್ದ್ರತೆ",
    windSpeed: "ಗಾಳಿಯ ವೇಗ",
    farmingAdvice: "ಕೃಷಿ ಸಲಹೆ",
    farmingIndex: "ಕೃಷಿ ಸೂಚ್ಯಂಕ",
    favorable: "ಅನುಕೂಲಕರ",
    caution: "ಎಚ್ಚರಿಕೆ ಅಗತ್ಯ",
    hazardous: "ಅಪಾಯಕಾರಿ",
    fetching: "ಹವಾಮಾನ ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...",
    noLocation: "ನಿಖರವಾದ ಕೃಷಿ ಸಲಹೆಗಾಗಿ ಜಿಪಿಎಸ್ ಸಕ್ರಿಯಗೊಳಿಸಿ.",
    retry: "ಹವಾಮಾನ ಮರುಲೋಡ್ ಮಾಡಿ",
    todayMax: "ಇಂದಿನ ಗರಿಷ್ಠ",
    cropsProfile: "ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿ"
  }
};

const dashboardTranslations = {
  en: {
    scanCrop: "Scan Crop",
    scanDesc: "Hold camera over an affected leaf for instant AI diagnosis",
    startScanner: "Tap to Start Camera View",
    uploadLabel: "Upload Crop Photo",
    lastDiagnosisTitle: "Recent Scan Result",
    noScansYet: "No scans recorded yet.",
    viewResult: "View Treatment Details",
    quickTools: "Farming Utilities",
    welcome: "Welcome back!",
    activeDiagnosis: "Diagnose Leaf",
    onlineMode: "Offline Ready",
    highSeverity: "High Severity",
    medSeverity: "Medium Severity",
    lowSeverity: "Low Severity",
    soilHealth: "Soil Health Status",
    goodStatus: "Optimal",
    tapToCapture: "Tap to Capture Diagnosis"
  },
  hi: {
    scanCrop: "फसल स्कैन करें",
    scanDesc: "तुरंत एआई निदान के लिए प्रभावित पत्ते पर कैमरा रखें",
    startScanner: "कैमरा व्यू शुरू करने के लिए टैप करें",
    uploadLabel: "फसल की फोटो अपलोड करें",
    lastDiagnosisTitle: "हालिया स्कैन परिणाम",
    noScansYet: "अभी तक कोई स्कैन नहीं किया गया है।",
    viewResult: "उपचार विवरण देखें",
    quickTools: "कृषि उपयोगिताएँ",
    welcome: "स्वागत है!",
    activeDiagnosis: "पत्ता निदान",
    onlineMode: "ऑफ़लाइन तैयार",
    highSeverity: "उच्च गंभीरता",
    medSeverity: "मध्यम गंभीरता",
    lowSeverity: "निम्न गंभीरता",
    soilHealth: "मिट्टी स्वास्थ्य स्थिति",
    goodStatus: "अनुकूल",
    tapToCapture: "निदान के लिए फोटो लें"
  },
  kn: {
    scanCrop: "ಬೆಳೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    scanDesc: "ತ್ವರಿತ AI ರೋಗನಿರ್ಣಯಕ್ಕಾಗಿ ಪೀಡಿತ ಎಲೆಯ ಮೇಲೆ ಕ್ಯಾಮೆರಾ ಹಿಡಿಯಿರಿ",
    startScanner: "ಕ್ಯಾಮೆರಾ ವೀಕ್ಷಣೆ ಪ್ರಾರಂಭಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
    uploadLabel: "ಬೆಳೆಯ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    lastDiagnosisTitle: "ಇತ್ತೀಚಿನ ಸ್ಕ್ಯಾನ್ ಫಲಿತಾಂಶ",
    noScansYet: "ಇನ್ನೂ ಯಾವುದೇ ಸ್ಕ್ಯಾನ್‌ಗಳಿಲ್ಲ.",
    viewResult: "ಚಿಕಿತ್ಸೆಯ ವಿವರಗಳನ್ನು ನೋಡಿ",
    quickTools: "ಕೃಷಿ ಉಪಯುಕ್ತತೆಗಳು",
    welcome: "ಸ್ವಾಗತ!",
    activeDiagnosis: "ಎಲೆ ರೋಗ ಪತ್ತೆ",
    onlineMode: "ಆಫ್‌ಲೈನ್ ಸಿದ್ಧವಾಗಿದೆ",
    highSeverity: "ಹೆಚ್ಚಿನ ತೀವ್ರತೆ",
    medSeverity: "ಮಧ್ಯಮ ತೀವ್ರತೆ",
    lowSeverity: "ಕಡಿಮೆ ತೀವ್ರತೆ",
    soilHealth: "ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಮಾಹಿತಿ",
    goodStatus: "ಉತ್ತಮ",
    tapToCapture: "ರೋಗ ಪತ್ತೆಗೆ ಫೋಟೋ ತೆಗೆಯಿರಿ"
  }
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  onNavigate, 
  onFileSelect, 
  onAddTask, 
  language, 
  onToggleLanguage, 
  onCameraOpen,
  lastDiagnosis 
}) => {
  const { t } = useTranslation();
  const dTrans = dashboardTranslations[language] || dashboardTranslations.en;
  
  const { latitude, longitude, loading: locationLoading, error: locationError, requestLocation } = useGeolocation();
  const [locationName, setLocationName] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<{ temp: number, condition: string, icon: React.ReactNode } | null>(null);
  const [weatherSummary, setWeatherSummary] = useState<WeatherSummaryData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [showWeatherCollapse, setShowWeatherCollapse] = useState(false);

  // Share state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const getShareReportText = () => {
    if (!lastDiagnosis) return '';
    const cropName = lastDiagnosis.crop || 'Crop';
    const unavailable = isDiagnosisUnavailable(lastDiagnosis);
    const diseaseName = (language === 'hi' && lastDiagnosis.diseaseHi) ? lastDiagnosis.diseaseHi :
                        (language === 'kn' && lastDiagnosis.diseaseKn) ? lastDiagnosis.diseaseKn :
                        lastDiagnosis.disease || 'Diagnosis';
    const severity = lastDiagnosis.severity || 'Medium';
    const confidence = getDiagnosisConfidencePercent(lastDiagnosis.confidence);
    const adviceText = lastDiagnosis.treatment?.chemical?.[0] || lastDiagnosis.treatment?.organic?.[0] || 'Consult local Krishi Kendra advisor for guidance.';

    return `🌾 *KrishiSewa Crop Health Diagnosis Report*\n\n` +
           (unavailable
             ? `• *Status:* Unable to Diagnose\n` +
               `• *AI Match Confidence:* ${confidence}%\n` +
               `• *Next Step:* Retake a clear, well-lit photo or consult a local Krishi Kendra advisor.\n\n`
             : `• *Crop:* ${cropName}\n` +
               `• *Diagnosis:* ${diseaseName}\n` +
               `• *Severity:* ${severity}\n` +
               `• *AI Match Confidence:* ${confidence}%\n` +
               `• *Key Treatment:* ${adviceText}\n\n`) +
           `📱 *Generated via KrishiSewa Smart Farming Assistant*`;
  };

  const handleNativeShare = async () => {
    const text = getShareReportText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `KrishiSewa Diagnosis: ${lastDiagnosis?.crop || 'Crop'}`,
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.info("Native share dismissed or unavailable:", err);
      }
    } else {
      handleCopyShareText();
    }
  };

  const handleWhatsAppShare = () => {
    const text = getShareReportText();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleTelegramShare = () => {
    const text = getShareReportText();
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleCopyShareText = async () => {
    const text = getShareReportText();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch (err) {
      console.warn("Clipboard copy failed:", err);
    }
  };

  // Home camera scanner state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flash, setFlash] = useState(false);

  // Auto-start camera stream if supported on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn("Home camera stream initialization failed:", err);
      setCameraError(err.message || "Camera access denied or unavailable.");
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64 = canvas.toDataURL('image/jpeg');
        setFlash(true);
        setTimeout(() => setFlash(false), 150);
        
        // Convert base64 to file to pass to onFileSelect
        fetch(base64)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "home_scan.jpg", { type: "image/jpeg" });
            onFileSelect(file);
          })
          .catch(err => {
            console.error("Failed to process captured image file:", err);
          });
      }
    }
  };

  // Reverse geocoding & Weather fetching
  useEffect(() => {
    if (latitude && longitude) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        .then(res => res.json())
        .then(data => {
          if (data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.county;
            const state = data.address.state;
            setLocationName(city && state ? `${city}, ${state}` : city || 'Local Farm');
          }
        })
        .catch(() => setLocationName('Local Farm'));

      setWeatherLoading(true);
      fetch('/api/weather-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude, language })
      })
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch weather");
          return res.json();
        })
        .then((data: WeatherSummaryData) => {
          setWeatherSummary(data);
          
          let conditionStr = 'Clear';
          if (data.rainProbability > 50) conditionStr = 'Rainy';
          else if (data.humidity > 80) conditionStr = 'Humid';
          else if (data.weatherCode >= 1 && data.weatherCode <= 3) conditionStr = 'Partly Cloudy';
          
          let iconComponent = <Sun size={20} className="text-yellow-400 animate-pulse" />;
          if (data.rainProbability > 50) iconComponent = <CloudRain size={20} className="text-blue-400" />;
          else if (data.weatherCode >= 1 && data.weatherCode <= 3) iconComponent = <Wind size={20} className="text-gray-400" />;

          setWeatherData({
            temp: Math.round(data.temperature),
            condition: conditionStr,
            icon: iconComponent
          });
        })
        .catch(err => console.error("Error loading weather summary:", err))
        .finally(() => setWeatherLoading(false));
    }
  }, [latitude, longitude, language]);

  const lastDiagnosisUnavailable = isDiagnosisUnavailable(lastDiagnosis);
  const lastDiagnosisConfidence = getDiagnosisConfidencePercent(lastDiagnosis?.confidence);
  const lastDiagnosisConfidenceLabel = getConfidenceLabel(lastDiagnosis?.confidence, lastDiagnosisUnavailable, language);
  const lastDiagnosisDiseaseLabel = lastDiagnosisUnavailable
    ? (language === 'hi' ? 'निदान नहीं हो पाया' : language === 'kn' ? 'ರೋಗನಿರ್ಣಯ ಸಾಧ್ಯವಾಗಲಿಲ್ಲ' : 'Unable to Diagnose')
    : language === 'hi' && lastDiagnosis?.diseaseHi ? lastDiagnosis.diseaseHi :
      language === 'kn' && lastDiagnosis?.diseaseKn ? lastDiagnosis.diseaseKn :
      lastDiagnosis?.disease;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFBF9] pb-24">
      {/* Top Welcome Bar */}
      <div className="bg-gradient-to-b from-primary-dark to-primary px-6 pt-12 pb-24 text-white rounded-b-[40px] shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
              <Sprout size={28} className="text-green-300" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs text-green-100/80 font-semibold">{dTrans.welcome}</p>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-1.5">
                <span>AgroCare AI</span>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold tracking-widest text-green-100 border border-white/10 uppercase">
                  PWA
                </span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-xs font-black uppercase tracking-wider bg-white/10 border border-white/10 px-3 py-1.5 rounded-full items-center gap-1.5 text-green-100 hidden sm:flex">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
              <span>{dTrans.onlineMode}</span>
            </div>
            <button
              onClick={() => onNavigate('profile')}
              className="w-10 h-10 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer hover:bg-white/20"
              style={{ minWidth: '40px', minHeight: '40px' }}
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-100/90 text-sm font-bold bg-black/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <MapPin size={15} className="text-green-300" />
            <span>
              {locationLoading ? 'GPS Locating...' : locationError ? 'Location Error' : locationName || 'Locating Farm...'}
            </span>
          </div>

          {weatherData && (
            <button 
              onClick={() => setShowWeatherCollapse(!showWeatherCollapse)}
              className="flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm active:scale-95 transition-transform"
            >
              {weatherData.icon}
              <span className="text-sm font-black">{weatherData.temp}°C</span>
              <span className="text-xs font-bold text-green-200">{weatherData.condition}</span>
              <ChevronRight size={14} className={`text-white transition-transform ${showWeatherCollapse ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 -mt-16 space-y-6 relative z-10">
        
        {/* Collapsible Weather Card */}
        <AnimatePresence>
          {showWeatherCollapse && weatherSummary && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="bg-white rounded-[28px] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-earth uppercase tracking-widest flex items-center gap-1.5">
                  <Sun size={16} className="text-primary" />
                  <span>{tWeather[language]?.weatherTitle || tWeather.en.weatherTitle}</span>
                </h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  weatherSummary.farmingIndex === 'Favorable' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  {weatherSummary.farmingIndex}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-semibold mb-4 leading-relaxed">{weatherSummary.summary}</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F4F6F2] p-3 rounded-2xl flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">{tWeather[language]?.humidity || tWeather.en.humidity}</span>
                  <span className="text-sm font-black text-earth">{weatherSummary.humidity}%</span>
                </div>
                <div className="bg-[#F4F6F2] p-3 rounded-2xl flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">{tWeather[language]?.rainProbability || tWeather.en.rainProbability}</span>
                  <span className="text-sm font-black text-earth">{weatherSummary.rainProbability}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HERO FEATURE: AI CROP DIAGNOSTIC HUB */}
        <div className="bg-gradient-to-br from-white via-emerald-50/50 to-emerald-100/30 p-5 sm:p-6 rounded-[36px] shadow-[0_16px_40px_rgba(27,94,32,0.06)] border border-emerald-100/90 relative overflow-hidden">
          {/* Top accent glow line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500" />
          
          {cameraActive ? (
            /* ACTIVE CAMERA STREAM VIEWFINDER */
            <div className="relative w-full aspect-[4/3] bg-neutral-950 rounded-[28px] overflow-hidden shadow-2xl border border-neutral-800 flex flex-col justify-between p-4">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover z-0 rounded-[28px]"
              />

              {/* Viewfinder Target Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                <div className="w-56 h-56 border-2 border-white/30 rounded-[28px] relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-[12px]"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-[12px]"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-[12px]"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-[12px]"></div>
                  
                  {/* Scanning line */}
                  <motion.div 
                    animate={{ top: ['5%', '95%', '5%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                  />
                </div>
              </div>

              {/* Flash effect */}
              <AnimatePresence>
                {flash && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white z-40 rounded-[28px]"
                  />
                )}
              </AnimatePresence>

              {/* Header controls inside camera */}
              <div className="relative z-20 w-full flex justify-between items-center">
                <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-emerald-400" />
                  <span>AI Live Scanner</span>
                </div>
                <button 
                  onClick={stopCamera}
                  className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                  title="Close Camera"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Shutter capture button */}
              <div className="relative z-20 w-full flex flex-col items-center gap-1 pb-1">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCapture}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-95 cursor-pointer border-4 border-emerald-500"
                >
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                    <Camera size={24} />
                  </div>
                </motion.button>
                <span className="text-[10px] font-bold text-white uppercase bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  {dTrans.tapToCapture}
                </span>
              </div>
            </div>
          ) : (
            /* IDLE CLEAN DIAGNOSTIC HUB */
            <div className="flex flex-col gap-4">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                    <Sprout size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-earth text-base tracking-tight">AI Crop Diagnostic Doctor</h3>
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full border border-emerald-200">
                        INSTANT
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      {language === 'hi' ? 'फसल की बीमारी का तुरंत एआई द्वारा पता लगाएं' : 
                       language === 'kn' ? 'ಬೆಳೆ ರೋಗಗಳನ್ನು ತಕ್ಷಣ AI ನಿಂದ ಪತ್ತೆ ಮಾಡಿ' : 
                       'Diagnose diseases, pests & nutrient issues in seconds'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={startCamera} 
                  disabled={cameraLoading}
                  className="group relative w-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-800 hover:from-emerald-500 hover:via-emerald-600 hover:to-green-700 text-white font-extrabold text-sm py-3.5 px-4 rounded-2xl shadow-[0_8px_25px_rgba(16,185,129,0.28)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.38)] flex items-center justify-center gap-3 transition-all cursor-pointer border border-emerald-400/30 overflow-hidden"
                  style={{ minHeight: '54px' }}
                >
                  <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md group-hover:scale-110 transition-transform">
                    {cameraLoading ? (
                      <Loader2 size={18} className="animate-spin text-emerald-200" />
                    ) : (
                      <Camera size={18} className="text-emerald-200" />
                    )}
                  </div>
                  <span className="tracking-wide">{dTrans.startScanner}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="group w-full bg-white hover:bg-emerald-50/90 text-emerald-950 font-extrabold text-sm py-3.5 px-4 rounded-2xl border-2 border-emerald-600/30 hover:border-emerald-600/60 flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  style={{ minHeight: '54px' }}
                >
                  <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-700 group-hover:scale-110 transition-transform">
                    <Upload size={18} />
                  </div>
                  <span className="tracking-wide">
                    {language === 'hi' ? 'पत्ती की फोटो अपलोड करें' : 
                     language === 'kn' ? 'ಎಲೆಯ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ' : 
                     'Upload Leaf Photo'}
                  </span>
                </motion.button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFileSelect(file);
                  }}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Drag & Drop Area */}
              <motion.div 
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.99 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) onFileSelect(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/90 hover:bg-emerald-50/40 rounded-2xl p-3.5 border-2 border-dashed border-emerald-200 hover:border-emerald-500 transition-all flex items-center justify-center gap-3.5 cursor-pointer text-center group shadow-2xs hover:shadow-sm"
              >
                <div className="p-2.5 rounded-xl bg-emerald-100/70 text-emerald-700 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  <Upload size={16} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-earth group-hover:text-emerald-900 transition-colors">
                    {language === 'hi' ? 'यहाँ फोटो खींचें और छोड़ें या ब्राउज़ करें' :
                     language === 'kn' ? 'ಇಲ್ಲಿ ಫೋಟೋ ಎಳೆದು ಹಾಕಿ ಅಥವಾ ಆಯ್ಕೆ ಮಾಡಿ' :
                     'Drag & drop crop image here or click to browse'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">Supports JPG, PNG, WEBP (Max 10MB)</p>
                </div>
              </motion.div>

              {/* Instant Demo Quick Scan Pills */}
              <div className="pt-2 border-t border-emerald-100/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={12} className="text-emerald-600 animate-pulse" />
                    {language === 'hi' ? 'त्वरित एआई टेस्ट स्कैन (नमूना)' :
                     language === 'kn' ? 'ತಕ್ಷಣದ AI ಮಾದರಿ ಪರಿಶೀಲನೆ' :
                     'Test Instant AI Demo Scan:'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '🌴 Coconut Bud Rot', crop: 'Coconut' },
                    { label: '🌾 Rice Leaf Blast', crop: 'Rice' },
                    { label: '🍅 Tomato Leaf Curl', crop: 'Tomato' },
                  ].map((demo, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.04, y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        // Generate simulated leaf image File
                        const canvas = document.createElement('canvas');
                        canvas.width = 400;
                        canvas.height = 400;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          const grad = ctx.createLinearGradient(0, 0, 400, 400);
                          grad.addColorStop(0, '#1b4332');
                          grad.addColorStop(0.5, '#2d6a4f');
                          grad.addColorStop(1, '#52b788');
                          ctx.fillStyle = grad;
                          ctx.fillRect(0, 0, 400, 400);

                          ctx.beginPath();
                          ctx.moveTo(200, 30);
                          ctx.lineTo(200, 370);
                          ctx.strokeStyle = '#d8f3dc';
                          ctx.lineWidth = 4;
                          ctx.stroke();

                          ctx.beginPath();
                          ctx.arc(170, 160, 30, 0, Math.PI * 2);
                          ctx.arc(230, 230, 25, 0, Math.PI * 2);
                          ctx.fillStyle = '#4a3222';
                          ctx.fill();

                          canvas.toBlob((blob) => {
                            if (blob) {
                              const file = new File([blob], `${demo.crop.toLowerCase()}_sample.jpg`, { type: 'image/jpeg' });
                              onFileSelect(file);
                            }
                          }, 'image/jpeg');
                        }
                      }}
                      className="bg-white hover:bg-emerald-700 hover:text-white text-earth text-xs font-bold px-3.5 py-1.5 rounded-xl border border-emerald-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{demo.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* OPTIONAL: Show last detection result as a card below scanner (if user has prior scans) */}
        {lastDiagnosis && (
          <motion.div 
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -2 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 24,
              opacity: { duration: 0.45 },
              y: { type: "spring", stiffness: 260, damping: 24 }
            }}
            className={`bg-gradient-to-br from-white p-6 rounded-[32px] shadow-[0_12px_36px_rgba(30,86,49,0.08)] hover:shadow-[0_18px_48px_rgba(30,86,49,0.14)] border flex flex-col gap-5 transition-all relative overflow-hidden group ${
              lastDiagnosisUnavailable
                ? 'via-amber-50/50 to-slate-50/30 border-amber-100'
                : 'via-emerald-50/40 to-emerald-50/15 border-emerald-100'
            }`}
          >
            {/* Top ambient radial light gradient */}
            <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24 group-hover:bg-emerald-400/20 transition-colors" />

            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  {!lastDiagnosisUnavailable && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${lastDiagnosisUnavailable ? 'bg-amber-500' : 'bg-primary'}`}></span>
                </span>
                <h3 className="text-xs font-black text-earth uppercase tracking-widest flex items-center gap-1.5">
                  {dTrans.lastDiagnosisTitle}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                  lastDiagnosisUnavailable ? 'bg-amber-50 text-amber-800 border-amber-200/80' :
                  lastDiagnosis.severity === 'High' ? 'bg-red-50 text-red-700 border-red-200/80' :
                  lastDiagnosis.severity === 'Medium' ? 'bg-amber-50 text-amber-800 border-amber-200/80' :
                  'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                }`}>
                  {lastDiagnosisUnavailable ? 'Not Diagnosed' : `${lastDiagnosis.severity} Severity`}
                </span>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setShareModalOpen(true)}
                  title="Share Report"
                  className="p-2.5 rounded-full bg-white hover:bg-emerald-100/70 text-primary transition-all flex items-center justify-center cursor-pointer border border-emerald-200/80 shadow-2xs"
                >
                  <Share2 size={15} />
                </motion.button>
              </div>
            </div>

            {/* Inner Details Banner */}
            <motion.div 
              whileHover={{ scale: 1.01, y: -1 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              onClick={() => onNavigate('diagnosis')}
              className="flex gap-4 items-center relative z-10 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-100/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group/card"
            >
              {lastDiagnosis.imageUrl && (
                <div className="relative shrink-0">
                  <img 
                    src={lastDiagnosis.imageUrl} 
                    alt="Last scan leaf" 
                    className="w-18 h-18 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-md group-hover/card:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full text-[9px] shadow-xs">
                    <CheckCircle size={10} />
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider block truncate">
                    {lastDiagnosisUnavailable ? '⚠️ Needs Retake' : `🌾 ${lastDiagnosis.crop || 'Crop'}`}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shrink-0 ${
                    lastDiagnosisUnavailable
                      ? 'text-slate-700 bg-slate-50/90 border-slate-200/80'
                      : 'text-primary bg-emerald-50/90 border-emerald-200/80'
                  }`}>
                    {lastDiagnosisConfidenceLabel}
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-earth truncate mt-1 group-hover/card:text-primary transition-colors">
                  {lastDiagnosisDiseaseLabel}
                </h4>
                <p className="text-xs text-gray-500 font-medium truncate mt-1 flex items-center gap-1.5">
                  {lastDiagnosisUnavailable ? <AlertTriangle size={13} className="text-amber-500 shrink-0" /> : <Sparkles size={13} className="text-emerald-500 shrink-0" />}
                  <span>{lastDiagnosisUnavailable ? 'Retake a clearer photo before treatment' : 'AI Crop Health Report Ready'}</span>
                </p>

                {/* Visual Confidence Progress Bar */}
                {lastDiagnosis.confidence !== undefined && !lastDiagnosisUnavailable && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-100/70">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-600 mb-1">
                      <span className="flex items-center gap-1">
                        <Sparkles size={11} className="text-emerald-600" />
                        {language === 'hi' ? 'एआई सटीकता:' : language === 'kn' ? 'AI ನಿಖರತೆ:' : 'AI Confidence:'}
                      </span>
                      <span className="font-mono text-emerald-700 font-black">
                        {lastDiagnosisConfidence}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-emerald-100/80 rounded-full overflow-hidden p-0.5 border border-emerald-200/60">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${lastDiagnosisConfidence}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 relative z-10">
              <motion.button 
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (onCameraOpen) {
                    onCameraOpen();
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    startCamera();
                  }
                }}
                className="w-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-800 hover:from-emerald-700 hover:to-green-900 text-white font-extrabold text-xs h-12 px-3.5 rounded-2xl shadow-[0_6px_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-400/30"
              >
                <RefreshCw size={15} className="text-emerald-200 shrink-0 animate-spin-slow" />
                <span className="truncate">
                  {language === 'hi' ? `पुनः स्कैन करें` :
                   language === 'kn' ? `ಮತ್ತೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ` :
                   `Scan Again`}
                </span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('diagnosis')}
                className="w-full bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-950 font-extrabold text-xs h-12 px-3.5 rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-xs border border-emerald-200/80 hover:border-emerald-300 cursor-pointer"
              >
                <span className="truncate">
                  {lastDiagnosisUnavailable ? 'View Retake Guidance' : dTrans.viewResult}
                </span>
                <ChevronRight size={15} className="text-emerald-700 shrink-0" />
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShareModalOpen(true)}
                className="w-full bg-white hover:bg-gray-50/90 text-gray-800 font-extrabold text-xs h-12 px-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 border border-gray-200 hover:border-emerald-200 cursor-pointer shadow-xs"
              >
                <Share2 size={15} className="text-emerald-600 shrink-0" />
                <span className="truncate">
                  {language === 'hi' ? 'साझा करें' :
                   language === 'kn' ? 'ಹಂಚಿಕೊಳ್ಳಿ' :
                   'Share Report'}
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* SECONDARY FEATURES: UTILITIES GRID */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-earth uppercase tracking-widest px-1">
            {dTrans.quickTools}
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Mandi Rates */}
            <motion.button 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => onNavigate('market')} 
              className="bg-white p-4 rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center justify-center text-center gap-2 transition-shadow cursor-pointer"
              style={{ minHeight: '96px' }}
            >
              <div className="w-11 h-11 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                <TrendingUp size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-black text-earth">{t('nav.market')}</span>
            </motion.button>

            {/* Certified Input Suppliers */}
            <motion.button 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => onNavigate('suppliers')} 
              className="bg-white p-4 rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center justify-center text-center gap-2 transition-shadow cursor-pointer"
              style={{ minHeight: '96px' }}
            >
              <div className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                <Store size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-black text-earth">{t('nav.suppliers')}</span>
            </motion.button>

            {/* Community Forum */}
            <motion.button 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => onNavigate('community')} 
              className="bg-white p-4 rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center justify-center text-center gap-2 transition-shadow cursor-pointer"
              style={{ minHeight: '96px' }}
            >
              <div className="w-11 h-11 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500">
                <Users size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-black text-earth">{t('nav.community')}</span>
            </motion.button>

            {/* Crop Calendar */}
            <motion.button 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => onNavigate('calendar')} 
              className="bg-white p-4 rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center justify-center text-center gap-2 transition-shadow cursor-pointer"
              style={{ minHeight: '96px' }}
            >
              <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                <CalendarIcon size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-black text-earth">{t('nav.calendar')}</span>
            </motion.button>

            {/* Soil Diagnostic Analysis */}
            <motion.button 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => onNavigate('soil-analysis')} 
              className="bg-white p-4 rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center justify-center text-center gap-2 transition-shadow cursor-pointer"
              style={{ minHeight: '96px' }}
            >
              <div className="w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                <Beaker size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-black text-earth">{t('dashboard.soil')}</span>
            </motion.button>

            {/* Subsidy Schemes */}
            <motion.button 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => onNavigate('scheme-finder')} 
              className="bg-white p-4 rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center justify-center text-center gap-2 transition-shadow cursor-pointer"
              style={{ minHeight: '96px' }}
            >
              <div className="w-11 h-11 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                <Landmark size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-black text-earth">Schemes</span>
            </motion.button>
          </div>
        </div>

        {/* Quick Advisor Chat Shortcut */}
        <motion.button 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          onClick={() => onNavigate('chat')}
          className="w-full bg-gradient-to-r from-primary to-primary-dark text-white p-5 rounded-[28px] shadow-[0_10px_35px_rgba(46,125,50,0.15)] hover:shadow-[0_16px_40px_rgba(46,125,50,0.25)] flex justify-between items-center text-left relative overflow-hidden transition-shadow cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
          <div className="flex gap-4 items-center relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
              <MessageSquare size={24} className="text-green-100" />
            </div>
            <div>
              <h4 className="font-black text-base">Ask AgroCare AI Advisor</h4>
              <p className="text-xs text-green-100/90 font-medium mt-0.5">Instant WhatsApp-style diagnostic advice</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-green-200" />
        </motion.button>

        {/* Share Diagnosis Modal */}
        <AnimatePresence>
          {shareModalOpen && lastDiagnosis && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col gap-5 relative overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary">
                      <Share2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-earth text-base">
                        {language === 'hi' ? 'निदान रिपोर्ट साझा करें' :
                         language === 'kn' ? 'ವರದಿಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ' :
                         'Share Diagnosis Report'}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        {language === 'hi' ? 'सोशल मीडिया और मैसेजिंग ऐप्स पर भेजें' :
                         language === 'kn' ? 'ಸಾಮಾಜಿಕ ಮಾಧ್ಯಮ ಮತ್ತು ಮೆಸೇಜಿಂಗ್ ಆ್ಯಪ್‌ಗಳಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ' :
                         'Export to WhatsApp, Telegram or social apps'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShareModalOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-earth transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Diagnosis Summary Preview Card */}
                <div className="bg-gradient-to-br from-emerald-50/80 to-green-50/40 p-4 rounded-2xl border border-emerald-100/80 flex gap-3.5 items-center">
                  {lastDiagnosis.imageUrl && (
                    <img
                      src={lastDiagnosis.imageUrl}
                      alt="Scan leaf"
                      className="w-16 h-16 rounded-xl object-cover border border-emerald-200 shrink-0 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest block">
                      {lastDiagnosisUnavailable ? 'Needs Retake' : (lastDiagnosis.crop || 'Crop')}
                    </span>
                    <h4 className="font-black text-earth text-sm truncate">
                      {lastDiagnosisDiseaseLabel}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-primary">
                        {lastDiagnosisUnavailable ? 'Not Diagnosed' : `${lastDiagnosisConfidence}% Match`}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {lastDiagnosisUnavailable ? 'No Severity' : `${lastDiagnosis.severity} Severity`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Share Actions Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* WhatsApp */}
                  <button
                    onClick={handleWhatsAppShare}
                    className="p-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    <MessageSquare size={18} />
                    <span>WhatsApp</span>
                  </button>

                  {/* Telegram */}
                  <button
                    onClick={handleTelegramShare}
                    className="p-3.5 rounded-2xl bg-[#229ED9] hover:bg-[#1d8cb0] text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    <Send size={18} />
                    <span>Telegram</span>
                  </button>

                  {/* Native Share */}
                  <button
                    onClick={handleNativeShare}
                    className="p-3.5 rounded-2xl bg-earth hover:bg-neutral-800 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    <Share2 size={18} />
                    <span>
                      {language === 'hi' ? 'अन्य ऐप्स' :
                       language === 'kn' ? 'ಇತರ ಆ್ಯಪ್‌ಗಳು' :
                       'Share Apps'}
                    </span>
                  </button>

                  {/* Copy Text */}
                  <button
                    onClick={handleCopyShareText}
                    className="p-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-earth font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 border border-gray-200"
                  >
                    {copiedToast ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                    <span>
                      {copiedToast ? (
                        language === 'hi' ? 'कॉपी हो गया!' :
                        language === 'kn' ? 'ಕಾಪಿ ಮಾಡಲಾಗಿದೆ!' :
                        'Copied!'
                      ) : (
                        language === 'hi' ? 'कॉपी करें' :
                        language === 'kn' ? 'ಕಾಪಿ ಮಾಡಿ' :
                        'Copy Text'
                      )}
                    </span>
                  </button>
                </div>

                {/* Toast Notification */}
                <AnimatePresence>
                  {copiedToast && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg"
                    >
                      <CheckCircle size={16} />
                      <span>Report copied to clipboard! Ready to paste & share.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

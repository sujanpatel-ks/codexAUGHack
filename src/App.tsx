import React, { useState, useEffect } from 'react';
import { Screen, Task, CropPrice, Language } from './types';
import { Dashboard } from './components/Dashboard';
import { Market } from './components/Market';
import { CropDetails } from './components/CropDetails';
import { Suppliers } from './components/Suppliers';
import { Community } from './components/Community';
import { Calendar } from './components/Calendar';
import { Diagnosis } from './components/Diagnosis';
import { Chat } from './components/Chat';
import { Profile } from './components/Profile';
import { SchemeFinder } from './components/SchemeFinder';
import { SoilAnalysis } from './components/SoilAnalysis';
import { History } from './components/History';
import { BottomNav } from './components/BottomNav';
import { AndroidWorkspace } from './components/AndroidWorkspace';
import { DiagnosisResult, diagnoseCrop } from './services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Camera, Sprout } from 'lucide-react';
import { CameraDiagnosis } from './components/CameraDiagnosis';
import { TASKS as INITIAL_TASKS } from './constants';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './components/LanguageSelector';
import { useAuth } from './AuthProvider';
import { VoiceNavigation } from './components/VoiceNavigation';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from './firebase';
import { OfflineBanner } from './components/OfflineBanner';
import { saveDiagnosisOffline, getLatestDiagnosisOffline } from './utils/offlineStorage';
import { createUnableToDiagnoseResult } from './utils/apiSafety';
import { apiFetch } from './services/apiClient';

export default function App() {
  const { user, loading, isAuthenticating, signIn } = useAuth();
  const { i18n } = useTranslation();
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedCrop, setSelectedCrop] = useState<CropPrice | null>(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState<string | undefined>(undefined);
  
  // Track last scan prediction for scanner dashboard card
  const [lastDiagnosis, setLastDiagnosis] = useState<any>(null);

  // Load last diagnosis on login
  useEffect(() => {
    if (!user) return;
    
    // Check local storage first for speed
    const stored = localStorage.getItem('agrocare_latest_diagnosis');
    if (stored) {
      try {
        setLastDiagnosis(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored diagnosis:", e);
      }
    }

    // Fetch latest scan from firestore as single source of truth
    const fetchLatest = async () => {
      try {
        if (user.isDemo) {
          const response = await apiFetch('/api/diagnoses');
          if (!response.ok) throw new Error('Failed to fetch demo diagnosis history');
          const result = await response.json();
          const latest = result.data?.[0];
          if (latest) {
            setLastDiagnosis(latest);
            localStorage.setItem('agrocare_latest_diagnosis', JSON.stringify(latest));
          }
          return;
        }

        const path = `users/${user.uid}/diagnoses`;
        const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          setLastDiagnosis(docData);
          localStorage.setItem('agrocare_latest_diagnosis', JSON.stringify(docData));
        }
      } catch (error) {
        console.error("Failed to fetch latest scan for home card:", error);
      }
    };
    fetchLatest();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-soil overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [0.9, 1, 0.9],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative mb-8"
        >
          <div className="w-24 h-24 bg-primary rounded-[32px] flex items-center justify-center shadow-2xl shadow-primary/20">
            <Sprout size={48} color="white" strokeWidth={2.5} />
          </div>
          <div className="absolute -inset-4 border-2 border-primary/20 rounded-[40px] animate-ping" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h1 className="text-2xl font-black text-earth tracking-tight">AgroCare AI</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em] mt-2">Cultivating Intelligence</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-soil p-6 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center mb-6 text-primary">
          <Sprout size={40} />
        </div>
        <h1 className="text-3xl font-black text-earth mb-3 tracking-tight">AgroCare AI</h1>
        <p className="text-sm font-semibold text-gray-500 max-w-xs mb-8 leading-relaxed">
          The ultimate AI-powered diagnostic and crop health platform for modern smallholder farmers.
        </p>
        <button 
          onClick={signIn}
          disabled={isAuthenticating}
          className="bg-primary text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-primary/25 hover:bg-primary-dark transition disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
          style={{ minHeight: '52px' }}
        >
          {isAuthenticating && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          )}
          {isAuthenticating ? 'Opening demo...' : 'Continue as Demo Farmer'}
        </button>
      </div>
    );
  }

  const language = (i18n.language?.split('-')[0] || 'en') as Language;

  const toggleLanguage = (lang?: Language | React.MouseEvent) => {
    if (typeof lang === 'string') {
      i18n.changeLanguage(lang);
    } else {
      const nextLang = language === 'en' ? 'hi' : language === 'hi' ? 'kn' : 'en';
      i18n.changeLanguage(nextLang);
    }
  };

  const handleCameraCapture = async (base64: string) => {
    setShowCamera(false);
    setIsDiagnosing(true);
    setActiveScreen('diagnosis');
    setUploadedImageUrl(base64);
    
    try {
      const result = await diagnoseCrop(base64);
      setDiagnosisResult(result);
      setLastDiagnosis(result);
      localStorage.setItem('agrocare_latest_diagnosis', JSON.stringify(result));
      
      // Save to backend
      apiFetch('/api/diagnoses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      }).catch(err => console.error("Failed to save diagnosis to backend:", err));
    } catch (error) {
      console.error("Diagnosis failed:", error);
      const fallbackResult = createUnableToDiagnoseResult('Diagnosis failed. No disease was inferred from this image.') as DiagnosisResult;
      setDiagnosisResult(fallbackResult);
      setLastDiagnosis(fallbackResult);
      localStorage.setItem('agrocare_latest_diagnosis', JSON.stringify(fallbackResult));
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleAddTask = (task: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      completed: false,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleToggleUrgentTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, urgent: !t.urgent } : t));
  };

  const handleFileSelect = async (file: File) => {
    setIsDiagnosing(true);
    setActiveScreen('diagnosis');
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setUploadedImageUrl(base64);
        try {
          const result = await diagnoseCrop(base64);
          setDiagnosisResult(result);
          setLastDiagnosis(result);
          localStorage.setItem('agrocare_latest_diagnosis', JSON.stringify(result));
          
          // Save to backend
          apiFetch('/api/diagnoses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
          }).catch(err => console.error("Failed to save diagnosis to backend:", err));
        } catch (error) {
          console.error("Diagnosis failed:", error);
          const fallbackResult = createUnableToDiagnoseResult('Diagnosis failed. No disease was inferred from this image.') as DiagnosisResult;
          setDiagnosisResult(fallbackResult);
          setLastDiagnosis(fallbackResult);
          localStorage.setItem('agrocare_latest_diagnosis', JSON.stringify(fallbackResult));
        } finally {
          setIsDiagnosing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File reading failed:", error);
      setIsDiagnosing(false);
    }
  };

  const renderScreen = () => {
    if (isDiagnosing) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-soil p-6 text-center overflow-hidden">
          <div className="relative w-48 h-48 mb-12">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-dashed border-primary/30 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute inset-4 border-2 border-dashed border-primary/20 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <Camera size={48} className="text-primary" />
              </motion.div>
            </div>
            
            {/* Scanning Line */}
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent z-10 shadow-[0_0_15px_rgba(46,125,50,0.5)]"
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-black text-earth mb-3 uppercase tracking-tight">AI Analysis in Progress</h2>
            <div className="flex flex-col gap-2">
              <p className="text-gray-500 font-semibold">Identifying crop species & disease symptoms...</p>
              <div className="flex justify-center gap-1">
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    switch (activeScreen) {
      case 'home':
        return (
          <Dashboard 
            onNavigate={(screen) => setActiveScreen(screen)} 
            onFileSelect={handleFileSelect}
            onAddTask={handleAddTask}
            language={language}
            onToggleLanguage={toggleLanguage}
            onCameraOpen={() => setShowCamera(true)}
            lastDiagnosis={lastDiagnosis}
          />
        );
      case 'market':
        return (
          <Market 
            onBack={() => setActiveScreen('home')} 
            onSelectCrop={(crop) => {
              setSelectedCrop(crop);
              setActiveScreen('crop-details');
            }}
            language={language}
          />
        );
      case 'crop-details':
        return selectedCrop ? (
          <CropDetails 
            crop={selectedCrop} 
            onBack={() => setActiveScreen('market')} 
            language={language}
            onFindSuppliers={() => {
              setSupplierSearchQuery(selectedCrop.name);
              setActiveScreen('suppliers');
            }}
          />
        ) : null;
      case 'suppliers':
        return (
          <Suppliers 
            onBack={() => setActiveScreen('home')} 
            language={language} 
            initialSearch={supplierSearchQuery}
          />
        );
      case 'community':
        return <Community onBack={() => setActiveScreen('home')} language={language} onToggleLanguage={toggleLanguage} onNavigate={setActiveScreen} />;
      case 'calendar':
        return <Calendar tasks={tasks} onToggleTask={handleToggleTask} onToggleUrgentTask={handleToggleUrgentTask} onAddTask={handleAddTask} onBack={() => setActiveScreen('home')} language={language} />;
      case 'diagnosis':
        return (
          <Diagnosis 
            result={diagnosisResult} 
            imageUrl={uploadedImageUrl}
            language={language}
            onBack={() => setActiveScreen('home')} 
            onAskAI={() => setActiveScreen('chat')}
            onFindSupplier={(query) => {
              setSupplierSearchQuery(query);
              setActiveScreen('suppliers');
            }}
            onSaveToCalendar={handleAddTask}
            onToggleLanguage={toggleLanguage}
          />
        );
      case 'history':
        return (
          <History 
            language={language} 
            onSelectScan={(scan) => {
              setDiagnosisResult(scan);
              setUploadedImageUrl(scan.imageUrl || null);
              setActiveScreen('diagnosis');
            }} 
            onNavigate={setActiveScreen}
          />
        );
      case 'chat':
        return <Chat onBack={() => setActiveScreen('home')} language={language} onToggleLanguage={toggleLanguage} />;
      case 'profile':
        return <Profile onBack={() => setActiveScreen('home')} language={language} onToggleLanguage={toggleLanguage} />;
      case 'scheme-finder':
        return <SchemeFinder onBack={() => setActiveScreen('home')} language={language} />;
      case 'soil-analysis':
        return <SoilAnalysis onBack={() => setActiveScreen('home')} language={language} />;
      case 'android':
        return <AndroidWorkspace onBack={() => setActiveScreen('home')} currentLanguage={language} />;
      default:
        return (
          <Dashboard 
            onNavigate={(screen) => setActiveScreen(screen)} 
            onFileSelect={handleFileSelect}
            onAddTask={handleAddTask}
            language={language}
            onToggleLanguage={toggleLanguage}
            onCameraOpen={() => setShowCamera(true)}
            lastDiagnosis={lastDiagnosis}
          />
        );
    }
  };

  const isTabScreen = activeScreen === 'home' || activeScreen === 'market' || activeScreen === 'calendar' || activeScreen === 'history' || activeScreen === 'profile' || activeScreen === 'diagnosis';

  return (
    <div className="w-full mx-auto bg-white min-h-[100dvh] relative shadow-[0_0_40px_rgba(0,0,0,0.05)] overflow-x-hidden md:pl-24">
      {/* Offline Service Worker Persistent Status Banner */}
      <OfflineBanner 
        language={language} 
        onOpenOfflineLibrary={() => setActiveScreen('diagnosis')} 
      />

      {/* Global Language Selector Overlay on top of Home or Settings */}
      <AnimatePresence>
        {activeScreen === 'profile' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[60] top-4 right-4"
          >
            <LanguageSelector />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScreen + (isDiagnosing ? '-loading' : '')}
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className={`min-h-[100dvh] w-full max-w-7xl mx-auto ${isTabScreen ? 'pb-24 md:pb-0' : ''}`}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      
      {isTabScreen && !isDiagnosing && (
        <BottomNav 
          activeScreen={activeScreen} 
          onScreenChange={(screen) => setActiveScreen(screen)} 
          language={language}
          onCameraOpen={() => setShowCamera(true)}
        />
      )}

      {showCamera && (
        <CameraDiagnosis 
          onCapture={handleCameraCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}
      <VoiceNavigation 
        currentLanguage={language} 
        onNavigate={(screen) => setActiveScreen(screen)} 
        onCameraOpen={() => setShowCamera(true)}
        enabled={activeScreen !== 'home'}
      />
      <Toaster position="top-center" richColors />
    </div>
  );
}

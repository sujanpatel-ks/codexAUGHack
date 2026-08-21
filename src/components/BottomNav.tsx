import React from 'react';
import { Home, Search, Bell, History as HistoryIcon, Scan, Store, UserRound, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen, Language } from '../types';

interface BottomNavProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  language: Language;
  onCameraOpen: () => void;
}

const translations = {
  en: {
    home: "Home",
    search: "Search",
    alerts: "Alerts",
    history: "History",
    markets: "Markets",
    stores: "Stores",
    profile: "Profile"
  },
  hi: {
    home: "मुख्य",
    search: "खोजें",
    alerts: "अलर्ट",
    history: "इतिहास",
    markets: "बाजार",
    stores: "दुकानें",
    profile: "प्रोफाइल"
  },
  kn: {
    home: "ಮನೆ",
    search: "ಹುಡುಕಾಟ",
    alerts: "ಎಚ್ಚರಿಕೆ",
    history: "ಇತಿಹಾಸ",
    markets: "ಮಾರುಕಟ್ಟೆ",
    stores: "ಅಂಗಡಿಗಳು",
    profile: "ಪ್ರೊಫೈಲ್"
  }
};

export const BottomNav: React.FC<BottomNavProps> = ({ 
  activeScreen, 
  onScreenChange, 
  language,
  onCameraOpen 
}) => {
  const t = translations[language] || translations.en;

  // Map active statuses to highlight correct tabs
  const isHomeActive = activeScreen === 'home';
  const isSearchActive = activeScreen === 'market' || activeScreen === 'crop-details' || activeScreen === 'suppliers';
  const isStoreActive = activeScreen === 'suppliers';
  const isAlertsActive = activeScreen === 'calendar';
  const isHistoryActive = activeScreen === 'history';
  const isProfileActive = activeScreen === 'profile';

  return (
    <>
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div id="mobile-bottom-nav" className="fixed bottom-0 left-0 w-full z-50 pointer-events-none md:hidden">
        {/* Background container with curved top edge and elevated drop shadow */}
        <div className="bg-white border-t border-gray-100/70 pb-6 pt-2 shadow-[0_-10px_35px_rgba(0,0,0,0.08)] rounded-t-[32px] pointer-events-auto relative">
          
          {/* Inner Nav Grid layout - 5 columns */}
          <div className="grid grid-cols-5 items-end px-2 h-16 relative">
            
            {/* 1. HOME TAB */}
            <button
              onClick={() => onScreenChange('home')}
              className={`flex flex-col items-center justify-center gap-1.5 h-14 rounded-2xl transition-all duration-200 ${
                isHomeActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={{ minHeight: '48px', minWidth: '48px' }}
              aria-label="Home"
            >
              <div className="relative flex items-center justify-center p-1">
                {isHomeActive && (
                  <motion.div 
                    layoutId="mobile-active-bg"
                    className="absolute inset-0 bg-primary/10 rounded-full scale-125"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Home size={22} strokeWidth={isHomeActive ? 2.5 : 2} className="relative z-10" />
              </div>
              <span className={`text-[10px] uppercase tracking-wider transition-all truncate max-w-full ${
                isHomeActive ? 'font-black opacity-100' : 'font-bold opacity-60'
              }`}>
                {t.home}
              </span>
            </button>

            {/* 2. MARKETS TAB */}
            <button
              onClick={() => onScreenChange('market')}
              className={`flex flex-col items-center justify-center gap-1.5 h-14 rounded-2xl transition-all duration-200 ${
                isSearchActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={{ minHeight: '48px', minWidth: '48px' }}
              aria-label="Markets"
            >
              <div className="relative flex items-center justify-center p-1">
                {isSearchActive && (
                  <motion.div 
                    layoutId="mobile-active-bg"
                    className="absolute inset-0 bg-primary/10 rounded-full scale-125"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <TrendingUp size={22} strokeWidth={isSearchActive ? 2.5 : 2} className="relative z-10" />
              </div>
              <span className={`text-[10px] uppercase tracking-wider transition-all truncate max-w-full ${
                isSearchActive ? 'font-black opacity-100' : 'font-bold opacity-60'
              }`}>
                {t.markets}
              </span>
            </button>

            {/* 3. CENTRAL SCANNER FLOATING ACTION BUTTON */}
            <div className="relative flex justify-center h-full">
              <div className="absolute -top-7 flex flex-col items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onCameraOpen}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-primary-dark text-white flex items-center justify-center shadow-[0_8px_24px_rgba(46,125,50,0.35)] border-4 border-white active:scale-95 transition-transform"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                  aria-label="Trigger AI Leaf Scanner"
                >
                  <Scan size={26} strokeWidth={2.5} className="text-white animate-pulse" />
                </motion.button>
              </div>
            </div>

            {/* 4. STORES TAB */}
            <button
              onClick={() => onScreenChange('suppliers')}
              className={`flex flex-col items-center justify-center gap-1.5 h-14 rounded-2xl transition-all duration-200 ${
                isStoreActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={{ minHeight: '48px', minWidth: '48px' }}
              aria-label="Stores"
            >
              <div className="relative flex items-center justify-center p-1">
                {isStoreActive && (
                  <motion.div 
                    layoutId="mobile-active-bg"
                    className="absolute inset-0 bg-primary/10 rounded-full scale-125"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Store size={22} strokeWidth={isStoreActive ? 2.5 : 2} className="relative z-10" />
              </div>
              <span className={`text-[10px] uppercase tracking-wider transition-all truncate max-w-full ${
                isStoreActive ? 'font-black opacity-100' : 'font-bold opacity-60'
              }`}>
                {t.stores}
              </span>
            </button>

            {/* 5. PROFILE TAB */}
            <button
              onClick={() => onScreenChange('profile')}
              className={`flex flex-col items-center justify-center gap-1.5 h-14 rounded-2xl transition-all duration-200 ${
                isProfileActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={{ minHeight: '48px', minWidth: '48px' }}
              aria-label="Profile"
            >
              <div className="relative flex items-center justify-center p-1">
                {isProfileActive && (
                  <motion.div 
                    layoutId="mobile-active-bg"
                    className="absolute inset-0 bg-primary/10 rounded-full scale-125"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <UserRound size={22} strokeWidth={isProfileActive ? 2.5 : 2} className="relative z-10" />
              </div>
              <span className={`text-[10px] uppercase tracking-wider transition-all truncate max-w-full ${
                isProfileActive ? 'font-black opacity-100' : 'font-bold opacity-60'
              }`}>
                {t.profile}
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* DESKTOP SIDE NAVIGATION RAIL (LAPTOP OPTIMIZED VERTICAL NAV) */}
      <div 
        id="desktop-side-nav" 
        className="hidden md:flex fixed top-0 left-0 w-24 h-screen z-50 bg-white/95 backdrop-blur-md border-r border-gray-100/80 flex-col items-center py-6 justify-between shadow-[6px_0_24px_rgba(0,0,0,0.03)] select-none transition-all duration-300"
      >
        {/* Top Logo Branding */}
        <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={() => onScreenChange('home')}>
          <motion.div 
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 bg-gradient-to-tr from-primary to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-primary/20 border border-emerald-400/30"
          >
            <Scan size={24} strokeWidth={2.5} />
          </motion.div>
          <span className="text-[10px] font-black tracking-widest text-earth uppercase group-hover:text-primary transition-colors">
            KisanAI
          </span>
        </div>

        {/* Central Vertical Navigation Tabs */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full px-3 my-4">
          
          {/* 1. Home */}
          <div className="relative group w-full flex justify-center">
            <button
              onClick={() => onScreenChange('home')}
              className={`relative flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all duration-200 cursor-pointer ${
                isHomeActive 
                  ? 'text-primary bg-primary/10 font-black shadow-2xs border border-primary/20' 
                  : 'text-gray-400 hover:text-earth hover:bg-gray-100/80 font-bold'
              }`}
              style={{ minHeight: '48px', minWidth: '48px' }}
              aria-label="Home Dashboard"
            >
              {isHomeActive && (
                <motion.div 
                  layoutId="desktop-active-indicator"
                  className="absolute -left-3 w-1.5 h-8 bg-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Home size={22} strokeWidth={isHomeActive ? 2.5 : 2} />
              <span className="text-[10px] uppercase tracking-wider mt-0.5">{t.home}</span>
            </button>
            {/* Laptop Hover Tooltip */}
            <div className="absolute left-20 top-1/2 -translate-y-1/2 bg-earth text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-lg whitespace-nowrap z-50">
              {t.home} Dashboard
            </div>
          </div>

          {/* 2. Search / Market */}
          <div className="relative group w-full flex justify-center">
            <button
              onClick={() => onScreenChange('market')}
              className={`relative flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all duration-200 cursor-pointer ${
                isSearchActive 
                  ? 'text-primary bg-primary/10 font-black shadow-2xs border border-primary/20' 
                  : 'text-gray-400 hover:text-earth hover:bg-gray-100/80 font-bold'
              }`}
              style={{ minHeight: '48px', minWidth: '48px' }}
              aria-label="Mandi Market Rates"
            >
              {isSearchActive && (
                <motion.div 
                  layoutId="desktop-active-indicator"
                  className="absolute -left-3 w-1.5 h-8 bg-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Search size={22} strokeWidth={isSearchActive ? 2.5 : 2} />
              <span className="text-[10px] uppercase tracking-wider mt-0.5">{t.search}</span>
            </button>
            <div className="absolute left-20 top-1/2 -translate-y-1/2 bg-earth text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-lg whitespace-nowrap z-50">
              Mandi Prices & Arbitrage
            </div>
          </div>

          {/* 3. Central AI Scanner Trigger */}
          <div className="relative group w-full flex justify-center my-1">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onCameraOpen}
              className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-emerald-600 text-white flex flex-col items-center justify-center shadow-lg shadow-primary/30 border border-emerald-300/40 cursor-pointer"
              aria-label="Scan Crop or Leaf with AI"
            >
              <Scan size={24} strokeWidth={2.5} className="animate-pulse" />
              <span className="text-[8px] uppercase tracking-widest font-black text-white mt-0.5">SCAN</span>
            </motion.button>
            <div className="absolute left-20 top-1/2 -translate-y-1/2 bg-earth text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-lg whitespace-nowrap z-50">
              AI Crop Leaf Scanner
            </div>
          </div>

          {/* 4. Calendar / Alerts */}
          <div className="relative group w-full flex justify-center">
            <button
              onClick={() => onScreenChange('calendar')}
              className={`relative flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all duration-200 cursor-pointer ${
                isAlertsActive 
                  ? 'text-primary bg-primary/10 font-black shadow-2xs border border-primary/20' 
                  : 'text-gray-400 hover:text-earth hover:bg-gray-100/80 font-bold'
              }`}
              style={{ minHeight: '48px', minWidth: '48px' }}
              aria-label="Farm Calendar & Tasks"
            >
              {isAlertsActive && (
                <motion.div 
                  layoutId="desktop-active-indicator"
                  className="absolute -left-3 w-1.5 h-8 bg-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Bell size={22} strokeWidth={isAlertsActive ? 2.5 : 2} />
              <span className="text-[10px] uppercase tracking-wider mt-0.5">{t.alerts}</span>
            </button>
            <div className="absolute left-20 top-1/2 -translate-y-1/2 bg-earth text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-lg whitespace-nowrap z-50">
              Task Calendar & Weather Alerts
            </div>
          </div>

          {/* 5. History */}
          <div className="relative group w-full flex justify-center">
            <button
              onClick={() => onScreenChange('history')}
              className={`relative flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all duration-200 cursor-pointer ${
                isHistoryActive 
                  ? 'text-primary bg-primary/10 font-black shadow-2xs border border-primary/20' 
                  : 'text-gray-400 hover:text-earth hover:bg-gray-100/80 font-bold'
              }`}
              style={{ minHeight: '48px', minWidth: '48px' }}
              aria-label="Diagnosis Scan History"
            >
              {isHistoryActive && (
                <motion.div 
                  layoutId="desktop-active-indicator"
                  className="absolute -left-3 w-1.5 h-8 bg-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <HistoryIcon size={22} strokeWidth={isHistoryActive ? 2.5 : 2} />
              <span className="text-[10px] uppercase tracking-wider mt-0.5">{t.history}</span>
            </button>
            <div className="absolute left-20 top-1/2 -translate-y-1/2 bg-earth text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-lg whitespace-nowrap z-50">
              Scan Logs & Diagnosis History
            </div>
          </div>

        </div>

        {/* Bottom Profile Settings Link */}
        <div className="relative group w-full flex justify-center pb-2">
          <button
            onClick={() => onScreenChange('profile')}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-2xl transition-all duration-200 cursor-pointer ${
              activeScreen === 'profile' ? 'text-primary bg-primary/10 font-black border border-primary/20' : 'text-gray-400 hover:text-earth hover:bg-gray-100/80'
            }`}
            style={{ minHeight: '48px', minWidth: '48px' }}
            aria-label="Farmer Profile Settings"
          >
            <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.3 }} className="p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </motion.div>
            <span className="text-[9px] uppercase tracking-wider font-bold">PROFILE</span>
          </button>
          <div className="absolute left-20 top-1/2 -translate-y-1/2 bg-earth text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-lg whitespace-nowrap z-50">
            Profile & Farm Configuration
          </div>
        </div>
      </div>
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, Moon, Sun, Compass, SlidersHorizontal, User, Globe, Bell, MoreVertical, Wallet, Plus } from 'lucide-react';
import { ScreenType, DashboardSection } from '../../types';
import { languageService, SupportedLanguage, useTranslation } from '../../services/languageService';
import { notificationService } from '../../services/notification/notificationService';
import { authService } from '../../services/auth/authService';
import { walletService } from '../../services/walletService';
import { NotificationDrawer } from './NotificationDrawer';
import { GlobalLanguageSelector } from './GlobalLanguageSelector';
import { AddMoneyModal } from './AddMoneyModal';

interface HeaderProps {
  currentScreen: ScreenType;
  activeSection?: DashboardSection;
  onNavigateScreen: (screen: ScreenType) => void;
  onNavigateSection?: (section: DashboardSection) => void;
  onSwitchToAstrologerPanel?: () => void;
  onSwitchToAdminPanel?: () => void;
  userName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  activeSection = 'overview',
  onNavigateScreen,
  onNavigateSection,
  onSwitchToAstrologerPanel,
  onSwitchToAdminPanel,
  userName = 'Demo Profile',
}) => {
  const { t } = useTranslation();
  const [showScreenPicker, setShowScreenPicker] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(languageService.getLanguage());
  const [walletBalance, setWalletBalance] = useState<number>(walletService.getBalance());
  const [showAddMoneyModal, setShowAddMoneyModal] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = walletService.subscribe(bal => {
      setWalletBalance(bal);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowOverflowMenu(false);
        setShowScreenPicker(false);
      }
    };
    if (showOverflowMenu || showScreenPicker) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showOverflowMenu, showScreenPicker]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    const unsubscribeAuth = authService.subscribe((user) => {
      if (!user) {
        setUnreadCount(0);
      } else {
        fetchUnreadCount();
      }
    });
    return () => {
      clearInterval(interval);
      unsubscribeAuth();
    };
  }, []);

  const fetchUnreadCount = async () => {
    const user = authService.getCurrentUser();
    if (user) {
      const res = await notificationService.getUnreadCount(user, user.id);
      if (res.success) setUnreadCount(res.data);
    } else {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    return languageService.subscribe(lang => setCurrentLang(lang));
  }, []);

  const toggleLanguage = () => {
    const next: SupportedLanguage = currentLang === 'en' ? 'hi' : 'en';
    languageService.setLanguage(next);
  };

  // Helper to determine back action
  const handleBack = () => {
    if (activeSection !== 'overview' && onNavigateSection) {
      onNavigateSection('overview');
      return;
    }
    if (currentScreen === 'birth-details') {
      onNavigateScreen('welcome');
      return;
    }
    if (currentScreen === 'dashboard') {
      onNavigateScreen('birth-details');
      return;
    }
    if (currentScreen === 'welcome') {
      onNavigateScreen('splash');
      return;
    }
  };

  const showBackButton = currentScreen === 'birth-details' || (currentScreen === 'dashboard' && activeSection !== 'overview');

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'kundli': return t('vedicKundliChart');
      case 'horoscope': return t('dailyHoroscope');
      case 'ai-astrologer': return t('aiAstrologer');
      case 'talk': return t('talk');
      case 'compatibility':
      case 'kundli-matching': return t('kundliMatching');
      case 'numerology': return t('numerology');
      case 'panchang': return t('panchang');
      case 'profile': return t('myProfile');
      default: return t('appTitle');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0c1222]/90 backdrop-blur-md border-b border-[#1e2b4f]/60 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {showBackButton ? (
            <button
              id="header-back-button"
              onClick={handleBack}
              className="p-1.5 rounded-full text-slate-300 hover:text-amber-300 hover:bg-[#16203c] transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-amber-400" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#b48c26] to-[#fde047] p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#0c1222] rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
            </div>
          )}

          <div>
            <h1 className="text-sm font-semibold tracking-wide text-slate-100 font-serif flex items-center gap-1.5">
              {currentScreen === 'dashboard' && activeSection !== 'overview' ? (
                getSectionTitle()
              ) : (
                <span className="gold-gradient-text font-bold">{t('appTitle')}</span>
              )}
            </h1>
            {currentScreen === 'dashboard' && activeSection === 'overview' && (
              <p className="text-[11px] text-amber-300/80 tracking-wide font-sans">
                Interactive Frontend Prototype
              </p>
            )}
          </div>
        </div>

        {/* Quick Nav / Screen Tester Dropdown */}
        <div className="relative flex items-center gap-1.5 sm:gap-2">
          {/* Header Wallet Pill */}
          {currentScreen === 'dashboard' && (
            <button
              onClick={() => setShowAddMoneyModal(true)}
              className="px-2 py-1 rounded-lg bg-[#16203c] hover:bg-[#1e2b4f] text-amber-300 text-[11px] font-bold flex items-center gap-1 border border-amber-500/30 transition-all shadow-sm active:scale-95 shrink-0"
              title="Add Demo Money to Wallet"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span>₹{walletBalance.toFixed(0)}</span>
              <Plus className="w-3 h-3 text-amber-400" />
            </button>
          )}

          {/* Always-visible Global Language Selector */}
          <GlobalLanguageSelector id="header-global-lang-selector" />

          {/* In-App Three-Dot Overflow Menu (⋮) */}
          <div className="relative">
            <button
              id="header-overflow-menu-btn"
              onClick={() => {
                setShowOverflowMenu(!showOverflowMenu);
                setShowScreenPicker(false);
              }}
              aria-label="More actions"
              aria-expanded={showOverflowMenu}
              className={`p-1.5 rounded-lg border transition-all shadow-sm relative active:scale-95 flex items-center justify-center ${
                showOverflowMenu
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 ring-1 ring-amber-400/30'
                  : 'bg-[#16203c]/80 hover:bg-[#1e2b4f] text-amber-300 border-amber-500/20'
              }`}
              title="More options"
            >
              <MoreVertical className="w-4 h-4 text-amber-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs ring-1 ring-[#0c1222]" />
              )}
            </button>

            {showOverflowMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowOverflowMenu(false)}
                />
                <div
                  id="header-overflow-dropdown"
                  className="absolute right-0 mt-2 max-w-[calc(100vw-2rem)] rounded-2xl bg-[#0c1222] border border-amber-500/30 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-0.5 max-w-full">
                    {/* 1. Avatar Action */}
                    <button
                      id="overflow-profile-avatar-btn"
                      onClick={() => {
                        if (onNavigateSection) {
                          onNavigateSection('profile');
                        } else {
                          onNavigateScreen('dashboard');
                        }
                        setShowOverflowMenu(false);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl transition-all shrink-0 ${
                        currentScreen === 'dashboard' && activeSection === 'profile'
                          ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40'
                          : 'bg-[#16203c] text-slate-300 hover:text-amber-200 hover:bg-[#1f2c52] border border-[#1e2b4f]'
                      }`}
                      title="My Profile"
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[10px] font-bold text-black shadow-xs">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-medium leading-none">{t('profile')}</span>
                    </button>

                    {/* 2. Astrologer Panel Action */}
                    {onSwitchToAstrologerPanel && (
                      <button
                        id="overflow-astrologer-btn"
                        onClick={() => {
                          onSwitchToAstrologerPanel();
                          setShowOverflowMenu(false);
                        }}
                        className="flex flex-col items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#16203c] hover:bg-[#1f2c52] text-amber-300 border border-[#1e2b4f] transition-all shrink-0"
                        title="Open Separate Astrologer Professional Dashboard"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-[10px] font-medium leading-none text-slate-300">{t('astrologerPanel')}</span>
                      </button>
                    )}

                    {/* 3. Notifications Action (Bell) */}
                    <button
                      id="overflow-notifications-btn"
                      onClick={() => {
                        setShowNotifDrawer(true);
                        setShowOverflowMenu(false);
                      }}
                      className="flex flex-col items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#16203c] hover:bg-[#1f2c52] text-amber-300 border border-[#1e2b4f] transition-all shrink-0 relative"
                      title="In-App Notifications"
                    >
                      <div className="relative">
                        <Bell className="w-4 h-4 text-amber-400" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1.5 px-1 min-w-[12px] h-3 rounded-full bg-amber-500 text-slate-950 font-bold text-[8px] flex items-center justify-center shadow-xs">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium leading-none text-slate-300">{t('alerts')}</span>
                    </button>

                    {/* 4. Language Selector Action (EN / HI) */}
                    <button
                      id="overflow-language-btn"
                      onClick={() => {
                        toggleLanguage();
                        setShowOverflowMenu(false);
                      }}
                      className="flex flex-col items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#16203c] hover:bg-[#1f2c52] text-amber-300 border border-[#1e2b4f] transition-all shrink-0"
                      title="Switch Language (English / हिंदी)"
                    >
                      <Globe className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-mono font-bold leading-none text-amber-300">
                        {currentLang === 'en' ? 'EN' : 'HI'}
                      </span>
                    </button>

                    {/* 5. Account Action */}
                    <button
                      id="overflow-account-btn"
                      onClick={() => {
                        onNavigateScreen('login');
                        setShowOverflowMenu(false);
                      }}
                      className="flex flex-col items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#16203c] hover:bg-[#1f2c52] text-amber-300 border border-[#1e2b4f] transition-all shrink-0"
                      title="Cloud Account & Authentication"
                    >
                      <User className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-medium leading-none text-slate-300">{t('account')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              id="screen-navigator-toggle"
              onClick={() => setShowScreenPicker(!showScreenPicker)}
              className="p-1.5 rounded-lg bg-[#16203c]/80 hover:bg-[#1e2b4f] text-amber-300 text-xs flex items-center gap-1 border border-amber-500/20 transition-all shadow-sm"
              title="Switch Screen View"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-medium hidden sm:inline">Views</span>
            </button>

            {showScreenPicker && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowScreenPicker(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0c1222] border border-amber-500/30 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1.5 text-[10px] uppercase font-semibold tracking-wider text-amber-400/80 border-b border-[#1e2b4f] mb-1">
                    Prototype Screen Switcher
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => { onNavigateScreen('splash'); setShowScreenPicker(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        currentScreen === 'splash' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-300 hover:bg-[#16203c]'
                      }`}
                    >
                      <span>1. Splash Screen</span>
                      {currentScreen === 'splash' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                    </button>
                    <button
                      onClick={() => { onNavigateScreen('welcome'); setShowScreenPicker(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        currentScreen === 'welcome' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-300 hover:bg-[#16203c]'
                      }`}
                    >
                      <span>2. Welcome Screen</span>
                      {currentScreen === 'welcome' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                    </button>
                    <button
                      onClick={() => { onNavigateScreen('birth-details'); setShowScreenPicker(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        currentScreen === 'birth-details' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-300 hover:bg-[#16203c]'
                      }`}
                    >
                      <span>3. Birth Details Screen</span>
                      {currentScreen === 'birth-details' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                    </button>
                    <button
                      onClick={() => {
                        onNavigateScreen('dashboard');
                        if (onNavigateSection) onNavigateSection('overview');
                        setShowScreenPicker(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        currentScreen === 'dashboard' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-300 hover:bg-[#16203c]'
                      }`}
                    >
                      <span>4. Home Dashboard</span>
                      {currentScreen === 'dashboard' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                    </button>

                    {onSwitchToAstrologerPanel && (
                      <button
                        onClick={() => {
                          onSwitchToAstrologerPanel();
                          setShowScreenPicker(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between text-amber-300 hover:bg-[#16203c] border-t border-[#1e2b4f] mt-1 pt-2 font-bold"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>5. Astrologer Panel (Pro)</span>
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300">
                          Demo
                        </span>
                      </button>
                    )}

                    {onSwitchToAdminPanel && (
                      <button
                        onClick={() => {
                          onSwitchToAdminPanel();
                          setShowScreenPicker(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between text-amber-400 hover:bg-[#16203c] font-bold"
                      >
                        <span className="flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                          <span>6. Admin / Owner Panel</span>
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono">
                          Admin
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <NotificationDrawer
        isOpen={showNotifDrawer}
        onClose={() => {
          setShowNotifDrawer(false);
          fetchUnreadCount();
        }}
        onSelectRelatedEntity={(_type, _id) => {
          if (onNavigateSection) onNavigateSection('talk');
        }}
      />

      <AddMoneyModal
        isOpen={showAddMoneyModal}
        onClose={() => setShowAddMoneyModal(false)}
      />
    </header>
  );
};

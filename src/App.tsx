import React, { useState, useEffect, useCallback } from 'react';
import { ScreenType, DashboardSection, BirthProfile, UserBirthDetails, AppPortalMode, UserAccount } from './types';
import { DEFAULT_USER } from './data/astrologyMockData';
import { calculateBirthChart } from './services/astrologyEngine';
import { authService } from './services/auth/authService';
import { birthProfileService } from './services/birthProfileService';
import { useTranslation } from './services/languageService';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { SplashScreen } from './components/screens/SplashScreen';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { BirthDetailsScreen } from './components/screens/BirthDetailsScreen';
import { ChartPreparationScreen } from './components/screens/ChartPreparationScreen';
import { HomeDashboard } from './components/screens/HomeDashboard';
import { LoginScreen } from './components/screens/LoginScreen';
import { LanguageSelectScreen } from './components/screens/LanguageSelectScreen';
import { AstrologerPanel } from './components/astrologer/AstrologerPanel';
import { AdminPanel } from './components/admin/AdminPanel';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const { t, language } = useTranslation();
  const [appMode, setAppMode] = useState<AppPortalMode>('client');
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [birthProfile, setBirthProfile] = useState<BirthProfile>(DEFAULT_USER);

  // Authentication & Initialization State
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState<boolean>(false);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);

  // Profile router for authenticated users
  const routeAuthenticatedUser = useCallback(async (user: UserAccount) => {
    const langSelected = localStorage.getItem('app_language_selected');
    if (!langSelected) {
      setCurrentScreen('language-select');
      return;
    }

    setIsCheckingProfile(true);
    setProfileLoadError(null);

    try {
      const res = await birthProfileService.listBirthProfilesForUser(user, user.id);
      if (!res.success) {
        // Requirement 7: Do not silently treat user as brand-new user on lookup failure
        setProfileLoadError(res.error || 'Failed to load your saved birth profile. Please try again.');
        setIsCheckingProfile(false);
        return;
      }

      if (res.data && res.data.length > 0) {
        // Requirement 4: Existing Authenticated User with saved profiles
        const defaultProf = res.data.find(p => p.isDefault) || res.data[0];
        const activeProf: BirthProfile = {
          name: defaultProf.name,
          dateOfBirth: defaultProf.dateOfBirth,
          birthTime: defaultProf.timeOfBirth,
          birthTimeKnown: true,
          gender: defaultProf.gender || 'unspecified',
          birthPlace: defaultProf.birthPlace,
          latitude: defaultProf.latitude,
          longitude: defaultProf.longitude,
          timezone: defaultProf.timezone,
          isDemoData: false,
        };
        setBirthProfile(activeProf);
        calculateBirthChart(activeProf);
        setCurrentScreen('dashboard');
        setActiveSection('overview');
      } else {
        // Requirement 5: New Authenticated User without saved profiles
        setCurrentScreen('welcome');
      }
    } catch (err: any) {
      setProfileLoadError(err.message || 'Error loading birth profiles.');
    } finally {
      setIsCheckingProfile(false);
    }
  }, []);

  // Subscribe to auth state on mount and wait for Firebase initialization
  useEffect(() => {
    let isMounted = true;

    // Listen to session changes
    const unsubscribe = authService.subscribe((user) => {
      if (!isMounted) return;
      setCurrentUser(user);
    });

    // Wait for initial Firebase Auth resolution
    authService.waitForInitialization().then((user) => {
      if (!isMounted) return;
      setAuthInitialized(true);
      setCurrentUser(user);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Guard protected screens: unauthenticated users cannot access dashboard, welcome, birth-details, or chart-prep
  useEffect(() => {
    if (!authInitialized) return;
    const isProtected = currentScreen !== 'splash' && currentScreen !== 'login';
    if (!currentUser && isProtected) {
      setCurrentScreen('login');
    }
  }, [authInitialized, currentUser, currentScreen]);

  // Navigate between high-level screens
  const handleNavigateScreen = (screen: ScreenType) => {
    // Prevent unauthenticated navigation to protected screens
    if (!currentUser && screen !== 'splash' && screen !== 'login') {
      setCurrentScreen('login');
      return;
    }
    setCurrentScreen(screen);
    if (screen === 'dashboard') {
      setActiveSection('overview');
    }
  };

  // Navigate between Dashboard sub-sections
  const handleNavigateSection = (section: DashboardSection) => {
    if (currentScreen !== 'dashboard') {
      setCurrentScreen('dashboard');
    }
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Splash Screen Continue
  const handleSplashContinue = async () => {
    let user = currentUser;
    if (!authInitialized) {
      user = await authService.waitForInitialization();
      setAuthInitialized(true);
      setCurrentUser(user);
    }

    if (!user) {
      // Unauthenticated -> LoginScreen
      setCurrentScreen('login');
      return;
    }

    // Authenticated -> Check profile and route
    await routeAuthenticatedUser(user);
  };

  // Handle Login / Registration Success
  const handleLoginSuccess = async () => {
    const user = authService.getCurrentUser() || currentUser;
    if (user) {
      setCurrentUser(user);
      await routeAuthenticatedUser(user);
    } else {
      const resolved = await authService.waitForInitialization();
      if (resolved) {
        setCurrentUser(resolved);
        await routeAuthenticatedUser(resolved);
      } else {
        setCurrentScreen('login');
      }
    }
  };

  // Handle saving birth details and navigating to chart preparation screen
  const handleSaveAndCreateChart = async (profile: BirthProfile) => {
    const user = authService.getCurrentUser() || currentUser;
    if (user) {
      // Persist profile to Firestore via birthProfileService
      const createRes = await birthProfileService.createBirthProfile(user, {
        name: profile.name,
        dateOfBirth: profile.dateOfBirth,
        timeOfBirth: profile.birthTime,
        birthPlace: profile.birthPlace,
        latitude: profile.latitude,
        longitude: profile.longitude,
        timezone: profile.timezone,
        gender: (profile.gender as any) || 'unspecified',
        relationship: 'SELF',
        isDefault: true,
      });
      if (createRes.success && createRes.data) {
        profile.isDemoData = false;
      }
    }

    setBirthProfile(profile);
    calculateBirthChart(profile);
    setCurrentScreen('chart-prep');
  };

  // When chart preparation completes, transition directly to the Demo Kundli screen
  const handleChartPrepComplete = () => {
    setCurrentScreen('dashboard');
    setActiveSection('kundli');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle quick exploration with sample chart
  const handleExploreSample = () => {
    setBirthProfile(DEFAULT_USER);
    calculateBirthChart(DEFAULT_USER);
    setCurrentScreen('chart-prep');
  };

  // Handle user logout
  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setBirthProfile(DEFAULT_USER);
    setActiveSection('overview');
    setCurrentScreen('login');
  };

  // Handle reset profile
  const handleResetDetails = () => {
    handleLogout();
  };

  // Handle selecting a saved birth profile
  const handleSelectBirthProfile = (profile: BirthProfile) => {
    setBirthProfile(profile);
    calculateBirthChart(profile);
  };

  // Helper backward-compatible user details object for existing components
  const userDetailsCompat: UserBirthDetails = {
    ...birthProfile,
    fullName: birthProfile.name,
    dob: birthProfile.dateOfBirth,
    isTimeUnknown: !birthProfile.birthTimeKnown,
  };

  if (appMode === 'admin') {
    return (
      <AdminPanel
        onSwitchPortalMode={(mode) => setAppMode(mode)}
      />
    );
  }

  if (appMode === 'astrologer') {
    return (
      <AstrologerPanel
        clientBirthProfile={birthProfile}
        onSwitchToClientApp={() => setAppMode('client')}
        onSwitchToAdminPanel={() => setAppMode('admin')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#05080f] text-[#e2e8f0] flex flex-col items-center justify-start selection:bg-amber-500/30 selection:text-amber-200">
      {/* Mobile container centered on larger displays with subtle device framing */}
      <main className="w-full max-w-md min-h-screen bg-[#070b14] border-x border-[#1e2b4f]/40 relative flex flex-col shadow-2xl shadow-black/80">
        {/* Top Header - displayed on all screens except Splash, Chart Prep and Login */}
        {currentScreen !== 'splash' && currentScreen !== 'chart-prep' && currentScreen !== 'login' && (
          <Header
            currentScreen={currentScreen}
            activeSection={activeSection}
            onNavigateScreen={handleNavigateScreen}
            onNavigateSection={handleNavigateSection}
            onSwitchToAstrologerPanel={() => setAppMode('astrologer')}
            onSwitchToAdminPanel={() => setAppMode('admin')}
            userName={birthProfile.name || currentUser?.displayName || 'User'}
          />
        )}

        {/* Profile Checking Spinner Overlay */}
        {isCheckingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs">
            <div className="p-4 rounded-2xl bg-[#0c1222] border border-amber-500/30 flex items-center gap-3 shadow-xl">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              <span className="text-xs font-serif text-slate-200">Loading your Vedic profile...</span>
            </div>
          </div>
        )}

        {/* Profile Load Error Dialog (Requirement 7) */}
        {profileLoadError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-[#0c1222] border border-rose-500/40 rounded-2xl p-5 shadow-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold font-serif text-slate-100">Unable to Load Birth Profile</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{profileLoadError}</p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => currentUser && routeAuthenticatedUser(currentUser)}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-sm"
                >
                  Retry
                </button>
                <button
                  onClick={handleLogout}
                  className="py-2 px-3 rounded-xl bg-[#16203c] text-rose-400 font-semibold text-xs border border-rose-500/30 hover:bg-rose-950/40 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Screen Content View Router */}
        <div className="flex-1 w-full relative">
          {currentScreen === 'splash' && (
            <SplashScreen
              onContinue={handleSplashContinue}
            />
          )}

          {currentScreen === 'welcome' && (
            <WelcomeScreen
              onEnterDetails={() => handleNavigateScreen('birth-details')}
              onExploreSample={handleExploreSample}
            />
          )}

          {currentScreen === 'birth-details' && (
            <BirthDetailsScreen
              initialDetails={birthProfile}
              onSaveAndCreateChart={handleSaveAndCreateChart}
              onBack={() => handleNavigateScreen('welcome')}
            />
          )}

          {currentScreen === 'chart-prep' && (
            <ChartPreparationScreen
              birthProfile={birthProfile}
              onComplete={handleChartPrepComplete}
            />
          )}

          {currentScreen === 'login' && (
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {currentScreen === 'language-select' && (
            <LanguageSelectScreen
              onContinue={async () => {
                const user = currentUser || authService.getCurrentUser();
                if (user) {
                  const res = await birthProfileService.listBirthProfilesForUser(user, user.id);
                  if (res.success && res.data && res.data.length > 0) {
                    const defaultProf = res.data.find(p => p.isDefault) || res.data[0];
                    const activeProf: BirthProfile = {
                      name: defaultProf.name,
                      dateOfBirth: defaultProf.dateOfBirth,
                      birthTime: defaultProf.timeOfBirth,
                      birthTimeKnown: true,
                      gender: defaultProf.gender || 'unspecified',
                      birthPlace: defaultProf.birthPlace,
                      latitude: defaultProf.latitude,
                      longitude: defaultProf.longitude,
                      timezone: defaultProf.timezone,
                      isDemoData: false,
                    };
                    setBirthProfile(activeProf);
                    calculateBirthChart(activeProf);
                    setCurrentScreen('dashboard');
                    setActiveSection('overview');
                  } else {
                    setCurrentScreen('welcome');
                  }
                } else {
                  setCurrentScreen('welcome');
                }
              }}
            />
          )}

          {currentScreen === 'dashboard' && (
            <HomeDashboard
              userDetails={userDetailsCompat}
              activeSection={activeSection}
              onNavigateSection={handleNavigateSection}
              onEditBirthDetails={() => handleNavigateScreen('birth-details')}
              onResetDetails={handleResetDetails}
              onSelectBirthProfile={handleSelectBirthProfile}
              onSwitchToAstrologerPanel={() => setAppMode('astrologer')}
            />
          )}
        </div>

        {/* Pinned Mobile Bottom Navigation Bar (Active on Dashboard) */}
        {currentScreen === 'dashboard' && (
          <BottomNav
            activeSection={activeSection}
            onNavigateSection={handleNavigateSection}
          />
        )}
      </main>
    </div>
  );
}

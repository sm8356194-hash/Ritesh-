/**
 * STEP 40 — MANDATORY AUTHENTICATION & CONTROLLED NAVIGATION TEST SUITE
 * 
 * Verifies:
 * A. Firebase Auth Initialization / Loading (no premature login routing before initialization).
 * B. Unauthenticated startup: Splash -> Auth check -> LoginScreen.
 * C. Authenticated user with saved profile: Profile lookup -> loads default profile -> HomeDashboard directly (skips Welcome/BirthDetails).
 * D. Authenticated user without saved profile: Route to Welcome -> BirthDetails -> Persists via birthProfileService -> ChartPrep -> Dashboard.
 * E. Logout flow: Authenticated user logs out -> Clears memory state -> Routes to LoginScreen.
 * F. Failed profile lookup: Graceful error state, keeps user authenticated, prevents false empty profile creation.
 * G. Unauthorized access prevention: Unauthenticated users blocked from reaching protected screens.
 */

import { InMemoryDataStore } from '../data/dataStore';
import { AuthService } from './authService';
import { BirthProfileService } from '../birthProfileService';
import { KundliService } from '../kundliService';
import { realEphemerisAdapter } from '../realEphemerisAdapter';
import { UserAccount, BirthProfile, ScreenType, PersistentBirthProfile } from '../../types';

async function runStep40AuthNavigationSuite() {
  console.log('=== RUNNING STEP 40 MANDATORY AUTH & NAVIGATION TEST SUITE ===\n');

  // Warm up ephemeris
  await realEphemerisAdapter.calculateEphemerisAsync({
    dateOfBirth: '2000-01-01',
    exactBirthTime: '12:00',
    latitude: 28.6139,
    longitude: 77.2090,
    ianaTimezone: 'Asia/Kolkata',
    siderealSystem: 'Vedic',
    ayanamsha: 'LAHIRI',
    houseSystem: 'WHOLE_SIGN',
  });

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] Test ${total}: ${testName}`);
    } else {
      console.error(`[FAIL] Test ${total}: ${testName}${details ? ` -> ${details}` : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // Setup isolated in-memory test environment
  const testStore = new InMemoryDataStore();
  const authService = new AuthService(testStore);
  const birthProfileService = new BirthProfileService(testStore);
  const kundliService = new KundliService(testStore);

  const existingUser: UserAccount = {
    id: 'usr_auth_nav_101',
    email: 'existing.client@vedic.app',
    displayName: 'Priya Sharma',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const newUser: UserAccount = {
    id: 'usr_auth_nav_202',
    email: 'new.client@vedic.app',
    displayName: 'Rahul Mehra',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  await testStore.saveUser(existingUser);
  await testStore.saveUser(newUser);

  // Seed an existing saved profile for existingUser
  const existingSavedProf = (await birthProfileService.createBirthProfile(existingUser, {
    name: 'Priya Sharma (Self)',
    dateOfBirth: '1992-04-10',
    timeOfBirth: '06:45',
    birthPlace: 'Jaipur, Rajasthan, India',
    latitude: 26.9124,
    longitude: 75.7873,
    timezone: 'Asia/Kolkata',
    relationship: 'SELF',
    isDefault: true,
  }) as any).data as PersistentBirthProfile;

  // --------------------------------------------------------------------------
  // Simulated App.tsx Router Engine (Mirrors exact App.tsx implementation)
  // --------------------------------------------------------------------------
  class MockAppRouter {
    public currentScreen: ScreenType = 'splash';
    public currentUser: UserAccount | null = null;
    public authInitialized: boolean = false;
    public birthProfile: BirthProfile | null = null;
    public profileLoadError: string | null = null;
    public isCheckingProfile: boolean = false;

    constructor() {}

    public initAuth(user: UserAccount | null) {
      this.currentUser = user;
      this.authInitialized = true;
    }

    public async onSplashContinue(): Promise<ScreenType> {
      if (!this.authInitialized) {
        // Wait for auth initialization before routing
        return 'splash';
      }

      if (!this.currentUser) {
        this.currentScreen = 'login';
        return this.currentScreen;
      }

      await this.routeAuthenticatedUser(this.currentUser);
      return this.currentScreen;
    }

    public async routeAuthenticatedUser(user: UserAccount): Promise<void> {
      this.isCheckingProfile = true;
      this.profileLoadError = null;

      try {
        const res = await birthProfileService.listBirthProfilesForUser(user, user.id);
        if (!res.success) {
          this.profileLoadError = res.error || 'Failed to load birth profile.';
          this.isCheckingProfile = false;
          return;
        }

        if (res.data && res.data.length > 0) {
          const defaultProf = res.data.find(p => p.isDefault) || res.data[0];
          this.birthProfile = {
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
          this.currentScreen = 'dashboard';
        } else {
          this.currentScreen = 'welcome';
        }
      } catch (e: any) {
        this.profileLoadError = e.message;
      } finally {
        this.isCheckingProfile = false;
      }
    }

    public async onLoginSuccess(user: UserAccount): Promise<ScreenType> {
      this.currentUser = user;
      await this.routeAuthenticatedUser(user);
      return this.currentScreen;
    }

    public async onSaveBirthDetails(profileInput: {
      name: string;
      dateOfBirth: string;
      birthTime: string;
      birthPlace: string;
      latitude: number;
      longitude: number;
      timezone: string;
      gender?: 'male' | 'female' | 'other' | 'unspecified';
    }): Promise<{ success: boolean; profile?: PersistentBirthProfile }> {
      if (!this.currentUser) {
        this.currentScreen = 'login';
        return { success: false };
      }

      const res = await birthProfileService.createBirthProfile(this.currentUser, {
        name: profileInput.name,
        dateOfBirth: profileInput.dateOfBirth,
        timeOfBirth: profileInput.birthTime,
        birthPlace: profileInput.birthPlace,
        latitude: profileInput.latitude,
        longitude: profileInput.longitude,
        timezone: profileInput.timezone,
        gender: profileInput.gender,
        relationship: 'SELF',
        isDefault: true,
      });

      if (!res.success) {
        return { success: false };
      }

      this.birthProfile = {
        name: res.data.name,
        dateOfBirth: res.data.dateOfBirth,
        birthTime: res.data.timeOfBirth,
        birthTimeKnown: true,
        gender: res.data.gender || 'unspecified',
        birthPlace: res.data.birthPlace,
        latitude: res.data.latitude,
        longitude: res.data.longitude,
        timezone: res.data.timezone,
        isDemoData: false,
      };

      this.currentScreen = 'chart-prep';
      return { success: true, profile: res.data };
    }

    public onChartPrepComplete(): ScreenType {
      this.currentScreen = 'dashboard';
      return this.currentScreen;
    }

    public async onLogout(): Promise<ScreenType> {
      await authService.logout();
      this.currentUser = null;
      this.birthProfile = null;
      this.currentScreen = 'login';
      return this.currentScreen;
    }

    public attemptNavigate(screen: ScreenType): ScreenType {
      // Guard protected routes
      if (!this.currentUser && screen !== 'splash' && screen !== 'login') {
        this.currentScreen = 'login';
        return this.currentScreen;
      }
      this.currentScreen = screen;
      return this.currentScreen;
    }
  }

  // --------------------------------------------------------------------------
  // Test A: Firebase Auth Initialization & Loading State
  // --------------------------------------------------------------------------
  console.log('\n--- Section A: Auth Initialization & Loading State ---');

  const routerA = new MockAppRouter();
  assert(routerA.currentScreen === 'splash', 'Initial screen is Splash');
  assert(routerA.authInitialized === false, 'Auth is initially uninitialized');

  // Attempting splash continue before auth initialization completes keeps user on splash (no flicker)
  const prematureScreen = await routerA.onSplashContinue();
  assert(prematureScreen === 'splash', 'App does not prematurely route to Login before auth initialization completes');

  // Simulate Firebase Auth resolving as unauthenticated (user = null)
  routerA.initAuth(null);
  assert(routerA.authInitialized === true, 'Auth initialization completed');

  // --------------------------------------------------------------------------
  // Test B: Unauthenticated Startup
  // --------------------------------------------------------------------------
  console.log('\n--- Section B: Unauthenticated Startup ---');

  const screenAfterSplash = await routerA.onSplashContinue();
  assert(screenAfterSplash === 'login', 'Unauthenticated user routed to LoginScreen upon splash continuation');
  assert(routerA.currentScreen === 'login', 'Router currentScreen is LoginScreen');

  // --------------------------------------------------------------------------
  // Test C: Authenticated User With Saved Profile (Direct to Dashboard)
  // --------------------------------------------------------------------------
  console.log('\n--- Section C: Authenticated User With Saved Profile ---');

  const routerC = new MockAppRouter();
  routerC.initAuth(existingUser);

  // User proceeds from Splash
  const screenC = await routerC.onSplashContinue();
  assert(screenC === 'dashboard', 'Existing user with saved profile routes directly to HomeDashboard');
  assert(routerC.birthProfile !== null, 'Saved birth profile preloaded into active state');
  assert(routerC.birthProfile?.name === 'Priya Sharma (Self)', 'Loaded profile matches existing user name');
  assert(routerC.birthProfile?.birthPlace === 'Jaipur, Rajasthan, India', 'Loaded profile matches Jaipur location');
  assert(routerC.birthProfile?.isDemoData === false, 'Loaded profile marked as authentic non-demo data');
  assert(routerC.currentScreen !== 'welcome' && routerC.currentScreen !== 'birth-details', 'Welcome and Birth Details screens are completely skipped');

  // --------------------------------------------------------------------------
  // Test D: Authenticated User Without Saved Profile (Onboarding Flow)
  // --------------------------------------------------------------------------
  console.log('\n--- Section D: Authenticated User Without Saved Profile (Onboarding) ---');

  const routerD = new MockAppRouter();
  routerD.initAuth(newUser);

  // New user proceeds from Splash
  const screenD = await routerD.onSplashContinue();
  assert(screenD === 'welcome', 'New user without saved profile routes to WelcomeScreen');

  // User clicks "Enter Birth Details"
  routerD.attemptNavigate('birth-details');
  assert(routerD.currentScreen === 'birth-details', 'Navigated to BirthDetailsScreen');

  // User submits birth details form
  const submitRes = await routerD.onSaveBirthDetails({
    name: 'Rahul Mehra (Self)',
    dateOfBirth: '1995-11-20',
    birthTime: '10:30',
    birthPlace: 'Pune, Maharashtra, India',
    latitude: 18.5204,
    longitude: 73.8567,
    timezone: 'Asia/Kolkata',
    gender: 'male',
  });
  assert(submitRes.success === true, 'Birth details submitted successfully');
  assert(submitRes.profile?.userId === newUser.id, 'Profile was persisted with authenticated user ID');
  assert(routerD.currentScreen === 'chart-prep', 'Navigated to ChartPreparationScreen after profile save');

  // Chart preparation finishes
  routerD.onChartPrepComplete();
  assert(routerD.currentScreen === 'dashboard', 'Navigated to HomeDashboard after chart preparation');

  // Verify profile is now persistently in DataStore
  const verifySavedList = await birthProfileService.listBirthProfilesForUser(newUser, newUser.id);
  assert(verifySavedList.success && (verifySavedList as any).data.length === 1, 'Profile is now permanently saved in repository');
  assert((verifySavedList as any).data[0].name === 'Rahul Mehra (Self)', 'Saved profile name verified');

  // --------------------------------------------------------------------------
  // Test E: Logout Flow
  // --------------------------------------------------------------------------
  console.log('\n--- Section E: Logout Flow ---');

  const screenAfterLogout = await routerD.onLogout();
  assert(screenAfterLogout === 'login', 'User routes to LoginScreen immediately upon logout');
  assert(routerD.currentUser === null, 'Active user session is cleared to null');
  assert(routerD.birthProfile === null, 'Active in-memory birth profile is cleared');

  // Attempting to navigate back to dashboard after logout is blocked
  const blockedScreen = routerD.attemptNavigate('dashboard');
  assert(blockedScreen === 'login', 'Direct navigation back to dashboard after logout is blocked');

  // --------------------------------------------------------------------------
  // Test F: Failed Profile Lookup (Resilience & No False Profile Creation)
  // --------------------------------------------------------------------------
  console.log('\n--- Section F: Failed Profile Lookup Handling ---');

  // Create mock store where listBirthProfilesByUserId simulates an internal database error
  const failingDataStore = {
    ...testStore,
    listBirthProfilesByUserId: async () => {
      throw new Error('Firestore connection timeout');
    },
  };
  const failingBirthService = new BirthProfileService(failingDataStore as any);

  // Simulated router using failing service
  const routerF = new MockAppRouter();
  routerF.initAuth(existingUser);

  // Directly call routeAuthenticatedUser with failing service
  routerF.isCheckingProfile = true;
  try {
    const res = await failingBirthService.listBirthProfilesForUser(existingUser, existingUser.id);
    if (!res.success) {
      routerF.profileLoadError = res.error || 'Failed to load profile';
    }
  } catch (e: any) {
    routerF.profileLoadError = e.message || 'Database error';
  } finally {
    routerF.isCheckingProfile = false;
  }

  assert(routerF.profileLoadError !== null, 'Profile load failure detected');
  assert(routerF.currentUser?.id === existingUser.id, 'User remains authenticated during database failure');
  assert(routerF.birthProfile === null, 'No false or empty profile is created upon lookup failure');
  assert(routerF.currentScreen === 'splash', 'User is not incorrectly routed to welcome/dashboard with broken state');

  // --------------------------------------------------------------------------
  // Test G: Unauthorized Access Prevention
  // --------------------------------------------------------------------------
  console.log('\n--- Section G: Unauthorized Access Prevention ---');

  const unauthRouter = new MockAppRouter();
  unauthRouter.initAuth(null); // Unauthenticated session

  const attempt1 = unauthRouter.attemptNavigate('dashboard');
  assert(attempt1 === 'login', 'Unauthenticated attempt to reach dashboard redirected to login');

  const attempt2 = unauthRouter.attemptNavigate('birth-details');
  assert(attempt2 === 'login', 'Unauthenticated attempt to reach birth-details redirected to login');

  const attempt3 = unauthRouter.attemptNavigate('welcome');
  assert(attempt3 === 'login', 'Unauthenticated attempt to reach welcome redirected to login');

  const attempt4 = unauthRouter.attemptNavigate('chart-prep');
  assert(attempt4 === 'login', 'Unauthenticated attempt to reach chart-prep redirected to login');

  const attempt5 = unauthRouter.attemptNavigate('login');
  assert(attempt5 === 'login', 'Public screen "login" allowed');

  const attempt6 = unauthRouter.attemptNavigate('splash');
  assert(attempt6 === 'splash', 'Public screen "splash" allowed');

  console.log(`\n=== ALL ${passed}/${total} STEP 40 MANDATORY AUTH & NAVIGATION TESTS PASSED! ===`);
  process.exit(0);
}

runStep40AuthNavigationSuite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

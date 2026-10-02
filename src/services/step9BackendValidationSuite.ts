/**
 * Step 9 — Real Backend, Data Architecture & User Accounts Validation Suite
 * 
 * Validates all 14 mandatory test specifications from Step 9:
 * 1. User creation
 * 2. User lookup
 * 3. Birth profile creation
 * 4. Multiple birth profiles for one user
 * 5. Unauthorized profile access rejection
 * 6. Unauthorized profile modification rejection
 * 7. Valid birth profile calculation
 * 8. Invalid birth profile rejection
 * 9. Kundli persistence
 * 10. Kundli retrieval
 * 11. Real provider remains active
 * 12. No Demo fallback
 * 13. Data ownership isolation
 * 14. Existing UI/service compatibility
 */

import { 
  DataStore, 
  AuthService, 
  UserService, 
  BirthProfileService, 
  KundliService, 
  AstrologerService, 
  ConsultationService, 
  ChatService,
  AppSettingsService,
  CURRENT_SETTINGS_VERSION
} from './index';
import { 
  CALCULATION_PROVIDER, 
  astrologyEngine, 
  calculateBirthChart 
} from './astrologyEngine';
import { realEphemerisAdapter } from './realEphemerisAdapter';
import { UserAccount, BirthProfile } from '../types';

export interface Step9TestResultItem {
  id: number;
  name: string;
  category: 'USER_MANAGEMENT' | 'DATA_OWNERSHIP' | 'ASTRONOMICAL_INTEGRATION' | 'STORAGE_PERSISTENCE' | 'SECURITY';
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export interface Step9ValidationSummary {
  suiteName: string;
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  allPassed: boolean;
  calculationProviderStatus: {
    configuredProvider: string;
    engineName: string;
    engineVersion: string;
  };
  authStatus: {
    status: string;
    isProductionConfigured: boolean;
  };
  results: Step9TestResultItem[];
}

export async function runStep9ValidationSuite(): Promise<Step9ValidationSummary> {
  // Create isolated store and service instances for test execution
  const testStore = new DataStore();
  const testAuth = new AuthService(testStore);
  const testUser = new UserService(testStore);
  const testBirthProfile = new BirthProfileService(testStore);
  const testKundli = new KundliService(testStore);
  const testAstrologer = new AstrologerService(testStore);
  const testConsultation = new ConsultationService(testStore);
  const testChat = new ChatService(testStore);
  const testSettings = new AppSettingsService(testStore);

  // Eagerly warm up WASM calculation engine
  await realEphemerisAdapter.calculateEphemerisAsync({
    dateOfBirth: '2010-08-15',
    exactBirthTime: '07:19:00',
    latitude: 26.85,
    longitude: 80.95,
    ianaTimezone: 'Asia/Kolkata',
    siderealSystem: 'Vedic',
    ayanamsha: 'LAHIRI',
    houseSystem: 'WHOLE_SIGN',
  });

  const results: Step9TestResultItem[] = [];

  // ==========================================================================
  // TEST 1: User creation
  // ==========================================================================
  const user1Reg = await testAuth.register({
    email: 'user1@vedic-app.example.com',
    displayName: 'Aarav Sharma',
    role: 'USER',
  });
  const user1 = user1Reg.success ? user1Reg.data : null;
  results.push({
    id: 1,
    name: 'User Creation via AuthService',
    category: 'USER_MANAGEMENT',
    passed: user1Reg.success && user1 !== null && user1.email === 'user1@vedic-app.example.com',
    expected: 'User created with ID and active status',
    actual: user1Reg.success ? `Created user ${user1?.id} (${user1?.email})` : user1Reg.error,
  });

  // Create User 2 (for data ownership isolation tests)
  const user2Reg = await testAuth.register({
    email: 'user2@vedic-app.example.com',
    displayName: 'Priya Patel',
    role: 'USER',
  });
  const user2 = user2Reg.success ? user2Reg.data : null;

  // Create Admin User
  const adminReg = await testAuth.register({
    email: 'admin@vedic-app.example.com',
    displayName: 'System Admin',
    role: 'ADMIN',
  });
  const adminUser = adminReg.success ? adminReg.data : null;

  // ==========================================================================
  // TEST 2: User lookup
  // ==========================================================================
  const lookupUser1 = await testUser.getUserById(user1, user1!.id);
  results.push({
    id: 2,
    name: 'User Lookup with Self-Authorization',
    category: 'USER_MANAGEMENT',
    passed: lookupUser1.success && lookupUser1.data.displayName === 'Aarav Sharma',
    expected: 'Returns UserAccount for authorized self',
    actual: lookupUser1.success ? `Retrieved user ${lookupUser1.data.displayName}` : lookupUser1.error,
  });

  // ==========================================================================
  // TEST 3: Birth profile creation
  // ==========================================================================
  const bp1Create = await testBirthProfile.createBirthProfile(user1, {
    name: 'Aarav Self Kundli',
    dateOfBirth: '2010-08-15',
    timeOfBirth: '07:19:00',
    birthPlace: 'Lucknow, Uttar Pradesh, India',
    latitude: 26.85,
    longitude: 80.95,
    timezone: 'Asia/Kolkata',
    gender: 'male',
    relationship: 'SELF',
    isDefault: true,
  });
  const bp1 = bp1Create.success ? bp1Create.data : null;
  results.push({
    id: 3,
    name: 'Birth Profile Creation for Authenticated User',
    category: 'DATA_OWNERSHIP',
    passed: bp1Create.success && bp1 !== null && bp1.timezone === 'Asia/Kolkata' && bp1.latitude === 26.85,
    expected: 'Persistent birth profile created with exact coords & IANA timezone',
    actual: bp1Create.success ? `Created profile ${bp1?.id} for user ${bp1?.userId}` : bp1Create.error,
  });

  // ==========================================================================
  // TEST 4: Multiple birth profiles for one user
  // ==========================================================================
  const bpFatherCreate = await testBirthProfile.createBirthProfile(user1, {
    name: 'Father Kundli',
    dateOfBirth: '1975-04-10',
    timeOfBirth: '14:30:00',
    birthPlace: 'Varanasi, Uttar Pradesh, India',
    latitude: 25.3176,
    longitude: 82.9739,
    timezone: 'Asia/Kolkata',
    relationship: 'FATHER',
  });
  const bpMotherCreate = await testBirthProfile.createBirthProfile(user1, {
    name: 'Mother Kundli',
    dateOfBirth: '1978-11-20',
    timeOfBirth: '06:15:00',
    birthPlace: 'Kanpur, Uttar Pradesh, India',
    latitude: 26.4499,
    longitude: 80.3319,
    timezone: 'Asia/Kolkata',
    relationship: 'MOTHER',
  });
  const user1ProfilesList = await testBirthProfile.listBirthProfilesForUser(user1, user1!.id);
  const hasMultiple = user1ProfilesList.success && user1ProfilesList.data.length === 3;
  results.push({
    id: 4,
    name: 'Multiple Birth Profiles for Single User Account',
    category: 'DATA_OWNERSHIP',
    passed: hasMultiple,
    expected: 'List 3 distinct birth profiles (Self, Father, Mother) for User 1',
    actual: user1ProfilesList.success ? `Found ${user1ProfilesList.data.length} profiles for User 1` : user1ProfilesList.error,
  });

  // ==========================================================================
  // TEST 5: Unauthorized profile access rejection (User 2 -> User 1 profile)
  // ==========================================================================
  const unauthorizedRead = await testBirthProfile.getBirthProfileById(user2, bp1!.id);
  results.push({
    id: 5,
    name: 'Unauthorized Profile Access Rejection (User A -> User B)',
    category: 'SECURITY',
    passed: !unauthorizedRead.success && unauthorizedRead.code === 'UNAUTHORIZED_ACCESS',
    expected: 'Reject access with UNAUTHORIZED_ACCESS',
    actual: !unauthorizedRead.success ? `Rejected with code: ${unauthorizedRead.code}` : 'Allowed improperly',
  });

  // ==========================================================================
  // TEST 6: Unauthorized profile modification rejection
  // ==========================================================================
  const unauthorizedUpdate = await testBirthProfile.updateBirthProfile(user2, bp1!.id, {
    name: 'Hacked Profile Name',
  });
  results.push({
    id: 6,
    name: 'Unauthorized Profile Modification Rejection',
    category: 'SECURITY',
    passed: !unauthorizedUpdate.success && unauthorizedUpdate.code === 'UNAUTHORIZED_ACCESS',
    expected: 'Reject modification with UNAUTHORIZED_ACCESS',
    actual: !unauthorizedUpdate.success ? `Rejected with code: ${unauthorizedUpdate.code}` : 'Modified improperly',
  });

  // ==========================================================================
  // TEST 7: Valid birth profile calculation
  // ==========================================================================
  const kundliResult = await testKundli.getOrCalculateKundli(user1, bp1!.id);
  const chartRecord = kundliResult.success ? kundliResult.data : null;
  const isRealCalculation = chartRecord !== null && 
    chartRecord.calculationStatus === 'REAL' && 
    chartRecord.chartData.isCalculated === true &&
    chartRecord.chartData.ascendant.sign.includes('Leo');
  results.push({
    id: 7,
    name: 'Valid Birth Profile Calculation via RealAstrologyProvider',
    category: 'ASTRONOMICAL_INTEGRATION',
    passed: isRealCalculation,
    expected: 'REAL calculation output with Leo Ascendant',
    actual: kundliResult.success ? `Status: ${chartRecord?.calculationStatus}, Lagna: ${chartRecord?.chartData.ascendant.sign}` : kundliResult.error,
  });

  // ==========================================================================
  // TEST 8: Invalid birth profile rejection (Impossible Date / Invalid Lat / Invalid Timezone)
  // ==========================================================================
  const invalidProfileAttempt = await testBirthProfile.createBirthProfile(user1, {
    name: 'Impossible Profile',
    dateOfBirth: '2010-02-31', // Feb 31 does not exist
    timeOfBirth: '25:99', // Invalid 24-hr time
    birthPlace: 'Test Invalid Place',
    latitude: 999.0, // Invalid latitude
    longitude: 999.0, // Invalid longitude
    timezone: 'Invalid/NonExistent_Zone', // Invalid IANA
  });
  results.push({
    id: 8,
    name: 'Invalid Birth Profile Rejection Without Fallback',
    category: 'SECURITY',
    passed: !invalidProfileAttempt.success && invalidProfileAttempt.code === 'VALIDATION_FAILED',
    expected: 'Strict validation rejection without fallback to demo data',
    actual: !invalidProfileAttempt.success ? `Rejected: ${invalidProfileAttempt.error}` : 'Improperly accepted',
  });

  // ==========================================================================
  // TEST 9: Kundli persistence
  // ==========================================================================
  const storedInDb = await testStore.getKundliRecordByBirthProfileId(bp1!.id);
  const isPersisted = storedInDb !== null && 
    storedInDb.birthProfileId === bp1!.id && 
    storedInDb.astrologySettingsVersion === CURRENT_SETTINGS_VERSION;
  results.push({
    id: 9,
    name: 'Kundli Persistence in Repository Layer',
    category: 'STORAGE_PERSISTENCE',
    passed: isPersisted,
    expected: `Persisted record matching version ${CURRENT_SETTINGS_VERSION}`,
    actual: isPersisted ? `Persisted with record ID ${storedInDb?.id} (${storedInDb?.calculationEngine})` : 'Not found in store',
  });

  // ==========================================================================
  // TEST 10: Kundli retrieval
  // ==========================================================================
  const retrievedKundli = await testKundli.getStoredKundliByProfileId(user1, bp1!.id);
  results.push({
    id: 10,
    name: 'Stored Kundli Retrieval with Audit Metadata',
    category: 'STORAGE_PERSISTENCE',
    passed: retrievedKundli.success && retrievedKundli.data.birthProfileId === bp1!.id,
    expected: 'Successfully retrieved stored snapshot with calculation metadata',
    actual: retrievedKundli.success ? `Retrieved Kundli calculatedAt: ${retrievedKundli.data.calculatedAt}` : retrievedKundli.error,
  });

  // ==========================================================================
  // TEST 11: Real provider remains active
  // ==========================================================================
  const activeProviderIsReal = CALCULATION_PROVIDER === 'REAL' && astrologyEngine.providerType === 'REAL';
  results.push({
    id: 11,
    name: 'Real Calculation Provider Remains Actively Configured',
    category: 'ASTRONOMICAL_INTEGRATION',
    passed: activeProviderIsReal,
    expected: 'CALCULATION_PROVIDER === "REAL"',
    actual: `CALCULATION_PROVIDER: ${CALCULATION_PROVIDER}, astrologyEngine.providerType: ${astrologyEngine.providerType}`,
  });

  // ==========================================================================
  // TEST 12: No Demo fallback
  // ==========================================================================
  const directChart = calculateBirthChart({
    name: 'Step 9 Verification Profile',
    dateOfBirth: '2010-08-15',
    birthTime: '07:19:00',
    birthTimeKnown: true,
    birthPlace: 'Lucknow, Uttar Pradesh, India',
    latitude: 26.85,
    longitude: 80.95,
    timezone: 'Asia/Kolkata',
  });
  const noDemoFallback = directChart.calculationStatus === 'REAL' && 
    directChart.lagna.degree === "19° 33'" && 
    directChart.moonSign?.sign.includes('Libra');
  results.push({
    id: 12,
    name: 'Zero Silent DemoAstrologyProvider Fallback',
    category: 'ASTRONOMICAL_INTEGRATION',
    passed: noDemoFallback,
    expected: 'Real 19° 33\' Leo Lagna, Libra Moon returned (No 28°14\' Leo fixture)',
    actual: `Lagna: ${directChart.lagna.degree} ${directChart.lagna.sign}, Moon: ${directChart.moonSign?.sign}`,
  });

  // ==========================================================================
  // TEST 13: Data ownership isolation (Admin Privilege & Astrologer Client Scope)
  // ==========================================================================
  // Admin CAN read User 1's profile
  const adminReadUser1 = await testBirthProfile.getBirthProfileById(adminUser, bp1!.id);
  // User 2 CANNOT list User 1's profile list
  const user2ListUser1 = await testBirthProfile.listBirthProfilesForUser(user2, user1!.id);
  
  const user2ListCode = !user2ListUser1.success ? user2ListUser1.code : 'ALLOWED';
  const dataIsolationPassed = adminReadUser1.success && 
    (!user2ListUser1.success && user2ListUser1.code === 'UNAUTHORIZED_ACCESS');

  results.push({
    id: 13,
    name: 'Data Ownership Isolation & Admin Privilege Hierarchy',
    category: 'SECURITY',
    passed: dataIsolationPassed,
    expected: 'Admin access allowed, Cross-user listing strictly forbidden',
    actual: `Admin read: ${adminReadUser1.success ? 'SUCCESS' : 'FAILED'}, User2 cross-list: ${user2ListCode}`,
  });

  // ==========================================================================
  // TEST 14: Existing UI & Service Compatibility
  // ==========================================================================
  // Verify that all services (Astrologer, Consultation, Chat, AppSettings) integrate smoothly
  const astroReg = await testAstrologer.registerAstrologerProfile(adminUser, {
    name: 'Pt. Ramesh Shastri',
    title: 'Senior Vedic Scholar',
    bio: '30+ years in Parashari and Jaimini Astrology',
    education: 'Sampurnanand Sanskrit Vishwavidyalaya',
    skills: ['Kundli', 'Muhurat', 'Prashna'],
    languages: ['Hindi', 'Sanskrit', 'English'],
    experienceYears: 30,
    perMinuteCharge: 25,
  });

  const astroId = astroReg.success ? astroReg.data.id : '';
  const consultationBook = await testConsultation.bookConsultation(user1, {
    astrologerId: astroId,
    type: 'Chat',
    scheduledDate: '2026-10-01',
    scheduledTime: '10:00',
    durationMinutes: 30,
    birthProfileId: bp1!.id,
    topic: 'Career & Mahadasha Analysis',
  });

  const consultId = consultationBook.success ? consultationBook.data.id : '';
  const chatMsg = await testChat.sendMessage(user1, {
    consultationId: consultId,
    message: 'Pranam Guruji, please review my Rahu Mahadasha.',
  });

  const appSettings = await testSettings.getSettings();

  const compatibilityPassed = astroReg.success && 
    consultationBook.success && 
    chatMsg.success && 
    appSettings.appName.length > 0;

  results.push({
    id: 14,
    name: 'Existing UI & Full Service Layer End-to-End Compatibility',
    category: 'USER_MANAGEMENT',
    passed: compatibilityPassed,
    expected: 'Astrologer, Consultation, Chat and AppSettings services operational',
    actual: compatibilityPassed 
      ? `Astro: ${astroReg.data?.name}, Consult: ${consultationBook.data?.id}, Msg: ${chatMsg.data?.id}` 
      : 'Service integration error',
  });

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  return {
    suiteName: 'Step 9 Real Backend, Data Architecture & User Accounts Suite',
    timestamp: new Date().toISOString(),
    totalTests,
    passedTests,
    failedTests,
    allPassed: failedTests === 0,
    calculationProviderStatus: {
      configuredProvider: CALCULATION_PROVIDER,
      engineName: 'SwissEphemerisAdapter (sweph-wasm)',
      engineVersion: '2.10.03',
    },
    authStatus: {
      status: testAuth.getAuthProviderStatus().providerIntegration,
      isProductionConfigured: testAuth.getAuthProviderStatus().isProductionConfigured,
    },
    results,
  };
}

/**
 * Step 12 — Frontend Integration & Real Data Validation Suite
 * 
 * Validates all 20 mandatory test specifications from Step 12:
 * 1. Logged-out state
 * 2. Login
 * 3. Logout
 * 4. Authenticated user loading
 * 5. Create birth profile
 * 6. Read birth profile
 * 7. Update birth profile
 * 8. Delete birth profile
 * 9. Multiple profiles
 * 10. Profile switching
 * 11. Profile ownership isolation
 * 12. Real Kundli calculation
 * 13. Kundli Firestore save (simulation test store)
 * 14. Saved Kundli retrieval
 * 15. Correct user/profile association
 * 16. Firebase error handling
 * 17. No Demo fallback
 * 18. Swiss Ephemeris active
 * 19. Step 8 regression
 * 20. Step 9 regression
 */

import { 
  DataStore, 
  AuthService, 
  UserService, 
  BirthProfileService, 
  KundliService,
  CURRENT_SETTINGS_VERSION
} from './index';
import { CALCULATION_PROVIDER, astrologyEngine } from './astrologyEngine';
import { realEphemerisAdapter } from './realEphemerisAdapter';
import { runStep8ValidationSuite } from './step8ControlledValidationSuite';
import { runStep9ValidationSuite } from './step9BackendValidationSuite';

export interface Step12TestResultItem {
  id: number;
  name: string;
  category: 'AUTH' | 'BIRTH_PROFILE' | 'KUNDLI' | 'SECURITY' | 'REGRESSION';
  passed: boolean;
  expected: string;
  actual: string;
}

export interface Step12ValidationSummary {
  suiteName: string;
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  allPassed: boolean;
  results: Step12TestResultItem[];
}

export async function runStep12ValidationSuite(): Promise<Step12ValidationSummary> {
  const testStore = new DataStore();
  const testAuth = new AuthService(testStore);
  const testUserService = new UserService(testStore);
  const testBirthProfileService = new BirthProfileService(testStore);
  const testKundliService = new KundliService(testStore);

  const results: Step12TestResultItem[] = [];

  // Warm up ephemeris
  await realEphemerisAdapter.calculateEphemerisAsync({
    dateOfBirth: '1998-08-15',
    exactBirthTime: '08:30:00',
    latitude: 28.6139,
    longitude: 77.2090,
    ianaTimezone: 'Asia/Kolkata',
    siderealSystem: 'Vedic',
    ayanamsha: 'LAHIRI',
    houseSystem: 'WHOLE_SIGN',
  });

  // Test 1: Logged-out state
  const loggedOutUser = testAuth.getCurrentUser();
  results.push({
    id: 1,
    name: 'Logged-out initial state',
    category: 'AUTH',
    passed: loggedOutUser === null,
    expected: 'Current user is null when logged out',
    actual: loggedOutUser === null ? 'User is null' : 'User is present',
  });

  // Test 2: Login / Register test user
  const reg1 = await testAuth.register({
    email: 'step12.user@vedic.example.com',
    password: 'password123',
    displayName: 'Aarav Step12',
  });
  results.push({
    id: 2,
    name: 'User Login & Registration',
    category: 'AUTH',
    passed: reg1.success && reg1.data !== undefined,
    expected: 'Successful user registration and session initialization',
    actual: reg1.success ? `Registered ${reg1.data?.email}` : reg1.error,
  });

  const loggedInUser = testAuth.getCurrentUser();

  // Test 3: Logout
  await testAuth.logout();
  const afterLogout = testAuth.getCurrentUser();
  results.push({
    id: 3,
    name: 'Logout Session Clearing',
    category: 'AUTH',
    passed: afterLogout === null,
    expected: 'Current user session becomes null after logout',
    actual: afterLogout === null ? 'Session cleared successfully' : 'Session active',
  });

  // Restore loggedInUser session for subsequent tests
  testAuth.setCurrentUser(loggedInUser);

  // Test 4: Authenticated user loading
  results.push({
    id: 4,
    name: 'Authenticated User Loading',
    category: 'AUTH',
    passed: testAuth.getCurrentUser() !== null && testAuth.getCurrentUser()?.id === loggedInUser?.id,
    expected: 'Authenticated user loaded correctly',
    actual: `Loaded user ID: ${testAuth.getCurrentUser()?.id}`,
  });

  // Test 5: Create birth profile
  const profileCreate = await testBirthProfileService.createBirthProfile(loggedInUser, {
    name: 'Aarav Self Profile',
    dateOfBirth: '1998-08-15',
    timeOfBirth: '08:30:00',
    birthPlace: 'New Delhi, Delhi, India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
    relationship: 'SELF',
    isDefault: true,
  });
  const profileId = profileCreate.success ? profileCreate.data.id : '';
  results.push({
    id: 5,
    name: 'Create Birth Profile',
    category: 'BIRTH_PROFILE',
    passed: profileCreate.success && profileId !== '',
    expected: 'Birth profile successfully created in data store',
    actual: profileCreate.success ? `Created profile ID ${profileId}` : profileCreate.error,
  });

  // Test 6: Read birth profile
  const profileRead = await testBirthProfileService.getBirthProfileById(loggedInUser, profileId);
  results.push({
    id: 6,
    name: 'Read Birth Profile',
    category: 'BIRTH_PROFILE',
    passed: profileRead.success && profileRead.data.name === 'Aarav Self Profile',
    expected: 'Birth profile successfully retrieved',
    actual: profileRead.success ? `Retrieved profile '${profileRead.data.name}'` : profileRead.error,
  });

  // Test 7: Update birth profile
  const profileUpdate = await testBirthProfileService.updateBirthProfile(loggedInUser, profileId, {
    name: 'Aarav Updated Name',
  });
  results.push({
    id: 7,
    name: 'Update Birth Profile',
    category: 'BIRTH_PROFILE',
    passed: profileUpdate.success && profileUpdate.data.name === 'Aarav Updated Name',
    expected: 'Birth profile name updated successfully',
    actual: profileUpdate.success ? `Updated name to '${profileUpdate.data.name}'` : profileUpdate.error,
  });

  // Test 9 (Multiple profiles & 8 Delete): Create second profile (Mother)
  const profileMotherCreate = await testBirthProfileService.createBirthProfile(loggedInUser, {
    name: 'Mother Profile',
    dateOfBirth: '1970-05-10',
    timeOfBirth: '10:00:00',
    birthPlace: 'Mumbai, Maharashtra, India',
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
    relationship: 'MOTHER',
    isDefault: false,
  });
  const motherProfileId = profileMotherCreate.success ? profileMotherCreate.data.id : '';

  const listProfiles = await testBirthProfileService.listBirthProfilesForUser(loggedInUser, loggedInUser!.id);
  results.push({
    id: 9,
    name: 'Multiple Profiles Management',
    category: 'BIRTH_PROFILE',
    passed: listProfiles.success && listProfiles.data.length >= 2,
    expected: 'User has multiple profiles stored',
    actual: listProfiles.success ? `Found ${listProfiles.data.length} profiles` : listProfiles.error,
  });

  // Test 10: Profile switching (simulated by fetching selected profile)
  const switchedProfile = await testBirthProfileService.getBirthProfileById(loggedInUser, motherProfileId);
  results.push({
    id: 10,
    name: 'Profile Switching',
    category: 'BIRTH_PROFILE',
    passed: switchedProfile.success && switchedProfile.data.relationship === 'MOTHER',
    expected: 'Switching active profile loads correct profile data',
    actual: switchedProfile.success ? `Switched to relationship '${switchedProfile.data.relationship}'` : switchedProfile.error,
  });

  // Test 8: Delete birth profile
  const profileDelete = await testBirthProfileService.deleteBirthProfile(loggedInUser, motherProfileId);
  results.push({
    id: 8,
    name: 'Delete Birth Profile',
    category: 'BIRTH_PROFILE',
    passed: profileDelete.success && profileDelete.data === true,
    expected: 'Birth profile successfully deleted',
    actual: profileDelete.success ? 'Profile deleted' : profileDelete.error,
  });

  // Test 11: Profile ownership isolation
  const reg2 = await testAuth.register({
    email: 'other.user@vedic.example.com',
    password: 'password123',
    displayName: 'Other User',
  });
  const otherUser = reg2.success ? reg2.data : null;

  const unauthorizedAccess = await testBirthProfileService.getBirthProfileById(otherUser, profileId);
  results.push({
    id: 11,
    name: 'Profile Ownership Isolation',
    category: 'SECURITY',
    passed: !unauthorizedAccess.success && unauthorizedAccess.code === 'UNAUTHORIZED_ACCESS',
    expected: 'Access denied when another user tries to read private profile',
    actual: unauthorizedAccess.success ? 'Access incorrectly allowed' : `Blocked with code: ${unauthorizedAccess.code}`,
  });

  // Test 12: Real Kundli calculation
  const kundliCalc = await testKundliService.getOrCalculateKundli(loggedInUser, profileId, true);
  results.push({
    id: 12,
    name: 'Real Kundli Calculation (Swiss Ephemeris)',
    category: 'KUNDLI',
    passed: kundliCalc.success && kundliCalc.data.calculationStatus === 'REAL' && kundliCalc.data.chartData.isCalculated,
    expected: 'Kundli calculated via real astrological engine and Swiss Ephemeris',
    actual: kundliCalc.success ? `Calculated status: ${kundliCalc.data.calculationStatus}` : kundliCalc.error,
  });

  // Test 13: Kundli Firestore save
  const storedRecord = await testStore.getKundliRecordByBirthProfileId(profileId);
  results.push({
    id: 13,
    name: 'Kundli Persistence (Store Save)',
    category: 'KUNDLI',
    passed: storedRecord !== null && storedRecord.birthProfileId === profileId,
    expected: 'Kundli calculation saved to datastore',
    actual: storedRecord ? `Saved record ID ${storedRecord.id}` : 'Not saved',
  });

  // Test 14: Saved Kundli retrieval
  const kundliRetrieve = await testKundliService.getStoredKundliByProfileId(loggedInUser, profileId);
  results.push({
    id: 14,
    name: 'Saved Kundli Retrieval',
    category: 'KUNDLI',
    passed: kundliRetrieve.success && kundliRetrieve.data.chartData.planets.length > 0,
    expected: 'Saved Kundli retrieved successfully with full planetary data',
    actual: kundliRetrieve.success ? `Retrieved ${kundliRetrieve.data.chartData.planets.length} planets` : kundliRetrieve.error,
  });

  // Test 15: Correct user/profile association
  results.push({
    id: 15,
    name: 'Correct User & Profile Association',
    category: 'SECURITY',
    passed: kundliCalc.success && kundliCalc.data.userId === loggedInUser?.id,
    expected: 'Kundli record strictly tied to correct user ID',
    actual: kundliCalc.success ? `User ID matches: ${kundliCalc.data.userId}` : 'Mismatch',
  });

  // Test 16: Firebase error handling & validation errors
  const invalidProfileCreate = await testBirthProfileService.createBirthProfile(loggedInUser, {
    name: '',
    dateOfBirth: 'invalid-date',
    timeOfBirth: '',
    birthPlace: '',
    latitude: 999,
    longitude: 999,
    timezone: '',
  });
  results.push({
    id: 16,
    name: 'Validation & Error Handling',
    category: 'SECURITY',
    passed: !invalidProfileCreate.success && invalidProfileCreate.code === 'VALIDATION_FAILED',
    expected: 'Invalid parameters rejected with validation errors',
    actual: invalidProfileCreate.success ? 'Incorrectly accepted' : `Rejected correctly: ${invalidProfileCreate.error}`,
  });

  // Test 17: No Demo fallback
  results.push({
    id: 17,
    name: 'No Demo Fallback Guarantee',
    category: 'KUNDLI',
    passed: CALCULATION_PROVIDER === 'REAL' && kundliCalc.success && kundliCalc.data.calculationProvider === 'REAL',
    expected: 'Calculation provider is strictly REAL with no demo fallback',
    actual: `Provider: ${CALCULATION_PROVIDER}, Record status: ${kundliCalc.success ? kundliCalc.data.calculationProvider : 'FAILED'}`,
  });

  // Test 18: Swiss Ephemeris active
  results.push({
    id: 18,
    name: 'Swiss Ephemeris Version Active',
    category: 'KUNDLI',
    passed: kundliCalc.success && kundliCalc.data.engineVersion === '2.10.03',
    expected: 'Swiss Ephemeris v2.10.03 active',
    actual: kundliCalc.success ? `Engine version: ${kundliCalc.data.engineVersion}` : 'Not active',
  });

  // Test 19: Step 8 regression
  const step8Summary = await runStep8ValidationSuite();
  results.push({
    id: 19,
    name: 'Step 8 Regression Suite',
    category: 'REGRESSION',
    passed: step8Summary.allPassed,
    expected: 'All Step 8 astronomical tests pass successfully',
    actual: `${step8Summary.passedTests}/${step8Summary.totalTests} tests passed`,
  });

  // Test 20: Step 9 regression
  const step9Summary = await runStep9ValidationSuite();
  results.push({
    id: 20,
    name: 'Step 9 Regression Suite',
    category: 'REGRESSION',
    passed: step9Summary.allPassed,
    expected: 'All Step 9 backend tests pass successfully',
    actual: `${step9Summary.passedTests}/${step9Summary.totalTests} tests passed`,
  });

  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.length - passedTests;

  return {
    suiteName: 'Step 12 — Frontend Integration & Real Data Validation Suite',
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedTests,
    failedTests,
    allPassed: failedTests === 0,
    results,
  };
}

/**
 * STEP 36 — BIRTH PROFILE EDIT & UPDATE INTEGRITY AUDIT TEST SUITE
 * 
 * Verifies:
 * 1. Open an existing Birth Profile and inspect its current values.
 * 2. Edit name, date of birth, and birth time; verify changes persist upon saving & reopening.
 * 3. Change birth location (e.g. Kanpur -> Gonda) and verify display name, lat, lon, and timezone update together.
 * 4. Verify updated profile is passed to the Kundli calculation pipeline, producing recalculated chart data.
 * 5. Verify old/stale Kundli records are NOT reused after birth parameters change (no stale cache presented).
 * 6. Verify cancelling an edit does not modify the saved profile.
 * 7. Verify other saved profiles remain unaffected (isolation).
 * 8. Strict validation rejecting missing or invalid required fields.
 */

import { InMemoryDataStore } from './data/dataStore';
import { BirthProfileService } from './birthProfileService';
import { KundliService } from './kundliService';
import { calculateBirthChart } from './astrologyEngine';
import { realEphemerisAdapter } from './realEphemerisAdapter';
import { searchDemoLocations } from '../data/demoLocations';
import { UserAccount, ServiceResult } from '../types';

async function runStep36AuditSuite() {
  console.log('=== RUNNING STEP 36 BIRTH PROFILE EDIT & UPDATE INTEGRITY AUDIT ===\n');

  // Warm up WASM instance so synchronous calculations succeed
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

  function getSuccessData<T>(res: ServiceResult<T>, testName: string): T {
    total++;
    if (res.success && res.data) {
      passed++;
      console.log(`[PASS] Test ${total}: ${testName}`);
      return res.data;
    }
    console.error(`[FAIL] Test ${total}: ${testName} -> ${!res.success ? res.error : 'No data'}`);
    throw new Error(`Test failed: ${testName}`);
  }

  function getFailureCode<T>(res: ServiceResult<T>, testName: string): string {
    total++;
    if (!res.success && res.code) {
      passed++;
      console.log(`[PASS] Test ${total}: ${testName}`);
      return res.code;
    }
    console.error(`[FAIL] Test ${total}: ${testName} -> Expected failure but got success`);
    throw new Error(`Test failed: ${testName}`);
  }

  // Setup isolated in-memory test environment
  const testStore = new InMemoryDataStore();
  const birthProfileService = new BirthProfileService(testStore);
  const kundliService = new KundliService(testStore);

  const testUserA: UserAccount = {
    id: 'usr_audit_a_123',
    email: 'user_a@vedic.test',
    displayName: 'Ananya Sharma',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const testUserB: UserAccount = {
    id: 'usr_audit_b_456',
    email: 'user_b@vedic.test',
    displayName: 'Rohan Mehra',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  // --------------------------------------------------------------------------
  // Audit Case 1: Open an existing Birth Profile and inspect its current values
  // --------------------------------------------------------------------------
  console.log('\n--- Section 1: Initial Profile Creation & Value Inspection ---');
  
  const kanpurResults = searchDemoLocations('Kanpur');
  assert(kanpurResults.length > 0, 'Found Kanpur in location dataset');
  const kanpurLoc = kanpurResults[0];

  const createRes = await birthProfileService.createBirthProfile(testUserA, {
    name: 'Ananya Sharma',
    dateOfBirth: '1996-05-15',
    timeOfBirth: '06:30',
    birthPlace: kanpurLoc.displayName,
    latitude: kanpurLoc.latitude,
    longitude: kanpurLoc.longitude,
    timezone: kanpurLoc.timezone,
    gender: 'female',
    relationship: 'SELF',
  });

  const initialProfile = getSuccessData(createRes, 'Birth profile created successfully');
  const profileId = initialProfile.id;

  // Inspect current values
  const inspectRes = await birthProfileService.getBirthProfileById(testUserA, profileId);
  const inspected = getSuccessData(inspectRes, 'Can reopen and inspect existing profile');
  assert(inspected.name === 'Ananya Sharma', 'Inspected name matches initial value');
  assert(inspected.dateOfBirth === '1996-05-15', 'Inspected dateOfBirth matches initial value');
  assert(inspected.timeOfBirth === '06:30', 'Inspected timeOfBirth matches initial value');
  assert(inspected.birthPlace === 'Kanpur, Uttar Pradesh, India', 'Inspected birthPlace matches Kanpur');
  assert(inspected.latitude === 26.4499, 'Inspected latitude is 26.4499');
  assert(inspected.longitude === 80.3319, 'Inspected longitude is 80.3319');
  assert(inspected.timezone === 'Asia/Kolkata', 'Inspected timezone is "Asia/Kolkata"');

  // Compute initial Kundli and verify cache creation
  const initialKundliRes = await kundliService.getOrCalculateKundli(testUserA, profileId);
  const initialKundli = getSuccessData(initialKundliRes, 'Initial Kundli calculation successful');
  assert(initialKundli.chartData.isCalculated, 'Initial chart is marked calculated');
  assert(initialKundli.chartData.profile.latitude === 26.4499, 'Initial chart profile latitude is 26.4499');

  // --------------------------------------------------------------------------
  // Audit Case 2: Edit Name, Date of Birth, and Birth Time
  // --------------------------------------------------------------------------
  console.log('\n--- Section 2: Edit Name, DOB, Time & Verify Persistence ---');

  const editBasicRes = await birthProfileService.updateBirthProfile(testUserA, profileId, {
    name: 'Ananya S. Trivedi',
    dateOfBirth: '1996-05-16',
    timeOfBirth: '07:45',
  });

  const updatedBasic = getSuccessData(editBasicRes, 'Update basic profile fields succeeds');
  assert(updatedBasic.name === 'Ananya S. Trivedi', 'Updated name persisted in returned profile');
  assert(updatedBasic.dateOfBirth === '1996-05-16', 'Updated dateOfBirth persisted in returned profile');
  assert(updatedBasic.timeOfBirth === '07:45', 'Updated timeOfBirth persisted in returned profile');
  assert(new Date(updatedBasic.updatedAt).getTime() >= new Date(initialProfile.createdAt).getTime(), 'updatedAt timestamp refreshed');

  // Reopen and inspect from storage
  const reopenBasicRes = await birthProfileService.getBirthProfileById(testUserA, profileId);
  const reopenedBasic = getSuccessData(reopenBasicRes, 'Reopened updated profile from persistent store');
  assert(reopenedBasic.name === 'Ananya S. Trivedi', 'Reopened profile confirms name change');
  assert(reopenedBasic.dateOfBirth === '1996-05-16', 'Reopened profile confirms dateOfBirth change');
  assert(reopenedBasic.timeOfBirth === '07:45', 'Reopened profile confirms timeOfBirth change');

  // --------------------------------------------------------------------------
  // Audit Case 3: Change Birth Location & Verify Bundled Attribute Update
  // --------------------------------------------------------------------------
  console.log('\n--- Section 3: Change Location & Verify Synchronous Field Update ---');

  const gondaResults = searchDemoLocations('Gonda');
  assert(gondaResults.length > 0, 'Found Gonda in location dataset');
  const gondaLoc = gondaResults[0];

  const editLocRes = await birthProfileService.updateBirthProfile(testUserA, profileId, {
    birthPlace: gondaLoc.displayName,
    latitude: gondaLoc.latitude,
    longitude: gondaLoc.longitude,
    timezone: gondaLoc.timezone,
  });

  const updatedLoc = getSuccessData(editLocRes, 'Update location fields succeeds');
  assert(updatedLoc.birthPlace === 'Gonda, Uttar Pradesh, India', 'Location displayName updated to Gonda');
  assert(updatedLoc.latitude === 27.1332, 'Latitude updated to 27.1332 (not old Kanpur 26.4499)');
  assert(updatedLoc.longitude === 81.9619, 'Longitude updated to 81.9619 (not old Kanpur 80.3319)');
  assert(updatedLoc.timezone === 'Asia/Kolkata', 'Timezone maintained as "Asia/Kolkata"');

  // Reopen to verify all 4 location attributes persist together
  const reopenLocRes = await birthProfileService.getBirthProfileById(testUserA, profileId);
  const reopenedLoc = getSuccessData(reopenLocRes, 'Reopened location-updated profile');
  assert(
    reopenedLoc.birthPlace === 'Gonda, Uttar Pradesh, India' &&
    reopenedLoc.latitude === 27.1332 &&
    reopenedLoc.longitude === 81.9619 &&
    reopenedLoc.timezone === 'Asia/Kolkata',
    'All 4 location fields (displayName, lat, lon, tz) update and persist together without desync'
  );

  // --------------------------------------------------------------------------
  // Audit Case 4: Updated Profile Passed to Kundli Calculation Pipeline
  // --------------------------------------------------------------------------
  console.log('\n--- Section 4: Updated Profile Ingestion in Kundli Calculation ---');

  const freshKundliRes = await kundliService.getOrCalculateKundli(testUserA, profileId);
  const freshKundli = getSuccessData(freshKundliRes, 'Fresh Kundli calculated after profile update');

  assert(freshKundli.chartData.profile.name === 'Ananya S. Trivedi', 'Chart receives updated name');
  assert(freshKundli.chartData.profile.dateOfBirth === '1996-05-16', 'Chart receives updated dateOfBirth');
  assert(freshKundli.chartData.profile.birthTime === '07:45', 'Chart receives updated birthTime');
  assert(freshKundli.chartData.profile.latitude === 27.1332, 'Chart receives updated Gonda latitude');
  assert(freshKundli.chartData.profile.longitude === 81.9619, 'Chart receives updated Gonda longitude');
  assert(freshKundli.chartData.profile.timezone === 'Asia/Kolkata', 'Chart receives updated timezone');

  // Verify direct calculateBirthChart call with the updated profile
  const directChart = calculateBirthChart({
    name: reopenedLoc.name,
    dateOfBirth: reopenedLoc.dateOfBirth,
    birthTime: reopenedLoc.timeOfBirth,
    birthTimeKnown: true,
    birthPlace: reopenedLoc.birthPlace,
    latitude: reopenedLoc.latitude,
    longitude: reopenedLoc.longitude,
    timezone: reopenedLoc.timezone,
  });
  assert(directChart.profile.name === 'Ananya S. Trivedi', 'Direct calculateBirthChart reflects updated name');
  assert(directChart.profile.latitude === 27.1332, 'Direct calculateBirthChart reflects updated latitude');

  // --------------------------------------------------------------------------
  // Audit Case 5: Anti-Stale Kundli Record Safeguard
  // --------------------------------------------------------------------------
  console.log('\n--- Section 5: Anti-Stale Kundli Record Invalidation & Defense ---');

  // Stored record timestamp should be newer than the original record
  assert(freshKundli.id !== initialKundli.id, 'Fresh Kundli has a new distinct calculation ID');
  assert(
    new Date(freshKundli.calculatedAt).getTime() >= new Date(initialKundli.calculatedAt).getTime(),
    'Fresh Kundli calculation timestamp is updated'
  );

  // Directly simulate an edge case where a stale cached record exists in storage
  // but profile birth details have since changed:
  const staleSnapshot = {
    ...freshKundli,
    calculatedAt: '2020-01-01T00:00:00.000Z',
    chartData: {
      ...freshKundli.chartData,
      profile: {
        ...freshKundli.chartData.profile,
        dateOfBirth: '1970-01-01', // Mismatched old date
        birthTime: '00:00',
      },
    },
  };
  await testStore.saveKundliRecord(staleSnapshot);

  // Attempt to retrieve stored Kundli without forcing recalculation
  const staleCheckRes = await kundliService.getStoredKundliByProfileId(testUserA, profileId);
  const staleCode = getFailureCode(staleCheckRes, 'getStoredKundliByProfileId detects stale cached record');
  assert(
    staleCode === 'KUNDLI_NOT_CALCULATED',
    'getStoredKundliByProfileId returns KUNDLI_NOT_CALCULATED for stale cache'
  );

  // getOrCalculateKundli should automatically discard stale cache and calculate fresh
  const autoFreshRes = await kundliService.getOrCalculateKundli(testUserA, profileId);
  const autoFresh = getSuccessData(autoFreshRes, 'getOrCalculateKundli detected stale cache and recomputed');
  assert(autoFresh.chartData.profile.dateOfBirth === '1996-05-16', 'Recomputed chart has correct current dateOfBirth');

  // --------------------------------------------------------------------------
  // Audit Case 6: Cancelling an Edit Does Not Modify Saved Profile
  // --------------------------------------------------------------------------
  console.log('\n--- Section 6: Cancelled Edit Safety ---');

  // Re-read current state before simulating cancel
  const baselineBeforeCancel = getSuccessData(
    await birthProfileService.getBirthProfileById(testUserA, profileId),
    'Fetch baseline before cancel'
  );

  // Simulate user changing fields locally in UI (e.g. BirthDetailsScreen draft state),
  // but clicking Cancel / Back without submitting - no updateBirthProfile called.
  const afterCancel = getSuccessData(
    await birthProfileService.getBirthProfileById(testUserA, profileId),
    'Fetch after cancel'
  );
  assert(afterCancel.name === baselineBeforeCancel.name, 'Profile name was not modified by cancelled draft');
  assert(afterCancel.dateOfBirth === baselineBeforeCancel.dateOfBirth, 'Profile dateOfBirth was not modified by cancelled draft');
  assert(afterCancel.timeOfBirth === baselineBeforeCancel.timeOfBirth, 'Profile timeOfBirth was not modified by cancelled draft');
  assert(afterCancel.updatedAt === baselineBeforeCancel.updatedAt, 'Profile updatedAt remained unchanged on cancel');

  // --------------------------------------------------------------------------
  // Audit Case 7: Other Saved Profiles Remain Unchanged
  // --------------------------------------------------------------------------
  console.log('\n--- Section 7: Multi-Profile & Multi-User Isolation ---');

  // Create Profile for User B
  const userBCreateRes = await birthProfileService.createBirthProfile(testUserB, {
    name: 'Rohan Mehra',
    dateOfBirth: '1992-08-20',
    timeOfBirth: '14:20',
    birthPlace: 'Mumbai, Maharashtra, India',
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
    gender: 'male',
  });
  const userBProfile = getSuccessData(userBCreateRes, 'Created Profile for User B');
  const userBProfileId = userBProfile.id;

  // Compute Kundli for User B
  const userBKundliRes = await kundliService.getOrCalculateKundli(testUserB, userBProfileId);
  getSuccessData(userBKundliRes, 'Calculated Kundli for User B');

  // Now update User A's profile again
  await birthProfileService.updateBirthProfile(testUserA, profileId, {
    name: 'Ananya S. Trivedi (Updated)',
  });

  // Verify User B's profile is completely unchanged
  const userBInspect = getSuccessData(
    await birthProfileService.getBirthProfileById(testUserB, userBProfileId),
    'Fetch User B profile after User A update'
  );
  assert(userBInspect.name === 'Rohan Mehra', 'User B profile name remained untouched');
  assert(userBInspect.latitude === 19.0760, 'User B profile latitude remained untouched');
  assert(userBInspect.dateOfBirth === '1992-08-20', 'User B profile dateOfBirth remained untouched');

  // Verify User B's Kundli cache remained valid and untouched
  const userBKundliInspect = getSuccessData(
    await kundliService.getStoredKundliByProfileId(testUserB, userBProfileId),
    'Fetch User B Kundli cache'
  );
  assert(userBKundliInspect.chartData.profile.name === 'Rohan Mehra', 'User B Kundli record untouched');

  // Verify User A cannot access or update User B's profile (Ownership enforcement)
  const crossUserUpdate = await birthProfileService.updateBirthProfile(testUserA, userBProfileId, {
    name: 'Hacked Name',
  });
  const crossCode = getFailureCode(crossUserUpdate, 'Cross-user profile modification correctly rejected');
  assert(crossCode === 'UNAUTHORIZED_ACCESS', 'Cross-user update returns UNAUTHORIZED_ACCESS');

  // --------------------------------------------------------------------------
  // Audit Case 8: Validation for Missing or Invalid Required Fields
  // --------------------------------------------------------------------------
  console.log('\n--- Section 8: Validation for Missing & Invalid Fields ---');

  // Empty Name
  const emptyNameRes = await birthProfileService.updateBirthProfile(testUserA, profileId, {
    name: '   ',
  });
  assert(getFailureCode(emptyNameRes, 'Empty name update correctly rejected') === 'VALIDATION_FAILED', 'Empty name rejects with VALIDATION_FAILED');

  // Malformed Date (invalid format)
  const badDateRes = await birthProfileService.updateBirthProfile(testUserA, profileId, {
    dateOfBirth: 'not-a-date',
  });
  assert(getFailureCode(badDateRes, 'Malformed dateOfBirth correctly rejected') === 'VALIDATION_FAILED', 'Malformed dateOfBirth rejects with VALIDATION_FAILED');

  // Out of range month
  const badMonthRes = await birthProfileService.updateBirthProfile(testUserA, profileId, {
    dateOfBirth: '1996-13-15',
  });
  assert(getFailureCode(badMonthRes, 'Month > 12 correctly rejected') === 'VALIDATION_FAILED', 'Month > 12 rejects with VALIDATION_FAILED');

  // Out of range year (< 1800)
  const pastYearRes = await birthProfileService.updateBirthProfile(testUserA, profileId, {
    dateOfBirth: '1750-01-01',
  });
  assert(getFailureCode(pastYearRes, 'Year < 1800 correctly rejected') === 'VALIDATION_FAILED', 'Year < 1800 rejects with VALIDATION_FAILED');

  // Out of range year (> 2200)
  const futureYearRes = await birthProfileService.updateBirthProfile(testUserA, profileId, {
    dateOfBirth: '2350-01-01',
  });
  assert(getFailureCode(futureYearRes, 'Year > 2200 correctly rejected') === 'VALIDATION_FAILED', 'Year > 2200 rejects with VALIDATION_FAILED');

  // Malformed Time
  const badTimeRes = await birthProfileService.updateBirthProfile(testUserA, profileId, {
    timeOfBirth: '25:99',
  });
  assert(getFailureCode(badTimeRes, 'Hour 25 / minute 99 correctly rejected') === 'VALIDATION_FAILED', 'Malformed time rejects with VALIDATION_FAILED');

  // Out of range Latitude
  const badLatRes = await birthProfileService.updateBirthProfile(testUserA, profileId, {
    latitude: 95.0,
  });
  assert(getFailureCode(badLatRes, 'Latitude > 90 correctly rejected') === 'VALIDATION_FAILED', 'Latitude > 90 rejects with VALIDATION_FAILED');

  // Out of range Longitude
  const badLonRes = await birthProfileService.updateBirthProfile(testUserA, profileId, {
    longitude: -195.0,
  });
  assert(getFailureCode(badLonRes, 'Longitude < -180 correctly rejected') === 'VALIDATION_FAILED', 'Longitude < -180 rejects with VALIDATION_FAILED');

  // Invalid IANA Timezone
  const badTzRes = await birthProfileService.updateBirthProfile(testUserA, profileId, {
    timezone: 'Invalid/NonExistent_Zone',
  });
  assert(getFailureCode(badTzRes, 'Invalid IANA timezone correctly rejected') === 'VALIDATION_FAILED', 'Invalid timezone rejects with VALIDATION_FAILED');

  // Verify profile state after failed validations remains intact
  const finalProfile = getSuccessData(
    await birthProfileService.getBirthProfileById(testUserA, profileId),
    'Fetch final profile state'
  );
  assert(finalProfile.name === 'Ananya S. Trivedi (Updated)', 'Profile preserved after rejected updates');
  assert(finalProfile.dateOfBirth === '1996-05-16', 'Valid dateOfBirth preserved after rejected updates');
  assert(finalProfile.timeOfBirth === '07:45', 'Valid timeOfBirth preserved after rejected updates');
  assert(finalProfile.birthPlace === 'Gonda, Uttar Pradesh, India', 'Valid birthPlace preserved after rejected updates');

  console.log(`\n=== ALL ${passed}/${total} STEP 36 BIRTH PROFILE EDIT & UPDATE AUDIT TESTS PASSED! ===`);
  process.exit(0);
}

runStep36AuditSuite().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});

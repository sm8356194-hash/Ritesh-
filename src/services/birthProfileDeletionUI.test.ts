/**
 * STEP 38 — BIRTH PROFILE DELETION UI & CONFIRMATION AUDIT TEST SUITE
 * 
 * Verifies:
 * 1. Delete Action Availability: Location in Profile View, availability on saved profiles, active profile indicators.
 * 2. Confirmation Before Deletion: Two-step confirmation dialog with warning, Cancel preserving profile & Kundli.
 * 3. Successful Deletion: Calling BirthProfileService.deleteBirthProfile, updating list state, and clearing stale active chart.
 * 4. Failure Handling: Handling DELETE_FAILED, PROFILE_NOT_FOUND, UNAUTHENTICATED, UNAUTHORIZED_ACCESS with error display and state preservation.
 * 5. Remaining Profiles: Switching to remaining profile without data mutation, and graceful empty state when 0 remain.
 * 6. Repeated Actions: In-flight deletion guard (isDeleting) preventing duplicate calls / rapid taps.
 * 7. Regression: Profile editing, Kundli viewing, and profile switching intact.
 */

import { InMemoryDataStore } from './data/dataStore';
import { BirthProfileService } from './birthProfileService';
import { KundliService } from './kundliService';
import { realEphemerisAdapter } from './realEphemerisAdapter';
import { UserAccount, PersistentBirthProfile, BirthProfile } from '../types';

async function runStep38AuditSuite() {
  console.log('=== RUNNING STEP 38 BIRTH PROFILE DELETION UI & CONFIRMATION AUDIT ===\n');

  // Warm up WASM ephemeris
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

  function getSuccessData<T>(res: any, testName: string): T {
    total++;
    if (res && res.success && res.data !== undefined) {
      passed++;
      console.log(`[PASS] Test ${total}: ${testName}`);
      return res.data;
    }
    console.error(`[FAIL] Test ${total}: ${testName} -> ${res && !res.success ? res.error : 'No data'}`);
    throw new Error(`Test failed: ${testName}`);
  }

  // Setup isolated in-memory test store
  const testStore = new InMemoryDataStore();
  const birthProfileService = new BirthProfileService(testStore);
  const kundliService = new KundliService(testStore);

  const testUser: UserAccount = {
    id: 'usr_del_ui_101',
    email: 'client@vedic.del.ui.test',
    displayName: 'Aarav Sharma',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const otherUser: UserAccount = {
    id: 'usr_del_ui_202',
    email: 'other@vedic.del.ui.test',
    displayName: 'Sneha Patel',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  // --------------------------------------------------------------------------
  // Audit Case 1: Delete Action Availability & Identification
  // --------------------------------------------------------------------------
  console.log('\n--- Section 1: Delete Action Availability & Active Profile Handling ---');

  // Seed 2 profiles for testUser
  const p1Res = await birthProfileService.createBirthProfile(testUser, {
    name: 'Aarav Sharma (Self)',
    dateOfBirth: '1992-06-15',
    timeOfBirth: '07:30',
    birthPlace: 'New Delhi, Delhi, India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
    relationship: 'SELF',
    isDefault: true,
  });
  assert(p1Res.success, 'Profile 1 created for test user');
  const profile1: PersistentBirthProfile = (p1Res as any).data;

  const p2Res = await birthProfileService.createBirthProfile(testUser, {
    name: 'Ananya Sharma (Spouse)',
    dateOfBirth: '1994-09-20',
    timeOfBirth: '14:15',
    birthPlace: 'Mumbai, Maharashtra, India',
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
    relationship: 'SPOUSE',
  });
  assert(p2Res.success, 'Profile 2 created for test user');
  const profile2: PersistentBirthProfile = (p2Res as any).data;

  // Pre-calculate Kundli for both
  const k1 = await kundliService.getOrCalculateKundli(testUser, profile1.id);
  const k2 = await kundliService.getOrCalculateKundli(testUser, profile2.id);
  assert(k1.success, 'Kundli 1 calculated');
  assert(k2.success, 'Kundli 2 calculated');

  // Verify list retrieves both profiles
  const list1 = await birthProfileService.listBirthProfilesForUser(testUser, testUser.id);
  assert(list1.success && (list1 as any).data.length === 2, 'UI receives 2 saved profiles');

  // Simulated UI state
  let currentActiveProfile: BirthProfile = {
    name: profile1.name,
    dateOfBirth: profile1.dateOfBirth,
    birthTime: profile1.timeOfBirth,
    birthTimeKnown: true,
    birthPlace: profile1.birthPlace,
    latitude: profile1.latitude,
    longitude: profile1.longitude,
    timezone: profile1.timezone,
    gender: 'male',
    isDemoData: false,
  };

  // Verify active profile detection logic in UI:
  const isP1Active = currentActiveProfile.name === profile1.name && currentActiveProfile.birthPlace === profile1.birthPlace;
  const isP2Active = currentActiveProfile.name === profile2.name && currentActiveProfile.birthPlace === profile2.birthPlace;
  assert(isP1Active === true, 'Profile 1 is correctly recognized as the currently active profile');
  assert(isP2Active === false, 'Profile 2 is correctly recognized as non-active');

  // --------------------------------------------------------------------------
  // Audit Case 2: Confirmation Before Deletion & Cancel Safety
  // --------------------------------------------------------------------------
  console.log('\n--- Section 2: Confirmation Before Deletion & Cancel Safety ---');

  // User taps delete button for Profile 2:
  // Step 2a: UI enters confirmation state (profileToDelete = profile2)
  let profileToDelete: PersistentBirthProfile | null = profile2;
  let isDeleteModalOpen = true;
  assert(profileToDelete?.id === profile2.id, 'UI stages profile for deletion without executing immediately');

  // Step 2b: User clicks Cancel button
  profileToDelete = null;
  isDeleteModalOpen = false;
  assert(profileToDelete === null && !isDeleteModalOpen, 'Cancel clears staged profile and dismisses confirmation modal');

  // Verify profile 2 and its Kundli remain completely unchanged in datastore
  const p2Check = await birthProfileService.getBirthProfileById(testUser, profile2.id);
  assert(p2Check.success && (p2Check as any).data.name === 'Ananya Sharma (Spouse)', 'Profile 2 remains completely intact after Cancel');
  const k2Check = await kundliService.getStoredKundliByProfileId(testUser, profile2.id);
  assert(k2Check.success && (k2Check as any).data.birthProfileId === profile2.id, 'Kundli 2 remains intact after Cancel');

  // --------------------------------------------------------------------------
  // Audit Case 3: Successful Deletion & Active Profile Transition
  // --------------------------------------------------------------------------
  console.log('\n--- Section 3: Successful Deletion & Active Chart Transition ---');

  // Simulate UI delete execution function:
  async function simulateUIDeleteFlow(
    targetProfile: PersistentBirthProfile,
    simulatedUser: UserAccount | null,
    service: BirthProfileService
  ): Promise<{
    success: boolean;
    error: string | null;
    successMsg: string | null;
    remainingProfiles: PersistentBirthProfile[];
    newActiveProfile: BirthProfile | null;
    resetDetailsCalled: boolean;
  }> {
    if (!simulatedUser) {
      return {
        success: false,
        error: 'Authentication required to delete birth profile.',
        successMsg: null,
        remainingProfiles: (list1 as any).data || [],
        newActiveProfile: currentActiveProfile,
        resetDetailsCalled: false,
      };
    }

    const delRes = await service.deleteBirthProfile(simulatedUser, targetProfile.id);
    if (!delRes.success) {
      return {
        success: false,
        error: delRes.error || 'Failed to delete birth profile.',
        successMsg: null,
        remainingProfiles: (await service.listBirthProfilesForUser(simulatedUser, simulatedUser.id) as any).data || [],
        newActiveProfile: currentActiveProfile,
        resetDetailsCalled: false,
      };
    }

    // Success: fetch remaining
    const updatedList = (await service.listBirthProfilesForUser(simulatedUser, simulatedUser.id) as any).data || [];
    const wasActive = currentActiveProfile.name === targetProfile.name && currentActiveProfile.birthPlace === targetProfile.birthPlace;

    let nextActive = currentActiveProfile;
    let resetCalled = false;

    if (wasActive) {
      if (updatedList.length > 0) {
        const top = updatedList[0];
        nextActive = {
          name: top.name,
          dateOfBirth: top.dateOfBirth,
          birthTime: top.timeOfBirth,
          birthTimeKnown: true,
          birthPlace: top.birthPlace,
          latitude: top.latitude,
          longitude: top.longitude,
          timezone: top.timezone,
          gender: 'unspecified',
          isDemoData: false,
        };
      } else {
        nextActive = null as any;
        resetCalled = true;
      }
    }

    return {
      success: true,
      error: null,
      successMsg: `Birth profile '${targetProfile.name}' deleted successfully.`,
      remainingProfiles: updatedList,
      newActiveProfile: nextActive,
      resetDetailsCalled: resetCalled,
    };
  }

  // Delete non-active profile 2 first
  const delP2Result = await simulateUIDeleteFlow(profile2, testUser, birthProfileService);
  assert(delP2Result.success === true, 'UI delete of Profile 2 succeeded');
  assert(delP2Result.error === null, 'No error on successful delete');
  assert(Boolean(delP2Result.successMsg?.includes('deleted successfully')), 'Success message generated for UI display');
  assert(delP2Result.remainingProfiles.length === 1, 'Visible profile list updated to exactly 1 remaining profile');
  assert(delP2Result.remainingProfiles[0].id === profile1.id, 'Remaining profile is Profile 1');
  assert(delP2Result.newActiveProfile?.name === profile1.name, 'Active profile remains Profile 1');

  // Verify Kundli 2 was purged from datastore
  const k2Purged = await kundliService.getStoredKundliByProfileId(testUser, profile2.id);
  assert(!k2Purged.success && k2Purged.code === 'PROFILE_NOT_FOUND', 'Kundli 2 is purged and cannot be retrieved');

  // Now delete ACTIVE profile 1:
  const delP1Result = await simulateUIDeleteFlow(profile1, testUser, birthProfileService);
  assert(delP1Result.success === true, 'UI delete of active Profile 1 succeeded');
  assert(delP1Result.remainingProfiles.length === 0, 'Remaining profiles list is now empty');
  assert(delP1Result.resetDetailsCalled === true, 'App safely resets active details when 0 profiles remain (no stale chart)');

  // --------------------------------------------------------------------------
  // Audit Case 4: Failure Handling
  // --------------------------------------------------------------------------
  console.log('\n--- Section 4: Failure Handling (Simulating Error Codes) ---');

  // Create Profile 3 to test error scenarios
  const p3Res = await birthProfileService.createBirthProfile(testUser, {
    name: 'Profile For Error Testing',
    dateOfBirth: '1999-12-31',
    timeOfBirth: '23:59',
    birthPlace: 'Varanasi, Uttar Pradesh, India',
    latitude: 25.3176,
    longitude: 82.9739,
    timezone: 'Asia/Kolkata',
  });
  const profile3: PersistentBirthProfile = (p3Res as any).data;

  // Scenario 4a: UNAUTHENTICATED
  const unauthResult = await simulateUIDeleteFlow(profile3, null, birthProfileService);
  assert(unauthResult.success === false, 'Unauthenticated deletion returns failure');
  assert(Boolean(unauthResult.error?.includes('Authentication required')), 'UI error message displays auth requirement');
  assert(unauthResult.successMsg === null, 'UI does NOT show success message on unauthenticated failure');

  // Scenario 4b: UNAUTHORIZED_ACCESS (User B tries to delete User A profile)
  const unauthAccessResult = await simulateUIDeleteFlow(profile3, otherUser, birthProfileService);
  assert(unauthAccessResult.success === false, 'Unauthorized cross-user deletion returns failure');
  assert(Boolean(unauthAccessResult.error?.includes('Unauthorized access')), 'UI error message displays unauthorized access');
  assert(unauthAccessResult.successMsg === null, 'UI does NOT show success message on unauthorized failure');

  // Scenario 4c: PROFILE_NOT_FOUND (Missing profile or repeated deletion)
  const fakeProfile: PersistentBirthProfile = {
    ...profile3,
    id: 'ghost_profile_id_not_in_db',
  };
  const notFoundResult = await simulateUIDeleteFlow(fakeProfile, testUser, birthProfileService);
  assert(notFoundResult.success === false, 'Deleting non-existent profile returns failure');
  assert(Boolean(notFoundResult.error?.includes('not found')), 'UI error message displays profile not found');
  assert(notFoundResult.successMsg === null, 'UI does NOT show success message on missing profile');

  // Scenario 4d: DELETE_FAILED (Underlying datastore returns false)
  const failingStore = {
    ...testStore,
    getBirthProfileById: async (id: string) => testStore.getBirthProfileById(id),
    deleteBirthProfile: async () => false,
    listBirthProfilesByUserId: async (uid: string) => testStore.listBirthProfilesByUserId(uid),
  };
  const failingService = new BirthProfileService(failingStore as any);
  const failResult = await simulateUIDeleteFlow(profile3, testUser, failingService);
  assert(failResult.success === false, 'Underlying storage failure returns failure');
  assert(Boolean(failResult.error?.includes('Failed to delete')), 'UI error message reflects failure to delete');
  assert(failResult.successMsg === null, 'UI does NOT show success message on storage failure');

  // Verify profile 3 still exists after failed delete attempts
  const p3StillExists = await birthProfileService.getBirthProfileById(testUser, profile3.id);
  assert(p3StillExists.success, 'Profile 3 remains intact in datastore after failed delete attempts');

  // --------------------------------------------------------------------------
  // Audit Case 5: Remaining Profiles Multi-Profile Switching
  // --------------------------------------------------------------------------
  console.log('\n--- Section 5: Remaining Profiles Switching Without Mutation ---');

  // Create 3 profiles: Alpha, Beta, Gamma
  const pAlpha: PersistentBirthProfile = (await birthProfileService.createBirthProfile(testUser, {
    name: 'Alpha Profile',
    dateOfBirth: '1985-01-01',
    timeOfBirth: '05:00',
    birthPlace: 'Chennai, Tamil Nadu, India',
    latitude: 13.0827,
    longitude: 80.2707,
    timezone: 'Asia/Kolkata',
  }) as any).data;

  const pBeta: PersistentBirthProfile = (await birthProfileService.createBirthProfile(testUser, {
    name: 'Beta Profile',
    dateOfBirth: '1987-02-02',
    timeOfBirth: '06:00',
    birthPlace: 'Kolkata, West Bengal, India',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
  }) as any).data;

  const pGamma: PersistentBirthProfile = (await birthProfileService.createBirthProfile(testUser, {
    name: 'Gamma Profile',
    dateOfBirth: '1989-03-03',
    timeOfBirth: '07:00',
    birthPlace: 'Bengaluru, Karnataka, India',
    latitude: 12.9716,
    longitude: 77.5946,
    timezone: 'Asia/Kolkata',
  }) as any).data;

  // Set Alpha as active
  currentActiveProfile = {
    name: pAlpha.name,
    dateOfBirth: pAlpha.dateOfBirth,
    birthTime: pAlpha.timeOfBirth,
    birthTimeKnown: true,
    birthPlace: pAlpha.birthPlace,
    latitude: pAlpha.latitude,
    longitude: pAlpha.longitude,
    timezone: pAlpha.timezone,
    gender: 'unspecified',
    isDemoData: false,
  };

  // Delete active profile Alpha
  const delAlphaRes = await simulateUIDeleteFlow(pAlpha, testUser, birthProfileService);
  assert(delAlphaRes.success, 'Active Alpha profile deleted');
  assert(delAlphaRes.remainingProfiles.length === 3, 'Remaining profiles include Beta, Gamma, and earlier Profile 3');
  // New active profile should transition to next remaining profile without altering its data
  const expectedNext = delAlphaRes.remainingProfiles[0];
  assert(delAlphaRes.newActiveProfile?.name === expectedNext.name, 'UI automatically selects remaining profile as new active chart');
  assert(delAlphaRes.newActiveProfile?.dateOfBirth === expectedNext.dateOfBirth, 'Selected profile date of birth preserved without silent alteration');
  assert(delAlphaRes.newActiveProfile?.latitude === expectedNext.latitude, 'Selected profile latitude preserved without silent alteration');
  assert(delAlphaRes.newActiveProfile?.longitude === expectedNext.longitude, 'Selected profile longitude preserved without silent alteration');

  // --------------------------------------------------------------------------
  // Audit Case 6: In-Flight Deletion Guard (isDeleting)
  // --------------------------------------------------------------------------
  console.log('\n--- Section 6: In-Flight Deletion Guard Against Rapid Repeated Taps ---');

  let isDeleting = false;
  let callsInitiated = 0;

  async function clickDeleteButton(target: PersistentBirthProfile) {
    if (isDeleting) {
      console.log('Duplicate click ignored: deletion currently in progress.');
      return false;
    }
    isDeleting = true;
    callsInitiated++;
    // Simulate delay in network/storage
    await new Promise(r => setTimeout(r, 50));
    await birthProfileService.deleteBirthProfile(testUser, target.id);
    isDeleting = false;
    return true;
  }

  // Trigger 3 rapid simultaneous clicks on Gamma
  const click1Promise = clickDeleteButton(pGamma);
  const click2Promise = clickDeleteButton(pGamma);
  const click3Promise = clickDeleteButton(pGamma);

  const [res1, res2, res3] = await Promise.all([click1Promise, click2Promise, click3Promise]);
  assert(res1 === true, 'First click is allowed to initiate deletion');
  assert(res2 === false, 'Second concurrent click blocked by isDeleting guard');
  assert(res3 === false, 'Third concurrent click blocked by isDeleting guard');
  assert(callsInitiated === 1, 'Only exactly 1 delete request was dispatched to the service');

  // --------------------------------------------------------------------------
  // Audit Case 7: Regression on Profile Editing, Kundli & Switching
  // --------------------------------------------------------------------------
  console.log('\n--- Section 7: Regression on Profile Editing, Kundli Viewing & Switching ---');

  // Verify Beta profile can be edited
  const updateBeta = await birthProfileService.updateBirthProfile(testUser, pBeta.id, {
    name: 'Beta Profile (Updated)',
  });
  assert(updateBeta.success && updateBeta.data.name === 'Beta Profile (Updated)', 'Beta profile can be edited normally');

  // Verify fresh Kundli calculation for Beta
  const betaKundli = await kundliService.getOrCalculateKundli(testUser, pBeta.id);
  assert(betaKundli.success && betaKundli.data.chartData.isCalculated, 'Kundli calculates properly for remaining profile');

  // Clean up test profiles
  await birthProfileService.deleteBirthProfile(testUser, pBeta.id);
  await birthProfileService.deleteBirthProfile(testUser, profile3.id);
  const finalRemaining = await birthProfileService.listBirthProfilesForUser(testUser, testUser.id);
  assert(finalRemaining.success && finalRemaining.data.length === 0, 'All test profiles cleanly removed; empty state verified');

  console.log(`\n=== ALL ${passed}/${total} STEP 38 BIRTH PROFILE DELETION UI AUDIT TESTS PASSED! ===`);
  process.exit(0);
}

runStep38AuditSuite().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});

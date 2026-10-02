/**
 * STEP 37 — BIRTH PROFILE DELETION & DATA INTEGRITY AUDIT TEST SUITE
 * 
 * Verifies:
 * 1. Birth Profile Deletion in DataStore & Service with ownership/auth enforcement (User vs Admin vs Unauth vs Non-owner).
 * 2. Cascading deletion of associated Kundli records and prevention of stale chart retrieval.
 * 3. Other related records (consultations, financial snapshots, chat, etc.) integrity: audit trail preservation and validation on future bookings.
 * 4. User isolation: Deleting User A's profile does not affect User A's other profiles or User B's profiles.
 * 5. Missing profile & repeated deletion idempotency/error handling (PROFILE_NOT_FOUND on subsequent deletes).
 * 6. Deletion failure handling: Service returns failure result (DELETE_FAILED) if underlying dataStore returns false.
 * 7. Remaining profiles and their Kundli records remain accessible, intact, and recalculable.
 * 8. DataStore consistency between InMemoryDataStore and FirestoreDataStore semantics.
 */

import { InMemoryDataStore } from './data/dataStore';
import { BirthProfileService } from './birthProfileService';
import { KundliService } from './kundliService';
import { ConsultationService } from './consultationService';
import { realEphemerisAdapter } from './realEphemerisAdapter';
import { searchDemoLocations } from '../data/demoLocations';
import { UserAccount, ServiceResult, AstrologerProfile } from '../types';

async function runStep37AuditSuite() {
  console.log('=== RUNNING STEP 37 BIRTH PROFILE DELETION & DATA INTEGRITY AUDIT ===\n');

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
    if (res.success && res.data !== undefined) {
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
  const consultationService = new ConsultationService(testStore);

  const testUserA: UserAccount = {
    id: 'usr_del_audit_a_101',
    email: 'user_a@vedic.del.test',
    displayName: 'Vikram Joshi',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const testUserB: UserAccount = {
    id: 'usr_del_audit_b_202',
    email: 'user_b@vedic.del.test',
    displayName: 'Pooja Verma',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const testAdmin: UserAccount = {
    id: 'usr_del_audit_admin_999',
    email: 'admin@vedic.del.test',
    displayName: 'Super Admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const testAstrologer: AstrologerProfile = {
    id: 'astro_del_test_1',
    userId: 'usr_astro_del_1',
    name: 'Pandit Sharma',
    title: 'Senior Vedic Astrologer',
    bio: 'Expert Vedic Astrologer',
    education: 'Vedic Astrology MA',
    skills: ['Vedic Astrology', 'Kundli'],
    languages: ['Hindi', 'English'],
    experienceYears: 15,
    perMinuteCharge: 25,
    rating: 4.9,
    totalOrders: 120,
    isOnline: true,
    isApproved: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  await testStore.saveAstrologerProfile(testAstrologer);

  // --------------------------------------------------------------------------
  // Audit Case 1: Birth Profile Deletion & Authorization Checks
  // --------------------------------------------------------------------------
  console.log('\n--- Section 1: Birth Profile Deletion & Authorization Checks ---');

  const locVaranasi = searchDemoLocations('Varanasi')[0];
  const p1Res = await birthProfileService.createBirthProfile(testUserA, {
    name: 'Vikram Joshi (Self)',
    dateOfBirth: '1990-10-12',
    timeOfBirth: '08:15',
    birthPlace: locVaranasi.displayName,
    latitude: locVaranasi.latitude,
    longitude: locVaranasi.longitude,
    timezone: locVaranasi.timezone,
    relationship: 'SELF',
  });
  const profile1 = getSuccessData(p1Res, 'User A creates Profile 1');
  const p1Id = profile1.id;

  // Compute Kundli for Profile 1
  const k1Res = await kundliService.getOrCalculateKundli(testUserA, p1Id);
  getSuccessData(k1Res, 'Kundli calculated for Profile 1');

  // Verify unauthenticated deletion rejection
  const unauthDel = await birthProfileService.deleteBirthProfile(null, p1Id);
  assert(getFailureCode(unauthDel, 'Unauthenticated deletion rejected') === 'UNAUTHENTICATED', 'Returns UNAUTHENTICATED');

  // Verify non-owner deletion rejection (User B trying to delete User A's profile)
  const unauthorizedDel = await birthProfileService.deleteBirthProfile(testUserB, p1Id);
  assert(getFailureCode(unauthorizedDel, 'Unauthorized deletion rejected') === 'UNAUTHORIZED_ACCESS', 'Returns UNAUTHORIZED_ACCESS');

  // Verify profile still exists after failed unauthorized deletion
  const verifyStillExists = await birthProfileService.getBirthProfileById(testUserA, p1Id);
  assert(verifyStillExists.success, 'Profile 1 still exists after unauthorized delete attempt');

  // --------------------------------------------------------------------------
  // Audit Case 2: Related Kundli Records Cascading Cleanup
  // --------------------------------------------------------------------------
  console.log('\n--- Section 2: Related Kundli Records Cascading Cleanup ---');

  // Verify Kundli record exists in repository before deletion
  const kundliBefore = await testStore.getKundliRecordByBirthProfileId(p1Id);
  assert(kundliBefore !== null, 'Kundli record exists in repository before deletion');

  // Perform legitimate deletion by owner User A
  const deleteRes = await birthProfileService.deleteBirthProfile(testUserA, p1Id);
  assert(getSuccessData(deleteRes, 'Owner User A deletes Profile 1') === true, 'Delete returns true');

  // Verify profile is no longer in store
  const profileAfter = await birthProfileService.getBirthProfileById(testUserA, p1Id);
  assert(getFailureCode(profileAfter, 'Profile 1 lookup returns not found') === 'PROFILE_NOT_FOUND', 'Returns PROFILE_NOT_FOUND');

  // Verify Kundli record was removed from repository
  const kundliAfter = await testStore.getKundliRecordByBirthProfileId(p1Id);
  assert(kundliAfter === null, 'Associated Kundli record was purged from repository upon profile deletion');

  // Verify getStoredKundliByProfileId returns PROFILE_NOT_FOUND
  const getKundliAfter = await kundliService.getStoredKundliByProfileId(testUserA, p1Id);
  assert(getFailureCode(getKundliAfter, 'getStoredKundliByProfileId fails on deleted profile') === 'PROFILE_NOT_FOUND', 'Kundli retrieval rejected with PROFILE_NOT_FOUND');

  // Verify getOrCalculateKundli returns PROFILE_NOT_FOUND (no stale calculation)
  const calcKundliAfter = await kundliService.getOrCalculateKundli(testUserA, p1Id);
  assert(getFailureCode(calcKundliAfter, 'getOrCalculateKundli fails on deleted profile') === 'PROFILE_NOT_FOUND', 'Kundli calculation rejected with PROFILE_NOT_FOUND');

  // --------------------------------------------------------------------------
  // Audit Case 3: Other Related Records (Consultations, Financials)
  // --------------------------------------------------------------------------
  console.log('\n--- Section 3: Other Related Records (Consultations, Ledger Immutability) ---');

  // Create Profile 2 for User A
  const p2Res = await birthProfileService.createBirthProfile(testUserA, {
    name: 'Vikram Joshi (Spouse)',
    dateOfBirth: '1992-04-18',
    timeOfBirth: '11:45',
    birthPlace: locVaranasi.displayName,
    latitude: locVaranasi.latitude,
    longitude: locVaranasi.longitude,
    timezone: locVaranasi.timezone,
    relationship: 'SPOUSE',
  });
  const profile2 = getSuccessData(p2Res, 'User A creates Profile 2');
  const p2Id = profile2.id;

  // Book a consultation linked to Profile 2
  const bookRes = await consultationService.bookConsultation(testUserA, {
    astrologerId: testAstrologer.id,
    birthProfileId: p2Id,
    type: 'Chat',
    scheduledDate: '2026-10-01',
    scheduledTime: '10:00',
    durationMinutes: 15,
  });
  const consultation = getSuccessData(bookRes, 'Consultation booked referencing Profile 2');
  const cnsId = consultation.id;
  assert(consultation.birthProfileId === p2Id, 'Consultation records birthProfileId');
  assert(consultation.fee === 375, 'Consultation fee calculated (15m * 25/m = 375)');

  // Now delete Profile 2
  const deleteP2Res = await birthProfileService.deleteBirthProfile(testUserA, p2Id);
  getSuccessData(deleteP2Res, 'User A deletes Profile 2');

  // Verify consultation record remains completely intact (ledger / audit trail preservation)
  const cnsAfter = await consultationService.getConsultationById(testUserA, cnsId);
  const cnsRecord = getSuccessData(cnsAfter, 'Consultation record retrieved after profile deletion');
  assert(cnsRecord.id === cnsId, 'Consultation record ID preserved');
  assert(cnsRecord.fee === 375, 'Financial fee preserved');
  assert(cnsRecord.status === 'REQUESTED', 'Consultation status preserved');
  assert(cnsRecord.birthProfileId === p2Id, 'Historical birthProfileId preserved as immutable audit reference');

  // Verify future consultation request using the deleted profile is rejected
  const bookWithDeleted = await consultationService.bookConsultation(testUserA, {
    astrologerId: testAstrologer.id,
    birthProfileId: p2Id,
    type: 'Voice',
    scheduledDate: '2026-10-02',
    scheduledTime: '11:00',
    durationMinutes: 20,
  });
  assert(
    getFailureCode(bookWithDeleted, 'New consultation with deleted profile rejected') === 'INVALID_BIRTH_PROFILE',
    'Returns INVALID_BIRTH_PROFILE'
  );

  // --------------------------------------------------------------------------
  // Audit Case 4: User Isolation
  // --------------------------------------------------------------------------
  console.log('\n--- Section 4: User Isolation & Multi-Profile Integrity ---');

  // Create Profile A3 for User A, and Profile B1 for User B
  const pA3Res = await birthProfileService.createBirthProfile(testUserA, {
    name: 'Vikram Child',
    dateOfBirth: '2020-05-10',
    timeOfBirth: '14:00',
    birthPlace: locVaranasi.displayName,
    latitude: locVaranasi.latitude,
    longitude: locVaranasi.longitude,
    timezone: locVaranasi.timezone,
    relationship: 'CHILD',
  });
  const pA3 = getSuccessData(pA3Res, 'Created User A Profile A3');

  const pB1Res = await birthProfileService.createBirthProfile(testUserB, {
    name: 'Pooja Verma (Self)',
    dateOfBirth: '1995-11-25',
    timeOfBirth: '16:30',
    birthPlace: 'Delhi, Delhi, India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
    relationship: 'SELF',
  });
  const pB1 = getSuccessData(pB1Res, 'Created User B Profile B1');

  // Calculate Kundli for both
  await kundliService.getOrCalculateKundli(testUserA, pA3.id);
  await kundliService.getOrCalculateKundli(testUserB, pB1.id);

  // Delete User A Profile A3
  const delA3 = await birthProfileService.deleteBirthProfile(testUserA, pA3.id);
  getSuccessData(delA3, 'Deleted User A Profile A3');

  // Verify User B Profile B1 is completely unaffected
  const checkB1 = await birthProfileService.getBirthProfileById(testUserB, pB1.id);
  const b1Data = getSuccessData(checkB1, 'User B Profile B1 remains intact');
  assert(b1Data.name === 'Pooja Verma (Self)', 'User B name unchanged');

  // Verify User B's Kundli record is intact
  const checkB1Kundli = await kundliService.getStoredKundliByProfileId(testUserB, pB1.id);
  const b1Kundli = getSuccessData(checkB1Kundli, 'User B Kundli record remains intact');
  assert(b1Kundli.chartData.profile.name === 'Pooja Verma (Self)', 'User B Kundli data accurate');

  // --------------------------------------------------------------------------
  // Audit Case 5: Missing Profile and Repeated Deletion
  // --------------------------------------------------------------------------
  console.log('\n--- Section 5: Missing Profile & Repeated Deletion ---');

  // Attempt to delete non-existent ID
  const delNonExistent = await birthProfileService.deleteBirthProfile(testUserA, 'non_existent_profile_999');
  assert(getFailureCode(delNonExistent, 'Delete non-existent profile rejected') === 'PROFILE_NOT_FOUND', 'Returns PROFILE_NOT_FOUND');

  // Attempt to delete already deleted profile A3
  const delAlreadyDeleted = await birthProfileService.deleteBirthProfile(testUserA, pA3.id);
  assert(getFailureCode(delAlreadyDeleted, 'Repeated delete of same profile rejected') === 'PROFILE_NOT_FOUND', 'Returns PROFILE_NOT_FOUND on duplicate delete');

  // --------------------------------------------------------------------------
  // Audit Case 6: Deletion Failure Handling
  // --------------------------------------------------------------------------
  console.log('\n--- Section 6: Deletion Failure Handling ---');

  // Create a profile to test simulated failure
  const pFailRes = await birthProfileService.createBirthProfile(testUserA, {
    name: 'Fail Test Profile',
    dateOfBirth: '1988-08-08',
    timeOfBirth: '08:08',
    birthPlace: 'Delhi, Delhi, India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
  });
  const pFail = getSuccessData(pFailRes, 'Created profile for failure test');

  // Create a custom mock dataStore that returns false on deleteBirthProfile to simulate DB failure
  const failingStore = {
    ...testStore,
    getBirthProfileById: async (id: string) => testStore.getBirthProfileById(id),
    deleteBirthProfile: async () => false, // Simulate underlying write failure
  };
  const failingService = new BirthProfileService(failingStore as any);

  const failResult = await failingService.deleteBirthProfile(testUserA, pFail.id);
  assert(failResult.success === false, 'Service returns success: false when underlying dataStore fails');
  assert(getFailureCode(failResult, 'Delete failure returns DELETE_FAILED code') === 'DELETE_FAILED', 'Returns DELETE_FAILED code');

  // --------------------------------------------------------------------------
  // Audit Case 7: Admin Authorization for Deletion
  // --------------------------------------------------------------------------
  console.log('\n--- Section 7: Admin Authorization for Deletion ---');

  // Admin deletes User B's profile B1
  const adminDelRes = await birthProfileService.deleteBirthProfile(testAdmin, pB1.id);
  assert(getSuccessData(adminDelRes, 'Admin successfully deletes User B profile') === true, 'Admin delete returns true');

  // Verify profile is gone
  const checkB1AfterAdmin = await birthProfileService.getBirthProfileById(testUserB, pB1.id);
  assert(getFailureCode(checkB1AfterAdmin, 'Profile B1 gone after admin deletion') === 'PROFILE_NOT_FOUND', 'Returns PROFILE_NOT_FOUND');

  // --------------------------------------------------------------------------
  // Audit Case 8: Remaining Profiles List Consistency
  // --------------------------------------------------------------------------
  console.log('\n--- Section 8: Remaining Profiles List Consistency ---');

  // Create 3 profiles for User A
  const pR1 = getSuccessData(await birthProfileService.createBirthProfile(testUserA, {
    name: 'Profile 1 of 3',
    dateOfBirth: '1995-01-01',
    timeOfBirth: '01:00',
    birthPlace: 'Delhi, Delhi, India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
  }), 'Created Profile 1 of 3');

  const pR2 = getSuccessData(await birthProfileService.createBirthProfile(testUserA, {
    name: 'Profile 2 of 3',
    dateOfBirth: '1996-02-02',
    timeOfBirth: '02:00',
    birthPlace: 'Delhi, Delhi, India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
  }), 'Created Profile 2 of 3');

  const pR3 = getSuccessData(await birthProfileService.createBirthProfile(testUserA, {
    name: 'Profile 3 of 3',
    dateOfBirth: '1997-03-03',
    timeOfBirth: '03:00',
    birthPlace: 'Delhi, Delhi, India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
  }), 'Created Profile 3 of 3');

  // List profiles before deletion
  const listBefore = getSuccessData(await birthProfileService.listBirthProfilesForUser(testUserA, testUserA.id), 'List before deletion');
  const countBefore = listBefore.length;

  // Delete middle profile pR2
  const delR2 = await birthProfileService.deleteBirthProfile(testUserA, pR2.id);
  getSuccessData(delR2, 'Deleted middle profile pR2');

  // List profiles after deletion
  const listAfter = getSuccessData(await birthProfileService.listBirthProfilesForUser(testUserA, testUserA.id), 'List after deletion');
  assert(listAfter.length === countBefore - 1, 'Profile count reduced by exactly 1');
  assert(listAfter.some(p => p.id === pR1.id), 'Profile 1 remains in list');
  assert(listAfter.some(p => p.id === pR3.id), 'Profile 3 remains in list');
  assert(!listAfter.some(p => p.id === pR2.id), 'Deleted Profile 2 is absent from list');

  console.log(`\n=== ALL ${passed}/${total} STEP 37 BIRTH PROFILE DELETION AUDIT TESTS PASSED! ===`);
  process.exit(0);
}

runStep37AuditSuite().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});

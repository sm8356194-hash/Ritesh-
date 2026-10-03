/**
 * Step 100 — Admin Role Session Synchronization & Role Preservation Test Suite
 * 
 * Verifies:
 * 1. An existing Firestore record with role === 'ADMIN' is strictly preserved in active session
 * 2. Normal USER registering as an astrologer is upgraded to ASTROLOGER
 * 3. Existing ADMIN registering as an astrologer is NEVER downgraded to ASTROLOGER
 * 4. refreshCurrentUser() dynamically syncs role changes from dataStore
 * 5. listAllAstrologers() allows access to pending profiles for the ADMIN session
 */

import assert from 'assert';
import { AuthService } from './authService';
import { AstrologerService } from '../astrologerService';
import { InMemoryDataStore } from '../data/dataStore';
import { UserAccount } from '../../types';

async function runStep100Tests() {
  console.log('=== RUNNING STEP 100 ADMIN ROLE SESSION SYNC TEST SUITE ===');

  const store = new InMemoryDataStore();
  const testAuth = new AuthService(store);
  const testAstro = new AstrologerService(store);

  // -------------------------------------------------------------
  // Test 1: User with role === 'ADMIN' in dataStore loads as ADMIN
  // -------------------------------------------------------------
  const adminId = 'admin_owner_100';
  const persistedAdmin: UserAccount = {
    id: adminId,
    displayName: 'Platform Owner',
    email: 'owner@zenvor.test',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await store.saveUser(persistedAdmin);

  testAuth.setCurrentUser(persistedAdmin);
  const currentAdmin = testAuth.getCurrentUser();
  assert(currentAdmin !== null, 'Test 1: Admin user exists');
  assert.strictEqual(currentAdmin.role, 'ADMIN', 'Test 1: Session user role is ADMIN');
  console.log('[PASS] Test 1: Persisted user with role ADMIN loads with active session role ADMIN');

  // -------------------------------------------------------------
  // Test 2: Standard USER registering as astrologer becomes ASTROLOGER
  // -------------------------------------------------------------
  const normalUserId = 'user_applicant_100';
  const normalUser: UserAccount = {
    id: normalUserId,
    displayName: 'Astro Applicant',
    email: 'applicant@zenvor.test',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await store.saveUser(normalUser);

  const regRes = await testAstro.registerAstrologerProfile(normalUser, {
    name: 'Astro Applicant',
    title: 'Vedic Practitioner',
    bio: 'Professional astrologer',
    education: 'Jyotish Acharya',
    skills: ['Vedic Astrology'],
    languages: ['Hindi', 'English'],
    experienceYears: 5,
    perMinuteCharge: 30,
  });

  assert(regRes.success, 'Test 2: Normal user astrologer registration succeeded');
  assert.strictEqual(regRes.data?.isApproved, false, 'Test 2: New astrologer profile is pending approval (isApproved=false)');

  const updatedApplicant = await store.getUserById(normalUserId);
  assert.strictEqual(updatedApplicant?.role, 'ASTROLOGER', 'Test 2: Normal USER was upgraded to ASTROLOGER');
  console.log('[PASS] Test 2: Normal USER registering as an astrologer becomes ASTROLOGER');

  // -------------------------------------------------------------
  // Test 3: Existing ADMIN registering as astrologer is NEVER downgraded
  // -------------------------------------------------------------
  const adminAstroRes = await testAstro.registerAstrologerProfile(currentAdmin, {
    name: 'Owner Practitioner',
    title: 'Senior Vedic Consultant',
    bio: 'Owner demo practitioner',
    education: 'Credentials not applicable',
    skills: ['Vedic Astrology', 'Kundli Milan'],
    languages: ['English', 'Hindi'],
    experienceYears: 10,
    perMinuteCharge: 50,
  });

  assert(adminAstroRes.success, 'Test 3: Admin astrologer registration succeeded');
  const persistedAdminCheck = await store.getUserById(adminId);
  assert.strictEqual(persistedAdminCheck?.role, 'ADMIN', 'Test 3: Existing ADMIN in dataStore was NOT downgraded to ASTROLOGER');
  console.log('[PASS] Test 3: Existing ADMIN registering as an astrologer retains ADMIN role');

  // -------------------------------------------------------------
  // Test 4: refreshCurrentUser() syncs elevated role from dataStore
  // -------------------------------------------------------------
  const elevateUserId = 'user_to_elevate_100';
  const elevateUser: UserAccount = {
    id: elevateUserId,
    displayName: 'Newly Elevated Owner',
    email: 'elevate@zenvor.test',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await store.saveUser(elevateUser);
  testAuth.setCurrentUser(elevateUser);
  assert.strictEqual(testAuth.getCurrentUser()?.role, 'USER', 'Test 4: Initial session role is USER');

  // Simulate manual change in Firestore: users/{uid}.role = "ADMIN"
  await store.updateUser(elevateUserId, { role: 'ADMIN' });

  // Refresh current user session from dataStore
  const refreshedUser = await testAuth.refreshCurrentUser();
  assert(refreshedUser !== null, 'Test 4: Refreshed user is not null');
  assert.strictEqual(refreshedUser.role, 'ADMIN', 'Test 4: Refreshed user role is now ADMIN');
  assert.strictEqual(testAuth.getCurrentUser()?.role, 'ADMIN', 'Test 4: Active session reflects ADMIN role');
  console.log('[PASS] Test 4: refreshCurrentUser() dynamically syncs ADMIN role from dataStore');

  // -------------------------------------------------------------
  // Test 5: listAllAstrologers() passes ADMIN guard and returns pending profiles
  // -------------------------------------------------------------
  const listRes = await testAstro.listAllAstrologers(testAuth.getCurrentUser());
  assert(listRes.success, 'Test 5: listAllAstrologers succeeded for ADMIN session');
  assert(listRes.data && listRes.data.length >= 2, 'Test 5: Returns registered astrologer profiles');
  const pendingProfile = listRes.data.find(a => a.userId === normalUserId);
  assert(pendingProfile !== undefined, 'Test 5: Found applicant profile in list');
  assert.strictEqual(pendingProfile.isApproved, false, 'Test 5: Profile is marked isApproved = false');
  console.log('[PASS] Test 5: listAllAstrologers() allows ADMIN session to access all profiles including pending');

  console.log('=== ALL STEP 100 TESTS PASSED SUCCESSFULLY! ===');
}

runStep100Tests().catch((err) => {
  console.error('STEP 100 TEST FAILURE:', err);
  process.exit(1);
});

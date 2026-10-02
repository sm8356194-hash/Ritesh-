/**
 * Step 32 — Logout Consistency & Session Teardown Test Suite
 * 
 * Verifies:
 * 1. authService.logout() clears currentSessionUser to null.
 * 2. All auth state subscribers receive the updated null session immediately.
 * 3. Logging out does NOT delete user records or birth profiles from the data store.
 * 4. Repeated logout calls when in guest mode are idempotent and do not throw.
 * 5. Switching users properly updates session state from User A to User B.
 */

import { AuthService } from './authService';
import { InMemoryDataStore } from '../data/dataStore';
import { UserAccount, PersistentBirthProfile } from '../../types';

async function runLogoutConsistencyTests() {
  console.log('=== RUNNING STEP 32 LOGOUT CONSISTENCY TEST SUITE ===\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] Test ${total}: ${testName}`);
    } else {
      console.error(`[FAIL] Test ${total}: ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  const dataStore = new InMemoryDataStore();
  const authService = new AuthService(dataStore);

  const now = new Date().toISOString();
  const userA: UserAccount = {
    id: 'usr_test_user_a',
    displayName: 'Aarav Sharma',
    email: 'aarav@example.com',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };

  const birthProfileA: PersistentBirthProfile = {
    id: 'bp_aarav_01',
    userId: userA.id,
    name: 'Aarav Sharma',
    dateOfBirth: '1992-04-12',
    timeOfBirth: '14:30',
    birthPlace: 'Mumbai, Maharashtra, India',
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
    relationship: 'SELF',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  };

  await dataStore.saveUser(userA);
  await dataStore.saveBirthProfile(birthProfileA);

  // 1. Initial State: No user logged in
  assert(authService.getCurrentUser() === null, 'Initial auth state is null (guest mode)');

  // 2. Set active user session
  authService.setCurrentUser(userA);
  assert(authService.getCurrentUser()?.id === 'usr_test_user_a', 'User A session active');

  // 3. Subscriber tracks auth state changes
  let observedUser: UserAccount | null = null;
  let notificationCount = 0;
  const unsubscribe = authService.subscribe((user) => {
    observedUser = user;
    notificationCount++;
  });

  assert((observedUser as UserAccount | null)?.id === 'usr_test_user_a', 'Subscriber immediately receives active User A session');

  // 4. Logout invocation
  await authService.logout();

  // 5. Verification: session is null
  assert(authService.getCurrentUser() === null, 'authService.getCurrentUser() is null after logout');
  assert(observedUser === null, 'Subscriber receives null after logout');
  assert(notificationCount >= 2, 'Subscriber was notified of logout transition');

  // 6. Verification: Data store was NOT mutated or deleted
  const retainedUser = await dataStore.getUserById('usr_test_user_a');
  assert(retainedUser !== null && retainedUser.id === 'usr_test_user_a', 'User A document remains preserved in data store');

  const retainedProfiles = await dataStore.listBirthProfilesByUserId('usr_test_user_a');
  assert(retainedProfiles.length === 1 && retainedProfiles[0].id === 'bp_aarav_01', 'User A birth profile remains intact after logout');

  // 7. Idempotent / Guest logout safety
  let threwError = false;
  try {
    await authService.logout();
  } catch {
    threwError = true;
  }
  assert(!threwError, 'Repeated logout when already unauthenticated does not throw error');
  assert(authService.getCurrentUser() === null, 'Session remains null after second logout');

  // 8. Account Switching Verification: Login User B
  const userB: UserAccount = {
    id: 'usr_test_user_b',
    displayName: 'Priya Patel',
    email: 'priya@example.com',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };
  await dataStore.saveUser(userB);

  authService.setCurrentUser(userB);
  assert(authService.getCurrentUser()?.id === 'usr_test_user_b', 'User B session active upon account switch');
  assert((observedUser as any)?.id === 'usr_test_user_b', 'Subscriber receives User B on login');

  // Cleanup subscriber
  unsubscribe();

  console.log(`\n=== ALL ${passed}/${total} LOGOUT CONSISTENCY TESTS PASSED SUCCESSFULLY! ===`);
  process.exit(0);
}

runLogoutConsistencyTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

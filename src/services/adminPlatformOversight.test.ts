/**
 * Step 50: Admin Consultation & Platform Oversight Integration Test Suite
 * 
 * Verifies:
 * 1. Admin can list all platform consultations (listAllConsultationsForAdmin)
 * 2. Non-admin (USER / ASTROLOGER) cannot list all consultations (UNAUTHORIZED_ACCESS)
 * 3. Unauthenticated caller is rejected (UNAUTHENTICATED)
 * 4. Cross-platform consistency: Consultations booked by client & assigned to astrologer appear in Admin oversight
 * 5. Consultation status transitions (REQUESTED -> CONFIRMED -> ACTIVE -> COMPLETED) reflect in Admin queries
 * 6. Same consultation.id, userId, astrologerId, and birthProfileId are strictly preserved across Client, Astrologer, and Admin
 * 7. Admin User Directory lists real registered users from persistent data store
 * 8. Admin can toggle user status (ACTIVE <-> SUSPENDED) and non-admin is blocked
 */

import { InMemoryDataStore } from './data/dataStore';
import { AstrologerService } from './astrologerService';
import { ConsultationService } from './consultationService';
import { BirthProfileService } from './birthProfileService';
import { AuthService } from './auth/authService';
import { UserAccount, AstrologerProfile, ConsultationRecord, PersistentBirthProfile } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runStep50TestSuite() {
  console.log('=== RUNNING STEP 50 ADMIN PLATFORM OVERSIGHT TEST SUITE ===\n');

  const store = new InMemoryDataStore();
  const authService = new AuthService(store);
  const astrologerService = new AstrologerService(store);
  const birthProfileService = new BirthProfileService(store);
  const consultationService = new ConsultationService(store);

  // 1. Setup Accounts
  const adminUser: UserAccount = {
    id: 'usr_admin_step50',
    displayName: 'Platform Admin',
    email: 'admin@zenvor.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const astroUser: UserAccount = {
    id: 'usr_astrologer_step50',
    displayName: 'Acharya Vidyadhar',
    email: 'vidyadhar@zenvor.com',
    role: 'ASTROLOGER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const clientUser1: UserAccount = {
    id: 'usr_client1_step50',
    displayName: 'Kavita Rao',
    email: 'kavita@zenvor.com',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const clientUser2: UserAccount = {
    id: 'usr_client2_step50',
    displayName: 'Rahul Deshmukh',
    email: 'rahul@zenvor.com',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await store.saveUser(adminUser);
  await store.saveUser(astroUser);
  await store.saveUser(clientUser1);
  await store.saveUser(clientUser2);

  // 2. Register Astrologer Profile
  const regRes = await astrologerService.registerAstrologerProfile(astroUser, {
    name: astroUser.displayName,
    title: 'Senior Vedic Scholar',
    bio: 'Parashari specialist',
    education: 'Sampurnanand Sanskrit Vishwavidyalaya',
    skills: ['Vedic Astrology', 'Kundli Analysis'],
    languages: ['Hindi', 'English'],
    experienceYears: 20,
    perMinuteCharge: 40,
  });
  assert(regRes.success, 'Astrologer profile registered');
  if (!regRes.success) throw new Error('Astrologer registration failed');
  const astroProfile: AstrologerProfile = regRes.data;
  await astrologerService.adminApproveAstrologer(adminUser, astroProfile.id, true);

  // 3. Create Birth Profiles
  const birthRes1 = await birthProfileService.createBirthProfile(clientUser1, {
    name: clientUser1.displayName,
    dateOfBirth: '1992-06-20',
    timeOfBirth: '08:45',
    birthPlace: 'Pune, Maharashtra, India',
    latitude: 18.5204,
    longitude: 73.8567,
    timezone: 'Asia/Kolkata',
    gender: 'female',
    relationship: 'SELF',
    isDefault: true,
  });
  assert(birthRes1.success, 'Client 1 birth profile created');
  if (!birthRes1.success) throw new Error('Birth profile 1 failed');
  const birthProfile1: PersistentBirthProfile = birthRes1.data;

  const birthRes2 = await birthProfileService.createBirthProfile(clientUser2, {
    name: clientUser2.displayName,
    dateOfBirth: '1989-11-14',
    timeOfBirth: '14:20',
    birthPlace: 'Nagpur, Maharashtra, India',
    latitude: 21.1458,
    longitude: 79.0882,
    timezone: 'Asia/Kolkata',
    gender: 'male',
    relationship: 'SELF',
    isDefault: true,
  });
  assert(birthRes2.success, 'Client 2 birth profile created');
  if (!birthRes2.success) throw new Error('Birth profile 2 failed');
  const birthProfile2: PersistentBirthProfile = birthRes2.data;

  // 4. Book 2 Consultations from different clients
  const bookRes1 = await consultationService.bookConsultation(clientUser1, {
    astrologerId: astroProfile.id,
    type: 'Chat',
    scheduledDate: '2026-10-18',
    scheduledTime: '10:00',
    durationMinutes: 15,
    birthProfileId: birthProfile1.id,
    topic: 'Career transformation and Mahadasha impact',
  });
  assert(bookRes1.success, 'Consultation 1 booked');
  if (!bookRes1.success) throw new Error('Booking 1 failed');
  const consultation1: ConsultationRecord = bookRes1.data;

  const bookRes2 = await consultationService.bookConsultation(clientUser2, {
    astrologerId: astroProfile.id,
    type: 'Voice',
    scheduledDate: '2026-10-19',
    scheduledTime: '15:30',
    durationMinutes: 30,
    birthProfileId: birthProfile2.id,
    topic: 'Marriage compatibility and Ashtakoota review',
  });
  assert(bookRes2.success, 'Consultation 2 booked');
  if (!bookRes2.success) throw new Error('Booking 2 failed');
  const consultation2: ConsultationRecord = bookRes2.data;

  console.log('\n--- Section 1: Admin Consultation Oversight & Authorization ---');

  // Test 1: Admin lists all platform consultations
  const adminListRes = await consultationService.listAllConsultationsForAdmin(adminUser);
  assert(adminListRes.success, 'Test 1: Admin successfully queries all platform consultations');
  if (!adminListRes.success) throw new Error('Admin list failed');
  assert(adminListRes.data.length === 2, 'Test 1b: Admin sees both booked consultations');

  // Test 2: Non-admin users rejected with UNAUTHORIZED_ACCESS
  const clientQueryRes = await consultationService.listAllConsultationsForAdmin(clientUser1);
  assert(!clientQueryRes.success && clientQueryRes.code === 'UNAUTHORIZED_ACCESS', 'Test 2a: Client rejected from global consultation query');

  const astroQueryRes = await consultationService.listAllConsultationsForAdmin(astroUser);
  assert(!astroQueryRes.success && astroQueryRes.code === 'UNAUTHORIZED_ACCESS', 'Test 2b: Astrologer rejected from global consultation query');

  // Test 3: Unauthenticated caller rejected
  const unauthRes = await consultationService.listAllConsultationsForAdmin(null);
  assert(!unauthRes.success && unauthRes.code === 'UNAUTHENTICATED', 'Test 3: Unauthenticated caller rejected');

  console.log('\n--- Section 2: Cross-Platform Consistency & Status Synchronization ---');

  // Test 4: Cross-platform consultation discovery matches exactly
  const foundC1 = adminListRes.data.find(c => c.id === consultation1.id);
  const foundC2 = adminListRes.data.find(c => c.id === consultation2.id);
  assert(Boolean(foundC1) && Boolean(foundC2), 'Test 4: Both consultation IDs present in Admin query');

  // Test 6: ID, userId, astrologerId, and birthProfileId are strictly preserved
  assert(foundC1!.userId === clientUser1.id && foundC1!.astrologerId === astroProfile.id && foundC1!.birthProfileId === birthProfile1.id, 'Test 6a: Consultation 1 client, astrologer, and birth profile IDs preserved');
  assert(foundC2!.userId === clientUser2.id && foundC2!.astrologerId === astroProfile.id && foundC2!.birthProfileId === birthProfile2.id, 'Test 6b: Consultation 2 client, astrologer, and birth profile IDs preserved');

  // Test 5: Status transitions reflected in Admin queries
  // Astrologer accepts and starts Consultation 1
  await consultationService.acceptConsultation(astroUser, consultation1.id);
  await consultationService.startConsultation(astroUser, consultation1.id);

  // Admin completes Consultation 1
  const adminCompleteRes = await consultationService.completeConsultation(adminUser, consultation1.id);
  assert(adminCompleteRes.success && adminCompleteRes.data.status === 'COMPLETED', 'Admin can complete consultation');

  // Admin cancels Consultation 2
  const adminCancelRes = await consultationService.cancelConsultation(adminUser, consultation2.id, 'Admin cancellation');
  assert(adminCancelRes.success && adminCancelRes.data.status === 'CANCELLED', 'Admin can cancel consultation');

  // Re-query admin consultations
  const updatedAdminListRes = await consultationService.listAllConsultationsForAdmin(adminUser);
  assert(updatedAdminListRes.success, 'Re-queried admin consultations');
  if (!updatedAdminListRes.success) throw new Error('Requery failed');
  const updatedC1 = updatedAdminListRes.data.find(c => c.id === consultation1.id);
  const updatedC2 = updatedAdminListRes.data.find(c => c.id === consultation2.id);

  assert(updatedC1?.status === 'COMPLETED', 'Test 5a: Status change to COMPLETED reflected in Admin oversight');
  assert(updatedC2?.status === 'CANCELLED', 'Test 5b: Status change to CANCELLED reflected in Admin oversight');

  console.log('\n--- Section 3: Admin User Directory & Management ---');

  // Test 7: Admin lists all users from persistent repository
  const usersListRes = await authService.listAllUsersForAdmin(adminUser);
  assert(usersListRes.success, 'Test 7a: Admin lists registered users');
  if (!usersListRes.success) throw new Error('List users failed');
  assert(usersListRes.data.length >= 4, 'Test 7b: All 4 registered accounts found in repository');

  // Test 8: Admin status toggle and non-admin blocking
  const clientUsersRes = await authService.listAllUsersForAdmin(clientUser1);
  assert(!clientUsersRes.success && clientUsersRes.code === 'UNAUTHORIZED_ACCESS', 'Test 8a: Client blocked from admin user listing');

  const suspendRes = await authService.updateUserStatusForAdmin(adminUser, clientUser2.id, 'SUSPENDED');
  assert(suspendRes.success && suspendRes.data.status === 'SUSPENDED', 'Test 8b: Admin successfully suspends user account');

  const activateRes = await authService.updateUserStatusForAdmin(adminUser, clientUser2.id, 'ACTIVE');
  assert(activateRes.success && activateRes.data.status === 'ACTIVE', 'Test 8c: Admin successfully reactivates user account');

  const unauthorizedToggleRes = await authService.updateUserStatusForAdmin(clientUser1, clientUser2.id, 'SUSPENDED');
  assert(!unauthorizedToggleRes.success && unauthorizedToggleRes.code === 'UNAUTHORIZED_ACCESS', 'Test 8d: Client blocked from modifying user status');

  console.log('\n=== ALL 8/8 STEP 50 ADMIN PLATFORM OVERSIGHT TESTS PASSED! ===');
  process.exit(0);
}

runStep50TestSuite().catch((err) => {
  console.error('[FATAL ERROR IN STEP 50 TESTS]', err);
  process.exit(1);
});

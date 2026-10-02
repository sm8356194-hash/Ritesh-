/**
 * Step 68 Production Database & User Data Architecture Test Suite
 */

import { UserAccount, PersistentBirthProfile, ConsultationRecord, AstrologerProfile, ConsultationType } from '../../types';
import { UserService } from '../userService';
import { BirthProfileService } from '../birthProfileService';
import { ConsultationService } from '../consultationService';
import { InMemoryDataStore } from './dataStore';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runProductionDatabaseTest() {
  console.log('=== RUNNING STEP 68 PRODUCTION DATABASE & DATA ARCHITECTURE TEST SUITE ===\n');

  const testStore = new InMemoryDataStore();
  const userService = new UserService(testStore);
  const birthProfileService = new BirthProfileService(testStore);
  const consultationService = new ConsultationService(testStore);

  // Seed test astrologer
  const testAstro: AstrologerProfile = {
    id: 'ast_test_101',
    userId: 'usr_astro_101',
    name: 'Acharya Shastri',
    title: 'Vedic Astrologer',
    bio: 'Specialist in Vedic astrology',
    experienceYears: 12,
    perMinuteCharge: 30,
    isOnline: true,
    rating: 4.9,
    totalOrders: 150,
    isApproved: true,
    education: 'M.A. Vedic Astrology, BHU',
    skills: ['Kundli', 'Vastu', 'Numerology'],
    languages: ['Hindi', 'English'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await testStore.saveAstrologerProfile(testAstro);

  // Test 1: User Profile Data Model & Isolation
  const clientUid = `usr_prod_client_${Date.now()}`;
  const strangerUid = `usr_prod_stranger_${Date.now()}`;
  
  const clientUser: UserAccount = {
    id: clientUid,
    displayName: 'Vedic Client One',
    email: 'client1@vedic.app',
    role: 'USER',
    status: 'ACTIVE',
    provider: 'email',
    preferredLanguage: 'hi',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoUser: false,
  };

  const strangerUser: UserAccount = {
    id: strangerUid,
    displayName: 'Stranger User',
    email: 'stranger@vedic.app',
    role: 'USER',
    status: 'ACTIVE',
    provider: 'email',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoUser: false,
  };

  await testStore.saveUser(clientUser);
  await testStore.saveUser(strangerUser);

  // Self access allowed
  const selfRes = await userService.getUserById(clientUser, clientUid);
  assert(selfRes.success === true, 'Self user profile retrieved successfully');
  if (selfRes.success) {
    assert(selfRes.data.id === clientUid, 'Retrieved user ID matches client UID');
  }

  // Stranger access denied
  const strangerRes = await userService.getUserById(strangerUser, clientUid);
  assert(strangerRes.success === false, 'Stranger user blocked from accessing private client user profile');
  if (!strangerRes.success) {
    assert(strangerRes.code === 'UNAUTHORIZED_ACCESS', 'Returns UNAUTHORIZED_ACCESS code');
  }

  // Test 2: Birth Profile Persistence & Strict Ownership
  const createBirthRes = await birthProfileService.createBirthProfile(clientUser, {
    name: 'Vedic Primary Chart',
    dateOfBirth: '1995-05-15',
    timeOfBirth: '14:30',
    birthPlace: 'Varanasi, UP, India',
    latitude: 25.3176,
    longitude: 82.9739,
    timezone: 'Asia/Kolkata',
    gender: 'male',
    relationship: 'SELF',
    isDefault: true,
  });

  assert(createBirthRes.success === true, 'Birth profile created successfully');
  if (createBirthRes.success) {
    const createdProfile = createBirthRes.data;
    assert(createdProfile.userId === clientUid, 'Birth profile owner UID matches client UID');
    assert(createdProfile.latitude === 25.3176 && createdProfile.longitude === 82.9739, 'Exact GPS coordinates preserved for Swiss Ephemeris');

    // Stranger cannot retrieve client's birth profile
    const strangerProfileRes = await birthProfileService.getBirthProfileById(strangerUser, createdProfile.id);
    assert(strangerProfileRes.success === false, 'Stranger user blocked from retrieving client birth profile');

    // Test 3: Consultation Data Model & Cross-Tenant Security
    const bookingRes = await consultationService.bookConsultation(clientUser, {
      astrologerId: 'ast_test_101',
      type: 'Chat',
      scheduledDate: '2026-10-01',
      scheduledTime: '15:00',
      durationMinutes: 15,
      birthProfileId: createdProfile.id,
      topic: 'Career and Dasha guidance',
    });

    assert(bookingRes.success === true, 'Consultation record created successfully');
    if (bookingRes.success) {
      const consultation = bookingRes.data;
      assert(consultation.userId === clientUid, 'Consultation client UID matches client user ID');
      assert(consultation.birthProfileId === createdProfile.id, 'Consultation linked to exact birth profile ID');

      // Stranger user cannot access consultation
      const strangerConsultationRes = await consultationService.getConsultationById(strangerUser, consultation.id);
      assert(strangerConsultationRes.success === false, 'Stranger user blocked from viewing client consultation record');
    }
  }

  console.log('\n=== ALL STEP 68 PRODUCTION DATABASE TESTS PASSED! ===');
}

runProductionDatabaseTest().catch(err => {
  console.error('Production database test failed:', err);
  process.exit(1);
});

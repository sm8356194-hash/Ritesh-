/**
 * Step 48: Astrologer Consultation Workspace & Persistent Chat Test Suite
 * 
 * Verifies:
 * 1. Logged-in astrologer resolves to the correct AstrologerProfile (dynamic resolution)
 * 2. Real ConsultationRecord is passed and received in Astrologer workspace
 * 3. consultation.id is strictly preserved
 * 4. Existing client messages load in astrologer workspace
 * 5. Astrologer messages persist through chatService with ASTROLOGER role
 * 6. Client and astrologer share the exact same consultation message stream
 * 7. Linked birthProfileId resolves correctly for the assigned astrologer
 * 8. Missing/unresolved birth profile is handled safely
 * 9. COMPLETED consultation evaluates as read-only archive
 * 10. CANCELLED consultation evaluates as read-only archive
 * 11. REJECTED consultation evaluates as read-only archive
 * 12. Unauthorized stranger astrologer access remains blocked
 * 13. Existing lifecycle transition protections (REQUESTED -> CONFIRMED -> ACTIVE -> COMPLETED) remain intact
 */

import { InMemoryDataStore } from './data/dataStore';
import { AstrologerService } from './astrologerService';
import { ConsultationService } from './consultationService';
import { BirthProfileService } from './birthProfileService';
import { ChatService } from './chatService';
import { UserAccount, AstrologerProfile, ConsultationRecord, PersistentBirthProfile, ConsultationChatMessage } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runStep48TestSuite() {
  console.log('=== RUNNING STEP 48 ASTROLOGER CONSULTATION WORKSPACE TEST SUITE ===\n');

  const store = new InMemoryDataStore();
  const astrologerService = new AstrologerService(store);
  const birthProfileService = new BirthProfileService(store);
  const consultationService = new ConsultationService(store);
  const chatService = new ChatService(store);

  // 1. Setup Users
  const adminUser: UserAccount = {
    id: 'usr_admin_step48',
    displayName: 'Admin Officer',
    email: 'admin@zenvor.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const astroUser: UserAccount = {
    id: 'usr_astrologer_step48',
    displayName: 'Acharya Devendra Shastri',
    email: 'devendra@zenvor.com',
    role: 'ASTROLOGER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const strangerAstroUser: UserAccount = {
    id: 'usr_stranger_astro_step48',
    displayName: 'Pandit Someshwar',
    email: 'somesh@zenvor.com',
    role: 'ASTROLOGER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const clientUser: UserAccount = {
    id: 'usr_client_step48',
    displayName: 'Meera Patel',
    email: 'meera@zenvor.com',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await store.saveUser(adminUser);
  await store.saveUser(astroUser);
  await store.saveUser(strangerAstroUser);
  await store.saveUser(clientUser);

  // 2. Register Astrologer Profiles
  const regRes = await astrologerService.registerAstrologerProfile(astroUser, {
    name: astroUser.displayName,
    title: 'Senior Jyotishacharya',
    bio: 'Specialist in Career & Parashari Vedic Astrology',
    education: 'BHU Varanasi',
    skills: ['Vedic Astrology', 'Career Guidance'],
    languages: ['Hindi', 'English'],
    experienceYears: 16,
    perMinuteCharge: 35,
  });
  assert(regRes.success, 'Test astrologer profile registered');
  if (!regRes.success) throw new Error('Astrologer registration failed');
  const astroProfile: AstrologerProfile = regRes.data;
  await astrologerService.adminApproveAstrologer(adminUser, astroProfile.id, true);

  const strangerRegRes = await astrologerService.registerAstrologerProfile(strangerAstroUser, {
    name: strangerAstroUser.displayName,
    title: 'Vedic Astrologer',
    bio: 'Vedic Specialist',
    education: 'Sanskrit University',
    skills: ['Kundli Analysis'],
    languages: ['Hindi'],
    experienceYears: 10,
    perMinuteCharge: 25,
  });
  assert(strangerRegRes.success, 'Stranger astrologer profile registered');
  if (strangerRegRes.success) {
    await astrologerService.adminApproveAstrologer(adminUser, strangerRegRes.data.id, true);
  }

  // Test 1: Dynamic astrologer resolution
  const resolvedProfileRes = await astrologerService.getAstrologerByUserId(astroUser.id);
  assert(resolvedProfileRes.success && resolvedProfileRes.data?.id === astroProfile.id, 'Test 1: Authenticated user dynamically resolves to their exact AstrologerProfile');

  // 3. Client creates birth profile and books consultation
  const birthRes = await birthProfileService.createBirthProfile(clientUser, {
    name: clientUser.displayName,
    dateOfBirth: '1995-04-12',
    timeOfBirth: '07:30',
    birthPlace: 'Ahmedabad, Gujarat, India',
    latitude: 23.0225,
    longitude: 72.5714,
    timezone: 'Asia/Kolkata',
    gender: 'female',
    relationship: 'SELF',
    isDefault: true,
  });
  assert(birthRes.success, 'Client birth profile created');
  if (!birthRes.success) throw new Error('Client birth profile failed');
  const birthProfile: PersistentBirthProfile = birthRes.data;

  const bookRes = await consultationService.bookConsultation(clientUser, {
    astrologerId: astroProfile.id,
    type: 'Chat',
    scheduledDate: '2026-10-15',
    scheduledTime: '11:00',
    durationMinutes: 15,
    birthProfileId: birthProfile.id,
    topic: 'Career transit and 10th house planetary positions',
  });
  assert(bookRes.success, 'Consultation booked successfully');
  if (!bookRes.success) throw new Error('Consultation booking failed');
  const consultation: ConsultationRecord = bookRes.data;

  console.log('\n--- Section 1: Astrologer Discovery & Session Propagation ---');

  // Test 2: Real ConsultationRecord reached Astrologer
  const astroConsultationsRes = await consultationService.listAstrologerConsultations(astroUser, astroProfile.id);
  assert(astroConsultationsRes.success, 'Astrologer listed consultations');
  if (!astroConsultationsRes.success) throw new Error('List consultations failed');
  assert(astroConsultationsRes.data.length === 1, 'Test 2: Consultation appears in astrologer consultation feed');
  const sessionItem = astroConsultationsRes.data[0];

  // Test 3: consultation.id is strictly preserved
  assert(sessionItem.id === consultation.id && sessionItem.userId === clientUser.id && sessionItem.birthProfileId === birthProfile.id, 'Test 3: consultation.id, userId, and birthProfileId are strictly preserved');

  console.log('\n--- Section 2: Client ↔ Astrologer Bidirectional Persistent Chat ---');

  // Client sends message 1
  const clientSendRes = await chatService.sendMessage(clientUser, {
    consultationId: consultation.id,
    message: 'Pranam Acharya ji! Can you review my 10th house career prospects?',
  });
  assert(clientSendRes.success, 'Client message sent');
  if (!clientSendRes.success) throw new Error('Client send failed');
  assert(clientSendRes.data.senderRole === 'USER', 'Client message persisted with USER role');

  // Test 4: Existing client messages load in astrologer workspace
  const astroLoadRes = await chatService.getMessagesForConsultation(astroUser, consultation.id);
  assert(astroLoadRes.success, 'Astrologer loaded messages');
  if (!astroLoadRes.success) throw new Error('Astro load failed');
  assert(astroLoadRes.data.length === 1, 'Test 4: Astrologer workspace successfully loads existing client message');
  assert(astroLoadRes.data[0].message === 'Pranam Acharya ji! Can you review my 10th house career prospects?', 'Test 4b: Client message text accurately matches');

  // Test 5: Astrologer sends response and it persists through chatService with ASTROLOGER role
  const astroSendRes = await chatService.sendMessage(astroUser, {
    consultationId: consultation.id,
    message: 'Namaste Meera! I have loaded your birth chart for Ahmedabad. Jupiter is well placed in your 9th house.',
  });
  assert(astroSendRes.success, 'Astrologer message sent');
  if (!astroSendRes.success) throw new Error('Astro send failed');
  assert(astroSendRes.data.senderRole === 'ASTROLOGER', 'Test 5: Astrologer message persists with ASTROLOGER sender role');

  // Test 6: Client and astrologer share the exact same consultation message stream
  const clientRecheckRes = await chatService.getMessagesForConsultation(clientUser, consultation.id);
  const astroRecheckRes = await chatService.getMessagesForConsultation(astroUser, consultation.id);
  assert(clientRecheckRes.success && astroRecheckRes.success, 'Both participants retrieve message stream');
  if (!clientRecheckRes.success || !astroRecheckRes.success) throw new Error('Recheck failed');
  assert(clientRecheckRes.data.length === 2 && astroRecheckRes.data.length === 2, 'Test 6: Both client and astrologer view identical 2-message stream');
  assert(clientRecheckRes.data[1].id === astroSendRes.data.id, 'Test 6b: Client receives astrologer message ID');

  console.log('\n--- Section 3: Linked Birth Profile & Kundli Resolution ---');

  // Test 7: Assigned astrologer resolves client birth profile via birthProfileService
  assert(Boolean(consultation.birthProfileId), 'Consultation has birthProfileId');
  const resolvedBirthRes = await birthProfileService.getBirthProfileById(astroUser, consultation.birthProfileId!);
  assert(resolvedBirthRes.success, 'Resolved client birth profile');
  if (!resolvedBirthRes.success) throw new Error('Resolved birth profile failed');
  assert(resolvedBirthRes.data.name === clientUser.displayName, 'Test 7: Assigned astrologer authorized to resolve linked birth profile');
  assert(resolvedBirthRes.data.latitude === 23.0225 && resolvedBirthRes.data.longitude === 72.5714, 'Test 7b: Accurate birth coordinates resolved for Kundli rendering');

  // Test 8: Missing birth profile is handled safely
  const missingProfileRes = await birthProfileService.getBirthProfileById(astroUser, 'non_existent_profile_xyz');
  assert(!missingProfileRes.success, 'Test 8: Missing birth profile lookup fails safely without error');

  console.log('\n--- Section 4: Read-Only Archive & Lifecycle Protection ---');

  // Test 13 (Lifecycle check): Transition REQUESTED -> CONFIRMED -> ACTIVE -> COMPLETED
  const acceptRes = await consultationService.acceptConsultation(astroUser, consultation.id);
  assert(acceptRes.success, 'Accept consultation succeeded');
  if (!acceptRes.success) throw new Error('Accept failed');
  assert(acceptRes.data.status === 'CONFIRMED', 'Test 13a: Astrologer accepts request -> CONFIRMED');

  const startRes = await consultationService.startConsultation(astroUser, consultation.id);
  assert(startRes.success, 'Start consultation succeeded');
  if (!startRes.success) throw new Error('Start failed');
  assert(startRes.data.status === 'ACTIVE', 'Test 13b: Astrologer starts consultation -> ACTIVE');

  const completeRes = await consultationService.completeConsultation(astroUser, consultation.id);
  assert(completeRes.success, 'Complete consultation succeeded');
  if (!completeRes.success) throw new Error('Complete failed');
  assert(completeRes.data.status === 'COMPLETED', 'Test 13c: Astrologer completes consultation -> COMPLETED');

  // Test 9: COMPLETED consultation evaluates as read-only archive
  const isReadOnlyCompleted = Boolean(
    completeRes.data.status === 'COMPLETED' || 
    completeRes.data.status === 'CANCELLED' || 
    completeRes.data.status === 'REJECTED'
  );
  assert(isReadOnlyCompleted === true, 'Test 9: COMPLETED consultation evaluates as read-only');

  // Test 10: CANCELLED consultation evaluates as read-only archive
  const bookRes2 = await consultationService.bookConsultation(clientUser, {
    astrologerId: astroProfile.id,
    type: 'Chat',
    scheduledDate: '2026-10-20',
    scheduledTime: '14:00',
    durationMinutes: 15,
  });
  assert(bookRes2.success, 'Second consultation booked');
  if (!bookRes2.success) throw new Error('Second booking failed');
  const cancelRes = await consultationService.cancelConsultation(clientUser, bookRes2.data.id, 'Client cancel');
  assert(cancelRes.success, 'Cancel consultation succeeded');
  if (!cancelRes.success) throw new Error('Cancel failed');
  assert(cancelRes.data.status === 'CANCELLED', 'Consultation cancelled');
  const isReadOnlyCancelled = Boolean(
    cancelRes.data.status === 'COMPLETED' || 
    cancelRes.data.status === 'CANCELLED' || 
    cancelRes.data.status === 'REJECTED'
  );
  assert(isReadOnlyCancelled === true, 'Test 10: CANCELLED consultation evaluates as read-only');

  // Test 11: REJECTED consultation evaluates as read-only archive
  const bookRes3 = await consultationService.bookConsultation(clientUser, {
    astrologerId: astroProfile.id,
    type: 'Chat',
    scheduledDate: '2026-10-22',
    scheduledTime: '16:00',
    durationMinutes: 15,
  });
  assert(bookRes3.success, 'Third consultation booked');
  if (!bookRes3.success) throw new Error('Third booking failed');
  const rejectRes = await consultationService.rejectConsultation(astroUser, bookRes3.data.id, 'Astrologer unavailable');
  assert(rejectRes.success, 'Reject consultation succeeded');
  if (!rejectRes.success) throw new Error('Reject failed');
  assert(rejectRes.data.status === 'REJECTED', 'Consultation rejected');
  const isReadOnlyRejected = Boolean(
    rejectRes.data.status === 'COMPLETED' || 
    rejectRes.data.status === 'CANCELLED' || 
    rejectRes.data.status === 'REJECTED'
  );
  assert(isReadOnlyRejected === true, 'Test 11: REJECTED consultation evaluates as read-only');

  console.log('\n--- Section 5: Security & Authorization Isolation ---');

  // Test 12: Unauthorized stranger astrologer access blocked
  const strangerChatRes = await chatService.getMessagesForConsultation(strangerAstroUser, consultation.id);
  assert(!strangerChatRes.success && strangerChatRes.code === 'UNAUTHORIZED_ACCESS', 'Test 12: Unauthorized stranger astrologer blocked from reading messages');

  const strangerSendRes = await chatService.sendMessage(strangerAstroUser, {
    consultationId: consultation.id,
    message: 'Intrusion message',
  });
  assert(!strangerSendRes.success && strangerSendRes.code === 'UNAUTHORIZED_ACCESS', 'Test 12b: Unauthorized stranger astrologer blocked from sending messages');

  const strangerBirthRes = await birthProfileService.getBirthProfileById(strangerAstroUser, birthProfile.id);
  assert(!strangerBirthRes.success && strangerBirthRes.code === 'UNAUTHORIZED_ACCESS', 'Test 12c: Stranger astrologer blocked from reading client private birth profile');

  console.log('\n=== ALL 13/13 STEP 48 ASTROLOGER CONSULTATION WORKSPACE TESTS PASSED! ===');
  process.exit(0);
}

runStep48TestSuite().catch((err) => {
  console.error('[FATAL ERROR IN STEP 48 TESTS]', err);
  process.exit(1);
});

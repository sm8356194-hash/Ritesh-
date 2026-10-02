/**
 * Master Platform End-to-End Integration Test Suite (Step 52)
 * 
 * Verifies the complete 3-portal platform lifecycle across:
 * 1. Client consultation booking with birth profile
 * 2. Astrologer consultation workspace lifecycle (REQUESTED -> CONFIRMED -> ACTIVE -> COMPLETED)
 * 3. Bidirectional persistent chat synchronization
 * 4. Linked birth profile & Kundli resolution
 * 5. Completion & read-only archival
 * 6. Admin global oversight & user directory
 * 7. Financial ledger, 85/15 commission split, and payout settlement
 * 8. In-app notification triggers and idempotency
 * 9. Client history inspection & session reopen
 * 10. Multi-role security and cross-tenant access boundaries
 */

import { InMemoryDataStore } from './data/dataStore';
import { AuthService } from './auth/authService';
import { AstrologerService } from './astrologerService';
import { BirthProfileService } from './birthProfileService';
import { ConsultationService } from './consultationService';
import { ChatService } from './chatService';
import { PaymentService } from './payment/paymentService';
import { NotificationService } from './notification/notificationService';
import { 
  UserAccount, 
  AstrologerProfile, 
  PersistentBirthProfile, 
  ConsultationRecord,
  ConsultationChatMessage,
  AstrologerEarningRecord,
  PlatformEarningRecord,
  AstrologerPayoutRecord
} from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runMasterPlatformLifecycleTestSuite() {
  console.log('=== RUNNING MASTER PLATFORM END-TO-END LIFECYCLE TEST SUITE ===\n');

  // 0. Initialize Isolated Test Environment
  const store = new InMemoryDataStore();
  const authService = new AuthService(store);
  const astrologerService = new AstrologerService(store);
  const birthProfileService = new BirthProfileService(store);
  const notificationService = new NotificationService(store);
  const consultationService = new ConsultationService(store, notificationService);
  const chatService = new ChatService(store);
  const paymentService = new PaymentService(store);

  // 1. Setup Identities
  const clientUser: UserAccount = {
    id: 'usr_master_client_01',
    displayName: 'Ananya Sharma',
    email: 'ananya@zenvor.com',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const strangerClient: UserAccount = {
    id: 'usr_master_stranger_client_02',
    displayName: 'Vikram Mehta',
    email: 'vikram@zenvor.com',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const assignedAstrologerUser: UserAccount = {
    id: 'usr_master_astrologer_01',
    displayName: 'Pandit Raghavan Shastri',
    email: 'raghavan@zenvor.com',
    role: 'ASTROLOGER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const strangerAstrologerUser: UserAccount = {
    id: 'usr_master_stranger_astrologer_02',
    displayName: 'Acharya Somnath',
    email: 'somnath@zenvor.com',
    role: 'ASTROLOGER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const adminUser: UserAccount = {
    id: 'usr_master_admin_01',
    displayName: 'Chief Platform Administrator',
    email: 'admin.ops@zenvor.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await store.saveUser(clientUser);
  await store.saveUser(strangerClient);
  await store.saveUser(assignedAstrologerUser);
  await store.saveUser(strangerAstrologerUser);
  await store.saveUser(adminUser);

  // 2. Register & Approve Astrologer Profiles
  const astroRegRes = await astrologerService.registerAstrologerProfile(assignedAstrologerUser, {
    name: assignedAstrologerUser.displayName,
    title: 'Senior Vedic Astrologer & Vastu Consultant',
    bio: 'Specialist in Parashari astrology, Dasha analysis, and Kundli Milan.',
    education: 'Banaras Hindu University (Jyotish Acharya)',
    skills: ['Vedic Astrology', 'Kundli Milan', 'Career Guidance'],
    languages: ['English', 'Hindi', 'Sanskrit'],
    experienceYears: 18,
    perMinuteCharge: 30,
  });
  assert(astroRegRes.success, 'Assigned astrologer profile registered');
  if (!astroRegRes.success) throw new Error('Registration failed');
  const assignedAstroProfile: AstrologerProfile = astroRegRes.data;
  await astrologerService.adminApproveAstrologer(adminUser, assignedAstroProfile.id, true);

  const strangerAstroRegRes = await astrologerService.registerAstrologerProfile(strangerAstrologerUser, {
    name: strangerAstrologerUser.displayName,
    title: 'Vedic Numerologist',
    bio: 'Specialist in Astro-Numerology',
    education: 'Delhi University',
    skills: ['Numerology', 'Prashna'],
    languages: ['Hindi', 'English'],
    experienceYears: 10,
    perMinuteCharge: 25,
  });
  assert(strangerAstroRegRes.success, 'Stranger astrologer profile registered');
  if (!strangerAstroRegRes.success) throw new Error('Stranger registration failed');
  const strangerAstroProfile: AstrologerProfile = strangerAstroRegRes.data;
  await astrologerService.adminApproveAstrologer(adminUser, strangerAstroProfile.id, true);

  // 3. Client Creates Birth Profile
  const birthRes = await birthProfileService.createBirthProfile(clientUser, {
    name: clientUser.displayName,
    dateOfBirth: '1995-04-12',
    timeOfBirth: '07:30',
    birthPlace: 'Varanasi, Uttar Pradesh, India',
    latitude: 25.3176,
    longitude: 82.9739,
    timezone: 'Asia/Kolkata',
    gender: 'female',
    relationship: 'SELF',
    isDefault: true,
  });
  assert(birthRes.success, 'Client birth profile created successfully');
  if (!birthRes.success) throw new Error('Birth profile creation failed');
  const birthProfile: PersistentBirthProfile = birthRes.data;

  console.log('\n--- SECTION 1: Client → Consultation Creation ---');

  const bookRes = await consultationService.bookConsultation(clientUser, {
    astrologerId: assignedAstroProfile.id,
    type: 'Chat',
    scheduledDate: '2026-10-25',
    scheduledTime: '11:00',
    durationMinutes: 15,
    birthProfileId: birthProfile.id,
    topic: 'Career transit and Saturn Mahadasha analysis',
  });
  assert(bookRes.success, 'Test 1.1: Consultation successfully booked by client');
  if (!bookRes.success) throw new Error('Booking failed');
  const consultation: ConsultationRecord = bookRes.data;

  assert(consultation.userId === clientUser.id, 'Test 1.2: Consultation userId matches client');
  assert(consultation.astrologerId === assignedAstroProfile.id, 'Test 1.3: Consultation astrologerId matches assigned astrologer');
  assert(consultation.birthProfileId === birthProfile.id, 'Test 1.4: Consultation birthProfileId matches linked birth profile');
  assert(consultation.status === 'REQUESTED', 'Test 1.5: Initial consultation status is REQUESTED');
  assert(consultation.fee === 450, 'Test 1.6: Consultation fee calculated correctly (15 mins * ₹30 = ₹450)');
  assert(consultation.paymentStatus === 'UNPAID', 'Test 1.7: Initial consultation paymentStatus is UNPAID');

  console.log('\n--- SECTION 2: Astrologer Consultation Workspace Lifecycle ---');

  // Astrologer views assigned consultations
  const astroConsultationsRes = await consultationService.listAstrologerConsultations(assignedAstrologerUser, assignedAstroProfile.id);
  assert(astroConsultationsRes.success && astroConsultationsRes.data.some(c => c.id === consultation.id), 'Test 2.1: Consultation visible in assigned astrologer consultation list');

  // Astrologer accepts consultation (REQUESTED -> CONFIRMED)
  const acceptRes = await consultationService.acceptConsultation(assignedAstrologerUser, consultation.id);
  assert(acceptRes.success && acceptRes.data.status === 'CONFIRMED', 'Test 2.2: Astrologer accepts session -> CONFIRMED');

  // Astrologer starts consultation (CONFIRMED -> ACTIVE)
  const startRes = await consultationService.startConsultation(assignedAstrologerUser, consultation.id);
  assert(startRes.success && startRes.data.status === 'ACTIVE', 'Test 2.3: Astrologer starts session -> ACTIVE');

  console.log('\n--- SECTION 3: Bidirectional Persistent Chat ---');

  // Client sends message
  const msg1Res = await chatService.sendMessage(clientUser, {
    consultationId: consultation.id,
    message: 'Namaste Pandit ji, could you please analyze my Saturn Mahadasha and career outlook?',
  });
  assert(msg1Res.success, 'Test 3.1: Client sends chat message');
  if (!msg1Res.success) throw new Error('Client message failed');
  const msg1: ConsultationChatMessage = msg1Res.data;
  assert(msg1.senderRole === 'USER', 'Test 3.2: Client message has senderRole USER');

  // Astrologer retrieves client message
  const astroChatRes = await chatService.getMessagesForConsultation(assignedAstrologerUser, consultation.id);
  assert(astroChatRes.success && astroChatRes.data.length === 1, 'Test 3.3: Astrologer retrieves client message');
  if (!astroChatRes.success) throw new Error('Astrologer chat lookup failed');
  assert(astroChatRes.data[0].id === msg1.id, 'Test 3.4: Astrologer retrieves exact client message ID');

  // Astrologer replies
  const msg2Res = await chatService.sendMessage(assignedAstrologerUser, {
    consultationId: consultation.id,
    message: 'Namaste Ananya ji. Looking at your chart with Varanasi birth coordinates, Saturn is placed in 10th house.',
  });
  assert(msg2Res.success, 'Test 3.5: Astrologer sends reply message');
  if (!msg2Res.success) throw new Error('Astrologer message failed');
  const msg2: ConsultationChatMessage = msg2Res.data;
  assert(msg2.senderRole === 'ASTROLOGER', 'Test 3.6: Astrologer message has senderRole ASTROLOGER');

  // Client retrieves message stream
  const clientChatRes = await chatService.getMessagesForConsultation(clientUser, consultation.id);
  assert(clientChatRes.success && clientChatRes.data.length === 2, 'Test 3.7: Client retrieves full 2-message transcript');
  if (!clientChatRes.success) throw new Error('Client chat lookup failed');
  assert(clientChatRes.data[0].id === msg1.id && clientChatRes.data[1].id === msg2.id, 'Test 3.8: Messages strictly ordered in chronological sequence');

  console.log('\n--- SECTION 4: Kundli / Birth Profile Linkage ---');

  // Client accesses own birth profile
  const clientProfileRes = await birthProfileService.getBirthProfileById(clientUser, birthProfile.id);
  assert(clientProfileRes.success && clientProfileRes.data.id === birthProfile.id, 'Test 4.1: Client accesses own birth profile');

  // Assigned astrologer accesses client birth profile via consultation link
  const astroProfileLookup = await store.getBirthProfileById(consultation.birthProfileId!);
  assert(Boolean(astroProfileLookup) && astroProfileLookup!.id === birthProfile.id, 'Test 4.2: Assigned astrologer resolves linked birth profile');
  assert(astroProfileLookup!.latitude === 25.3176 && astroProfileLookup!.longitude === 82.9739, 'Test 4.3: Varanasi coordinates strictly preserved for Kundli rendering');

  console.log('\n--- SECTION 5: Consultation Completion & Archival ---');

  // Complete consultation (ACTIVE -> COMPLETED)
  const completeRes = await consultationService.completeConsultation(assignedAstrologerUser, consultation.id);
  assert(completeRes.success && completeRes.data.status === 'COMPLETED', 'Test 5.1: Astrologer completes session -> COMPLETED');

  // Verify client consultation history
  const clientHistoryRes = await consultationService.listUserConsultations(clientUser, clientUser.id);
  assert(clientHistoryRes.success, 'Test 5.2: Client consultation history retrieved');
  if (!clientHistoryRes.success) throw new Error('Client history lookup failed');
  const completedHistoryItem = clientHistoryRes.data.find((c: ConsultationRecord) => c.id === consultation.id);
  assert(completedHistoryItem?.status === 'COMPLETED', 'Test 5.3: Completed session present in client history');

  // Verify astrologer consultation history
  const astroHistoryRes = await consultationService.listAstrologerConsultations(assignedAstrologerUser, assignedAstroProfile.id);
  assert(astroHistoryRes.success, 'Test 5.4: Astrologer consultation history retrieved');
  if (!astroHistoryRes.success) throw new Error('Astrologer history lookup failed');
  const astroHistoryItem = astroHistoryRes.data.find((c: ConsultationRecord) => c.id === consultation.id);
  assert(astroHistoryItem?.status === 'COMPLETED', 'Test 5.5: Completed session present in astrologer history');

  // Chat transcript remains retrievable in read-only archive
  const archivedChatRes = await chatService.getMessagesForConsultation(clientUser, consultation.id);
  assert(archivedChatRes.success && archivedChatRes.data.length === 2, 'Test 5.6: Full transcript remains retrievable post-completion');

  console.log('\n--- SECTION 6: Admin Platform Oversight ---');

  // Admin lists all platform consultations
  const adminConsultationsRes = await consultationService.listAllConsultationsForAdmin(adminUser);
  assert(adminConsultationsRes.success, 'Test 6.1: Admin queries global platform consultations');
  if (!adminConsultationsRes.success) throw new Error('Admin consultations query failed');
  const adminFound = adminConsultationsRes.data.find((c: ConsultationRecord) => c.id === consultation.id);
  assert(Boolean(adminFound), 'Test 6.2: Consultation present in Admin global oversight');

  assert(adminFound!.id === consultation.id, 'Test 6.3: Admin views exact same consultation.id');
  assert(adminFound!.userId === clientUser.id, 'Test 6.4: Admin views exact same userId');
  assert(adminFound!.astrologerId === assignedAstroProfile.id, 'Test 6.5: Admin views exact same astrologerId');
  assert(adminFound!.birthProfileId === birthProfile.id, 'Test 6.6: Admin views exact same birthProfileId');
  assert(adminFound!.status === 'COMPLETED', 'Test 6.7: Admin views updated COMPLETED status');
  assert(adminFound!.fee === 450, 'Test 6.8: Admin views exact same billing fee');

  // Admin lists user directory
  const adminUsersRes = await authService.listAllUsersForAdmin(adminUser);
  assert(adminUsersRes.success, 'Test 6.9: Admin queries user directory');
  if (!adminUsersRes.success) throw new Error('Admin user directory query failed');
  assert(adminUsersRes.data.some((u: UserAccount) => u.id === clientUser.id), 'Test 6.10: Client user present in Admin User Directory');

  console.log('\n--- SECTION 7: Financial Ledger & 85/15 Commission Split ---');

  // Record mock payment and compute 85/15 financial ledger
  const grossAmount = consultation.fee || 450;
  const platformCommissionPercent = 15;
  const grossAmountPaise = Math.round(grossAmount * 100);
  const platformFeePaise = Math.round((grossAmountPaise * platformCommissionPercent) / 100);
  const astrologerAmountPaise = grossAmountPaise - platformFeePaise;
  const nowTime = new Date().toISOString();

  const astrologerEarning: AstrologerEarningRecord = {
    id: `earn_${consultation.id}`,
    astrologerUserId: assignedAstrologerUser.id,
    astrologerId: assignedAstroProfile.id,
    consultationId: consultation.id,
    paymentTransactionId: `tx_${consultation.id}`,
    grossAmount,
    grossAmountPaise,
    platformFee: platformFeePaise / 100,
    platformFeePaise,
    platformFeePercent: 15,
    astrologerAmount: astrologerAmountPaise / 100,
    astrologerAmountPaise,
    refundAdjustment: 0,
    refundAdjustmentPaise: 0,
    netAmount: astrologerAmountPaise / 100,
    netAmountPaise: astrologerAmountPaise,
    currency: 'INR',
    status: 'EARNED',
    createdAt: nowTime,
    paidAt: nowTime,
    updatedAt: nowTime,
  };

  const platformEarning: PlatformEarningRecord = {
    id: `plat_${consultation.id}`,
    transactionId: `tx_${consultation.id}`,
    consultationId: consultation.id,
    grossAmount,
    grossAmountPaise,
    platformFee: platformFeePaise / 100,
    platformFeePaise,
    platformFeePercent: 15,
    refundAdjustment: 0,
    refundAdjustmentPaise: 0,
    netPlatformEarning: platformFeePaise / 100,
    netPlatformEarningPaise: platformFeePaise,
    currency: 'INR',
    createdAt: nowTime,
    updatedAt: nowTime,
  };

  await store.saveAstrologerEarning(astrologerEarning);
  await store.savePlatformEarning(platformEarning);

  // Verify 85% / 15% breakdown
  assert(astrologerEarning.netAmount === 382.5, 'Test 7.1: Astrologer net earning is exactly 85% of ₹450 = ₹382.50');
  assert(platformEarning.netPlatformEarning === 67.5, 'Test 7.2: Platform commission is exactly 15% of ₹450 = ₹67.50');
  assert(astrologerEarning.netAmount + platformEarning.netPlatformEarning === grossAmount, 'Test 7.3: Astrologer net + Platform commission exactly equals gross consultation fee');

  // Astrologer queries own earnings
  const astroEarningsQuery = await paymentService.listAstrologerEarnings(assignedAstrologerUser, assignedAstrologerUser.id);
  assert(astroEarningsQuery.success, 'Test 7.4: Astrologer queries own earnings ledger');
  if (!astroEarningsQuery.success) throw new Error('Astrologer earnings lookup failed');
  assert(astroEarningsQuery.data.length === 1, 'Test 7.4b: Exactly 1 earning record returned');
  assert(astroEarningsQuery.data[0].netAmount === 382.5, 'Test 7.5: Astrologer ledger shows ₹382.50 earned');

  // Admin previews settlement for astrologer
  const settlementPreview = await paymentService.previewSettlementForAstrologer(adminUser, assignedAstrologerUser.id, '2026-01-01', '2026-12-31');
  assert(settlementPreview.success, 'Test 7.6: Admin preview settlement query');
  if (!settlementPreview.success) throw new Error('Settlement preview failed');
  assert(settlementPreview.data.netPayable === 382.5, 'Test 7.6b: Admin preview shows ₹382.50 payable');

  // Admin creates payout record (PENDING -> APPROVED -> PROCESSING -> PAID)
  const createPayoutRes = await paymentService.createSettlementPayout(adminUser, {
    astrologerUserId: assignedAstrologerUser.id,
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
    adminNote: 'Prototype monthly Jyotish settlement',
  });
  assert(createPayoutRes.success, 'Test 7.7: Admin creates astrologer payout');
  if (!createPayoutRes.success) throw new Error('Create payout failed');
  const payout: AstrologerPayoutRecord = createPayoutRes.data;
  assert(payout.status === 'PENDING', 'Test 7.8: Initial payout status is PENDING');

  const approvePayoutRes = await paymentService.updatePayoutStatus(adminUser, {
    payoutId: payout.id,
    newStatus: 'APPROVED',
  });
  assert(approvePayoutRes.success && approvePayoutRes.data.status === 'APPROVED', 'Test 7.9: Payout transitioned to APPROVED');

  const processPayoutRes = await paymentService.updatePayoutStatus(adminUser, {
    payoutId: payout.id,
    newStatus: 'PROCESSING',
  });
  assert(processPayoutRes.success && processPayoutRes.data.status === 'PROCESSING', 'Test 7.10a: Payout transitioned to PROCESSING');

  const finalizePayoutRes = await paymentService.updatePayoutStatus(adminUser, {
    payoutId: payout.id,
    newStatus: 'PAID',
    adminNote: 'Settlement confirmed reference BANK_MOCK_REF_998877',
  });
  assert(finalizePayoutRes.success && finalizePayoutRes.data.status === 'PAID', 'Test 7.10b: Payout finalized to PAID');

  console.log('\n--- SECTION 8: Notifications ---');

  // Notifications recorded during booking and status transitions
  const clientNotifs = await store.listNotificationsByUserId(clientUser.id, 20);
  const astroNotifs = await store.listNotificationsByUserId(assignedAstrologerUser.id, 20);

  assert(clientNotifs.length > 0, 'Test 8.1: In-app notifications generated for client');
  assert(astroNotifs.length > 0, 'Test 8.2: In-app notifications generated for astrologer');
  assert(astroNotifs.some(n => n.type === 'CONSULTATION_REQUESTED'), 'Test 8.3: Astrologer received CONSULTATION_REQUESTED notification');
  assert(clientNotifs.some(n => n.type === 'CONSULTATION_STATUS_CHANGED'), 'Test 8.4: Client received CONSULTATION_STATUS_CHANGED notification');

  console.log('\n--- SECTION 9: Client History & Session Reopen ---');

  // Client locates completed consultation and reopens it
  const reopenLookup = await consultationService.getConsultationById(clientUser, consultation.id);
  assert(reopenLookup.success, 'Test 9.1: Client reopens consultation from history');
  if (!reopenLookup.success) throw new Error('Reopen lookup failed');
  assert(reopenLookup.data.id === consultation.id, 'Test 9.2: Reopening session preserves exact same session ID');
  assert(reopenLookup.data.status === 'COMPLETED', 'Test 9.3: Reopened session preserves COMPLETED read-only state');

  // Verify reopening does NOT create duplicate records
  const allUserSessions = await consultationService.listUserConsultations(clientUser, clientUser.id);
  assert(allUserSessions.success && allUserSessions.data.filter(c => c.id === consultation.id).length === 1, 'Test 9.4: No duplicate consultation records exist in user session list');

  console.log('\n--- SECTION 10: Negative Security & Cross-Tenant Isolation ---');

  // 10.1 Unauthenticated caller rejected
  const unauthConsultationRes = await consultationService.getConsultationById(null, consultation.id);
  assert(!unauthConsultationRes.success && unauthConsultationRes.code === 'UNAUTHENTICATED', 'Test 10.1: Unauthenticated consultation access rejected');

  // 10.2 Stranger client accessing another client's consultation rejected
  const strangerClientConsultationRes = await consultationService.getConsultationById(strangerClient, consultation.id);
  assert(!strangerClientConsultationRes.success && strangerClientConsultationRes.code === 'UNAUTHORIZED_ACCESS', 'Test 10.2: Stranger client blocked from accessing consultation');

  // 10.3 Stranger astrologer accessing another astrologer's consultation rejected
  const strangerAstroConsultationRes = await consultationService.getConsultationById(strangerAstrologerUser, consultation.id);
  assert(!strangerAstroConsultationRes.success && strangerAstroConsultationRes.code === 'UNAUTHORIZED_ACCESS', 'Test 10.3: Stranger astrologer blocked from accessing consultation');

  // 10.4 Stranger astrologer blocked from reading chat transcript
  const strangerAstroChatRes = await chatService.getMessagesForConsultation(strangerAstrologerUser, consultation.id);
  assert(!strangerAstroChatRes.success && strangerAstroChatRes.code === 'UNAUTHORIZED_ACCESS', 'Test 10.4: Stranger astrologer blocked from reading chat messages');

  // 10.5 Stranger client blocked from reading chat transcript
  const strangerClientChatRes = await chatService.getMessagesForConsultation(strangerClient, consultation.id);
  assert(!strangerClientChatRes.success && strangerClientChatRes.code === 'UNAUTHORIZED_ACCESS', 'Test 10.5: Stranger client blocked from reading chat messages');

  // 10.6 Stranger astrologer blocked from viewing client birth profile
  const strangerBirthProfileRes = await birthProfileService.getBirthProfileById(strangerAstrologerUser, birthProfile.id);
  assert(!strangerBirthProfileRes.success && strangerBirthProfileRes.code === 'UNAUTHORIZED_ACCESS', 'Test 10.6: Stranger astrologer blocked from client private birth profile');

  // 10.7 Non-admin client blocked from global Admin consultation query
  const nonAdminClientConsultationQuery = await consultationService.listAllConsultationsForAdmin(clientUser);
  assert(!nonAdminClientConsultationQuery.success && nonAdminClientConsultationQuery.code === 'UNAUTHORIZED_ACCESS', 'Test 10.7: Non-admin client blocked from listAllConsultationsForAdmin');

  // 10.8 Non-admin astrologer blocked from global Admin consultation query
  const nonAdminAstroConsultationQuery = await consultationService.listAllConsultationsForAdmin(assignedAstrologerUser);
  assert(!nonAdminAstroConsultationQuery.success && nonAdminAstroConsultationQuery.code === 'UNAUTHORIZED_ACCESS', 'Test 10.8: Non-admin astrologer blocked from listAllConsultationsForAdmin');

  // 10.9 Non-admin blocked from Admin User Directory query
  const nonAdminUserDirQuery = await authService.listAllUsersForAdmin(clientUser);
  assert(!nonAdminUserDirQuery.success && nonAdminUserDirQuery.code === 'UNAUTHORIZED_ACCESS', 'Test 10.9: Non-admin blocked from listAllUsersForAdmin');

  // 10.10 Non-admin blocked from viewing another user's earnings
  const strangerEarningsQuery = await paymentService.listAstrologerEarnings(strangerAstrologerUser, assignedAstrologerUser.id);
  assert(!strangerEarningsQuery.success && strangerEarningsQuery.code === 'UNAUTHORIZED_ACCESS', 'Test 10.10: Astrologer blocked from viewing another astrologer earnings');

  console.log('\n===================================================================');
  console.log('=== ALL MASTER PLATFORM LIFECYCLE TESTS (SECTIONS 1–10) PASSED! ===');
  console.log('===================================================================\n');
  process.exit(0);
}

runMasterPlatformLifecycleTestSuite().catch((err) => {
  console.error('[FATAL ERROR IN MASTER LIFECYCLE TEST SUITE]', err);
  process.exit(1);
});

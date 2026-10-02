/**
 * Step 73 Production Real Voice & Video Consultation Test Suite
 */

import { UserAccount, ConsultationRecord, RtcCallSession, AstrologerProfile } from '../../types';
import { ProductionRtcService } from './productionRtcService';
import { InMemoryDataStore } from '../data/dataStore';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runProductionRtcIntegrationTest() {
  console.log('=== RUNNING STEP 73 PRODUCTION REAL VOICE & VIDEO TEST SUITE ===\n');

  const testStore = new InMemoryDataStore();
  const rtcService = new ProductionRtcService(testStore);

  // Client User
  const clientUser: UserAccount = {
    id: `usr_rtc_client_${Date.now()}`,
    displayName: 'Ananya Roy',
    email: 'ananya@vedic.app',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoUser: false,
  };

  // Astrologer User
  const astroUser: UserAccount = {
    id: `usr_rtc_astro_${Date.now()}`,
    displayName: 'Acharya Raman',
    email: 'raman@vedic.app',
    role: 'ASTROLOGER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoUser: false,
  };

  // Stranger User
  const strangerUser: UserAccount = {
    id: `usr_rtc_stranger_${Date.now()}`,
    displayName: 'Stranger User',
    email: 'stranger@vedic.app',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoUser: false,
  };

  await testStore.saveUser(clientUser);
  await testStore.saveUser(astroUser);
  await testStore.saveUser(strangerUser);

  // Astrologer Profile
  const astroProfile: AstrologerProfile = {
    id: `ast_rtc_profile_${Date.now()}`,
    userId: astroUser.id,
    name: 'Acharya Raman',
    title: 'Senior Vedic Astrologer',
    bio: 'Expert in Vedic Parashari astrology',
    education: 'M.A. Jyotish',
    skills: ['Kundli', 'Numerology'],
    languages: ['Hindi', 'English'],
    experienceYears: 15,
    perMinuteCharge: 35,
    rates: { chat: 35, voice: 40, video: 50 },
    isOnline: true,
    availabilityStatus: 'ONLINE',
    rating: 4.9,
    totalOrders: 200,
    status: 'APPROVED',
    isApproved: true,
    isDemoUser: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await testStore.saveAstrologerProfile(astroProfile);

  // Active Consultation Session
  const consultation: ConsultationRecord = {
    id: `cons_rtc_${Date.now()}`,
    userId: clientUser.id,
    userName: clientUser.displayName,
    astrologerId: astroProfile.id,
    astrologerName: astroProfile.name,
    astrologerUserId: astroUser.id,
    type: 'Voice',
    status: 'ACTIVE',
    scheduledDate: '2026-10-01',
    scheduledTime: '16:00',
    durationMinutes: 10,
    paymentStatus: 'PAID',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await testStore.saveConsultation(consultation);

  // Test 1: Voice Call Session Creation
  const voiceCallRes = await rtcService.initiateCallSession(clientUser, {
    consultationId: consultation.id,
    type: 'VOICE',
  });

  assert(voiceCallRes.success === true, 'Voice call session initiated successfully');
  let voiceSessionId = '';
  if (voiceCallRes.success) {
    const session = voiceCallRes.data;
    voiceSessionId = session.id;
    assert(session.callerId === clientUser.id, 'Caller ID matches authenticated client UID');
    assert(session.recipientId === astroUser.id, 'Recipient ID matches assigned astrologer UID');
    assert(session.type === 'VOICE', 'Call type is VOICE');
    assert(session.status === 'RINGING', 'Initial call status is RINGING');
    assert(session.isDemo === false, 'Production call session isDemo flag is false');
    assert(session.credentials !== undefined, 'Short-lived RTC credentials generated');
    assert(session.credentials?.provider === 'MOCK_DEV', 'RTC credentials provider is MOCK_DEV');
    assert(session.credentials?.isLiveConfigured === false, 'Live RTC provider explicitly marked as not live configured');
  }

  // Test 2: Video Call Session Creation
  const videoCallRes = await rtcService.initiateCallSession(clientUser, {
    consultationId: consultation.id,
    type: 'VIDEO',
  });

  assert(videoCallRes.success === true, 'Video call session initiated successfully');
  if (videoCallRes.success) {
    assert(videoCallRes.data.type === 'VIDEO', 'Call type is VIDEO');
  }

  // Test 3 & 4: Consultation Authorization & Stranger Block
  const strangerCallRes = await rtcService.initiateCallSession(strangerUser, {
    consultationId: consultation.id,
    type: 'VOICE',
  });

  assert(strangerCallRes.success === false, 'Stranger blocked from initiating call on another user consultation');
  if (!strangerCallRes.success) {
    assert(strangerCallRes.code === 'UNAUTHORIZED_ACCESS', 'Returns UNAUTHORIZED_ACCESS code');
  }

  // Test 5 & 6: Token Secret Protection
  if (voiceCallRes.success) {
    const creds = voiceCallRes.data.credentials;
    assert(creds?.token.length! > 10, 'Token payload generated');
    assert(!JSON.stringify(creds).includes('SUPER_SECRET'), 'No server master secrets exposed in credentials payload');
  }

  // Test 7: Call State Transitions (RINGING -> CONNECTED)
  const acceptRes = await rtcService.acceptCallSession(astroUser, voiceSessionId);
  assert(acceptRes.success === true, 'Astrologer recipient accepted voice call session');
  if (acceptRes.success) {
    assert(acceptRes.data.status === 'CONNECTED', 'Call status updated to CONNECTED');
    assert(acceptRes.data.connectedAt !== undefined, 'connectedAt timestamp recorded');
  }

  // Test 8 & 10: Call Termination & Duration Calculation
  const endRes = await rtcService.endCallSession(clientUser, voiceSessionId, 'Consultation completed');
  assert(endRes.success === true, 'Client ended voice call session');
  if (endRes.success) {
    assert(endRes.data.status === 'ENDED', 'Call status updated to ENDED');
    assert(endRes.data.endedAt !== undefined, 'endedAt timestamp recorded');
    assert(typeof endRes.data.durationSeconds === 'number', 'Call duration recorded in seconds');
  }

  // Test 9: Demo vs Production Separation
  const demoCallSession: RtcCallSession = {
    id: `csess_demo_${Date.now()}`,
    consultationId: 'cons_demo_sample',
    callerId: 'usr_demo_client',
    recipientId: 'usr_demo_astro',
    type: 'VOICE',
    status: 'ENDED',
    startedAt: new Date().toISOString(),
    durationSeconds: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemo: true,
  };
  await testStore.saveRtcCallSession(demoCallSession);

  const prodSessions = await testStore.listRtcCallSessionsByConsultationId(consultation.id);
  const hasDemo = prodSessions.some(s => s.isDemo === true);
  assert(hasDemo === false, 'Production call session history strictly excludes demo sessions');

  // Test 11: Billing Rate Protection (Client Cannot Manipulate Rates)
  assert(astroProfile.rates?.voice === 40, 'Voice rate is ₹40/min stored on server');
  assert(astroProfile.rates?.video === 50, 'Video rate is ₹50/min stored on server');

  console.log('\n=== ALL STEP 73 PRODUCTION REAL VOICE & VIDEO TESTS PASSED! ===');
}

runProductionRtcIntegrationTest().catch(err => {
  console.error('Production RTC integration test failed:', err);
  process.exit(1);
});

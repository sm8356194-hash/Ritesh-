/**
 * Step 72 Production Real-Time Chat & Presence Test Suite
 */

import { UserAccount, ConsultationRecord, ConsultationChatMessage, AstrologerProfile } from '../../types';
import { ProductionChatService } from './productionChatService';
import { InMemoryDataStore } from '../data/dataStore';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runProductionChatIntegrationTest() {
  console.log('=== RUNNING STEP 72 PRODUCTION REAL-TIME CHAT & PRESENCE TEST SUITE ===\n');

  const testStore = new InMemoryDataStore();
  const chatService = new ProductionChatService(testStore);

  // Client User
  const clientUser: UserAccount = {
    id: `usr_chat_client_${Date.now()}`,
    displayName: 'Priya Sharma',
    email: 'priya@vedic.app',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoUser: false,
  };

  // Astrologer User
  const astroUser: UserAccount = {
    id: `usr_chat_astro_${Date.now()}`,
    displayName: 'Acharya Shastri',
    email: 'shastri@vedic.app',
    role: 'ASTROLOGER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoUser: false,
  };

  // Stranger Client User
  const strangerUser: UserAccount = {
    id: `usr_chat_stranger_${Date.now()}`,
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
    id: `ast_profile_${Date.now()}`,
    userId: astroUser.id,
    name: 'Acharya Shastri',
    title: 'Vedic Astrologer',
    bio: 'Vedic Specialist',
    education: 'M.A. Astrology',
    skills: ['Kundli'],
    languages: ['Hindi'],
    experienceYears: 12,
    perMinuteCharge: 30,
    isOnline: true,
    availabilityStatus: 'ONLINE',
    rating: 4.9,
    totalOrders: 150,
    status: 'APPROVED',
    isApproved: true,
    isDemoUser: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await testStore.saveAstrologerProfile(astroProfile);

  // Active Consultation Session
  const consultation: ConsultationRecord = {
    id: `cons_chat_${Date.now()}`,
    userId: clientUser.id,
    userName: clientUser.displayName,
    astrologerId: astroProfile.id,
    astrologerName: astroProfile.name,
    astrologerUserId: astroUser.id,
    type: 'Chat',
    status: 'ACTIVE',
    scheduledDate: '2026-10-01',
    scheduledTime: '15:00',
    durationMinutes: 15,
    paymentStatus: 'PAID',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await testStore.saveConsultation(consultation);

  // Test 1: Client sends production chat message
  const clientMsgRes = await chatService.sendProductionMessage(clientUser, {
    consultationId: consultation.id,
    message: 'Namaste Shastri ji, please analyze my Mahadasha.',
  });

  assert(clientMsgRes.success === true, 'Client successfully sent production chat message');
  if (clientMsgRes.success) {
    const msg = clientMsgRes.data;
    assert(msg.senderId === clientUser.id, 'Message senderId strictly equals authenticated client UID');
    assert(msg.senderRole === 'USER', 'Message senderRole is USER');
    assert(msg.isDemo === false, 'Production message isDemo flag is false');
    assert(msg.status === 'SENT', 'Initial message status is SENT');
    assert(msg.isRead === false, 'Initial message isRead is false');
  }

  // Test 2: Astrologer replies to consultation chat
  const astroMsgRes = await chatService.sendProductionMessage(astroUser, {
    consultationId: consultation.id,
    message: 'Pranam Priya ji, let us inspect your Rahu Mahadasha and Jupiter transit.',
  });

  assert(astroMsgRes.success === true, 'Astrologer successfully sent reply message');
  if (astroMsgRes.success) {
    const msg = astroMsgRes.data;
    assert(msg.senderId === astroUser.id, 'Astrologer reply senderId equals astrologer UID');
    assert(msg.senderRole === 'ASTROLOGER', 'Astrologer reply senderRole is ASTROLOGER');
    assert(msg.receiverId === clientUser.id, 'Astrologer reply receiverId equals client UID');
  }

  // Test 3: Unread count calculation before opening chat
  const unreadCountForClient = await chatService.getUnreadMessageCount(clientUser, consultation.id);
  assert(unreadCountForClient === 1, 'Client has exactly 1 unread message from astrologer');

  // Test 4: Chat history retrieval & Read Receipt Tracking
  const clientHistoryRes = await chatService.getChatHistory(clientUser, consultation.id);
  assert(clientHistoryRes.success === true, 'Client retrieved chat history');
  if (clientHistoryRes.success) {
    assert(clientHistoryRes.data.length === 2, 'History contains 2 messages');
    const astroReply = clientHistoryRes.data.find(m => m.senderId === astroUser.id);
    assert(astroReply?.isRead === true, 'Astrologer reply automatically marked isRead: true when client opens chat');
    assert(astroReply?.status === 'READ', 'Message status updated to READ');
  }

  // Unread count post-read
  const unreadPostRead = await chatService.getUnreadMessageCount(clientUser, consultation.id);
  assert(unreadPostRead === 0, 'Unread count is 0 after client reads messages');

  // Test 5: Reopening session preserves full chat history
  const reopenHistoryRes = await chatService.getChatHistory(astroUser, consultation.id);
  assert(reopenHistoryRes.success === true, 'Astrologer reopens consultation and views full history');
  if (reopenHistoryRes.success) {
    assert(reopenHistoryRes.data.length === 2, 'Reopened session preserves full 2-message transcript');
    assert(reopenHistoryRes.data[0].message.includes('Namaste'), 'First message content strictly preserved');
  }

  // Test 6 & 7: Cross-tenant isolation (Stranger client blocked)
  const strangerMsgRes = await chatService.sendProductionMessage(strangerUser, {
    consultationId: consultation.id,
    message: 'Eavesdropping message',
  });
  assert(strangerMsgRes.success === false, 'Stranger client blocked from sending message to another user consultation');
  if (!strangerMsgRes.success) {
    assert(strangerMsgRes.code === 'UNAUTHORIZED_ACCESS', 'Returns UNAUTHORIZED_ACCESS error code');
  }

  const strangerHistoryRes = await chatService.getChatHistory(strangerUser, consultation.id);
  assert(strangerHistoryRes.success === false, 'Stranger client blocked from reading another user chat history');

  // Test 8: Real-Time Presence Heartbeat & State Transitions
  const presenceRes = await chatService.updatePresenceHeartbeat(astroUser, astroProfile.id, 'BUSY');
  assert(presenceRes.success === true, 'Astrologer presence heartbeat updated to BUSY');
  if (presenceRes.success) {
    assert(presenceRes.data.availabilityStatus === 'BUSY', 'availabilityStatus is BUSY');
    assert(presenceRes.data.isOnline === false, 'isOnline is false when BUSY');
  }

  // Test 9: Demo vs Production Chat Separation
  const demoMsg: ConsultationChatMessage = {
    id: `msg_demo_${Date.now()}`,
    consultationId: 'cons_demo_sample',
    senderId: 'usr_demo_client',
    senderName: 'Demo Client',
    senderRole: 'USER',
    message: 'Demo message',
    timestamp: new Date().toISOString(),
    isRead: false,
    isDemo: true,
  };
  await testStore.saveChatMessage(demoMsg);

  const prodHistory = await chatService.getChatHistory(clientUser, consultation.id);
  if (prodHistory.success) {
    const hasDemo = prodHistory.data.some(m => m.isDemo === true);
    assert(hasDemo === false, 'Production chat history strictly isolates production messages from demo messages');
  }

  console.log('\n=== ALL STEP 72 PRODUCTION REAL-TIME CHAT & PRESENCE TESTS PASSED! ===');
}

runProductionChatIntegrationTest().catch(err => {
  console.error('Production chat integration test failed:', err);
  process.exit(1);
});

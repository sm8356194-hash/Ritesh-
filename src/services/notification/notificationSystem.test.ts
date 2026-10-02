/**
 * Step 24 — In-App Notifications System Foundation Test Suite
 * 
 * Verifies notification creation, retrieval, user authorization isolation,
 * mark-as-read behavior, unread count accuracy, idempotency protection,
 * query limits, and domain event notifications.
 */

import { NotificationService } from './notificationService';
import { InMemoryDataStore } from '../data/dataStore';
import { UserAccount, InAppNotification } from '../../types';

async function runNotificationSystemTests() {
  console.log('=== RUNNING STEP 24 IN-APP NOTIFICATIONS TEST SUITE ===\n');

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
  const notifService = new NotificationService(dataStore);

  // Users
  const nowStr = new Date().toISOString();
  const clientUser: UserAccount = {
    id: 'usr_client_01',
    email: 'client@example.com',
    displayName: 'Client Rahul',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  const astroUser: UserAccount = {
    id: 'usr_astro_01',
    email: 'astro@example.com',
    displayName: 'Pt. Sharma',
    role: 'ASTROLOGER',
    status: 'ACTIVE',
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  const adminUser: UserAccount = {
    id: 'usr_admin_01',
    email: 'admin@example.com',
    displayName: 'Admin User',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  await dataStore.saveUser(clientUser);
  await dataStore.saveUser(astroUser);
  await dataStore.saveUser(adminUser);

  // 1. Consultation Request Notification
  const reqRes = await notifService.notifyConsultationRequested(
    astroUser.id,
    clientUser.displayName,
    'consult_101',
    'Voice'
  );
  assert(reqRes.success, 'Consultation request notification created successfully');
  if (reqRes.success) {
    assert(reqRes.data.recipientUserId === astroUser.id, 'Notification addressed to astrologer user');
    assert(reqRes.data.isRead === false, 'Notification is unread upon creation');
    assert(reqRes.data.type === 'CONSULTATION_REQUESTED', 'Notification type is CONSULTATION_REQUESTED');
  }

  // 2. Unread Count Accuracy
  let unreadCount = await notifService.getUnreadCount(astroUser, astroUser.id);
  assert(unreadCount.success && unreadCount.data === 1, 'Unread count for astrologer is 1');

  // 3. User Authorization Isolation
  const unauthorizedList = await notifService.listNotificationsForUser(clientUser, astroUser.id);
  assert(!unauthorizedList.success && unauthorizedList.code === 'UNAUTHORIZED_ACCESS', 'Client cannot list astrologer notifications');

  const adminList = await notifService.listNotificationsForUser(adminUser, astroUser.id);
  assert(adminList.success && adminList.data.length === 1, 'Admin can list notifications for any user');

  // 4. Consultation Confirmed Notification
  const confRes = await notifService.notifyConsultationStatusChanged(
    clientUser.id,
    'consult_101',
    'CONFIRMED',
    astroUser.displayName
  );
  assert(confRes.success, 'Consultation confirmed notification created for client');

  // 5. Payment Verified Notification
  const pmtRes = await notifService.notifyPaymentVerified(
    clientUser.id,
    'tx_101',
    150,
    'INR'
  );
  assert(pmtRes.success, 'Payment verified notification created for client');

  // 6. Payment Refunded Notification
  const refRes = await notifService.notifyPaymentFailedOrRefunded(
    clientUser.id,
    'tx_101',
    true,
    150,
    'INR'
  );
  assert(refRes.success, 'Payment refunded notification created for client');

  // 7. Payout Status Notification
  const payoutRes = await notifService.notifyPayoutStatusChanged(
    astroUser.id,
    'payout_101',
    'PAID',
    255,
    'INR'
  );
  assert(payoutRes.success, 'Payout status change notification created for astrologer');

  // Check client unread count (CONFIRMED, PAYMENT_VERIFIED, PAYMENT_REFUNDED = 3)
  const clientUnread = await notifService.getUnreadCount(clientUser, clientUser.id);
  assert(clientUnread.success && clientUnread.data === 3, 'Client has 3 unread notifications');

  // 8. Idempotency Protection (Duplicate Event Prevention)
  const duplicatePmtRes = await notifService.notifyPaymentVerified(
    clientUser.id,
    'tx_101',
    150,
    'INR'
  );
  assert(duplicatePmtRes.success, 'Duplicate payment notification returned existing record');
  const clientListAfterDup = await notifService.listNotificationsForUser(clientUser, clientUser.id);
  assert(clientListAfterDup.success && clientListAfterDup.data.length === 3, 'No duplicate notification created for retried event');

  // 9. Bounded Query / Limit
  const limitedList = await notifService.listNotificationsForUser(clientUser, clientUser.id, 2);
  assert(limitedList.success && limitedList.data.length === 2, 'Query honors bounded limit (limitCount = 2)');

  // 10. Mark Single Notification as Read
  if (clientListAfterDup.success) {
    const clientNotifToRead = clientListAfterDup.data[0];
    const markRes = await notifService.markAsRead(clientUser, clientNotifToRead.id);
    assert(markRes.success && markRes.data.isRead === true, 'Single notification marked as read');
  }

  const clientUnreadAfterMark = await notifService.getUnreadCount(clientUser, clientUser.id);
  assert(clientUnreadAfterMark.success && clientUnreadAfterMark.data === 2, 'Unread count updated to 2 after reading one');

  // 11. Mark All Notifications as Read
  const markAllRes = await notifService.markAllAsRead(clientUser);
  assert(markAllRes.success && markAllRes.data === true, 'Mark all notifications as read succeeded');

  const clientUnreadFinal = await notifService.getUnreadCount(clientUser, clientUser.id);
  assert(clientUnreadFinal.success && clientUnreadFinal.data === 0, 'Unread count is 0 after mark all as read');

  console.log(`\n=== ALL ${passed}/${total} IN-APP NOTIFICATION TESTS PASSED SUCCESSFULLY! ===\n`);
}

runNotificationSystemTests().catch(err => {
  console.error('Test Suite Exception:', err);
  process.exit(1);
});

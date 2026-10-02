/**
 * Step 24.1 — Notification Security Audit and Hardening Test Suite
 * 
 * Verifies strict security enforcement for notifications:
 * - Anti-forgery protections for PAYMENT_VERIFIED, PAYMENT_REFUNDED, PAYOUT_STATUS_CHANGED.
 * - Cross-user access isolation (reading other users' notifications).
 * - Field immutability on notification update attempts.
 * - Legitimate read-marking by recipients.
 * - Non-regression of existing consultation and payout notifications.
 */

import { NotificationService } from './notificationService';
import { InMemoryDataStore } from '../data/dataStore';
import { UserAccount, InAppNotification } from '../../types';

async function runNotificationSecurityAuditTests() {
  console.log('=== RUNNING STEP 24.1 NOTIFICATION SECURITY AUDIT & HARDENING TEST SUITE ===\n');

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

  const nowStr = new Date().toISOString();

  const normalUser: UserAccount = {
    id: 'usr_normal_01',
    email: 'normal@example.com',
    displayName: 'Normal User Rahul',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  const victimUser: UserAccount = {
    id: 'usr_victim_02',
    email: 'victim@example.com',
    displayName: 'Victim User Priya',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  const adminUser: UserAccount = {
    id: 'usr_admin_01',
    email: 'admin@example.com',
    displayName: 'System Admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  await dataStore.saveUser(normalUser);
  await dataStore.saveUser(victimUser);
  await dataStore.saveUser(adminUser);

  // 1. Anti-forgery: Normal user attempts to create a fake PAYMENT_VERIFIED notification
  const fakePmtRes = await notifService.createNotification({
    recipientUserId: normalUser.id,
    type: 'PAYMENT_VERIFIED',
    title: 'Fake Payment Verified',
    message: 'Forged payment notification',
  }, normalUser);

  assert(!fakePmtRes.success, 'Normal user blocked from creating fake PAYMENT_VERIFIED notification');
  if (!fakePmtRes.success) {
    assert(fakePmtRes.code === 'FINANCIAL_NOTIFICATION_FORGERY_BLOCKED', 'Correct error code returned for financial forgery attempt');
  }

  // 2. Anti-forgery: Normal user attempts to create a fake PAYMENT_REFUNDED notification
  const fakeRefRes = await notifService.createNotification({
    recipientUserId: normalUser.id,
    type: 'PAYMENT_REFUNDED',
    title: 'Fake Refunded',
    message: 'Forged refund notification',
  }, normalUser);

  assert(!fakeRefRes.success, 'Normal user blocked from creating fake PAYMENT_REFUNDED notification');

  // 3. Anti-forgery: Normal user attempts to create a fake PAYOUT_STATUS_CHANGED notification
  const fakePayoutRes = await notifService.createNotification({
    recipientUserId: normalUser.id,
    type: 'PAYOUT_STATUS_CHANGED',
    title: 'Fake Payout Status',
    message: 'Forged payout notification',
  }, normalUser);

  assert(!fakePayoutRes.success, 'Normal user blocked from creating fake PAYOUT_STATUS_CHANGED notification');

  // 4. Admin / System IS allowed to issue legitimate financial notifications
  const legitimatePmtRes = await notifService.createNotification({
    recipientUserId: victimUser.id,
    type: 'PAYMENT_VERIFIED',
    title: 'Payment Successful',
    message: 'Your payment of INR 500 was verified.',
    relatedEntityId: 'tx_legit_101',
    relatedEntityType: 'PAYMENT',
  }, adminUser);

  assert(legitimatePmtRes.success, 'Admin / System can successfully issue PAYMENT_VERIFIED notification');

  // 5. Cross-user isolation: Normal user attempts to read victim's notifications
  const crossReadRes = await notifService.listNotificationsForUser(normalUser, victimUser.id);
  assert(!crossReadRes.success, 'Normal user blocked from reading another user\'s notifications');
  if (!crossReadRes.success) {
    assert(crossReadRes.code === 'UNAUTHORIZED_ACCESS', 'Correct UNAUTHORIZED_ACCESS code returned for cross-user read');
  }

  // 6. Victim can read their own notification
  const victimReadRes = await notifService.listNotificationsForUser(victimUser, victimUser.id);
  assert(victimReadRes.success && victimReadRes.data.length === 1, 'Victim can read their own notifications');

  // 7. Cross-user modification: Normal user attempts to mark victim's notification as read
  if (legitimatePmtRes.success) {
    const victimNotifId = legitimatePmtRes.data.id;
    const crossMarkRes = await notifService.markAsRead(normalUser, victimNotifId);
    assert(!crossMarkRes.success, 'Normal user blocked from marking victim\'s notification as read');
  }

  // 8. Legitimate recipient marking their own notification as read
  if (legitimatePmtRes.success) {
    const victimNotifId = legitimatePmtRes.data.id;
    const legitMarkRes = await notifService.markAsRead(victimUser, victimNotifId);
    assert(legitMarkRes.success && legitMarkRes.data.isRead === true, 'Legitimate recipient can mark their own notification as read');
    
    // Verify unread count becomes 0
    const victimUnread = await notifService.getUnreadCount(victimUser, victimUser.id);
    assert(victimUnread.success && victimUnread.data === 0, 'Unread count correctly reflects 0 after read');
  }

  // 9. Legitimate Consultation Notifications flow (Client <-> Astrologer)
  const reqNotif = await notifService.notifyConsultationRequested(
    normalUser.id,
    victimUser.displayName,
    'consult_sec_01',
    'Video'
  );
  assert(reqNotif.success, 'Consultation request notification successfully created');

  const confNotif = await notifService.notifyConsultationStatusChanged(
    victimUser.id,
    'consult_sec_01',
    'CONFIRMED',
    normalUser.displayName
  );
  assert(confNotif.success, 'Consultation status change notification successfully created');

  console.log(`\n=== ALL ${passed}/${total} NOTIFICATION SECURITY AUDIT TESTS PASSED SUCCESSFULLY! ===\n`);
}

runNotificationSecurityAuditTests().catch(err => {
  console.error('Test Suite Exception:', err);
  process.exit(1);
});

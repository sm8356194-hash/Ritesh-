/**
 * Unified Backend Data Store & Repository Layer
 * 
 * Provides structured entity storage for:
 * - User Accounts (UserAccount)
 * - Persistent Birth Profiles (PersistentBirthProfile)
 * - Calculated Kundli Records (StoredKundliRecord)
 * - Astrologer Profiles (AstrologerProfile)
 * - Consultation Records (ConsultationRecord)
 * - Consultation Chat Messages (ConsultationChatMessage)
 * - App Settings (AppSettingsRecord)
 */

import {
  UserAccount,
  PersistentBirthProfile,
  StoredKundliRecord,
  AstrologerProfile,
  ConsultationRecord,
  ConsultationChatMessage,
  AppSettingsRecord,
  PaymentTransaction,
  PaymentAuditLog,
  AstrologerEarningRecord,
  PlatformEarningRecord,
  AstrologerPayoutRecord,
  InAppNotification,
  ProductionWallet,
  ProductionWalletTransaction,
  AstrologerKycRecord,
  RtcCallSession,
  FcmTokenRecord,
  PushNotificationAuditRecord,
} from '../../types';

import { FirestoreDataStore } from './firestoreDataStore';

export interface DataStoreInterface {
  saveUser(user: UserAccount): Promise<UserAccount>;
  getUserById(userId: string): Promise<UserAccount | null>;
  getUserByEmail(email: string): Promise<UserAccount | null>;
  listUsers(): Promise<UserAccount[]>;
  updateUser(userId: string, updates: Partial<Omit<UserAccount, 'id' | 'createdAt'>>): Promise<UserAccount | null>;
  deleteUser(userId: string): Promise<boolean>;

  saveBirthProfile(profile: PersistentBirthProfile): Promise<PersistentBirthProfile>;
  getBirthProfileById(profileId: string): Promise<PersistentBirthProfile | null>;
  listBirthProfilesByUserId(userId: string): Promise<PersistentBirthProfile[]>;
  updateBirthProfile(profileId: string, updates: Partial<Omit<PersistentBirthProfile, 'id' | 'userId' | 'createdAt'>>): Promise<PersistentBirthProfile | null>;
  deleteBirthProfile(profileId: string): Promise<boolean>;

  saveKundliRecord(record: StoredKundliRecord): Promise<StoredKundliRecord>;
  getKundliRecordByBirthProfileId(birthProfileId: string): Promise<StoredKundliRecord | null>;
  deleteKundliRecord(birthProfileId: string): Promise<boolean>;

  saveAstrologerProfile(profile: AstrologerProfile): Promise<AstrologerProfile>;
  getAstrologerProfileById(astrologerId: string): Promise<AstrologerProfile | null>;
  getAstrologerProfileByUserId(userId: string): Promise<AstrologerProfile | null>;
  listAstrologers(filterApprovedOnly?: boolean): Promise<AstrologerProfile[]>;
  updateAstrologerProfile(astrologerId: string, updates: Partial<Omit<AstrologerProfile, 'id' | 'userId' | 'createdAt'>>): Promise<AstrologerProfile | null>;

  saveConsultation(consultation: ConsultationRecord): Promise<ConsultationRecord>;
  getConsultationById(consultationId: string): Promise<ConsultationRecord | null>;
  listConsultationsByUserId(userId: string): Promise<ConsultationRecord[]>;
  listConsultationsByAstrologerId(astrologerId: string): Promise<ConsultationRecord[]>;
  listAllConsultations(): Promise<ConsultationRecord[]>;
  updateConsultation(consultationId: string, updates: Partial<Omit<ConsultationRecord, 'id' | 'userId' | 'astrologerId' | 'createdAt'>>): Promise<ConsultationRecord | null>;

  saveChatMessage(message: ConsultationChatMessage): Promise<ConsultationChatMessage>;
  listChatMessagesByConsultationId(consultationId: string): Promise<ConsultationChatMessage[]>;

  getAppSettings(): Promise<AppSettingsRecord>;
  updateAppSettings(updates: Partial<Omit<AppSettingsRecord, 'id'>>): Promise<AppSettingsRecord>;

  // Step 18 Payment Transactions
  savePaymentTransaction(tx: PaymentTransaction): Promise<PaymentTransaction>;
  getPaymentTransactionById(txId: string): Promise<PaymentTransaction | null>;
  getPaymentTransactionByConsultationId(consultationId: string): Promise<PaymentTransaction | null>;
  listPaymentTransactionsByUserId(userId: string): Promise<PaymentTransaction[]>;
  listPaymentTransactionsByAstrologerId(astrologerId: string): Promise<PaymentTransaction[]>;
  listAllPaymentTransactions(): Promise<PaymentTransaction[]>;
  updatePaymentTransaction(txId: string, updates: Partial<Omit<PaymentTransaction, 'id' | 'createdAt'>>): Promise<PaymentTransaction | null>;

  savePaymentAuditLog(log: PaymentAuditLog): Promise<PaymentAuditLog>;
  listPaymentAuditLogsByTransactionId(transactionId: string): Promise<PaymentAuditLog[]>;

  // Step 22 Earnings & Platform Billing Ledgers
  saveAstrologerEarning(earning: AstrologerEarningRecord): Promise<AstrologerEarningRecord>;
  getAstrologerEarningById(earningId: string): Promise<AstrologerEarningRecord | null>;
  listAstrologerEarningsByAstrologerUserId(astrologerUserId: string): Promise<AstrologerEarningRecord[]>;
  listAllAstrologerEarnings(): Promise<AstrologerEarningRecord[]>;
  updateAstrologerEarning(earningId: string, updates: Partial<Omit<AstrologerEarningRecord, 'id' | 'createdAt'>>): Promise<AstrologerEarningRecord | null>;

  savePlatformEarning(earning: PlatformEarningRecord): Promise<PlatformEarningRecord>;
  getPlatformEarningById(earningId: string): Promise<PlatformEarningRecord | null>;
  listAllPlatformEarnings(): Promise<PlatformEarningRecord[]>;

  // Step 23 Payout & Settlement Foundation
  saveAstrologerPayout(payout: AstrologerPayoutRecord): Promise<AstrologerPayoutRecord>;
  getAstrologerPayoutById(payoutId: string): Promise<AstrologerPayoutRecord | null>;
  listAstrologerPayoutsByAstrologerUserId(astrologerUserId: string): Promise<AstrologerPayoutRecord[]>;
  listAllAstrologerPayouts(): Promise<AstrologerPayoutRecord[]>;
  updateAstrologerPayout(payoutId: string, updates: Partial<Omit<AstrologerPayoutRecord, 'id' | 'createdAt'>>): Promise<AstrologerPayoutRecord | null>;

  // Step 24 In-App Notifications
  saveNotification(notification: InAppNotification): Promise<InAppNotification>;
  listNotificationsByUserId(userId: string, limitCount?: number): Promise<InAppNotification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(notifId: string, userId: string): Promise<InAppNotification | null>;
  markAllNotificationsAsRead(userId: string): Promise<boolean>;

  // Step 70 Production Wallet & Ledger
  getProductionWallet(userId: string): Promise<ProductionWallet | null>;
  saveProductionWallet(wallet: ProductionWallet): Promise<ProductionWallet>;
  getProductionWalletTransactionById(txId: string): Promise<ProductionWalletTransaction | null>;
  listProductionWalletTransactionsByUserId(userId: string): Promise<ProductionWalletTransaction[]>;
  saveProductionWalletTransaction(tx: ProductionWalletTransaction): Promise<ProductionWalletTransaction>;

  // Step 75 Production Push Notifications
  saveFcmToken(fcmToken: FcmTokenRecord): Promise<FcmTokenRecord>;
  getFcmToken(tokenId: string): Promise<FcmTokenRecord | null>;
  deleteFcmToken(tokenId: string): Promise<boolean>;
  listFcmTokensByUserId(userId: string): Promise<FcmTokenRecord[]>;
  savePushNotificationAudit(audit: PushNotificationAuditRecord): Promise<PushNotificationAuditRecord>;
  getPushNotificationAudit(auditId: string): Promise<PushNotificationAuditRecord | null>;
  listPushNotificationAuditsByUserId(userId: string): Promise<PushNotificationAuditRecord[]>;

  // Step 71 Astrologer KYC & Onboarding
  saveAstrologerKyc(kyc: AstrologerKycRecord): Promise<AstrologerKycRecord>;
  getAstrologerKycByAstrologerId(astrologerId: string): Promise<AstrologerKycRecord | null>;
  listAllAstrologerKycsForAdmin(): Promise<AstrologerKycRecord[]>;

  // Step 73 RTC Call Sessions
  saveRtcCallSession(session: RtcCallSession): Promise<RtcCallSession>;
  getRtcCallSessionById(sessionId: string): Promise<RtcCallSession | null>;
  listRtcCallSessionsByConsultationId(consultationId: string): Promise<RtcCallSession[]>;

  clear(): void;
}

export class InMemoryDataStore implements DataStoreInterface {
  private users: Map<string, UserAccount> = new Map();
  private userEmails: Map<string, string> = new Map(); // email (lowercase) -> userId
  private birthProfiles: Map<string, PersistentBirthProfile> = new Map();
  private kundliRecords: Map<string, StoredKundliRecord> = new Map(); // birthProfileId -> StoredKundliRecord
  private astrologerProfiles: Map<string, AstrologerProfile> = new Map();
  private astrologerUserMap: Map<string, string> = new Map(); // userId -> astrologerId
  private consultations: Map<string, ConsultationRecord> = new Map();
  private chatMessages: Map<string, ConsultationChatMessage[]> = new Map(); // consultationId -> messages
  private paymentTransactions: Map<string, PaymentTransaction> = new Map(); // txId -> PaymentTransaction
  private paymentAuditLogs: Map<string, PaymentAuditLog[]> = new Map(); // txId -> PaymentAuditLog[]
  private astrologerEarnings: Map<string, AstrologerEarningRecord> = new Map(); // earnId -> AstrologerEarningRecord
  private platformEarnings: Map<string, PlatformEarningRecord> = new Map(); // platId -> PlatformEarningRecord
  private astrologerPayouts: Map<string, AstrologerPayoutRecord> = new Map(); // payoutId -> AstrologerPayoutRecord
  private notifications: Map<string, InAppNotification> = new Map(); // notifId -> InAppNotification
  private productionWallets: Map<string, ProductionWallet> = new Map(); // userId -> ProductionWallet
  private productionWalletTransactions: Map<string, ProductionWalletTransaction> = new Map(); // wtxId -> ProductionWalletTransaction
  private astrologerKycs: Map<string, AstrologerKycRecord> = new Map(); // kycId / astrologerId -> AstrologerKycRecord
  private rtcCallSessions: Map<string, RtcCallSession> = new Map(); // csessId -> RtcCallSession
  private fcmTokens: Map<string, FcmTokenRecord> = new Map(); // tokenId -> FcmTokenRecord
  private pushNotificationAudits: Map<string, PushNotificationAuditRecord> = new Map(); // auditId -> PushNotificationAuditRecord
  private appSettings: AppSettingsRecord;

  constructor() {
    this.appSettings = {
      id: 'global_app_settings',
      appName: 'Vedic Astrology App',
      version: '1.0.0-real-step12',
      maintenanceMode: false,
      allowNewRegistrations: true,
      defaultAyanamsha: 'LAHIRI',
      defaultHouseSystem: 'WHOLE_SIGN',
      platformCommissionPercent: 15,
      minConsultationPrice: 10,
      currency: 'INR',
      privacyPolicyNotice: 'Your birth details and consultations are private and encrypted.',
      termsNotice: 'Astrology services are advisory. Standard terms apply.',
      updatedAt: new Date().toISOString(),
    };
  }

  public async saveUser(user: UserAccount): Promise<UserAccount> {
    const emailKey = user.email.trim().toLowerCase();
    this.users.set(user.id, { ...user });
    this.userEmails.set(emailKey, user.id);
    return { ...user };
  }

  public async getUserById(userId: string): Promise<UserAccount | null> {
    const user = this.users.get(userId);
    return user ? { ...user } : null;
  }

  public async getUserByEmail(email: string): Promise<UserAccount | null> {
    const emailKey = email.trim().toLowerCase();
    const userId = this.userEmails.get(emailKey);
    if (!userId) return null;
    return this.getUserById(userId);
  }

  public async listUsers(): Promise<UserAccount[]> {
    return Array.from(this.users.values()).map(u => ({ ...u }));
  }

  public async updateUser(userId: string, updates: Partial<Omit<UserAccount, 'id' | 'createdAt'>>): Promise<UserAccount | null> {
    const existing = this.users.get(userId);
    if (!existing) return null;

    if (updates.email && updates.email.trim().toLowerCase() !== existing.email.toLowerCase()) {
      const oldEmailKey = existing.email.toLowerCase();
      const newEmailKey = updates.email.trim().toLowerCase();
      this.userEmails.delete(oldEmailKey);
      this.userEmails.set(newEmailKey, userId);
    }

    const updated: UserAccount = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(userId, updated);
    return { ...updated };
  }

  public async deleteUser(userId: string): Promise<boolean> {
    const existing = this.users.get(userId);
    if (!existing) return false;

    this.userEmails.delete(existing.email.toLowerCase());
    this.users.delete(userId);

    const userProfiles = await this.listBirthProfilesByUserId(userId);
    for (const p of userProfiles) {
      await this.deleteBirthProfile(p.id);
    }

    return true;
  }

  public async saveBirthProfile(profile: PersistentBirthProfile): Promise<PersistentBirthProfile> {
    this.birthProfiles.set(profile.id, { ...profile });
    return { ...profile };
  }

  public async getBirthProfileById(profileId: string): Promise<PersistentBirthProfile | null> {
    const profile = this.birthProfiles.get(profileId);
    return profile ? { ...profile } : null;
  }

  public async listBirthProfilesByUserId(userId: string): Promise<PersistentBirthProfile[]> {
    return Array.from(this.birthProfiles.values())
      .filter(p => p.userId === userId)
      .map(p => ({ ...p }));
  }

  public async updateBirthProfile(
    profileId: string, 
    updates: Partial<Omit<PersistentBirthProfile, 'id' | 'userId' | 'createdAt'>>
  ): Promise<PersistentBirthProfile | null> {
    const existing = this.birthProfiles.get(profileId);
    if (!existing) return null;

    const updated: PersistentBirthProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.birthProfiles.set(profileId, updated);
    return { ...updated };
  }

  public async deleteBirthProfile(profileId: string): Promise<boolean> {
    const existing = this.birthProfiles.get(profileId);
    if (!existing) return false;

    this.birthProfiles.delete(profileId);
    this.kundliRecords.delete(profileId);
    return true;
  }

  public async saveKundliRecord(record: StoredKundliRecord): Promise<StoredKundliRecord> {
    this.kundliRecords.set(record.birthProfileId, { ...record });
    return { ...record };
  }

  public async getKundliRecordByBirthProfileId(birthProfileId: string): Promise<StoredKundliRecord | null> {
    const record = this.kundliRecords.get(birthProfileId);
    return record ? { ...record } : null;
  }

  public async deleteKundliRecord(birthProfileId: string): Promise<boolean> {
    return this.kundliRecords.delete(birthProfileId);
  }

  public async saveAstrologerProfile(profile: AstrologerProfile): Promise<AstrologerProfile> {
    this.astrologerProfiles.set(profile.id, { ...profile });
    this.astrologerUserMap.set(profile.userId, profile.id);
    return { ...profile };
  }

  public async getAstrologerProfileById(astrologerId: string): Promise<AstrologerProfile | null> {
    const profile = this.astrologerProfiles.get(astrologerId);
    return profile ? { ...profile } : null;
  }

  public async getAstrologerProfileByUserId(userId: string): Promise<AstrologerProfile | null> {
    const astrologerId = this.astrologerUserMap.get(userId);
    if (!astrologerId) return null;
    return this.getAstrologerProfileById(astrologerId);
  }

  public async listAstrologers(filterApprovedOnly: boolean = true): Promise<AstrologerProfile[]> {
    return Array.from(this.astrologerProfiles.values())
      .filter(a => !filterApprovedOnly || a.isApproved)
      .map(a => ({ ...a }));
  }

  public async updateAstrologerProfile(
    astrologerId: string,
    updates: Partial<Omit<AstrologerProfile, 'id' | 'userId' | 'createdAt'>>
  ): Promise<AstrologerProfile | null> {
    const existing = this.astrologerProfiles.get(astrologerId);
    if (!existing) return null;

    const updated: AstrologerProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.astrologerProfiles.set(astrologerId, updated);
    return { ...updated };
  }

  public async saveConsultation(consultation: ConsultationRecord): Promise<ConsultationRecord> {
    this.consultations.set(consultation.id, { ...consultation });
    return { ...consultation };
  }

  public async getConsultationById(consultationId: string): Promise<ConsultationRecord | null> {
    const consultation = this.consultations.get(consultationId);
    return consultation ? { ...consultation } : null;
  }

  public async listConsultationsByUserId(userId: string): Promise<ConsultationRecord[]> {
    return Array.from(this.consultations.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(c => ({ ...c }));
  }

  public async listConsultationsByAstrologerId(astrologerId: string): Promise<ConsultationRecord[]> {
    return Array.from(this.consultations.values())
      .filter(c => c.astrologerId === astrologerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(c => ({ ...c }));
  }

  public async listAllConsultations(): Promise<ConsultationRecord[]> {
    return Array.from(this.consultations.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(c => ({ ...c }));
  }

  public async updateConsultation(
    consultationId: string,
    updates: Partial<Omit<ConsultationRecord, 'id' | 'userId' | 'astrologerId' | 'createdAt'>>
  ): Promise<ConsultationRecord | null> {
    const existing = this.consultations.get(consultationId);
    if (!existing) return null;

    const updated: ConsultationRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.consultations.set(consultationId, updated);
    return { ...updated };
  }

  public async saveChatMessage(message: ConsultationChatMessage): Promise<ConsultationChatMessage> {
    const list = this.chatMessages.get(message.consultationId) || [];
    const index = list.findIndex(m => m.id === message.id);
    if (index >= 0) {
      list[index] = { ...message };
    } else {
      list.push({ ...message });
    }
    this.chatMessages.set(message.consultationId, list);
    return { ...message };
  }

  public async listChatMessagesByConsultationId(consultationId: string): Promise<ConsultationChatMessage[]> {
    const list = this.chatMessages.get(consultationId) || [];
    return list.map(m => ({ ...m }));
  }

  public async getAppSettings(): Promise<AppSettingsRecord> {
    return { ...this.appSettings };
  }

  public async updateAppSettings(updates: Partial<Omit<AppSettingsRecord, 'id'>>): Promise<AppSettingsRecord> {
    this.appSettings = {
      ...this.appSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return { ...this.appSettings };
  }

  // Step 18 Payment Transactions Implementation
  public async savePaymentTransaction(tx: PaymentTransaction): Promise<PaymentTransaction> {
    this.paymentTransactions.set(tx.id, { ...tx });
    return { ...tx };
  }

  public async getPaymentTransactionById(txId: string): Promise<PaymentTransaction | null> {
    const tx = this.paymentTransactions.get(txId);
    return tx ? { ...tx } : null;
  }

  public async getPaymentTransactionByConsultationId(consultationId: string): Promise<PaymentTransaction | null> {
    for (const tx of this.paymentTransactions.values()) {
      if (tx.consultationId === consultationId) {
        return { ...tx };
      }
    }
    return null;
  }

  public async listPaymentTransactionsByUserId(userId: string): Promise<PaymentTransaction[]> {
    const results: PaymentTransaction[] = [];
    for (const tx of this.paymentTransactions.values()) {
      if (tx.userId === userId) {
        results.push({ ...tx });
      }
    }
    return results;
  }

  public async listPaymentTransactionsByAstrologerId(astrologerId: string): Promise<PaymentTransaction[]> {
    const results: PaymentTransaction[] = [];
    for (const tx of this.paymentTransactions.values()) {
      if (tx.astrologerId === astrologerId) {
        results.push({ ...tx });
      }
    }
    return results;
  }

  public async listAllPaymentTransactions(): Promise<PaymentTransaction[]> {
    return Array.from(this.paymentTransactions.values()).map(tx => ({ ...tx }));
  }

  public async updatePaymentTransaction(txId: string, updates: Partial<Omit<PaymentTransaction, 'id' | 'createdAt'>>): Promise<PaymentTransaction | null> {
    const existing = this.paymentTransactions.get(txId);
    if (!existing) return null;
    const updated: PaymentTransaction = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.paymentTransactions.set(txId, updated);
    return { ...updated };
  }

  public async savePaymentAuditLog(log: PaymentAuditLog): Promise<PaymentAuditLog> {
    const list = this.paymentAuditLogs.get(log.transactionId) || [];
    list.push({ ...log });
    this.paymentAuditLogs.set(log.transactionId, list);
    return { ...log };
  }

  public async listPaymentAuditLogsByTransactionId(transactionId: string): Promise<PaymentAuditLog[]> {
    const list = this.paymentAuditLogs.get(transactionId) || [];
    return list.map(l => ({ ...l }));
  }

  public async saveAstrologerEarning(earning: AstrologerEarningRecord): Promise<AstrologerEarningRecord> {
    this.astrologerEarnings.set(earning.id, { ...earning });
    return { ...earning };
  }

  public async getAstrologerEarningById(earningId: string): Promise<AstrologerEarningRecord | null> {
    const item = this.astrologerEarnings.get(earningId);
    return item ? { ...item } : null;
  }

  public async listAstrologerEarningsByAstrologerUserId(astrologerUserId: string): Promise<AstrologerEarningRecord[]> {
    return Array.from(this.astrologerEarnings.values())
      .filter(e => e.astrologerUserId === astrologerUserId || e.astrologerId === astrologerUserId)
      .map(e => ({ ...e }));
  }

  public async listAllAstrologerEarnings(): Promise<AstrologerEarningRecord[]> {
    return Array.from(this.astrologerEarnings.values()).map(e => ({ ...e }));
  }

  public async updateAstrologerEarning(earningId: string, updates: Partial<Omit<AstrologerEarningRecord, 'id' | 'createdAt'>>): Promise<AstrologerEarningRecord | null> {
    const existing = this.astrologerEarnings.get(earningId);
    if (!existing) return null;
    const updated: AstrologerEarningRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.astrologerEarnings.set(earningId, updated);
    return { ...updated };
  }

  public async savePlatformEarning(earning: PlatformEarningRecord): Promise<PlatformEarningRecord> {
    this.platformEarnings.set(earning.id, { ...earning });
    return { ...earning };
  }

  public async getPlatformEarningById(earningId: string): Promise<PlatformEarningRecord | null> {
    const item = this.platformEarnings.get(earningId);
    return item ? { ...item } : null;
  }

  public async listAllPlatformEarnings(): Promise<PlatformEarningRecord[]> {
    return Array.from(this.platformEarnings.values()).map(p => ({ ...p }));
  }

  public async saveAstrologerPayout(payout: AstrologerPayoutRecord): Promise<AstrologerPayoutRecord> {
    this.astrologerPayouts.set(payout.id, { ...payout });
    return { ...payout };
  }

  public async getAstrologerPayoutById(payoutId: string): Promise<AstrologerPayoutRecord | null> {
    const item = this.astrologerPayouts.get(payoutId);
    return item ? { ...item } : null;
  }

  public async listAstrologerPayoutsByAstrologerUserId(astrologerUserId: string): Promise<AstrologerPayoutRecord[]> {
    return Array.from(this.astrologerPayouts.values())
      .filter(p => p.astrologerUserId === astrologerUserId || p.astrologerId === astrologerUserId)
      .map(p => ({ ...p }));
  }

  public async listAllAstrologerPayouts(): Promise<AstrologerPayoutRecord[]> {
    return Array.from(this.astrologerPayouts.values()).map(p => ({ ...p }));
  }

  public async updateAstrologerPayout(payoutId: string, updates: Partial<Omit<AstrologerPayoutRecord, 'id' | 'createdAt'>>): Promise<AstrologerPayoutRecord | null> {
    const existing = this.astrologerPayouts.get(payoutId);
    if (!existing) return null;
    const updated: AstrologerPayoutRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.astrologerPayouts.set(payoutId, updated);
    return { ...updated };
  }

  // Step 24 Notification Methods
  public async saveNotification(notification: InAppNotification): Promise<InAppNotification> {
    this.notifications.set(notification.id, { ...notification });
    return { ...notification };
  }

  public async listNotificationsByUserId(userId: string, limitCount: number = 30): Promise<InAppNotification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.recipientUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limitCount)
      .map(n => ({ ...n }));
  }

  public async getUnreadNotificationCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(n => n.recipientUserId === userId && !n.isRead)
      .length;
  }

  public async markNotificationAsRead(notifId: string, userId: string): Promise<InAppNotification | null> {
    const existing = this.notifications.get(notifId);
    if (!existing || existing.recipientUserId !== userId) return null;
    const now = new Date().toISOString();
    const updated: InAppNotification = {
      ...existing,
      isRead: true,
      readAt: existing.readAt || now,
    };
    this.notifications.set(notifId, updated);
    return { ...updated };
  }

  public async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const now = new Date().toISOString();
    let updatedAny = false;
    this.notifications.forEach((notif, id) => {
      if (notif.recipientUserId === userId && !notif.isRead) {
        this.notifications.set(id, {
          ...notif,
          isRead: true,
          readAt: now,
        });
        updatedAny = true;
      }
    });
    return updatedAny;
  }

  // Step 70 Production Wallet & Ledger Methods
  public async getProductionWallet(userId: string): Promise<ProductionWallet | null> {
    const wallet = this.productionWallets.get(userId);
    return wallet ? { ...wallet } : null;
  }

  public async saveProductionWallet(wallet: ProductionWallet): Promise<ProductionWallet> {
    const copy = { ...wallet, updatedAt: new Date().toISOString() };
    this.productionWallets.set(wallet.userId, copy);
    return { ...copy };
  }

  public async getProductionWalletTransactionById(txId: string): Promise<ProductionWalletTransaction | null> {
    const tx = this.productionWalletTransactions.get(txId);
    return tx ? { ...tx } : null;
  }

  public async listProductionWalletTransactionsByUserId(userId: string): Promise<ProductionWalletTransaction[]> {
    const list: ProductionWalletTransaction[] = [];
    this.productionWalletTransactions.forEach(tx => {
      if (tx.userId === userId) {
        list.push({ ...tx });
      }
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async saveProductionWalletTransaction(tx: ProductionWalletTransaction): Promise<ProductionWalletTransaction> {
    const copy = { ...tx };
    this.productionWalletTransactions.set(tx.id, copy);
    return { ...copy };
  }

  // Step 71 Astrologer KYC & Onboarding Methods
  public async saveAstrologerKyc(kyc: AstrologerKycRecord): Promise<AstrologerKycRecord> {
    const copy = { ...kyc };
    this.astrologerKycs.set(kyc.astrologerId, copy);
    this.astrologerKycs.set(kyc.kycId, copy);
    return { ...copy };
  }

  public async getAstrologerKycByAstrologerId(astrologerId: string): Promise<AstrologerKycRecord | null> {
    const kyc = this.astrologerKycs.get(astrologerId);
    return kyc ? { ...kyc } : null;
  }

  public async listAllAstrologerKycsForAdmin(): Promise<AstrologerKycRecord[]> {
    const set = new Set<string>();
    const list: AstrologerKycRecord[] = [];
    this.astrologerKycs.forEach(kyc => {
      if (!set.has(kyc.kycId)) {
        set.add(kyc.kycId);
        list.push({ ...kyc });
      }
    });
    return list;
  }

  // Step 73 RTC Call Session Methods
  public async saveRtcCallSession(session: RtcCallSession): Promise<RtcCallSession> {
    const copy = { ...session, updatedAt: new Date().toISOString() };
    this.rtcCallSessions.set(session.id, copy);
    return { ...copy };
  }

  public async getRtcCallSessionById(sessionId: string): Promise<RtcCallSession | null> {
    const session = this.rtcCallSessions.get(sessionId);
    return session ? { ...session } : null;
  }

  public async listRtcCallSessionsByConsultationId(consultationId: string): Promise<RtcCallSession[]> {
    const list: RtcCallSession[] = [];
    this.rtcCallSessions.forEach(s => {
      if (s.consultationId === consultationId) {
        list.push({ ...s });
      }
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Step 75 Production Push Notifications
  public async saveFcmToken(fcmToken: FcmTokenRecord): Promise<FcmTokenRecord> {
    const copy = { ...fcmToken, updatedAt: new Date().toISOString() };
    this.fcmTokens.set(fcmToken.id, copy);
    return { ...copy };
  }

  public async getFcmToken(tokenId: string): Promise<FcmTokenRecord | null> {
    const token = this.fcmTokens.get(tokenId);
    return token ? { ...token } : null;
  }

  public async deleteFcmToken(tokenId: string): Promise<boolean> {
    return this.fcmTokens.delete(tokenId);
  }

  public async listFcmTokensByUserId(userId: string): Promise<FcmTokenRecord[]> {
    const list: FcmTokenRecord[] = [];
    this.fcmTokens.forEach(t => {
      if (s => true && t.userId === userId) {
        list.push({ ...t });
      }
    });
    return list;
  }

  public async savePushNotificationAudit(audit: PushNotificationAuditRecord): Promise<PushNotificationAuditRecord> {
    const copy = { ...audit, updatedAt: new Date().toISOString() };
    this.pushNotificationAudits.set(audit.id, copy);
    return { ...copy };
  }

  public async getPushNotificationAudit(auditId: string): Promise<PushNotificationAuditRecord | null> {
    const audit = this.pushNotificationAudits.get(auditId);
    return audit ? { ...audit } : null;
  }

  public async listPushNotificationAuditsByUserId(userId: string): Promise<PushNotificationAuditRecord[]> {
    const list: PushNotificationAuditRecord[] = [];
    this.pushNotificationAudits.forEach(a => {
      if (a.recipientUserId === userId) {
        list.push({ ...a });
      }
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public clear(): void {
    this.users.clear();
    this.userEmails.clear();
    this.birthProfiles.clear();
    this.kundliRecords.clear();
    this.astrologerProfiles.clear();
    this.astrologerUserMap.clear();
    this.consultations.clear();
    this.chatMessages.clear();
    this.paymentTransactions.clear();
    this.paymentAuditLogs.clear();
    this.astrologerEarnings.clear();
    this.platformEarnings.clear();
    this.astrologerPayouts.clear();
    this.notifications.clear();
    this.fcmTokens.clear();
    this.pushNotificationAudits.clear();
  }
}

export { FirestoreDataStore };

// Export DataStore as DataStoreInterface type alias and InMemoryDataStore constructor for unit tests
export type DataStore = DataStoreInterface;
export const DataStore = InMemoryDataStore;

// Global Singleton DataStore Instance using Firestore Data Store for production
export const globalDataStore = new FirestoreDataStore();

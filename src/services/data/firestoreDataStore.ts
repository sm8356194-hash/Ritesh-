/**
 * Firestore Data Store Implementation
 * 
 * Implements persistent repository methods using Cloud Firestore SDK
 * with resilient offline fallback handling.
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
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

import { DataStoreInterface } from './dataStore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function isOfflineError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code;
  return (
    code === 'unavailable' ||
    msg.includes('offline') ||
    msg.includes('Could not reach Cloud Firestore') ||
    msg.includes('Failed to get document because the client is offline')
  );
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (isOfflineError(error)) {
    console.warn(`Firestore operating in offline mode (${operationType}) for path '${path}': ${errMsg}`);
    return;
  }
  const errInfo = {
    error: errMsg,
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes undefined fields from objects before saving to Firestore,
 * as Firestore does not support undefined values.
 */
function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as unknown as T;
  }
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      cleaned[key] = cleanUndefined(val);
    }
  }
  return cleaned;
}

const DEFAULT_APP_SETTINGS: AppSettingsRecord = {
  id: 'global_app_settings',
  appName: 'Vedic Astrology App',
  version: '1.0.0-real-step11',
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

export class FirestoreDataStore implements DataStoreInterface {
  // ==========================================================================
  // USERS REPOSITORY
  // ==========================================================================

  public async saveUser(user: UserAccount): Promise<UserAccount> {
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), cleanUndefined(user));
      return { ...user };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return { ...user };
    }
  }

  public async getUserById(userId: string): Promise<UserAccount | null> {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return null;
      return snap.data() as UserAccount;
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn(`Firestore offline fallback for getUserById '${userId}'`);
        if (auth.currentUser && auth.currentUser.uid === userId) {
          return {
            id: auth.currentUser.uid,
            displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
            email: auth.currentUser.email || '',
            role: 'USER',
            status: 'ACTIVE',
            phone: auth.currentUser.phoneNumber || undefined,
            avatarUrl: auth.currentUser.photoURL || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return null;
      }
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  public async getUserByEmail(email: string): Promise<UserAccount | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const path = 'users';
    try {
      const q = query(collection(db, 'users'), where('email', '==', normalizedEmail));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data() as UserAccount;
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn(`Firestore offline fallback for getUserByEmail '${normalizedEmail}'`);
        return null;
      }
      handleFirestoreError(error, OperationType.LIST, path);
      return null;
    }
  }

  public async listUsers(): Promise<UserAccount[]> {
    const path = 'users';
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => d.data() as UserAccount);
    } catch (error) {
      if (isOfflineError(error)) return [];
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  public async updateUser(userId: string, updates: Partial<Omit<UserAccount, 'id' | 'createdAt'>>): Promise<UserAccount | null> {
    const path = `users/${userId}`;
    try {
      const ref = doc(db, 'users', userId);
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(ref, cleanUndefined(updatedData));
      const updated = await this.getUserById(userId);
      return updated;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      return null;
    }
  }

  public async deleteUser(userId: string): Promise<boolean> {
    const path = `users/${userId}`;
    try {
      await deleteDoc(doc(db, 'users', userId));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      return false;
    }
  }

  // ==========================================================================
  // BIRTH PROFILES REPOSITORY
  // ==========================================================================

  public async saveBirthProfile(profile: PersistentBirthProfile): Promise<PersistentBirthProfile> {
    const path = `birth_profiles/${profile.id}`;
    try {
      await setDoc(doc(db, 'birth_profiles', profile.id), cleanUndefined(profile));
      return { ...profile };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return { ...profile };
    }
  }

  public async getBirthProfileById(profileId: string): Promise<PersistentBirthProfile | null> {
    const path = `birth_profiles/${profileId}`;
    try {
      if (!auth.currentUser) return null;
      const snap = await getDoc(doc(db, 'birth_profiles', profileId));
      if (!snap.exists()) return null;
      return snap.data() as PersistentBirthProfile;
    } catch (error) {
      if (isOfflineError(error)) return null;
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  public async listBirthProfilesByUserId(userId: string): Promise<PersistentBirthProfile[]> {
    const path = 'birth_profiles';
    try {
      if (!auth.currentUser) {
        return [];
      }
      const q = query(collection(db, 'birth_profiles'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as PersistentBirthProfile);
    } catch (error) {
      if (isOfflineError(error)) return [];
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  public async updateBirthProfile(
    profileId: string, 
    updates: Partial<Omit<PersistentBirthProfile, 'id' | 'userId' | 'createdAt'>>
  ): Promise<PersistentBirthProfile | null> {
    const path = `birth_profiles/${profileId}`;
    try {
      const ref = doc(db, 'birth_profiles', profileId);
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(ref, cleanUndefined(updatedData));
      return await this.getBirthProfileById(profileId);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      return null;
    }
  }

  public async deleteBirthProfile(profileId: string): Promise<boolean> {
    const path = `birth_profiles/${profileId}`;
    try {
      await deleteDoc(doc(db, 'birth_profiles', profileId));
      try {
        await deleteDoc(doc(db, 'kundli_records', profileId));
      } catch (err) {
        // Safe optional deletion if kundli_record doc does not exist or fails
      }
      return true;
    } catch (error) {
      if (isOfflineError(error)) {
        return true;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('permission') || errMsg.includes('not-found') || errMsg.includes('Missing or insufficient permissions')) {
        console.warn(`Firestore permission/not-found fallback during deleteBirthProfile '${profileId}': ${errMsg}`);
        return true;
      }
      handleFirestoreError(error, OperationType.DELETE, path);
      return false;
    }
  }

  // ==========================================================================
  // KUNDLI RECORDS REPOSITORY
  // ==========================================================================

  public async saveKundliRecord(record: StoredKundliRecord): Promise<StoredKundliRecord> {
    const path = `kundli_records/${record.birthProfileId}`;
    try {
      await setDoc(doc(db, 'kundli_records', record.birthProfileId), cleanUndefined(record));
      return { ...record };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return { ...record };
    }
  }

  public async getKundliRecordByBirthProfileId(birthProfileId: string): Promise<StoredKundliRecord | null> {
    const path = `kundli_records/${birthProfileId}`;
    try {
      if (!auth.currentUser) return null;
      const snap = await getDoc(doc(db, 'kundli_records', birthProfileId));
      if (!snap.exists()) return null;
      return snap.data() as StoredKundliRecord;
    } catch (error) {
      if (isOfflineError(error)) return null;
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  public async deleteKundliRecord(birthProfileId: string): Promise<boolean> {
    const path = `kundli_records/${birthProfileId}`;
    try {
      await deleteDoc(doc(db, 'kundli_records', birthProfileId));
      return true;
    } catch (error) {
      if (isOfflineError(error)) {
        return true;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('permission') || errMsg.includes('not-found') || errMsg.includes('Missing or insufficient permissions')) {
        console.warn(`Firestore permission/not-found fallback during deleteKundliRecord '${birthProfileId}': ${errMsg}`);
        return true;
      }
      handleFirestoreError(error, OperationType.DELETE, path);
      return false;
    }
  }

  // ==========================================================================
  // ASTROLOGER PROFILES REPOSITORY
  // ==========================================================================

  public async saveAstrologerProfile(profile: AstrologerProfile): Promise<AstrologerProfile> {
    const path = `astrologer_profiles/${profile.id}`;
    try {
      await setDoc(doc(db, 'astrologer_profiles', profile.id), cleanUndefined(profile));
      return { ...profile };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return { ...profile };
    }
  }

  public async getAstrologerProfileById(astrologerId: string): Promise<AstrologerProfile | null> {
    const path = `astrologer_profiles/${astrologerId}`;
    try {
      const snap = await getDoc(doc(db, 'astrologer_profiles', astrologerId));
      if (!snap.exists()) return null;
      return snap.data() as AstrologerProfile;
    } catch (error) {
      if (isOfflineError(error)) return null;
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  public async getAstrologerProfileByUserId(userId: string): Promise<AstrologerProfile | null> {
    const path = 'astrologer_profiles';
    try {
      const q = query(collection(db, 'astrologer_profiles'), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data() as AstrologerProfile;
    } catch (error) {
      if (isOfflineError(error)) return null;
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('permission') || errMsg.includes('Missing or insufficient permissions')) {
        console.warn(`Firestore permission warning in getAstrologerProfileByUserId '${userId}': ${errMsg}`);
        return null;
      }
      handleFirestoreError(error, OperationType.LIST, path);
      return null;
    }
  }

  public async listAstrologers(filterApprovedOnly: boolean = true): Promise<AstrologerProfile[]> {
    const path = 'astrologer_profiles';
    try {
      let q = query(collection(db, 'astrologer_profiles'));
      if (filterApprovedOnly) {
        q = query(collection(db, 'astrologer_profiles'), where('isApproved', '==', true));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as AstrologerProfile);
    } catch (error) {
      if (isOfflineError(error)) return [];
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('permission') || errMsg.includes('Missing or insufficient permissions')) {
        console.warn(`Firestore permission warning in listAstrologers: ${errMsg}`);
        return [];
      }
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  public async updateAstrologerProfile(
    astrologerId: string,
    updates: Partial<Omit<AstrologerProfile, 'id' | 'userId' | 'createdAt'>>
  ): Promise<AstrologerProfile | null> {
    const path = `astrologer_profiles/${astrologerId}`;
    try {
      const ref = doc(db, 'astrologer_profiles', astrologerId);
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(ref, cleanUndefined(updatedData));
      return await this.getAstrologerProfileById(astrologerId);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      return null;
    }
  }

  // ==========================================================================
  // CONSULTATIONS REPOSITORY
  // ==========================================================================

  public async saveConsultation(consultation: ConsultationRecord): Promise<ConsultationRecord> {
    const path = `consultations/${consultation.id}`;
    try {
      await setDoc(doc(db, 'consultations', consultation.id), cleanUndefined(consultation));
      return { ...consultation };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return { ...consultation };
    }
  }

  public async getConsultationById(consultationId: string): Promise<ConsultationRecord | null> {
    const path = `consultations/${consultationId}`;
    try {
      const snap = await getDoc(doc(db, 'consultations', consultationId));
      if (!snap.exists()) return null;
      return snap.data() as ConsultationRecord;
    } catch (error) {
      if (isOfflineError(error)) return null;
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  public async listConsultationsByUserId(userId: string): Promise<ConsultationRecord[]> {
    const path = 'consultations';
    try {
      const q = query(collection(db, 'consultations'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as ConsultationRecord);
    } catch (error) {
      if (isOfflineError(error)) return [];
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  public async listConsultationsByAstrologerId(astrologerId: string): Promise<ConsultationRecord[]> {
    const path = 'consultations';
    try {
      const q = query(collection(db, 'consultations'), where('astrologerId', '==', astrologerId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as ConsultationRecord);
    } catch (error) {
      if (isOfflineError(error)) return [];
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  public async listAllConsultations(): Promise<ConsultationRecord[]> {
    const path = 'consultations';
    try {
      const q = query(collection(db, 'consultations'));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as ConsultationRecord);
    } catch (error) {
      if (isOfflineError(error)) return [];
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  public async updateConsultation(
    consultationId: string,
    updates: Partial<Omit<ConsultationRecord, 'id' | 'userId' | 'astrologerId' | 'createdAt'>>
  ): Promise<ConsultationRecord | null> {
    const path = `consultations/${consultationId}`;
    try {
      const ref = doc(db, 'consultations', consultationId);
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(ref, cleanUndefined(updatedData));
      return await this.getConsultationById(consultationId);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      return null;
    }
  }

  // ==========================================================================
  // CHAT MESSAGES REPOSITORY
  // ==========================================================================

  public async saveChatMessage(message: ConsultationChatMessage): Promise<ConsultationChatMessage> {
    const path = `consultations/${message.consultationId}/messages/${message.id}`;
    try {
      await setDoc(doc(db, 'consultations', message.consultationId, 'messages', message.id), cleanUndefined(message));
      return { ...message };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return { ...message };
    }
  }

  public async listChatMessagesByConsultationId(consultationId: string): Promise<ConsultationChatMessage[]> {
    const path = `consultations/${consultationId}/messages`;
    try {
      const q = query(collection(db, 'consultations', consultationId, 'messages'), orderBy('timestamp', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as ConsultationChatMessage);
    } catch (error) {
      if (isOfflineError(error)) return [];
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  // ==========================================================================
  // APP SETTINGS REPOSITORY
  // ==========================================================================

  public async getAppSettings(): Promise<AppSettingsRecord> {
    const path = 'app_settings/global_app_settings';
    try {
      const snap = await getDoc(doc(db, 'app_settings', 'global_app_settings'));
      if (!snap.exists()) {
        return DEFAULT_APP_SETTINGS;
      }
      return snap.data() as AppSettingsRecord;
    } catch (error) {
      if (isOfflineError(error)) return DEFAULT_APP_SETTINGS;
      handleFirestoreError(error, OperationType.GET, path);
      return DEFAULT_APP_SETTINGS;
    }
  }

  public async updateAppSettings(updates: Partial<Omit<AppSettingsRecord, 'id'>>): Promise<AppSettingsRecord> {
    const path = 'app_settings/global_app_settings';
    try {
      const ref = doc(db, 'app_settings', 'global_app_settings');
      const current = await this.getAppSettings();
      const updated: AppSettingsRecord = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(ref, cleanUndefined(updated));
      return updated;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      return DEFAULT_APP_SETTINGS;
    }
  }

  // ==========================================================================
  // PAYMENT TRANSACTIONS REPOSITORY
  // ==========================================================================

  public async savePaymentTransaction(tx: PaymentTransaction): Promise<PaymentTransaction> {
    const path = `payment_transactions/${tx.id}`;
    try {
      await setDoc(doc(db, 'payment_transactions', tx.id), cleanUndefined(tx));
      return { ...tx };
    } catch (error) {
      console.warn('Firestore payment transaction write fallback:', error);
      return { ...tx };
    }
  }

  public async getPaymentTransactionById(txId: string): Promise<PaymentTransaction | null> {
    const path = `payment_transactions/${txId}`;
    try {
      const snap = await getDoc(doc(db, 'payment_transactions', txId));
      if (!snap.exists()) return null;
      return snap.data() as PaymentTransaction;
    } catch (error) {
      console.warn('Firestore payment transaction get fallback:', error);
      return null;
    }
  }

  public async getPaymentTransactionByConsultationId(consultationId: string): Promise<PaymentTransaction | null> {
    const path = `payment_transactions (consultationId=${consultationId})`;
    try {
      const q = query(collection(db, 'payment_transactions'), where('consultationId', '==', consultationId));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data() as PaymentTransaction;
    } catch (error) {
      console.warn('Firestore payment transaction lookup fallback:', error);
      return null;
    }
  }

  public async listPaymentTransactionsByUserId(userId: string): Promise<PaymentTransaction[]> {
    try {
      const q = query(
        collection(db, 'payment_transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as PaymentTransaction);
    } catch (error) {
      console.warn('Firestore payment transactions list fallback:', error);
      return [];
    }
  }

  public async listPaymentTransactionsByAstrologerId(astrologerId: string): Promise<PaymentTransaction[]> {
    try {
      const q = query(
        collection(db, 'payment_transactions'),
        where('astrologerId', '==', astrologerId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as PaymentTransaction);
    } catch (error) {
      console.warn('Firestore payment transactions list fallback:', error);
      return [];
    }
  }

  public async listAllPaymentTransactions(): Promise<PaymentTransaction[]> {
    try {
      const q = query(collection(db, 'payment_transactions'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as PaymentTransaction);
    } catch (error) {
      console.warn('Firestore all payment transactions list fallback:', error);
      return [];
    }
  }

  public async updatePaymentTransaction(txId: string, updates: Partial<Omit<PaymentTransaction, 'id' | 'createdAt'>>): Promise<PaymentTransaction | null> {
    const path = `payment_transactions/${txId}`;
    try {
      const ref = doc(db, 'payment_transactions', txId);
      const updatedData = cleanUndefined({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(ref, updatedData);
      return await this.getPaymentTransactionById(txId);
    } catch (error) {
      console.warn('Firestore payment transaction update fallback:', error);
      return null;
    }
  }

  public async savePaymentAuditLog(log: PaymentAuditLog): Promise<PaymentAuditLog> {
    try {
      await setDoc(doc(db, 'payment_audit_logs', log.id), cleanUndefined(log));
      return { ...log };
    } catch (error) {
      console.warn('Firestore audit log save fallback:', error);
      return { ...log };
    }
  }

  public async listPaymentAuditLogsByTransactionId(transactionId: string): Promise<PaymentAuditLog[]> {
    try {
      const q = query(
        collection(db, 'payment_audit_logs'),
        where('transactionId', '==', transactionId),
        orderBy('timestamp', 'asc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as PaymentAuditLog);
    } catch (error) {
      console.warn('Firestore audit logs list fallback:', error);
      return [];
    }
  }

  // ==========================================================================
  // ASTROLOGER EARNINGS REPOSITORY (Step 22)
  // ==========================================================================

  public async saveAstrologerEarning(earning: AstrologerEarningRecord): Promise<AstrologerEarningRecord> {
    const path = `astrologer_earnings/${earning.id}`;
    try {
      await setDoc(doc(db, 'astrologer_earnings', earning.id), cleanUndefined(earning));
      return { ...earning };
    } catch (error) {
      console.warn('Firestore saveAstrologerEarning fallback:', error);
      return { ...earning };
    }
  }

  public async getAstrologerEarningById(earningId: string): Promise<AstrologerEarningRecord | null> {
    const path = `astrologer_earnings/${earningId}`;
    try {
      const snap = await getDoc(doc(db, 'astrologer_earnings', earningId));
      if (!snap.exists()) return null;
      return snap.data() as AstrologerEarningRecord;
    } catch (error) {
      console.warn('Firestore getAstrologerEarningById fallback:', error);
      return null;
    }
  }

  public async listAstrologerEarningsByAstrologerUserId(astrologerUserId: string): Promise<AstrologerEarningRecord[]> {
    try {
      const q = query(
        collection(db, 'astrologer_earnings'),
        where('astrologerUserId', '==', astrologerUserId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as AstrologerEarningRecord);
    } catch (error) {
      console.warn('Firestore listAstrologerEarningsByAstrologerUserId fallback:', error);
      return [];
    }
  }

  public async listAllAstrologerEarnings(): Promise<AstrologerEarningRecord[]> {
    try {
      const snap = await getDocs(collection(db, 'astrologer_earnings'));
      return snap.docs.map(d => d.data() as AstrologerEarningRecord);
    } catch (error) {
      console.warn('Firestore listAllAstrologerEarnings fallback:', error);
      return [];
    }
  }

  public async updateAstrologerEarning(earningId: string, updates: Partial<Omit<AstrologerEarningRecord, 'id' | 'createdAt'>>): Promise<AstrologerEarningRecord | null> {
    const path = `astrologer_earnings/${earningId}`;
    try {
      const ref = doc(db, 'astrologer_earnings', earningId);
      const updatedData = cleanUndefined({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(ref, updatedData);
      return await this.getAstrologerEarningById(earningId);
    } catch (error) {
      console.warn('Firestore updateAstrologerEarning fallback:', error);
      return null;
    }
  }

  // ==========================================================================
  // PLATFORM EARNINGS REPOSITORY (Step 22)
  // ==========================================================================

  public async savePlatformEarning(earning: PlatformEarningRecord): Promise<PlatformEarningRecord> {
    const path = `platform_earnings/${earning.id}`;
    try {
      await setDoc(doc(db, 'platform_earnings', earning.id), cleanUndefined(earning));
      return { ...earning };
    } catch (error) {
      console.warn('Firestore savePlatformEarning fallback:', error);
      return { ...earning };
    }
  }

  public async getPlatformEarningById(earningId: string): Promise<PlatformEarningRecord | null> {
    const path = `platform_earnings/${earningId}`;
    try {
      const snap = await getDoc(doc(db, 'platform_earnings', earningId));
      if (!snap.exists()) return null;
      return snap.data() as PlatformEarningRecord;
    } catch (error) {
      console.warn('Firestore getPlatformEarningById fallback:', error);
      return null;
    }
  }

  public async listAllPlatformEarnings(): Promise<PlatformEarningRecord[]> {
    try {
      const snap = await getDocs(collection(db, 'platform_earnings'));
      return snap.docs.map(d => d.data() as PlatformEarningRecord);
    } catch (error) {
      console.warn('Firestore listAllPlatformEarnings fallback:', error);
      return [];
    }
  }

  // ==========================================================================
  // ASTROLOGER PAYOUTS REPOSITORY (Step 23)
  // ==========================================================================

  public async saveAstrologerPayout(payout: AstrologerPayoutRecord): Promise<AstrologerPayoutRecord> {
    const path = `astrologer_payouts/${payout.id}`;
    try {
      await setDoc(doc(db, 'astrologer_payouts', payout.id), cleanUndefined(payout));
      return { ...payout };
    } catch (error) {
      console.warn('Firestore saveAstrologerPayout fallback:', error);
      return { ...payout };
    }
  }

  public async getAstrologerPayoutById(payoutId: string): Promise<AstrologerPayoutRecord | null> {
    const path = `astrologer_payouts/${payoutId}`;
    try {
      const snap = await getDoc(doc(db, 'astrologer_payouts', payoutId));
      if (!snap.exists()) return null;
      return snap.data() as AstrologerPayoutRecord;
    } catch (error) {
      console.warn('Firestore getAstrologerPayoutById fallback:', error);
      return null;
    }
  }

  public async listAstrologerPayoutsByAstrologerUserId(astrologerUserId: string): Promise<AstrologerPayoutRecord[]> {
    try {
      const q = query(
        collection(db, 'astrologer_payouts'),
        where('astrologerUserId', '==', astrologerUserId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as AstrologerPayoutRecord);
    } catch (error) {
      console.warn('Firestore listAstrologerPayoutsByAstrologerUserId fallback:', error);
      return [];
    }
  }

  public async listAllAstrologerPayouts(): Promise<AstrologerPayoutRecord[]> {
    try {
      const snap = await getDocs(collection(db, 'astrologer_payouts'));
      return snap.docs.map(d => d.data() as AstrologerPayoutRecord);
    } catch (error) {
      console.warn('Firestore listAllAstrologerPayouts fallback:', error);
      return [];
    }
  }

  public async updateAstrologerPayout(
    payoutId: string, 
    updates: Partial<Omit<AstrologerPayoutRecord, 'id' | 'createdAt'>>
  ): Promise<AstrologerPayoutRecord | null> {
    const path = `astrologer_payouts/${payoutId}`;
    try {
      const ref = doc(db, 'astrologer_payouts', payoutId);
      const updatedData = cleanUndefined({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(ref, updatedData);
      return await this.getAstrologerPayoutById(payoutId);
    } catch (error) {
      console.warn('Firestore updateAstrologerPayout fallback:', error);
      return null;
    }
  }

  // Step 24 Notification Methods
  public async saveNotification(notification: InAppNotification): Promise<InAppNotification> {
    const path = `notifications/${notification.id}`;
    try {
      const ref = doc(db, 'notifications', notification.id);
      await setDoc(ref, cleanUndefined(notification));
      return { ...notification };
    } catch (error) {
      console.warn('Firestore saveNotification write fallback:', error);
      return { ...notification };
    }
  }

  public async listNotificationsByUserId(userId: string, limitCount: number = 30): Promise<InAppNotification[]> {
    const path = 'notifications';
    try {
      const q = query(
        collection(db, 'notifications'),
        where('recipientUserId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as InAppNotification);
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn('Firestore listNotificationsByUserId offline fallback:', error);
        return [];
      }
      // Fallback query without orderBy if index is building or missing
      try {
        const qSimple = query(
          collection(db, 'notifications'),
          where('recipientUserId', '==', userId),
          limit(limitCount)
        );
        const snap = await getDocs(qSimple);
        const list = snap.docs.map(d => d.data() as InAppNotification);
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (innerErr) {
        console.warn('Firestore listNotificationsByUserId simple query fallback:', innerErr);
        return [];
      }
    }
  }

  public async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const list = await this.listNotificationsByUserId(userId, 100);
      return list.filter(n => !n.isRead).length;
    } catch (error) {
      console.warn('Firestore getUnreadNotificationCount fallback:', error);
      return 0;
    }
  }

  public async markNotificationAsRead(notifId: string, userId: string): Promise<InAppNotification | null> {
    const path = `notifications/${notifId}`;
    try {
      const ref = doc(db, 'notifications', notifId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const notif = snap.data() as InAppNotification;
      if (notif.recipientUserId !== userId) return null;
      
      const now = new Date().toISOString();
      const updates = {
        isRead: true,
        readAt: notif.readAt || now,
      };
      await updateDoc(ref, updates);
      return { ...notif, ...updates };
    } catch (error) {
      console.warn('Firestore markNotificationAsRead fallback:', error);
      return null;
    }
  }

  public async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      const list = await this.listNotificationsByUserId(userId, 50);
      const unread = list.filter(n => !n.isRead);
      if (unread.length === 0) return true;

      const now = new Date().toISOString();
      for (const n of unread) {
        const ref = doc(db, 'notifications', n.id);
        await updateDoc(ref, { isRead: true, readAt: now });
      }
      return true;
    } catch (error) {
      console.warn('Firestore markAllNotificationsAsRead fallback:', error);
      return false;
    }
  }

  // ==========================================================================
  // PRODUCTION WALLETS & TRANSACTIONS REPOSITORY (STEP 70)
  // ==========================================================================

  public async getProductionWallet(userId: string): Promise<ProductionWallet | null> {
    const path = `wallets/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'wallets', userId));
      if (!snap.exists()) return null;
      return snap.data() as ProductionWallet;
    } catch (error) {
      if (isOfflineError(error)) return null;
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  public async saveProductionWallet(wallet: ProductionWallet): Promise<ProductionWallet> {
    const path = `wallets/${wallet.userId}`;
    const copy = { ...wallet, updatedAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, 'wallets', wallet.userId), cleanUndefined(copy));
      return { ...copy };
    } catch (error) {
      console.warn('Firestore saveProductionWallet fallback:', error);
      return { ...copy };
    }
  }

  public async getProductionWalletTransactionById(txId: string): Promise<ProductionWalletTransaction | null> {
    const path = `wallet_transactions/${txId}`;
    try {
      const snap = await getDoc(doc(db, 'wallet_transactions', txId));
      if (!snap.exists()) return null;
      return snap.data() as ProductionWalletTransaction;
    } catch (error) {
      if (isOfflineError(error)) return null;
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  public async listProductionWalletTransactionsByUserId(userId: string): Promise<ProductionWalletTransaction[]> {
    const path = `wallet_transactions`;
    try {
      const q = query(
        collection(db, 'wallet_transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as ProductionWalletTransaction);
    } catch (error) {
      if (isOfflineError(error)) return [];
      console.warn('Firestore listProductionWalletTransactions fallback:', error);
      return [];
    }
  }

  public async saveProductionWalletTransaction(tx: ProductionWalletTransaction): Promise<ProductionWalletTransaction> {
    const path = `wallet_transactions/${tx.id}`;
    try {
      await setDoc(doc(db, 'wallet_transactions', tx.id), cleanUndefined(tx));
      return { ...tx };
    } catch (error) {
      console.warn('Firestore saveProductionWalletTransaction fallback:', error);
      return { ...tx };
    }
  }

  // ==========================================================================
  // ASTROLOGER KYC REPOSITORY (STEP 71)
  // ==========================================================================

  public async saveAstrologerKyc(kyc: AstrologerKycRecord): Promise<AstrologerKycRecord> {
    const path = `astrologer_kyc/${kyc.kycId}`;
    try {
      await setDoc(doc(db, 'astrologer_kyc', kyc.kycId), cleanUndefined(kyc));
      return { ...kyc };
    } catch (error) {
      console.warn('Firestore saveAstrologerKyc fallback:', error);
      return { ...kyc };
    }
  }

  public async getAstrologerKycByAstrologerId(astrologerId: string): Promise<AstrologerKycRecord | null> {
    const path = `astrologer_kyc`;
    try {
      const q = query(collection(db, 'astrologer_kyc'), where('astrologerId', '==', astrologerId));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data() as AstrologerKycRecord;
    } catch (error) {
      if (isOfflineError(error)) return null;
      console.warn('Firestore getAstrologerKycByAstrologerId fallback:', error);
      return null;
    }
  }

  public async listAllAstrologerKycsForAdmin(): Promise<AstrologerKycRecord[]> {
    const path = `astrologer_kyc`;
    try {
      const snap = await getDocs(collection(db, 'astrologer_kyc'));
      return snap.docs.map(d => d.data() as AstrologerKycRecord);
    } catch (error) {
      if (isOfflineError(error)) return [];
      console.warn('Firestore listAllAstrologerKycsForAdmin fallback:', error);
      return [];
    }
  }

  // ==========================================================================
  // RTC CALL SESSIONS REPOSITORY (STEP 73)
  // ==========================================================================

  public async saveRtcCallSession(session: RtcCallSession): Promise<RtcCallSession> {
    const path = `consultations/${session.consultationId}/call_sessions/${session.id}`;
    const copy = { ...session, updatedAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, 'consultations', session.consultationId, 'call_sessions', session.id), cleanUndefined(copy));
      return { ...copy };
    } catch (error) {
      console.warn('Firestore saveRtcCallSession fallback:', error);
      return { ...copy };
    }
  }

  public async getRtcCallSessionById(sessionId: string): Promise<RtcCallSession | null> {
    const path = `consultations`;
    try {
      // Query group or direct doc fetch if consultationId known
      const q = query(
        collection(db, 'call_sessions'),
        where('id', '==', sessionId)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data() as RtcCallSession;
    } catch (error) {
      if (isOfflineError(error)) return null;
      console.warn('Firestore getRtcCallSessionById fallback:', error);
      return null;
    }
  }

  public async listRtcCallSessionsByConsultationId(consultationId: string): Promise<RtcCallSession[]> {
    const path = `consultations/${consultationId}/call_sessions`;
    try {
      const q = query(
        collection(db, 'consultations', consultationId, 'call_sessions'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as RtcCallSession);
    } catch (error) {
      if (isOfflineError(error)) return [];
      console.warn('Firestore listRtcCallSessionsByConsultationId fallback:', error);
      return [];
    }
  }

  // ==========================================================================
  // PUSH NOTIFICATIONS REPOSITORY (STEP 75)
  // ==========================================================================

  public async saveFcmToken(fcmToken: FcmTokenRecord): Promise<FcmTokenRecord> {
    const path = `fcm_tokens/${fcmToken.id}`;
    const copy = { ...fcmToken, updatedAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, 'fcm_tokens', fcmToken.id), cleanUndefined(copy));
      return { ...copy };
    } catch (error) {
      console.warn('Firestore saveFcmToken fallback:', error);
      return { ...copy };
    }
  }

  public async getFcmToken(tokenId: string): Promise<FcmTokenRecord | null> {
    const path = `fcm_tokens/${tokenId}`;
    try {
      const snap = await getDoc(doc(db, 'fcm_tokens', tokenId));
      if (!snap.exists()) return null;
      return snap.data() as FcmTokenRecord;
    } catch (error) {
      if (isOfflineError(error)) return null;
      console.warn('Firestore getFcmToken fallback:', error);
      return null;
    }
  }

  public async deleteFcmToken(tokenId: string): Promise<boolean> {
    const path = `fcm_tokens/${tokenId}`;
    try {
      await deleteDoc(doc(db, 'fcm_tokens', tokenId));
      return true;
    } catch (error) {
      console.warn('Firestore deleteFcmToken fallback:', error);
      return false;
    }
  }

  public async listFcmTokensByUserId(userId: string): Promise<FcmTokenRecord[]> {
    const path = `fcm_tokens`;
    try {
      const q = query(
        collection(db, 'fcm_tokens'),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as FcmTokenRecord);
    } catch (error) {
      if (isOfflineError(error)) return [];
      console.warn('Firestore listFcmTokensByUserId fallback:', error);
      return [];
    }
  }

  public async savePushNotificationAudit(audit: PushNotificationAuditRecord): Promise<PushNotificationAuditRecord> {
    const path = `push_notification_audits/${audit.id}`;
    const copy = { ...audit, updatedAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, 'push_notification_audits', audit.id), cleanUndefined(copy));
      return { ...copy };
    } catch (error) {
      console.warn('Firestore savePushNotificationAudit fallback:', error);
      return { ...copy };
    }
  }

  public async getPushNotificationAudit(auditId: string): Promise<PushNotificationAuditRecord | null> {
    const path = `push_notification_audits/${auditId}`;
    try {
      const snap = await getDoc(doc(db, 'push_notification_audits', auditId));
      if (!snap.exists()) return null;
      return snap.data() as PushNotificationAuditRecord;
    } catch (error) {
      if (isOfflineError(error)) return null;
      console.warn('Firestore getPushNotificationAudit fallback:', error);
      return null;
    }
  }

  public async listPushNotificationAuditsByUserId(userId: string): Promise<PushNotificationAuditRecord[]> {
    const path = `push_notification_audits`;
    try {
      const q = query(
        collection(db, 'push_notification_audits'),
        where('recipientUserId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as PushNotificationAuditRecord);
    } catch (error) {
      if (isOfflineError(error)) return [];
      console.warn('Firestore listPushNotificationAuditsByUserId fallback:', error);
      return [];
    }
  }

  public clear(): void {
    // No-op for remote Firestore
  }
}

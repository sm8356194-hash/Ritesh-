/**
 * Production Chat & Real-Time Presence Service (Step 72)
 * 
 * Manages authenticated real-time consultation chat messages, read receipt tracking,
 * unread counters, cross-tenant security enforcement, and practitioner presence state.
 */

import {
  UserAccount,
  ConsultationChatMessage,
  ChatMessageSenderRole,
  ChatMessageStatus,
  AstrologerAvailabilityStatus,
  ServiceResult,
  ConsultationRecord,
} from '../../types';
import { DataStore, globalDataStore } from '../data/dataStore';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { notificationService } from '../notification/notificationService';

export interface SendMessageInput {
  consultationId: string;
  message: string;
  sourceLanguage?: 'en' | 'hi' | 'other';
}

export type ChatUpdateCallback = (messages: ConsultationChatMessage[]) => void;

export class ProductionChatService {
  private dataStore: DataStore;
  private activeSubscriptions: Map<string, () => void> = new Map();

  constructor(dataStore: DataStore = globalDataStore) {
    this.dataStore = dataStore;
  }

  /**
   * Sends an authenticated production chat message in an active consultation.
   * Enforces server-side sender identity and consultation participant authorization.
   */
  public async sendProductionMessage(
    requestingUser: UserAccount | null,
    input: SendMessageInput
  ): Promise<ServiceResult<ConsultationChatMessage>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to send chat messages.',
        code: 'UNAUTHENTICATED',
      };
    }

    if (!input.message || input.message.trim().length === 0) {
      return {
        success: false,
        error: 'Message content cannot be empty.',
        code: 'VALIDATION_FAILED',
      };
    }

    const consultation = await this.dataStore.getConsultationById(input.consultationId);
    if (!consultation) {
      return {
        success: false,
        error: `Consultation session '${input.consultationId}' not found.`,
        code: 'NOT_FOUND',
      };
    }

    // Access control check: user must be client, assigned astrologer, or admin
    const isClient = consultation.userId === requestingUser.id;
    let isAstrologer = consultation.astrologerUserId === requestingUser.id;
    
    if (!isAstrologer && consultation.astrologerId) {
      const astroProfile = await this.dataStore.getAstrologerProfileById(consultation.astrologerId);
      if (astroProfile && astroProfile.userId === requestingUser.id) {
        isAstrologer = true;
      }
    }

    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isClient && !isAstrologer && !isAdmin) {
      return {
        success: false,
        error: 'Unauthorized access: You are not a participant in this consultation session.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    // Determine receiver identity
    let receiverId: string | undefined = undefined;
    if (isClient) {
      receiverId = consultation.astrologerUserId;
      if (!receiverId && consultation.astrologerId) {
        const astroProfile = await this.dataStore.getAstrologerProfileById(consultation.astrologerId);
        if (astroProfile) receiverId = astroProfile.userId;
      }
    } else if (isAstrologer) {
      receiverId = consultation.userId;
    }

    const senderRole: ChatMessageSenderRole = isAstrologer 
      ? 'ASTROLOGER' 
      : (isAdmin ? 'SYSTEM' : 'USER');

    const now = new Date().toISOString();
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const messageRecord: ConsultationChatMessage = {
      id: msgId,
      consultationId: input.consultationId,
      senderId: requestingUser.id, // Authoritative UID
      senderName: requestingUser.displayName || 'User',
      senderRole,
      receiverId,
      message: input.message.trim(),
      timestamp: now,
      updatedAt: now,
      isRead: false,
      status: 'SENT',
      isDemo: false,
      sourceLanguage: input.sourceLanguage || requestingUser.preferredLanguage || 'en',
    };

    const saved = await this.dataStore.saveChatMessage(messageRecord);

    if (receiverId) {
      notificationService.createNotification({
        recipientUserId: receiverId,
        type: 'NEW_CHAT_MESSAGE',
        title: 'New Chat Message',
        titleHi: 'नया संदेश',
        message: `${requestingUser.displayName}: ${input.message}`,
        messageHi: `${requestingUser.displayName}: ${input.message}`,
        relatedEntityId: input.consultationId,
        relatedEntityType: 'CONSULTATION',
        idempotencyKey: `msg_${msgId}`,
      }, requestingUser).catch(err => console.warn('Chat push error:', err));
    }

    return {
      success: true,
      data: saved,
    };
  }

  /**
   * Retrieves persistent chat history for a consultation session.
   * Automatically marks unread messages addressed to the caller as read.
   */
  public async getChatHistory(
    requestingUser: UserAccount | null,
    consultationId: string
  ): Promise<ServiceResult<ConsultationChatMessage[]>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to access chat history.',
        code: 'UNAUTHENTICATED',
      };
    }

    const consultation = await this.dataStore.getConsultationById(consultationId);
    if (!consultation) {
      return {
        success: false,
        error: `Consultation session '${consultationId}' not found.`,
        code: 'NOT_FOUND',
      };
    }

    // Access control check
    const isClient = consultation.userId === requestingUser.id;
    let isAstrologer = consultation.astrologerUserId === requestingUser.id;
    
    if (!isAstrologer && consultation.astrologerId) {
      const astroProfile = await this.dataStore.getAstrologerProfileById(consultation.astrologerId);
      if (astroProfile && astroProfile.userId === requestingUser.id) {
        isAstrologer = true;
      }
    }

    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isClient && !isAstrologer && !isAdmin) {
      return {
        success: false,
        error: 'Unauthorized access: You are not a participant in this consultation session.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const messages = await this.dataStore.listChatMessagesByConsultationId(consultationId);

    // Mark unread messages addressed to caller as READ
    const now = new Date().toISOString();
    let updatedAny = false;

    for (const msg of messages) {
      if (!msg.isRead && msg.senderId !== requestingUser.id) {
        msg.isRead = true;
        msg.readAt = now;
        msg.status = 'READ';
        await this.dataStore.saveChatMessage(msg);
        updatedAny = true;
      }
    }

    const updatedList = updatedAny
      ? await this.dataStore.listChatMessagesByConsultationId(consultationId)
      : messages;

    return {
      success: true,
      data: updatedList,
    };
  }

  /**
   * Subscribes to real-time chat updates via Firestore snapshot listener.
   */
  public subscribeToChatMessages(
    requestingUser: UserAccount | null,
    consultationId: string,
    onUpdate: ChatUpdateCallback
  ): () => void {
    if (!requestingUser) {
      onUpdate([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'consultations', consultationId, 'messages'),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const msgs = snapshot.docs.map(doc => doc.data() as ConsultationChatMessage);
          onUpdate(msgs);
        },
        (error) => {
          console.warn('Firestore chat listener fallback:', error);
          // Fallback to DataStore poll
          this.dataStore.listChatMessagesByConsultationId(consultationId).then(msgs => {
            onUpdate(msgs);
          });
        }
      );

      this.activeSubscriptions.set(consultationId, unsubscribe);
      return unsubscribe;
    } catch (e) {
      console.warn('Real-time subscription fallback:', e);
      this.dataStore.listChatMessagesByConsultationId(consultationId).then(msgs => {
        onUpdate(msgs);
      });
      return () => {};
    }
  }

  /**
   * Computes unread message count for the requesting user across or within a consultation.
   */
  public async getUnreadMessageCount(
    requestingUser: UserAccount | null,
    consultationId?: string
  ): Promise<number> {
    if (!requestingUser) return 0;

    if (consultationId) {
      const msgs = await this.dataStore.listChatMessagesByConsultationId(consultationId);
      return msgs.filter(m => !m.isRead && m.senderId !== requestingUser.id).length;
    }

    const consultations = requestingUser.role === 'ASTROLOGER'
      ? await this.dataStore.listConsultationsByAstrologerId(requestingUser.id)
      : await this.dataStore.listConsultationsByUserId(requestingUser.id);

    let totalUnread = 0;
    for (const c of consultations) {
      const msgs = await this.dataStore.listChatMessagesByConsultationId(c.id);
      totalUnread += msgs.filter(m => !m.isRead && m.senderId !== requestingUser.id).length;
    }

    return totalUnread;
  }

  /**
   * Presence Heartbeat & Availability State Management.
   */
  public async updatePresenceHeartbeat(
    requestingUser: UserAccount | null,
    astrologerId: string,
    status: AstrologerAvailabilityStatus
  ): Promise<ServiceResult<{ availabilityStatus: AstrologerAvailabilityStatus; isOnline: boolean; lastActiveAt: string }>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required for presence heartbeat.',
        code: 'UNAUTHENTICATED',
      };
    }

    const profile = await this.dataStore.getAstrologerProfileById(astrologerId);
    if (!profile) {
      return {
        success: false,
        error: `Astrologer profile '${astrologerId}' not found.`,
        code: 'NOT_FOUND',
      };
    }

    if (profile.userId !== requestingUser.id && requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized presence update.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const now = new Date().toISOString();
    const isOnline = status === 'ONLINE';

    await this.dataStore.updateAstrologerProfile(astrologerId, {
      availabilityStatus: status,
      isOnline,
    });

    return {
      success: true,
      data: {
        availabilityStatus: status,
        isOnline,
        lastActiveAt: now,
      },
    };
  }
}

export const productionChatService = new ProductionChatService();

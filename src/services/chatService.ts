/**
 * Chat Service
 * 
 * Manages secure consultation session messages between clients and verified astrologers.
 */

import { ConsultationChatMessage, ChatMessageSenderRole, UserAccount, ServiceResult } from '../types';
import { DataStore, globalDataStore } from './data/dataStore';

export class ChatService {
  private dataStore: DataStore;

  constructor(dataStore: DataStore = globalDataStore) {
    this.dataStore = dataStore;
  }

  /**
   * Sends a message within an authorized consultation session.
   */
  public async sendMessage(
    requestingUser: UserAccount | null,
    params: {
      consultationId: string;
      message: string;
    }
  ): Promise<ServiceResult<ConsultationChatMessage>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to send chat messages.',
        code: 'UNAUTHENTICATED',
      };
    }

    if (!params.message || params.message.trim().length === 0) {
      return {
        success: false,
        error: 'Message content cannot be empty.',
        code: 'EMPTY_MESSAGE',
      };
    }

    const consultation = await this.dataStore.getConsultationById(params.consultationId);
    if (!consultation) {
      return {
        success: false,
        error: 'Consultation session not found.',
        code: 'CONSULTATION_NOT_FOUND',
      };
    }

    const astrologer = await this.dataStore.getAstrologerProfileById(consultation.astrologerId);
    const isClient = consultation.userId === requestingUser.id;
    const isAstrologer = astrologer?.userId === requestingUser.id;
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isClient && !isAstrologer && !isAdmin) {
      return {
        success: false,
        error: 'Unauthorized: You are not an authorized participant in this consultation chat.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    let senderRole: ChatMessageSenderRole = 'USER';
    if (isAstrologer) senderRole = 'ASTROLOGER';
    else if (isAdmin && !isClient) senderRole = 'SYSTEM';

    const now = new Date().toISOString();
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const chatMsg: ConsultationChatMessage = {
      id: messageId,
      consultationId: consultation.id,
      senderId: requestingUser.id,
      senderName: requestingUser.displayName,
      senderRole,
      message: params.message.trim(),
      timestamp: now,
      isRead: false,
    };

    const saved = await this.dataStore.saveChatMessage(chatMsg);
    return {
      success: true,
      data: saved,
    };
  }

  /**
   * Retrieves all chat messages for a consultation session with participant check.
   */
  public async getMessagesForConsultation(
    requestingUser: UserAccount | null,
    consultationId: string
  ): Promise<ServiceResult<ConsultationChatMessage[]>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED',
      };
    }

    const consultation = await this.dataStore.getConsultationById(consultationId);
    if (!consultation) {
      return {
        success: false,
        error: 'Consultation session not found.',
        code: 'CONSULTATION_NOT_FOUND',
      };
    }

    const astrologer = await this.dataStore.getAstrologerProfileById(consultation.astrologerId);
    const isClient = consultation.userId === requestingUser.id;
    const isAstrologer = astrologer?.userId === requestingUser.id;
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isClient && !isAstrologer && !isAdmin) {
      return {
        success: false,
        error: 'Unauthorized access.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const messages = await this.dataStore.listChatMessagesByConsultationId(consultationId);
    return {
      success: true,
      data: messages,
    };
  }

  /**
   * Records a simulated demo astrologer response/greeting into the consultation message history.
   * Strictly enforces participant authorization (client, astrologer, admin).
   */
  public async sendDemoAstrologerMessage(
    requestingUser: UserAccount | null,
    params: {
      consultationId: string;
      message: string;
      sourceLanguage?: 'en' | 'hi';
    }
  ): Promise<ServiceResult<ConsultationChatMessage>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED',
      };
    }

    if (!params.message || params.message.trim().length === 0) {
      return {
        success: false,
        error: 'Message content cannot be empty.',
        code: 'EMPTY_MESSAGE',
      };
    }

    const consultation = await this.dataStore.getConsultationById(params.consultationId);
    if (!consultation) {
      return {
        success: false,
        error: 'Consultation session not found.',
        code: 'CONSULTATION_NOT_FOUND',
      };
    }

    const astrologer = await this.dataStore.getAstrologerProfileById(consultation.astrologerId);
    const isClient = consultation.userId === requestingUser.id;
    const isAstrologer = astrologer?.userId === requestingUser.id;
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isClient && !isAstrologer && !isAdmin) {
      return {
        success: false,
        error: 'Unauthorized access.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const now = new Date().toISOString();
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const chatMsg: ConsultationChatMessage = {
      id: messageId,
      consultationId: consultation.id,
      senderId: astrologer?.id || consultation.astrologerId || 'demo_astrologer',
      senderName: consultation.astrologerName || astrologer?.name || 'Astrologer',
      senderRole: 'ASTROLOGER',
      message: params.message.trim(),
      timestamp: now,
      isRead: true,
      sourceLanguage: params.sourceLanguage || 'en',
    };

    const saved = await this.dataStore.saveChatMessage(chatMsg);
    return {
      success: true,
      data: saved,
    };
  }
}

export const chatService = new ChatService();

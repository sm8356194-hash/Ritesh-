/**
 * Consultation Service
 * 
 * Manages consultation bookings, lifecycle state transitions (REQUESTED → CONFIRMED → ACTIVE → COMPLETED / REJECTED / CANCELLED),
 * and strict authorization boundaries between clients, astrologers, and administrators.
 */

import { ConsultationRecord, ConsultationStatus, ConsultationType, UserAccount, ServiceResult } from '../types';
import { DataStore, globalDataStore } from './data/dataStore';
import { NotificationService, notificationService as defaultNotificationService } from './notification/notificationService';

export class ConsultationService {
  private dataStore: DataStore;
  private notificationService: NotificationService;

  constructor(
    dataStore: DataStore = globalDataStore,
    notifService: NotificationService = defaultNotificationService
  ) {
    this.dataStore = dataStore;
    this.notificationService = notifService;
  }

  /**
   * Books a consultation session for the authenticated client.
   */
  public async bookConsultation(
    requestingUser: UserAccount | null,
    params: {
      astrologerId: string;
      type: ConsultationType;
      scheduledDate: string; // YYYY-MM-DD
      scheduledTime: string; // HH:MM
      durationMinutes: number;
      birthProfileId?: string;
      topic?: string;
    }
  ): Promise<ServiceResult<ConsultationRecord>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to book a consultation.',
        code: 'UNAUTHENTICATED',
      };
    }

    const astrologer = await this.dataStore.getAstrologerProfileById(params.astrologerId);
    if (!astrologer) {
      return {
        success: false,
        error: `Astrologer '${params.astrologerId}' not found.`,
        code: 'ASTROLOGER_NOT_FOUND',
      };
    }

    if (!astrologer.isApproved && requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Consultations can only be booked with approved astrologers.',
        code: 'ASTROLOGER_NOT_APPROVED',
      };
    }

    if (params.birthProfileId) {
      const birthProfile = await this.dataStore.getBirthProfileById(params.birthProfileId);
      if (!birthProfile || (birthProfile.userId !== requestingUser.id && requestingUser.role !== 'ADMIN')) {
        return {
          success: false,
          error: 'Specified birth profile does not exist or does not belong to you.',
          code: 'INVALID_BIRTH_PROFILE',
        };
      }
    }

    // Duplicate request protection: check if user already has an active/requested consultation with this astrologer
    const existingUserConsultations = await this.dataStore.listConsultationsByUserId(requestingUser.id);
    const activeDuplicate = existingUserConsultations.find(c => 
      c.astrologerId === params.astrologerId &&
      (c.status === 'REQUESTED' || c.status === 'CONFIRMED' || c.status === 'ACTIVE' || c.status === 'Requested' || c.status === 'Accepted')
    );

    if (activeDuplicate) {
      return {
        success: false,
        error: 'You already have an active or pending consultation request with this astrologer.',
        code: 'DUPLICATE_CONSULTATION_REQUEST',
      };
    }

    const now = new Date().toISOString();
    const consultationId = `cns_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const duration = Math.max(5, params.durationMinutes);
    const ratePerMinute = astrologer.perMinuteCharge && astrologer.perMinuteCharge > 0 ? astrologer.perMinuteCharge : 15;
    const fee = duration * ratePerMinute;
    const currency = 'INR';

    const consultation: ConsultationRecord = {
      id: consultationId,
      userId: requestingUser.id,
      userName: requestingUser.displayName,
      astrologerId: astrologer.id,
      astrologerName: astrologer.name,
      astrologerUserId: astrologer.userId,
      birthProfileId: params.birthProfileId,
      type: params.type,
      status: 'REQUESTED',
      paymentStatus: 'UNPAID',
      fee,
      currency,
      priceSnapshot: {
        fee,
        currency,
        ratePerMinute,
        durationMinutes: duration,
      },
      scheduledDate: params.scheduledDate.trim(),
      scheduledTime: params.scheduledTime.trim(),
      durationMinutes: duration,
      topic: params.topic?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.dataStore.saveConsultation(consultation);

    // Issue In-App Notification to Astrologer
    if (astrologer.userId) {
      await this.notificationService.notifyConsultationRequested(
        astrologer.userId,
        requestingUser.displayName,
        saved.id,
        saved.type
      );
    }

    return {
      success: true,
      data: saved,
    };
  }

  /**
   * Retrieves a consultation record by ID with authorization check.
   */
  public async getConsultationById(
    requestingUser: UserAccount | null,
    consultationId: string
  ): Promise<ServiceResult<ConsultationRecord>> {
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
        error: `Consultation '${consultationId}' not found.`,
        code: 'CONSULTATION_NOT_FOUND',
      };
    }

    const astrologerProfile = await this.dataStore.getAstrologerProfileById(consultation.astrologerId);
    const isClient = consultation.userId === requestingUser.id;
    const isAstrologer = (consultation.astrologerUserId && consultation.astrologerUserId === requestingUser.id) || (astrologerProfile?.userId === requestingUser.id);
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isClient && !isAstrologer && !isAdmin) {
      return {
        success: false,
        error: 'Unauthorized access: You are not a participant in this consultation.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    return {
      success: true,
      data: consultation,
    };
  }

  /**
   * Lists consultations for a client user.
   */
  public async listUserConsultations(
    requestingUser: UserAccount | null,
    targetUserId: string
  ): Promise<ServiceResult<ConsultationRecord[]>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED',
      };
    }

    if (requestingUser.id !== targetUserId && requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized access: You cannot view another user\'s consultations.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const records = await this.dataStore.listConsultationsByUserId(targetUserId);
    return {
      success: true,
      data: records,
    };
  }

  /**
   * Lists consultations for an astrologer.
   */
  public async listAstrologerConsultations(
    requestingUser: UserAccount | null,
    astrologerId: string
  ): Promise<ServiceResult<ConsultationRecord[]>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED',
      };
    }

    const astrologer = await this.dataStore.getAstrologerProfileById(astrologerId);
    if (!astrologer) {
      return {
        success: false,
        error: 'Astrologer not found.',
        code: 'ASTROLOGER_NOT_FOUND',
      };
    }

    if (astrologer.userId !== requestingUser.id && requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized: You cannot view consultations belonging to another astrologer.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const records = await this.dataStore.listConsultationsByAstrologerId(astrologerId);
    return {
      success: true,
      data: records,
    };
  }

  /**
   * Lists all consultations across all clients and astrologers for Admin platform oversight.
   */
  public async listAllConsultationsForAdmin(
    requestingUser: UserAccount | null
  ): Promise<ServiceResult<ConsultationRecord[]>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED',
      };
    }

    if (requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized access: Platform consultation oversight requires administrator privileges.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const records = await this.dataStore.listAllConsultations();
    return {
      success: true,
      data: records,
    };
  }

  /**
   * Astrologer accepts a REQUESTED consultation -> CONFIRMED
   */
  public async acceptConsultation(
    requestingUser: UserAccount | null,
    consultationId: string
  ): Promise<ServiceResult<ConsultationRecord>> {
    if (!requestingUser) {
      return { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' };
    }

    const consultation = await this.dataStore.getConsultationById(consultationId);
    if (!consultation) {
      return { success: false, error: 'Consultation not found.', code: 'CONSULTATION_NOT_FOUND' };
    }

    const astrologer = await this.dataStore.getAstrologerProfileById(consultation.astrologerId);
    const isAstrologer = (consultation.astrologerUserId === requestingUser.id) || (astrologer?.userId === requestingUser.id);
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isAstrologer && !isAdmin) {
      return { success: false, error: 'Only the assigned astrologer can accept this request.', code: 'UNAUTHORIZED_ACCESS' };
    }

    if (consultation.status !== 'REQUESTED' && consultation.status !== 'Requested') {
      return { success: false, error: `Cannot accept consultation in status '${consultation.status}'.`, code: 'INVALID_STATUS_TRANSITION' };
    }

    const now = new Date().toISOString();
    const updated = await this.dataStore.updateConsultation(consultationId, {
      status: 'CONFIRMED',
      confirmedAt: now,
    });

    // Notify client user
    await this.notificationService.notifyConsultationStatusChanged(
      consultation.userId,
      consultationId,
      'CONFIRMED',
      requestingUser.displayName
    );

    return { success: true, data: updated! };
  }

  /**
   * Astrologer rejects a REQUESTED consultation -> REJECTED
   */
  public async rejectConsultation(
    requestingUser: UserAccount | null,
    consultationId: string,
    reason?: string
  ): Promise<ServiceResult<ConsultationRecord>> {
    if (!requestingUser) {
      return { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' };
    }

    const consultation = await this.dataStore.getConsultationById(consultationId);
    if (!consultation) {
      return { success: false, error: 'Consultation not found.', code: 'CONSULTATION_NOT_FOUND' };
    }

    const astrologer = await this.dataStore.getAstrologerProfileById(consultation.astrologerId);
    const isAstrologer = (consultation.astrologerUserId === requestingUser.id) || (astrologer?.userId === requestingUser.id);
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isAstrologer && !isAdmin) {
      return { success: false, error: 'Only the assigned astrologer can reject this request.', code: 'UNAUTHORIZED_ACCESS' };
    }

    if (consultation.status !== 'REQUESTED' && consultation.status !== 'Requested') {
      return { success: false, error: `Cannot reject consultation in status '${consultation.status}'.`, code: 'INVALID_STATUS_TRANSITION' };
    }

    const now = new Date().toISOString();
    const updated = await this.dataStore.updateConsultation(consultationId, {
      status: 'REJECTED',
      rejectedAt: now,
      rejectionReason: reason?.trim() || undefined,
    });

    // Notify client user
    await this.notificationService.notifyConsultationStatusChanged(
      consultation.userId,
      consultationId,
      'REJECTED',
      requestingUser.displayName
    );

    return { success: true, data: updated! };
  }

  /**
   * Astrologer starts a CONFIRMED consultation -> ACTIVE
   */
  public async startConsultation(
    requestingUser: UserAccount | null,
    consultationId: string
  ): Promise<ServiceResult<ConsultationRecord>> {
    if (!requestingUser) {
      return { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' };
    }

    const consultation = await this.dataStore.getConsultationById(consultationId);
    if (!consultation) {
      return { success: false, error: 'Consultation not found.', code: 'CONSULTATION_NOT_FOUND' };
    }

    const astrologer = await this.dataStore.getAstrologerProfileById(consultation.astrologerId);
    const isAstrologer = (consultation.astrologerUserId === requestingUser.id) || (astrologer?.userId === requestingUser.id);
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isAstrologer && !isAdmin) {
      return { success: false, error: 'Only the assigned astrologer can start this consultation.', code: 'UNAUTHORIZED_ACCESS' };
    }

    if (consultation.status !== 'CONFIRMED' && consultation.status !== 'Accepted') {
      return { success: false, error: `Cannot start consultation in status '${consultation.status}'. Must be confirmed first.`, code: 'INVALID_STATUS_TRANSITION' };
    }

    const now = new Date().toISOString();
    const updated = await this.dataStore.updateConsultation(consultationId, {
      status: 'ACTIVE',
      startedAt: now,
    });

    // Notify client user
    await this.notificationService.notifyConsultationStatusChanged(
      consultation.userId,
      consultationId,
      'ACTIVE',
      requestingUser.displayName
    );

    return { success: true, data: updated! };
  }

  /**
   * Astrologer completes an ACTIVE consultation -> COMPLETED
   */
  public async completeConsultation(
    requestingUser: UserAccount | null,
    consultationId: string
  ): Promise<ServiceResult<ConsultationRecord>> {
    if (!requestingUser) {
      return { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' };
    }

    const consultation = await this.dataStore.getConsultationById(consultationId);
    if (!consultation) {
      return { success: false, error: 'Consultation not found.', code: 'CONSULTATION_NOT_FOUND' };
    }

    const astrologer = await this.dataStore.getAstrologerProfileById(consultation.astrologerId);
    const isAstrologer = (consultation.astrologerUserId === requestingUser.id) || (astrologer?.userId === requestingUser.id);
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isAstrologer && !isAdmin) {
      return { success: false, error: 'Only the assigned astrologer can complete this consultation.', code: 'UNAUTHORIZED_ACCESS' };
    }

    if (consultation.status !== 'ACTIVE') {
      return { success: false, error: `Cannot complete consultation in status '${consultation.status}'. Must be active.`, code: 'INVALID_STATUS_TRANSITION' };
    }

    const now = new Date().toISOString();
    const updated = await this.dataStore.updateConsultation(consultationId, {
      status: 'COMPLETED',
      completedAt: now,
    });

    // Notify client user
    await this.notificationService.notifyConsultationStatusChanged(
      consultation.userId,
      consultationId,
      'COMPLETED',
      requestingUser.displayName
    );

    return { success: true, data: updated! };
  }

  /**
   * Cancels a consultation (by client, astrologer, or admin) before completion.
   */
  public async cancelConsultation(
    requestingUser: UserAccount | null,
    consultationId: string,
    reason?: string
  ): Promise<ServiceResult<ConsultationRecord>> {
    if (!requestingUser) {
      return { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' };
    }

    const consultation = await this.dataStore.getConsultationById(consultationId);
    if (!consultation) {
      return { success: false, error: 'Consultation not found.', code: 'CONSULTATION_NOT_FOUND' };
    }

    const astrologer = await this.dataStore.getAstrologerProfileById(consultation.astrologerId);
    const isClient = consultation.userId === requestingUser.id;
    const isAstrologer = (consultation.astrologerUserId === requestingUser.id) || (astrologer?.userId === requestingUser.id);
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isClient && !isAstrologer && !isAdmin) {
      return { success: false, error: 'Unauthorized access.', code: 'UNAUTHORIZED_ACCESS' };
    }

    if (consultation.status === 'COMPLETED' || consultation.status === 'CANCELLED' || consultation.status === 'REJECTED') {
      return { success: false, error: `Cannot cancel consultation already in status '${consultation.status}'.`, code: 'INVALID_STATUS_TRANSITION' };
    }

    const now = new Date().toISOString();
    const updated = await this.dataStore.updateConsultation(consultationId, {
      status: 'CANCELLED',
      cancelledAt: now,
      cancellationReason: reason?.trim() || undefined,
    });

    // Notify the other participant
    const targetUserId = isClient ? (consultation.astrologerUserId || astrologer?.userId) : consultation.userId;
    if (targetUserId) {
      await this.notificationService.notifyConsultationStatusChanged(
        targetUserId,
        consultationId,
        'CANCELLED',
        requestingUser.displayName
      );
    }

    return { success: true, data: updated! };
  }

  /**
   * General status update method for legacy support.
   */
  public async updateConsultationStatus(
    requestingUser: UserAccount | null,
    consultationId: string,
    newStatus: ConsultationStatus
  ): Promise<ServiceResult<ConsultationRecord>> {
    if (newStatus === 'CONFIRMED' || newStatus === 'Accepted') {
      return this.acceptConsultation(requestingUser, consultationId);
    }
    if (newStatus === 'ACTIVE') {
      return this.startConsultation(requestingUser, consultationId);
    }
    if (newStatus === 'COMPLETED') {
      return this.completeConsultation(requestingUser, consultationId);
    }
    if (newStatus === 'CANCELLED') {
      return this.cancelConsultation(requestingUser, consultationId);
    }
    if (newStatus === 'REJECTED') {
      return this.rejectConsultation(requestingUser, consultationId);
    }

    return {
      success: false,
      error: 'Unsupported status transition.',
      code: 'INVALID_STATUS_TRANSITION',
    };
  }
}

export const consultationService = new ConsultationService();

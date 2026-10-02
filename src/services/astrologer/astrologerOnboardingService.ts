/**
 * Astrologer Onboarding & Account Management Service (Step 71)
 * 
 * Manages practitioner onboarding applications, KYC verification metadata,
 * availability status transitions, and RBAC admin approval workflows.
 */

import {
  UserAccount,
  AstrologerProfile,
  AstrologerKycRecord,
  AstrologerAccountStatus,
  AstrologerAvailabilityStatus,
  AstrologerRates,
  ServiceResult,
} from '../../types';
import { DataStore, globalDataStore } from '../data/dataStore';

export interface SubmitOnboardingInput {
  name: string;
  title: string;
  bio: string;
  education: string;
  skills: string[];
  languages: string[];
  experienceYears: number;
  perMinuteCharge: number;
  rates?: AstrologerRates;
  documentType: 'Aadhaar' | 'PAN' | 'Passport' | 'Certificate' | 'Other';
  idNumberLast4?: string;
  documentReference?: string;
}

export class AstrologerOnboardingService {
  private dataStore: DataStore;

  constructor(dataStore: DataStore = globalDataStore) {
    this.dataStore = dataStore;
  }

  /**
   * Submits a production onboarding application for an authenticated astrologer user.
   */
  public async submitOnboardingApplication(
    requestingUser: UserAccount | null,
    input: SubmitOnboardingInput
  ): Promise<ServiceResult<{ profile: AstrologerProfile; kyc: AstrologerKycRecord }>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to submit astrologer onboarding application.',
        code: 'UNAUTHENTICATED',
      };
    }

    if (!input.name || input.name.trim().length < 2) {
      return {
        success: false,
        error: 'A valid full name is required for practitioner onboarding.',
        code: 'VALIDATION_FAILED',
      };
    }

    if (input.perMinuteCharge <= 0) {
      return {
        success: false,
        error: 'Consultation rate must be greater than zero.',
        code: 'INVALID_RATE',
      };
    }

    const now = new Date().toISOString();
    const astrologerId = `ast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const kycId = `kyc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const profile: AstrologerProfile = {
      id: astrologerId,
      userId: requestingUser.id,
      name: input.name.trim(),
      displayName: input.name.trim(),
      email: requestingUser.email,
      phone: requestingUser.phone,
      title: input.title.trim() || 'Vedic Astrologer',
      bio: input.bio.trim() || 'Professional practitioner in Vedic astrology.',
      education: input.education.trim() || 'Vedic Astrology Scholar',
      skills: input.skills && input.skills.length > 0 ? input.skills : ['Kundli'],
      languages: input.languages && input.languages.length > 0 ? input.languages : ['Hindi', 'English'],
      experienceYears: Math.max(0, input.experienceYears || 1),
      perMinuteCharge: Math.max(5, input.perMinuteCharge),
      rates: input.rates || {
        chat: input.perMinuteCharge,
        voice: input.perMinuteCharge + 5,
        video: input.perMinuteCharge + 10,
      },
      isOnline: false,
      availabilityStatus: 'OFFLINE',
      rating: 5.0,
      totalOrders: 0,
      status: 'PENDING',
      isApproved: false,
      isDemoUser: false,
      createdAt: now,
      updatedAt: now,
    };

    const kyc: AstrologerKycRecord = {
      kycId,
      astrologerId,
      userId: requestingUser.id,
      documentType: input.documentType,
      verificationStatus: 'PENDING',
      idNumberLast4: input.idNumberLast4,
      documentReference: input.documentReference || 'storage/kyc/pending_doc.pdf',
      submittedAt: now,
    };

    const savedProfile = await this.dataStore.saveAstrologerProfile(profile);
    const savedKyc = await this.dataStore.saveAstrologerKyc(kyc);

    // Update user role to ASTROLOGER if not already
    if (requestingUser.role !== 'ASTROLOGER' && requestingUser.role !== 'ADMIN') {
      await this.dataStore.updateUser(requestingUser.id, { role: 'ASTROLOGER' });
    }

    return {
      success: true,
      data: {
        profile: savedProfile,
        kyc: savedKyc,
      },
    };
  }

  /**
   * Admin approves an onboarding application, enabling practitioner for consultations.
   */
  public async approveAstrologerApplication(
    adminUser: UserAccount | null,
    astrologerId: string
  ): Promise<ServiceResult<AstrologerProfile>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized: Only platform administrators can approve practitioner applications.',
        code: 'UNAUTHORIZED_ACCESS',
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

    const now = new Date().toISOString();
    const updatedProfile = await this.dataStore.updateAstrologerProfile(astrologerId, {
      status: 'APPROVED',
      isApproved: true,
      approvedAt: now,
      approvedBy: adminUser.id,
    });

    const kyc = await this.dataStore.getAstrologerKycByAstrologerId(astrologerId);
    if (kyc) {
      await this.dataStore.saveAstrologerKyc({
        ...kyc,
        verificationStatus: 'VERIFIED',
        reviewedAt: now,
        reviewedBy: adminUser.id,
      });
    }

    return {
      success: true,
      data: updatedProfile || { ...profile, status: 'APPROVED', isApproved: true },
    };
  }

  /**
   * Admin rejects an onboarding application.
   */
  public async rejectAstrologerApplication(
    adminUser: UserAccount | null,
    astrologerId: string,
    rejectionReason: string
  ): Promise<ServiceResult<AstrologerProfile>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized: Only platform administrators can reject practitioner applications.',
        code: 'UNAUTHORIZED_ACCESS',
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

    const now = new Date().toISOString();
    const updatedProfile = await this.dataStore.updateAstrologerProfile(astrologerId, {
      status: 'REJECTED',
      isApproved: false,
      rejectionReason: rejectionReason || 'Application criteria not met.',
    });

    const kyc = await this.dataStore.getAstrologerKycByAstrologerId(astrologerId);
    if (kyc) {
      await this.dataStore.saveAstrologerKyc({
        ...kyc,
        verificationStatus: 'REJECTED',
        rejectionReason,
        reviewedAt: now,
        reviewedBy: adminUser.id,
      });
    }

    return {
      success: true,
      data: updatedProfile || { ...profile, status: 'REJECTED', isApproved: false },
    };
  }

  /**
   * Admin suspends an approved astrologer account.
   */
  public async suspendAstrologerAccount(
    adminUser: UserAccount | null,
    astrologerId: string,
    reason: string
  ): Promise<ServiceResult<AstrologerProfile>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized: Only platform administrators can suspend practitioner accounts.',
        code: 'UNAUTHORIZED_ACCESS',
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

    const updatedProfile = await this.dataStore.updateAstrologerProfile(astrologerId, {
      status: 'SUSPENDED',
      isApproved: false,
      rejectionReason: reason || 'Account suspended by admin.',
    });

    return {
      success: true,
      data: updatedProfile || { ...profile, status: 'SUSPENDED', isApproved: false },
    };
  }

  /**
   * Updates availability status for the authenticated astrologer.
   */
  public async updateAvailabilityStatus(
    astrologerUser: UserAccount | null,
    astrologerId: string,
    availabilityStatus: AstrologerAvailabilityStatus
  ): Promise<ServiceResult<AstrologerProfile>> {
    if (!astrologerUser) {
      return {
        success: false,
        error: 'Authentication required to update availability status.',
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

    if (profile.userId !== astrologerUser.id && astrologerUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized: Cannot update another practitioner\'s availability status.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const isOnline = availabilityStatus === 'ONLINE';
    const updatedProfile = await this.dataStore.updateAstrologerProfile(astrologerId, {
      availabilityStatus,
      isOnline,
    });

    return {
      success: true,
      data: updatedProfile || { ...profile, availabilityStatus, isOnline },
    };
  }

  /**
   * Retrieves KYC verification metadata. Restricted to owner astrologer or admin.
   */
  public async getAstrologerKyc(
    requestingUser: UserAccount | null,
    astrologerId: string
  ): Promise<ServiceResult<AstrologerKycRecord>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to access KYC data.',
        code: 'UNAUTHENTICATED',
      };
    }

    const profile = await this.dataStore.getAstrologerProfileById(astrologerId);
    const kyc = await this.dataStore.getAstrologerKycByAstrologerId(astrologerId);

    if (!kyc) {
      return {
        success: false,
        error: `KYC record for astrologer '${astrologerId}' not found.`,
        code: 'NOT_FOUND',
      };
    }

    const isOwner = profile && profile.userId === requestingUser.id;
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: 'Unauthorized access: Sensitive KYC metadata is restricted to owner practitioner or admin.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    return {
      success: true,
      data: kyc,
    };
  }

  /**
   * Retrieves directory list for public consultation booking.
   * Filters out non-APPROVED or suspended production accounts.
   */
  public async listDirectoryAstrologers(
    isDemoMode: boolean = false
  ): Promise<AstrologerProfile[]> {
    const all = await this.dataStore.listAstrologers(false);

    if (isDemoMode) {
      // Return sample demo astrologers
      return all.filter(a => a.isDemoUser !== false);
    }

    // Return only production APPROVED astrologers
    return all.filter(a => a.isDemoUser === false && (a.status === 'APPROVED' || a.isApproved === true));
  }
}

export const astrologerOnboardingService = new AstrologerOnboardingService();

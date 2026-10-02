/**
 * Astrologer Service
 * 
 * Manages astrologer profiles, public directory listings, approval workflows,
 * and authorized client data visibility for practicing astrologers.
 */

import { AstrologerProfile, UserAccount, ServiceResult, PersistentBirthProfile } from '../types';
import { DataStore, globalDataStore } from './data/dataStore';

export class AstrologerService {
  private dataStore: DataStore;

  constructor(dataStore: DataStore = globalDataStore) {
    this.dataStore = dataStore;
  }

  /**
   * Lists approved astrologers for the public directory.
   */
  public async listApprovedAstrologers(): Promise<ServiceResult<AstrologerProfile[]>> {
    const astrologers = await this.dataStore.listAstrologers(true);
    return {
      success: true,
      data: astrologers,
    };
  }

  /**
   * Retrieves an astrologer profile by ID.
   */
  public async getAstrologerById(astrologerId: string): Promise<ServiceResult<AstrologerProfile>> {
    const profile = await this.dataStore.getAstrologerProfileById(astrologerId);
    if (!profile) {
      return {
        success: false,
        error: `Astrologer profile '${astrologerId}' not found.`,
        code: 'ASTROLOGER_NOT_FOUND',
      };
    }

    return {
      success: true,
      data: profile,
    };
  }

  /**
   * Alias for getAstrologerById for clear profile retrieval semantics.
   */
  public async getAstrologerProfileById(astrologerId: string): Promise<ServiceResult<AstrologerProfile>> {
    return this.getAstrologerById(astrologerId);
  }

  /**
   * Registers a new astrologer profile.
   */
  public async registerAstrologerProfile(
    requestingUser: UserAccount | null,
    profileData: {
      name: string;
      title: string;
      bio: string;
      education: string;
      skills: string[];
      languages: string[];
      experienceYears: number;
      perMinuteCharge: number;
      avatarUrl?: string;
    }
  ): Promise<ServiceResult<AstrologerProfile>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to register as an astrologer.',
        code: 'UNAUTHENTICATED',
      };
    }

    const existing = await this.dataStore.getAstrologerProfileByUserId(requestingUser.id);
    if (existing) {
      return {
        success: false,
        error: 'An astrologer profile is already registered for this user account.',
        code: 'ASTROLOGER_PROFILE_EXISTS',
      };
    }

    const now = new Date().toISOString();
    const astrologerId = `ast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const profile: AstrologerProfile = {
      id: astrologerId,
      userId: requestingUser.id,
      name: profileData.name.trim(),
      title: profileData.title.trim(),
      bio: profileData.bio.trim(),
      education: profileData.education.trim(),
      skills: profileData.skills,
      languages: profileData.languages,
      experienceYears: Math.max(0, profileData.experienceYears),
      perMinuteCharge: Math.max(0, profileData.perMinuteCharge),
      isOnline: true,
      rating: 5.0,
      totalOrders: 0,
      avatarUrl: profileData.avatarUrl?.trim(),
      isApproved: requestingUser.role === 'ADMIN', // Auto-approved if admin created, else requires admin approval
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.dataStore.saveAstrologerProfile(profile);

    // Update user role to ASTROLOGER if not admin
    if (requestingUser.role === 'USER') {
      await this.dataStore.updateUser(requestingUser.id, { role: 'ASTROLOGER' });
    }

    return {
      success: true,
      data: saved,
    };
  }

  /**
   * Retrieves clients whose birth profiles are authorized to this astrologer through
   * an active or booked consultation relationship.
   */
  public async getAuthorizedClientsForAstrologer(
    requestingUser: UserAccount | null,
    astrologerId: string
  ): Promise<ServiceResult<PersistentBirthProfile[]>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED',
      };
    }

    const astro = await this.dataStore.getAstrologerProfileById(astrologerId);
    if (!astro) {
      return {
        success: false,
        error: 'Astrologer not found.',
        code: 'ASTROLOGER_NOT_FOUND',
      };
    }

    // Check authorization: requesting user must be the astrologer or an admin
    if (astro.userId !== requestingUser.id && requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized: You cannot access client records of another astrologer.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    // Find all consultations for this astrologer
    const consultations = await this.dataStore.listConsultationsByAstrologerId(astrologerId);
    const authorizedUserIds = Array.from(new Set(consultations.map(c => c.userId)));

    const clientProfiles: PersistentBirthProfile[] = [];
    for (const uId of authorizedUserIds) {
      const profiles = await this.dataStore.listBirthProfilesByUserId(uId);
      clientProfiles.push(...profiles);
    }

    return {
      success: true,
      data: clientProfiles,
    };
  }

  /**
   * Retrieves an astrologer profile by user ID.
   */
  public async getAstrologerByUserId(userId: string): Promise<ServiceResult<AstrologerProfile | null>> {
    const profile = await this.dataStore.getAstrologerProfileByUserId(userId);
    return {
      success: true,
      data: profile,
    };
  }

  /**
   * Lists all astrologer profiles (approved and unapproved) for admin review.
   */
  public async listAllAstrologers(requestingUser: UserAccount | null): Promise<ServiceResult<AstrologerProfile[]>> {
    if (!requestingUser || requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin access required to view all astrologer profiles.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }
    const profiles = await this.dataStore.listAstrologers(false);
    return {
      success: true,
      data: profiles,
    };
  }

  /**
   * Updates an astrologer profile with owner/admin authorization checks.
   */
  public async updateAstrologerProfile(
    requestingUser: UserAccount | null,
    astrologerId: string,
    updates: Partial<AstrologerProfile>
  ): Promise<ServiceResult<AstrologerProfile>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to update profile.',
        code: 'UNAUTHENTICATED',
      };
    }

    const existing = await this.dataStore.getAstrologerProfileById(astrologerId);
    if (!existing) {
      return {
        success: false,
        error: 'Astrologer profile not found.',
        code: 'NOT_FOUND',
      };
    }

    if (existing.userId !== requestingUser.id && requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized: You cannot modify another astrologer profile.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const safeUpdates: Partial<AstrologerProfile> = { ...updates };
    // Non-admins cannot change isApproved or userId
    if (requestingUser.role !== 'ADMIN') {
      delete safeUpdates.isApproved;
      delete safeUpdates.userId;
      delete safeUpdates.id;
    }
    safeUpdates.updatedAt = new Date().toISOString();

    const updated = await this.dataStore.updateAstrologerProfile(astrologerId, safeUpdates);
    if (!updated) {
      return {
        success: false,
        error: 'Failed to update astrologer profile.',
        code: 'UPDATE_FAILED',
      };
    }

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Approves or rejects an astrologer profile (Admin only).
   */
  public async adminApproveAstrologer(
    requestingUser: UserAccount | null,
    astrologerId: string,
    isApproved: boolean
  ): Promise<ServiceResult<AstrologerProfile>> {
    if (!requestingUser || requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin access required to approve or reject astrologers.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const existing = await this.dataStore.getAstrologerProfileById(astrologerId);
    if (!existing) {
      return {
        success: false,
        error: 'Astrologer profile not found.',
        code: 'NOT_FOUND',
      };
    }

    const updated = await this.dataStore.updateAstrologerProfile(astrologerId, {
      isApproved,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      return {
        success: false,
        error: 'Failed to update approval status.',
        code: 'UPDATE_FAILED',
      };
    }

    return {
      success: true,
      data: updated,
    };
  }
}

export const astrologerService = new AstrologerService();

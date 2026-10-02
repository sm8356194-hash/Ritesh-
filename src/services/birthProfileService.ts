/**
 * Birth Profile Service
 * 
 * Manages persistent user birth profiles (supporting multiple profiles per user).
 * Enforces strict input validation and data ownership isolation.
 */

import { PersistentBirthProfile, UserAccount, ServiceResult, RelationshipType } from '../types';
import { DataStore, globalDataStore } from './data/dataStore';
import { validateBirthProfileParams } from './validation/dataValidation';

export interface CreateBirthProfileInput {
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  timeOfBirth: string; // HH:MM:SS or HH:MM
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: string; // IANA e.g. "Asia/Kolkata"
  gender?: 'male' | 'female' | 'other' | 'unspecified';
  relationship?: RelationshipType;
  isDefault?: boolean;
}

export class BirthProfileService {
  private dataStore: DataStore;

  constructor(dataStore: DataStore = globalDataStore) {
    this.dataStore = dataStore;
  }

  /**
   * Creates a persistent birth profile associated with the authenticated user.
   */
  public async createBirthProfile(
    requestingUser: UserAccount | null,
    input: CreateBirthProfileInput
  ): Promise<ServiceResult<PersistentBirthProfile>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to create a birth profile.',
        code: 'UNAUTHENTICATED',
      };
    }

    // Strict validation
    const validation = validateBirthProfileParams({
      userId: requestingUser.id,
      name: input.name,
      dateOfBirth: input.dateOfBirth,
      timeOfBirth: input.timeOfBirth,
      latitude: input.latitude,
      longitude: input.longitude,
      timezone: input.timezone,
      birthPlace: input.birthPlace,
    });

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.map(e => e.message).join('; '),
        code: 'VALIDATION_FAILED',
        details: validation.errors,
      };
    }

    const now = new Date().toISOString();
    const profileId = `bp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const profile: PersistentBirthProfile = {
      id: profileId,
      userId: requestingUser.id,
      name: input.name.trim(),
      dateOfBirth: input.dateOfBirth.trim(),
      timeOfBirth: input.timeOfBirth.trim(),
      birthPlace: input.birthPlace.trim(),
      latitude: input.latitude, // Exact precision maintained
      longitude: input.longitude, // Exact precision maintained
      timezone: input.timezone.trim(), // Exact IANA timezone maintained
      gender: input.gender,
      relationship: input.relationship || 'SELF',
      isDefault: input.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.dataStore.saveBirthProfile(profile);
    return {
      success: true,
      data: saved,
    };
  }

  /**
   * Retrieves a birth profile with strict ownership verification.
   */
  public async getBirthProfileById(
    requestingUser: UserAccount | null,
    profileId: string
  ): Promise<ServiceResult<PersistentBirthProfile>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to access birth profile.',
        code: 'UNAUTHENTICATED',
      };
    }

    const profile = await this.dataStore.getBirthProfileById(profileId);
    if (!profile) {
      return {
        success: false,
        error: `Birth profile '${profileId}' not found.`,
        code: 'PROFILE_NOT_FOUND',
      };
    }

    // Ownership check: User can access their own profile (or admin, or assigned astrologer with consultation)
    if (profile.userId !== requestingUser.id && requestingUser.role !== 'ADMIN') {
      const astrologerProfile = await this.dataStore.getAstrologerProfileByUserId(requestingUser.id);
      let isAuthorizedAstrologer = false;
      if (astrologerProfile) {
        const consultations = await this.dataStore.listConsultationsByAstrologerId(astrologerProfile.id);
        isAuthorizedAstrologer = consultations.some(c => c.userId === profile.userId || c.birthProfileId === profile.id);
      }

      if (!isAuthorizedAstrologer) {
        return {
          success: false,
          error: 'Unauthorized access: You do not have permission to view this private birth profile.',
          code: 'UNAUTHORIZED_ACCESS',
        };
      }
    }

    return {
      success: true,
      data: profile,
    };
  }

  /**
   * Lists all birth profiles belonging to a user (e.g. Self, Mother, Father, Child).
   */
  public async listBirthProfilesForUser(
    requestingUser: UserAccount | null,
    targetUserId: string
  ): Promise<ServiceResult<PersistentBirthProfile[]>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to list birth profiles.',
        code: 'UNAUTHENTICATED',
      };
    }

    // Ownership check
    if (requestingUser.id !== targetUserId && requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized access: You cannot list another user\'s birth profiles.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const profiles = await this.dataStore.listBirthProfilesByUserId(targetUserId);
    return {
      success: true,
      data: profiles,
    };
  }

  /**
   * Updates an existing birth profile with ownership verification and strict validation.
   */
  public async updateBirthProfile(
    requestingUser: UserAccount | null,
    profileId: string,
    updates: Partial<CreateBirthProfileInput>
  ): Promise<ServiceResult<PersistentBirthProfile>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to update birth profile.',
        code: 'UNAUTHENTICATED',
      };
    }

    const existing = await this.dataStore.getBirthProfileById(profileId);
    if (!existing) {
      return {
        success: false,
        error: `Birth profile '${profileId}' not found.`,
        code: 'PROFILE_NOT_FOUND',
      };
    }

    // Ownership check
    if (existing.userId !== requestingUser.id && requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized access: You cannot modify another user\'s private birth profile.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    // Validate merged values
    const merged = {
      userId: existing.userId,
      name: updates.name ?? existing.name,
      dateOfBirth: updates.dateOfBirth ?? existing.dateOfBirth,
      timeOfBirth: updates.timeOfBirth ?? existing.timeOfBirth,
      latitude: updates.latitude ?? existing.latitude,
      longitude: updates.longitude ?? existing.longitude,
      timezone: updates.timezone ?? existing.timezone,
      birthPlace: updates.birthPlace ?? existing.birthPlace,
    };

    const validation = validateBirthProfileParams(merged);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.map(e => e.message).join('; '),
        code: 'VALIDATION_FAILED',
        details: validation.errors,
      };
    }

    const updated = await this.dataStore.updateBirthProfile(profileId, {
      ...updates,
      name: merged.name.trim(),
      dateOfBirth: merged.dateOfBirth.trim(),
      timeOfBirth: merged.timeOfBirth.trim(),
      birthPlace: merged.birthPlace.trim(),
      timezone: merged.timezone.trim(),
    });

    if (!updated) {
      return {
        success: false,
        error: 'Failed to update birth profile.',
        code: 'UPDATE_FAILED',
      };
    }

    // Invalidate cached Kundli calculation because birth parameters changed
    await this.dataStore.deleteKundliRecord(profileId);

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Deletes a birth profile and its stored Kundli calculation with ownership check.
   */
  public async deleteBirthProfile(
    requestingUser: UserAccount | null,
    profileId: string
  ): Promise<ServiceResult<boolean>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to delete birth profile.',
        code: 'UNAUTHENTICATED',
      };
    }

    const existing = await this.dataStore.getBirthProfileById(profileId);
    if (!existing) {
      return {
        success: false,
        error: `Birth profile '${profileId}' not found.`,
        code: 'PROFILE_NOT_FOUND',
      };
    }

    // Ownership check
    if (existing.userId !== requestingUser.id && requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized access: You cannot delete another user\'s private birth profile.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const deleted = await this.dataStore.deleteBirthProfile(profileId);
    if (!deleted) {
      return {
        success: false,
        error: `Failed to delete birth profile '${profileId}'.`,
        code: 'DELETE_FAILED',
      };
    }
    return {
      success: true,
      data: true,
    };
  }
}

export const birthProfileService = new BirthProfileService();

/**
 * Kundli Service
 * 
 * Manages calculating, caching, and retrieving Kundli records for persistent birth profiles.
 * 
 * ARCHITECTURAL RULE:
 * - The authoritative calculation engine is RealAstrologyProvider via astrologyEngine singleton.
 * - This service NEVER computes planetary ephemerides itself; it delegates strictly to astrologyEngine.
 * - Stored Kundli records act as cached calculation snapshots with full audit metadata.
 */

import { 
  StoredKundliRecord, 
  PersistentBirthProfile, 
  UserAccount, 
  BirthProfile, 
  ServiceResult 
} from '../types';
import { DataStore, globalDataStore } from './data/dataStore';
import { astrologyEngine, astrologySettings } from './astrologyEngine';

export const CURRENT_SETTINGS_VERSION = 'VEDIC_LAHIRI_WHOLE_SIGN_V1';

export class KundliService {
  private dataStore: DataStore;

  constructor(dataStore: DataStore = globalDataStore) {
    this.dataStore = dataStore;
  }

  /**
   * Helper to verify if a cached Kundli record exactly matches the current birth profile parameters
   * and was calculated after the last profile update timestamp.
   */
  private isKundliFresh(record: StoredKundliRecord, profile: PersistentBirthProfile): boolean {
    if (profile.updatedAt && new Date(record.calculatedAt).getTime() < new Date(profile.updatedAt).getTime()) {
      return false;
    }
    const chartProfile = record.chartData?.profile;
    if (!chartProfile) return false;
    if (chartProfile.dateOfBirth !== profile.dateOfBirth) return false;
    if (chartProfile.birthTime !== profile.timeOfBirth && chartProfile.timeOfBirth !== profile.timeOfBirth) return false;
    if (chartProfile.latitude !== profile.latitude) return false;
    if (chartProfile.longitude !== profile.longitude) return false;
    if (chartProfile.timezone !== profile.timezone) return false;
    return true;
  }

  /**
   * Calculates (or retrieves valid cached) Kundli for a user's persistent birth profile.
   */
  public async getOrCalculateKundli(
    requestingUser: UserAccount | null,
    birthProfileId: string,
    forceRecalculate: boolean = false
  ): Promise<ServiceResult<StoredKundliRecord>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to calculate or access Kundli.',
        code: 'UNAUTHENTICATED',
      };
    }

    // 1. Fetch birth profile
    const profile = await this.dataStore.getBirthProfileById(birthProfileId);
    if (!profile) {
      return {
        success: false,
        error: `Birth profile '${birthProfileId}' not found.`,
        code: 'PROFILE_NOT_FOUND',
      };
    }

    // 2. Ownership verification
    if (profile.userId !== requestingUser.id && requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized access: You cannot access Kundli calculation for another user\'s profile.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    // 3. Check cache if not forcing recalculation
    if (!forceRecalculate) {
      const cached = await this.dataStore.getKundliRecordByBirthProfileId(birthProfileId);
      if (
        cached && 
        cached.astrologySettingsVersion === CURRENT_SETTINGS_VERSION &&
        cached.calculationStatus === 'REAL' &&
        cached.chartData.isCalculated &&
        this.isKundliFresh(cached, profile)
      ) {
        return {
          success: true,
          data: cached,
        };
      }
    }

    // 4. Delegate calculation strictly to central astrologyEngine (RealAstrologyProvider)
    const calculationInputProfile: BirthProfile = {
      name: profile.name,
      dateOfBirth: profile.dateOfBirth,
      timeOfBirth: profile.timeOfBirth,
      birthTime: profile.timeOfBirth,
      birthTimeKnown: true,
      birthPlace: profile.birthPlace,
      latitude: profile.latitude,
      longitude: profile.longitude,
      timezone: profile.timezone,
      gender: profile.gender,
      isDemoData: false,
    };

    const calculatedChart = astrologyEngine.calculateBirthChart(calculationInputProfile);

    // 5. Build persistent Kundli cache record
    const now = new Date().toISOString();
    const kundliRecord: StoredKundliRecord = {
      id: `knd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      birthProfileId: profile.id,
      userId: profile.userId,
      calculationProvider: 'REAL',
      calculationEngine: calculatedChart.calculationEngine || 'SwissEphemerisAdapter (sweph-wasm)',
      engineVersion: '2.10.03',
      astrologySettingsVersion: CURRENT_SETTINGS_VERSION,
      astrologySettings: { ...astrologySettings },
      chartData: calculatedChart,
      calculationStatus: calculatedChart.calculationStatus === 'REAL' ? 'REAL' : 'REAL_ENGINE_NOT_CONNECTED',
      calculatedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.dataStore.saveKundliRecord(kundliRecord);

    return {
      success: true,
      data: saved,
    };
  }

  /**
   * Retrieves a stored Kundli record by birthProfileId with authorization enforcement.
   */
  public async getStoredKundliByProfileId(
    requestingUser: UserAccount | null,
    birthProfileId: string
  ): Promise<ServiceResult<StoredKundliRecord>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to retrieve Kundli.',
        code: 'UNAUTHENTICATED',
      };
    }

    const profile = await this.dataStore.getBirthProfileById(birthProfileId);
    if (!profile) {
      return {
        success: false,
        error: `Birth profile '${birthProfileId}' not found.`,
        code: 'PROFILE_NOT_FOUND',
      };
    }

    if (profile.userId !== requestingUser.id && requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized access: You cannot retrieve Kundli data for another user\'s profile.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const record = await this.dataStore.getKundliRecordByBirthProfileId(birthProfileId);
    if (!record || !this.isKundliFresh(record, profile)) {
      if (record && !this.isKundliFresh(record, profile)) {
        await this.dataStore.deleteKundliRecord(birthProfileId);
      }
      return {
        success: false,
        error: `No valid stored Kundli calculation exists for profile '${birthProfileId}'. Please trigger calculation.`,
        code: 'KUNDLI_NOT_CALCULATED',
      };
    }

    return {
      success: true,
      data: record,
    };
  }
}

export const kundliService = new KundliService();

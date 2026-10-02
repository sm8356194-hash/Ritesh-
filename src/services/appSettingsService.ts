/**
 * Application Settings Service
 * 
 * Manages global platform configuration and administrative settings.
 */

import { AppSettingsRecord, UserAccount, ServiceResult } from '../types';
import { DataStore, globalDataStore } from './data/dataStore';

export class AppSettingsService {
  private dataStore: DataStore;

  constructor(dataStore: DataStore = globalDataStore) {
    this.dataStore = dataStore;
  }

  public async getSettings(): Promise<AppSettingsRecord> {
    return this.dataStore.getAppSettings();
  }

  public async updateSettings(
    requestingUser: UserAccount | null,
    updates: Partial<Omit<AppSettingsRecord, 'id' | 'updatedAt'>>
  ): Promise<ServiceResult<AppSettingsRecord>> {
    if (!requestingUser || requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin privilege required to update platform settings.',
        code: 'ADMIN_PRIVILEGE_REQUIRED',
      };
    }

    const updated = await this.dataStore.updateAppSettings(updates);
    return {
      success: true,
      data: updated,
    };
  }
}

export const appSettingsService = new AppSettingsService();

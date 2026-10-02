/**
 * User Service
 * 
 * Manages user accounts, authorization boundaries, and profile updates.
 */

import { UserAccount, UserRole, UserAccountStatus, ServiceResult } from '../types';
import { DataStore, globalDataStore } from './data/dataStore';
import { validateEmail } from './validation/dataValidation';

export class UserService {
  private dataStore: DataStore;

  constructor(dataStore: DataStore = globalDataStore) {
    this.dataStore = dataStore;
  }

  /**
   * Retrieves a user by ID with authorization enforcement.
   * - Self: Allowed
   * - Admin: Allowed
   * - Other User: Denied
   */
  public async getUserById(
    requestingUser: UserAccount | null,
    targetUserId: string
  ): Promise<ServiceResult<UserAccount>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to access user profile.',
        code: 'UNAUTHENTICATED',
      };
    }

    if (requestingUser.id !== targetUserId && requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized access: You cannot view another user\'s private account.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const user = await this.dataStore.getUserById(targetUserId);
    if (!user) {
      return {
        success: false,
        error: `User account '${targetUserId}' not found.`,
        code: 'USER_NOT_FOUND',
      };
    }

    return {
      success: true,
      data: user,
    };
  }

  /**
   * Updates user account fields with role-based field restrictions.
   */
  public async updateUserProfile(
    requestingUser: UserAccount | null,
    targetUserId: string,
    updates: {
      displayName?: string;
      email?: string;
      phone?: string;
      avatarUrl?: string;
      role?: UserRole;
      status?: UserAccountStatus;
    }
  ): Promise<ServiceResult<UserAccount>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to update user profile.',
        code: 'UNAUTHENTICATED',
      };
    }

    const isSelf = requestingUser.id === targetUserId;
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isSelf && !isAdmin) {
      return {
        success: false,
        error: 'Unauthorized access: You cannot update another user\'s profile.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    // Role or status alteration is strictly restricted to ADMIN
    if ((updates.role !== undefined || updates.status !== undefined) && !isAdmin) {
      return {
        success: false,
        error: 'Only administrators can modify user role or account status.',
        code: 'INSUFFICIENT_PERMISSIONS',
      };
    }

    if (updates.email) {
      const emailErrors = validateEmail(updates.email);
      if (emailErrors.length > 0) {
        return {
          success: false,
          error: emailErrors[0].message,
          code: 'INVALID_EMAIL',
        };
      }
    }

    const updated = await this.dataStore.updateUser(targetUserId, updates);
    if (!updated) {
      return {
        success: false,
        error: `User '${targetUserId}' not found.`,
        code: 'USER_NOT_FOUND',
      };
    }

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Lists all users in the system (Admin Only).
   */
  public async listAllUsers(requestingUser: UserAccount | null): Promise<ServiceResult<UserAccount[]>> {
    if (!requestingUser || requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin privilege required to list all user accounts.',
        code: 'ADMIN_PRIVILEGE_REQUIRED',
      };
    }

    const users = await this.dataStore.listUsers();
    return {
      success: true,
      data: users,
    };
  }
}

export const userService = new UserService();

/**
 * Authentication Service with Firebase Auth & InMemory Support
 * 
 * Manages user identities, active sessions, and authentication state
 * using Firebase Authentication (Firestore production) or InMemoryDataStore (test suites).
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { UserAccount, UserRole, AuthMode, AuthProviderType, ServiceResult } from '../../types';
import { DataStore, globalDataStore } from '../data/dataStore';
import { validateEmail } from '../validation/dataValidation';

export interface AuthProviderStatus {
  layer: 'FIREBASE_AUTH';
  providerIntegration: 'ACTIVE';
  isProductionConfigured: true;
  notice: string;
  providers?: Record<string, string>;
}

export class AuthService {
  private dataStore: DataStore;
  private currentSessionUser: UserAccount | null = null;
  private authStateListeners: ((user: UserAccount | null) => void)[] = [];
  private isInitialized: boolean = false;
  private initResolvers: ((user: UserAccount | null) => void)[] = [];

  constructor(dataStore: DataStore = globalDataStore) {
    this.dataStore = dataStore;

    // Listen to Firebase Auth state changes if using Firestore backend
    try {
      onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            let userDoc: UserAccount | null = null;
            try {
              userDoc = await this.dataStore.getUserById(firebaseUser.uid);
            } catch (fetchErr) {
              console.warn('Offline getUserById fallback:', fetchErr);
            }

            if (!userDoc) {
              const now = new Date().toISOString();
              userDoc = {
                id: firebaseUser.uid,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email || `${firebaseUser.uid.substring(0, 8)}@user.app`,
                role: 'USER',
                status: 'ACTIVE',
                phone: firebaseUser.phoneNumber || undefined,
                avatarUrl: firebaseUser.photoURL || undefined,
                createdAt: now,
                updatedAt: now,
              };
              try {
                await this.dataStore.saveUser(userDoc);
              } catch (saveErr) {
                console.warn('Offline saveUser fallback:', saveErr);
              }
            }
            this.currentSessionUser = userDoc;
          } else {
            this.currentSessionUser = null;
          }
        } catch (innerErr) {
          console.warn('Offline auth state sync fallback:', innerErr);
        } finally {
          this.markInitialized();
          this.notifyListeners();
        }
      });
    } catch (e) {
      this.markInitialized();
    }

    // Safety fallback for test/SSR environments or slow offline network
    setTimeout(() => {
      if (!this.isInitialized) {
        this.markInitialized();
        this.notifyListeners();
      }
    }, 1200);
  }

  private markInitialized(): void {
    if (!this.isInitialized) {
      this.isInitialized = true;
      const resolvers = [...this.initResolvers];
      this.initResolvers = [];
      resolvers.forEach((r) => r(this.currentSessionUser));
    }
  }

  public isAuthInitialized(): boolean {
    return this.isInitialized;
  }

  public async waitForInitialization(): Promise<UserAccount | null> {
    if (this.isInitialized) {
      return this.currentSessionUser;
    }
    return new Promise((resolve) => {
      this.initResolvers.push(resolve);
    });
  }

  public getAuthMode(): AuthMode {
    if (!this.currentSessionUser) {
      return 'DEMO';
    }
    if (this.currentSessionUser.isDemoUser || this.currentSessionUser.provider === 'demo') {
      return 'DEMO';
    }
    return 'AUTHENTICATED';
  }

  public isDemoMode(): boolean {
    return this.getAuthMode() === 'DEMO';
  }

  public canAccessSection(user: UserAccount | null, section: string): boolean {
    if (section === 'admin' || section === 'owner-panel') {
      return user?.role === 'ADMIN';
    }
    if (section === 'astrologer-workspace' || section === 'astrologer-panel') {
      return user?.role === 'ASTROLOGER' || user?.role === 'ADMIN';
    }
    return true; // All client sections accessible in Demo/User mode
  }

  public getAuthProviderStatus(): AuthProviderStatus {
    return {
      layer: 'FIREBASE_AUTH',
      providerIntegration: 'ACTIVE',
      isProductionConfigured: true,
      notice: 'Firebase Authentication foundation is active with Email/Password, Google OAuth, and Phone OTP capability.',
      providers: {
        emailPassword: 'CONFIGURED BUT NOT VERIFIED',
        googleOAuth: 'CONFIGURED BUT NOT VERIFIED',
        phoneOtp: 'CONFIGURED BUT NOT VERIFIED / DEMO ONLY',
      },
    };
  }

  public subscribe(listener: (user: UserAccount | null) => void): () => void {
    this.authStateListeners.push(listener);
    listener(this.currentSessionUser);
    return () => {
      this.authStateListeners = this.authStateListeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.authStateListeners) {
      try {
        listener(this.currentSessionUser);
      } catch (e) {
        console.error('Auth listener error:', e);
      }
    }
  }

  /**
   * Registers a new user account with email and password via Firebase Auth or InMemory store.
   */
  public async register(params: {
    email: string;
    password?: string;
    displayName: string;
    role?: UserRole;
    phone?: string;
    avatarUrl?: string;
  }): Promise<ServiceResult<UserAccount>> {
    const emailErrors = validateEmail(params.email);
    if (emailErrors.length > 0) {
      return {
        success: false,
        error: emailErrors[0].message,
        code: 'INVALID_EMAIL',
        details: emailErrors,
      };
    }

    if (!params.displayName || params.displayName.trim().length < 2) {
      return {
        success: false,
        error: 'Display name must be at least 2 characters long.',
        code: 'INVALID_DISPLAY_NAME',
      };
    }

    const normalizedEmail = params.email.trim().toLowerCase();
    const existing = await this.dataStore.getUserByEmail(normalizedEmail);
    if (existing) {
      return {
        success: false,
        error: `An account with email '${normalizedEmail}' already exists.`,
        code: 'EMAIL_ALREADY_EXISTS',
      };
    }

    const now = new Date().toISOString();
    let userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (params.password && params.password.length >= 6 && this.dataStore.constructor.name === 'FirestoreDataStore') {
      try {
        const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, params.password);
        userId = credential.user.uid;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Registration failed.',
          code: error.code || 'REGISTRATION_ERROR',
        };
      }
    } else {
      if (params.password && params.password.length > 0 && params.password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters long.',
          code: 'WEAK_PASSWORD',
        };
      }
    }

    const newUser: UserAccount = {
      id: userId,
      displayName: params.displayName.trim(),
      email: normalizedEmail,
      role: params.role || 'USER',
      status: 'ACTIVE',
      phone: params.phone?.trim(),
      avatarUrl: params.avatarUrl?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.dataStore.saveUser(newUser);
    this.currentSessionUser = saved;
    this.notifyListeners();

    return {
      success: true,
      data: saved,
    };
  }

  /**
   * Signs in an existing user with email and password.
   */
  public async loginWithEmail(email: string, password: string): Promise<ServiceResult<UserAccount>> {
    const emailErrors = validateEmail(email);
    if (emailErrors.length > 0) {
      return {
        success: false,
        error: emailErrors[0].message,
        code: 'INVALID_EMAIL',
      };
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      let userId = '';

      if (this.dataStore.constructor.name === 'FirestoreDataStore') {
        const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        userId = credential.user.uid;
      } else {
        const found = await this.dataStore.getUserByEmail(normalizedEmail);
        if (!found) {
          return {
            success: false,
            error: `No user account found matching email '${normalizedEmail}'.`,
            code: 'USER_NOT_FOUND',
          };
        }
        userId = found.id;
      }

      let userDoc = await this.dataStore.getUserById(userId);
      if (!userDoc) {
        const now = new Date().toISOString();
        userDoc = {
          id: userId,
          displayName: normalizedEmail.split('@')[0],
          email: normalizedEmail,
          role: 'USER',
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        };
        await this.dataStore.saveUser(userDoc);
      }

      if (userDoc.status === 'SUSPENDED') {
        if (this.dataStore.constructor.name === 'FirestoreDataStore') {
          await signOut(auth);
        }
        return {
          success: false,
          error: 'This account has been suspended.',
          code: 'ACCOUNT_SUSPENDED',
        };
      }

      this.currentSessionUser = userDoc;
      this.notifyListeners();

      return {
        success: true,
        data: userDoc,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Login failed.',
        code: error.code || 'LOGIN_ERROR',
      };
    }
  }

  /**
   * Signs in with Google Pop-up.
   */
  public async loginWithGoogle(): Promise<ServiceResult<UserAccount>> {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const firebaseUser = credential.user;

      let userDoc = await this.dataStore.getUserById(firebaseUser.uid);
      if (!userDoc) {
        const now = new Date().toISOString();
        userDoc = {
          id: firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Google User',
          email: firebaseUser.email || '',
          role: 'USER',
          status: 'ACTIVE',
          avatarUrl: firebaseUser.photoURL || undefined,
          createdAt: now,
          updatedAt: now,
        };
        await this.dataStore.saveUser(userDoc);
      }

      this.currentSessionUser = userDoc;
      this.notifyListeners();

      return {
        success: true,
        data: userDoc,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Google sign-in failed.',
        code: error.code || 'GOOGLE_LOGIN_ERROR',
      };
    }
  }

  /**
   * Sends OTP to a phone number via Firebase Phone Auth.
   */
  public async sendOtp(phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ServiceResult<ConfirmationResult>> {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      return {
        success: true,
        data: confirmationResult,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send OTP. Please check phone number format.',
        code: error.code || 'OTP_SEND_ERROR',
      };
    }
  }

  /**
   * Verifies the OTP code and completes authentication.
   */
  public async verifyOtp(confirmationResult: ConfirmationResult, otpCode: string): Promise<ServiceResult<UserAccount>> {
    try {
      const credential = await confirmationResult.confirm(otpCode);
      const firebaseUser = credential.user;

      let userDoc = await this.dataStore.getUserById(firebaseUser.uid);
      if (!userDoc) {
        const now = new Date().toISOString();
        userDoc = {
          id: firebaseUser.uid,
          displayName: firebaseUser.phoneNumber ? `User ${firebaseUser.phoneNumber.slice(-4)}` : 'Phone User',
          email: `${firebaseUser.uid}@phone.auth`,
          phone: firebaseUser.phoneNumber || undefined,
          role: 'USER',
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        };
        await this.dataStore.saveUser(userDoc);
      }

      this.currentSessionUser = userDoc;
      this.notifyListeners();

      return {
        success: true,
        data: userDoc,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Invalid OTP code.',
        code: error.code || 'OTP_VERIFY_ERROR',
      };
    }
  }

  public getCurrentUser(): UserAccount | null {
    return this.currentSessionUser ? { ...this.currentSessionUser } : null;
  }

  public async refreshCurrentUser(): Promise<UserAccount | null> {
    const userId = this.currentSessionUser?.id || auth.currentUser?.uid;
    if (!userId) return null;
    try {
      const freshUser = await this.dataStore.getUserById(userId);
      if (freshUser) {
        this.currentSessionUser = freshUser;
        this.notifyListeners();
        return freshUser;
      }
    } catch (e) {
      console.warn('Failed to refresh current session user:', e);
    }
    return this.currentSessionUser;
  }

  public setCurrentUser(user: UserAccount | null): void {
    this.currentSessionUser = user ? { ...user } : null;
    this.markInitialized();
    this.notifyListeners();
  }

  public async logout(): Promise<void> {
    try {
      if (this.dataStore.constructor.name === 'FirestoreDataStore') {
        await signOut(auth);
      }
    } catch (e) {
      console.error('Sign out error:', e);
    }
    this.currentSessionUser = null;
    this.markInitialized();
    this.notifyListeners();
  }

  /**
   * Lists all registered user accounts for Admin directory oversight.
   */
  public async listAllUsersForAdmin(
    requestingUser: UserAccount | null
  ): Promise<ServiceResult<UserAccount[]>> {
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
        error: 'Unauthorized access: User directory oversight requires administrator privileges.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const users = await this.dataStore.listUsers();
    return {
      success: true,
      data: users,
    };
  }

  /**
   * Updates user status for Admin oversight (ACTIVE, SUSPENDED, PENDING).
   */
  public async updateUserStatusForAdmin(
    requestingUser: UserAccount | null,
    userId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING'
  ): Promise<ServiceResult<UserAccount>> {
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
        error: 'Unauthorized access: Updating user status requires administrator privileges.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const updated = await this.dataStore.updateUser(userId, { status });
    if (!updated) {
      return {
        success: false,
        error: 'User not found.',
        code: 'USER_NOT_FOUND',
      };
    }

    return {
      success: true,
      data: updated,
    };
  }
}

export const authService = new AuthService();

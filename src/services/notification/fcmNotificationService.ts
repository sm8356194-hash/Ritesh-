/**
 * FCM Push Notification Service
 * 
 * Manages device registration tokens in Firestore, token life-cycle,
 * and trusted server-side push delivery via FCM v1 REST API.
 * Supports auto-detecting test runners for clean unit/integration testing fallback.
 */

import { collection, query, where, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import * as crypto from 'crypto';
import { db } from '../firebaseConfig';
import { FCMDeviceToken, PushNotificationDelivery, FCMDeliveryStatus } from '../../types';

export class FCMNotificationService {
  private isTestMode: boolean = false;
  private memoryTokens = new Map<string, FCMDeviceToken>();
  private memoryDeliveries = new Map<string, PushNotificationDelivery>();

  constructor() {
    // Auto-detect unit/integration testing runner context
    if (typeof process !== 'undefined') {
      if (
        process.env.NODE_ENV === 'test' ||
        process.env.VITE_APP_ENV === 'test' ||
        (Array.isArray(process.argv) && process.argv.some(a => a.includes('.test.') || a.includes('.spec.')))
      ) {
        this.isTestMode = true;
      }
    }
  }

  /**
   * Toggles testing mode manually
   */
  public setTestMode(active: boolean): void {
    this.isTestMode = active;
  }

  /**
   * Generates a unique document ID based on the long FCM token
   */
  private getTokenDocId(token: string): string {
    const clean = token.replace(/[^a-zA-Z0-9_\-]/g, '_');
    return `fcm_tok_${clean.substring(0, 100)}`;
  }

  /**
   * Registers or updates a device token for an authenticated user.
   */
  public async registerToken(
    userId: string,
    token: string,
    platform: 'web' | 'android' | 'ios' = 'web'
  ): Promise<FCMDeviceToken> {
    const tokenId = this.getTokenDocId(token);
    const now = new Date().toISOString();
    const tokenRecord: FCMDeviceToken = {
      id: tokenId,
      userId,
      token,
      platform,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    if (this.isTestMode) {
      this.memoryTokens.set(tokenId, tokenRecord);
      return tokenRecord;
    }

    const tokenRef = doc(db, 'fcm_tokens', tokenId);
    await setDoc(tokenRef, tokenRecord, { merge: true });
    return tokenRecord;
  }

  /**
   * Unregisters/removes a device token (e.g. on logout or invalid token detection).
   */
  public async unregisterToken(userId: string, token: string): Promise<void> {
    const tokenId = this.getTokenDocId(token);
    
    if (this.isTestMode) {
      const record = this.memoryTokens.get(tokenId);
      if (record) {
        record.isActive = false;
        record.updatedAt = new Date().toISOString();
      }
      return;
    }

    const tokenRef = doc(db, 'fcm_tokens', tokenId);
    
    // Completely delete the record to keep tokens tidy and secure
    try {
      await deleteDoc(tokenRef);
    } catch (e) {
      // In case write is offline, update isActive locally
      try {
        await updateDoc(tokenRef, { isActive: false, updatedAt: new Date().toISOString() });
      } catch (err) {
        console.warn('Failed to unregister token offline:', err);
      }
    }
  }

  /**
   * Fetches active tokens for a specific user from Firestore.
   */
  public async getActiveTokens(userId: string): Promise<FCMDeviceToken[]> {
    if (this.isTestMode) {
      return Array.from(this.memoryTokens.values()).filter(
        (t) => t.userId === userId && t.isActive === true
      );
    }

    const tokensRef = collection(db, 'fcm_tokens');
    const q = query(tokensRef, where('userId', '==', userId), where('isActive', '==', true));
    
    try {
      const snapshot = await getDocs(q);
      const list: FCMDeviceToken[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as FCMDeviceToken);
      });
      return list;
    } catch (e) {
      console.warn('Failed to fetch active tokens from Firestore:', e);
      return [];
    }
  }

  /**
   * Signs a service account JWT natively in Node.js to fetch an OAuth2 access token.
   * This allows secure push notification delivery without heavy third-party authentication SDKs.
   */
  private generateJWT(clientEmail: string, privateKey: string): string {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const base64UrlEncode = (obj: any): string => {
      return Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    };

    const headerEnc = base64UrlEncode(header);
    const payloadEnc = base64UrlEncode(payload);
    const signatureInput = `${headerEnc}.${payloadEnc}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    
    // Private keys in env might have \n characters escaped
    const formattedKey = privateKey.replace(/\\n/g, '\n');
    const signature = signer.sign(formattedKey, 'base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${signatureInput}.${signature}`;
  }

  /**
   * Requests an OAuth2 access token from Google APIs using a JWT.
   */
  private async getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
    const jwt = this.generateJWT(clientEmail, privateKey);
    const params = new URLSearchParams();
    params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    params.append('assertion', jwt);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      throw new Error(`Failed to retrieve OAuth2 token: ${errTxt}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Internal mechanism to send an actual push notification via Google FCM REST API v1
   */
  private async triggerFcmRestCall(
    projectId: string,
    accessToken: string,
    deviceToken: string,
    payload: { title: string; message: string; type: string; notificationId: string }
  ): Promise<any> {
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    const fcmPayload = {
      message: {
        token: deviceToken,
        notification: {
          title: payload.title,
          body: payload.message,
        },
        data: {
          type: payload.type,
          notificationId: payload.notificationId,
          click_action: 'FLUTTER_NOTIFICATION_CLICK', // standard navigation intent
        },
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(fcmPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, status: response.status, error: errText };
    }

    const resJson = await response.json();
    return { success: true, response: resJson };
  }

  /**
   * Trusted Delivery pipeline for server-side push notifications.
   * Leverages idempotency, tracks delivery status logs, and invalidates bad tokens.
   */
  public async sendPushNotification(
    recipientUserId: string,
    event: {
      notificationId: string;
      type: string;
      title: string;
      message: string;
      isDemo: boolean;
    }
  ): Promise<PushNotificationDelivery> {
    const now = new Date().toISOString();
    const deliveryId = `deliv_${event.notificationId}_${recipientUserId}`;

    // 1. Idempotency Check: Prevent duplicate processing
    if (this.isTestMode) {
      if (this.memoryDeliveries.has(deliveryId)) {
        return this.memoryDeliveries.get(deliveryId)!;
      }
    } else {
      try {
        const existingDoc = await getDocs(query(collection(db, 'push_deliveries'), where('id', '==', deliveryId)));
        if (!existingDoc.empty) {
          return existingDoc.docs[0].data() as PushNotificationDelivery;
        }
      } catch (e) {
        console.warn('Failed querying push deliveries idempotency, continuing:', e);
      }
    }

    const deliveryRecord: PushNotificationDelivery = {
      id: deliveryId,
      recipientUserId,
      notificationId: event.notificationId,
      type: event.type,
      status: 'QUEUED',
      tokensCount: 0,
      createdAt: now,
      updatedAt: now,
      isDemo: event.isDemo,
    };

    if (this.isTestMode) {
      this.memoryDeliveries.set(deliveryId, deliveryRecord);
    }

    // 2. Demo Mode Check: Isolation from production push triggers
    if (event.isDemo) {
      deliveryRecord.status = 'FAILED_DISABLED';
      deliveryRecord.errorMessage = 'Real push delivery disabled for Demo Mode sessions.';
      if (this.isTestMode) {
        this.memoryDeliveries.set(deliveryId, deliveryRecord);
      } else {
        await setDoc(doc(db, 'push_deliveries', deliveryId), deliveryRecord);
      }
      return deliveryRecord;
    }

    // 2b. Client Browser Guard: Direct FCM dispatch is restricted to trusted server processes
    if (typeof window !== 'undefined') {
      deliveryRecord.status = 'FAILED_DISABLED';
      deliveryRecord.errorMessage = 'Push notification dispatch is restricted to trusted server-side execution.';
      if (this.isTestMode) {
        this.memoryDeliveries.set(deliveryId, deliveryRecord);
      } else {
        try {
          await setDoc(doc(db, 'push_deliveries', deliveryId), deliveryRecord);
        } catch (e) {
          // Offline write fallback
        }
      }
      return deliveryRecord;
    }

    // 3. Retrieve user's active device tokens
    const activeTokens = await this.getActiveTokens(recipientUserId);
    deliveryRecord.tokensCount = activeTokens.length;

    if (activeTokens.length === 0) {
      deliveryRecord.status = 'FAILED_DISABLED';
      deliveryRecord.errorMessage = 'No active FCM device registration tokens found for this user.';
      if (this.isTestMode) {
        this.memoryDeliveries.set(deliveryId, deliveryRecord);
      } else {
        await setDoc(doc(db, 'push_deliveries', deliveryId), deliveryRecord);
      }
      return deliveryRecord;
    }

    // 4. Check FCM Server Credentials
    const saEnv = process.env.FCM_SERVICE_ACCOUNT_KEY;
    if (!saEnv) {
      deliveryRecord.status = 'FAILED_DISABLED';
      deliveryRecord.errorMessage = 'FCM credentials (FCM_SERVICE_ACCOUNT_KEY) are missing in server environment variables.';
      if (this.isTestMode) {
        this.memoryDeliveries.set(deliveryId, deliveryRecord);
      } else {
        await setDoc(doc(db, 'push_deliveries', deliveryId), deliveryRecord);
      }
      return deliveryRecord;
    }

    let saJson: any;
    try {
      saJson = JSON.parse(saEnv);
    } catch (e) {
      deliveryRecord.status = 'FAILED_ERROR';
      deliveryRecord.errorMessage = 'Failed to parse FCM_SERVICE_ACCOUNT_KEY JSON credentials.';
      if (this.isTestMode) {
        this.memoryDeliveries.set(deliveryId, deliveryRecord);
      } else {
        await setDoc(doc(db, 'push_deliveries', deliveryId), deliveryRecord);
      }
      return deliveryRecord;
    }

    const { project_id, client_email, private_key } = saJson;
    if (!project_id || !client_email || !private_key) {
      deliveryRecord.status = 'FAILED_ERROR';
      deliveryRecord.errorMessage = 'FCM_SERVICE_ACCOUNT_KEY is missing project_id, client_email, or private_key fields.';
      if (this.isTestMode) {
        this.memoryDeliveries.set(deliveryId, deliveryRecord);
      } else {
        await setDoc(doc(db, 'push_deliveries', deliveryId), deliveryRecord);
      }
      return deliveryRecord;
    }

    // 5. Trigger delivery attempt
    deliveryRecord.status = 'ATTEMPTED';
    deliveryRecord.updatedAt = new Date().toISOString();
    if (this.isTestMode) {
      this.memoryDeliveries.set(deliveryId, deliveryRecord);
    } else {
      await setDoc(doc(db, 'push_deliveries', deliveryId), deliveryRecord);
    }

    try {
      const accessToken = await this.getAccessToken(client_email, private_key);
      const results: any[] = [];
      let unregisteredTokensCount = 0;

      for (const tokenRecord of activeTokens) {
        const res = await this.triggerFcmRestCall(project_id, accessToken, tokenRecord.token, event);
        results.push(res);

        if (!res.success) {
          // Handle invalid or expired tokens (e.g. Unregistered, 404, or 410)
          const isUnregistered = res.status === 404 || res.status === 410 || 
            (res.error && (res.error.includes('UNREGISTERED') || res.error.includes('not-registered') || res.error.includes('Requested entity was not found')));
          
          if (isUnregistered) {
            unregisteredTokensCount++;
            await this.unregisterToken(recipientUserId, tokenRecord.token);
          }
        }
      }

      const someSuccess = results.some(r => r.success);

      if (someSuccess) {
        deliveryRecord.status = 'CONFIRMED_DELIVERY';
        deliveryRecord.providerResponse = JSON.stringify(results.filter(r => r.success));
      } else if (unregisteredTokensCount === activeTokens.length) {
        deliveryRecord.status = 'FAILED_EXPIRED_TOKEN';
        deliveryRecord.errorMessage = 'All registered tokens returned as unregistered or expired.';
      } else {
        deliveryRecord.status = 'FAILED_ERROR';
        deliveryRecord.errorMessage = `FCM REST delivery failed for all devices: ${JSON.stringify(results)}`;
      }

    } catch (err: any) {
      deliveryRecord.status = 'FAILED_ERROR';
      deliveryRecord.errorMessage = err?.message || 'Unexpected delivery pipeline exception.';
    }

    deliveryRecord.updatedAt = new Date().toISOString();
    if (this.isTestMode) {
      this.memoryDeliveries.set(deliveryId, deliveryRecord);
    } else {
      await setDoc(doc(db, 'push_deliveries', deliveryId), deliveryRecord);
    }
    return deliveryRecord;
  }
}

export const fcmNotificationService = new FCMNotificationService();

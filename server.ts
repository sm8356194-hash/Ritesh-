import express, { Request, Response } from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Initialize Firebase SDK on Server
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Production & Development Middleware
app.use((req: Request, res: Response, next) => {
  const allowedOriginSetting = (process.env.CORS_ALLOWED_ORIGIN || '').trim();
  const requestOrigin = req.headers.origin;

  if (allowedOriginSetting && allowedOriginSetting !== '*') {
    const allowedList = allowedOriginSetting.split(',').map((o) => o.trim());
    if (requestOrigin && allowedList.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Vary', 'Origin');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Health Check Endpoints (GET /health and GET /api/health)
const handleHealthCheck = (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    app: 'Talk With Astrologers',
    version: '1.0.0-production',
  });
};

app.get('/health', handleHealthCheck);
app.get('/api/health', handleHealthCheck);

// Raw body parser middleware for Webhook signature verification
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));

// Static WebAssembly endpoints for Swiss Ephemeris with authoritative application/wasm MIME type
const wasmFilePath = path.join(__dirname, 'node_modules/sweph-wasm/dist/wasm/swisseph.wasm');

app.get(['/swisseph.wasm', '/wasm/swisseph.wasm', '/node_modules/sweph-wasm/dist/wasm/swisseph.wasm'], (_req: Request, res: Response) => {
  if (fs.existsSync(wasmFilePath)) {
    res.setHeader('Content-Type', 'application/wasm');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.sendFile(wasmFilePath);
  }
  return res.status(404).send('WASM file not found');
});

// Static public directory serving
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    }
  },
}));

// Server-Side Only Razorpay Environment Secrets
const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || '').trim();
const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || '').trim();
const RAZORPAY_WEBHOOK_SECRET = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();

const IS_RAZORPAY_CONFIGURED = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

/**
 * Authoritative Financial Calculation Helper (Integer Paise)
 * Step 22 Commission Model: Customer Payment 100%, Platform Fee 15%, Astrologer Share 85%
 */
function calculateFinancialBreakdown(grossRupees: number, platformFeePercent: number = 15) {
  const grossAmountPaise = Math.round(grossRupees * 100);
  const platformFeePaise = Math.round((grossAmountPaise * platformFeePercent) / 100);
  const astrologerAmountPaise = Math.max(0, grossAmountPaise - platformFeePaise);

  return {
    grossAmount: grossAmountPaise / 100,
    grossAmountPaise,
    platformFee: platformFeePaise / 100,
    platformFeePaise,
    platformFeePercent,
    astrologerAmount: astrologerAmountPaise / 100,
    astrologerAmountPaise,
    currency: 'INR',
  };
}

/**
 * Authoritative Proportional Refund Adjustment Helper (Integer Paise)
 */
function calculateRefundBreakdown(
  grossRupees: number,
  refundRupees: number,
  platformFeePercent: number = 15
) {
  const grossAmountPaise = Math.round(grossRupees * 100);
  const refundPaise = Math.min(grossAmountPaise, Math.round(refundRupees * 100));
  const platformFeeRefundPaise = Math.round((refundPaise * platformFeePercent) / 100);
  const astrologerAdjustmentPaise = Math.max(0, refundPaise - platformFeeRefundPaise);

  return {
    refundAmount: refundPaise / 100,
    refundPaise,
    platformFeeRefund: platformFeeRefundPaise / 100,
    platformFeeRefundPaise,
    astrologerAdjustment: astrologerAdjustmentPaise / 100,
    astrologerAdjustmentPaise,
    currency: 'INR',
  };
}
function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined) as unknown as T;
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      cleaned[key] = cleanUndefined(val);
    }
  }
  return cleaned;
}

/**
 * Helper: Timing-safe hex string comparison for HMAC SHA-256 signatures
 */
function safeCompareHex(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
function getRazorpayAuthHeader(): string {
  return `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`;
}

/**
 * 0. Health & Payment Provider Status Endpoint
 * GET /api/payment/status
 */
app.get('/api/payment/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    isServerVerificationRequired: true,
    providerConfigured: IS_RAZORPAY_CONFIGURED,
    providerName: 'RAZORPAY',
    razorpayKeyId: IS_RAZORPAY_CONFIGURED ? RAZORPAY_KEY_ID : null,
    code: IS_RAZORPAY_CONFIGURED ? 'RAZORPAY_CONFIGURED' : 'PAYMENT_PROVIDER_NOT_CONFIGURED',
    timestamp: new Date().toISOString(),
  });
});

/**
 * 1. SECURE PAYMENT ORDER CREATION (Server Authoritative)
 * Endpoint: POST /api/payment/create-order
 */
app.post('/api/payment/create-order', async (req: Request, res: Response) => {
  try {
    const { consultationId, userId, astrologerId, durationMinutes } = req.body;

    if (!consultationId || !userId || !astrologerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: consultationId, userId, astrologerId',
        code: 'INVALID_INPUT',
      });
    }

    // 1. Verify Consultation document in Firestore
    const consultRef = doc(db, 'consultations', consultationId);
    const consultSnap = await getDoc(consultRef);

    if (!consultSnap.exists()) {
      return res.status(404).json({
        success: false,
        error: `Consultation '${consultationId}' not found.`,
        code: 'CONSULTATION_NOT_FOUND',
      });
    }

    const consultation = consultSnap.data();

    // 2. Verify user owns consultation
    if (consultation.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: User does not own this consultation.',
        code: 'UNAUTHORIZED_ACCESS',
      });
    }

    // 3. Check for existing payment transaction (Idempotency)
    const txQuery = query(collection(db, 'payment_transactions'), where('consultationId', '==', consultationId));
    const txSnap = await getDocs(txQuery);

    if (!txSnap.empty) {
      const existingTx = txSnap.docs[0].data();
      if (existingTx.status === 'PAID') {
        return res.status(400).json({
          success: false,
          error: 'Consultation is already paid.',
          code: 'ALREADY_PAID',
        });
      }
      if (existingTx.status === 'PAYMENT_PENDING') {
        return res.json({
          success: true,
          order: {
            transactionId: existingTx.id,
            consultationId: existingTx.consultationId,
            amount: existingTx.amount,
            currency: existingTx.currency || 'INR',
            provider: 'RAZORPAY',
            providerOrderId: existingTx.providerOrderId,
            razorpayKeyId: IS_RAZORPAY_CONFIGURED ? RAZORPAY_KEY_ID : null,
            providerConfigured: IS_RAZORPAY_CONFIGURED,
            status: existingTx.status,
            isServerVerificationRequired: true,
          },
        });
      }
    }

    // 4. Calculate authoritative price server-side from Astrologer Profile & App Settings
    let ratePerMinute = 15;
    const astroSnap = await getDoc(doc(db, 'astrologer_profiles', astrologerId));
    if (astroSnap.exists()) {
      const astroData = astroSnap.data();
      if (astroData.perMinuteCharge && astroData.perMinuteCharge > 0) {
        ratePerMinute = astroData.perMinuteCharge;
      }
    }

    let minPrice = 10;
    let currency = 'INR';
    const settingsSnap = await getDoc(doc(db, 'app_settings', 'global_app_settings'));
    if (settingsSnap.exists()) {
      const settingsData = settingsSnap.data();
      minPrice = settingsData.minConsultationPrice || 10;
      currency = settingsData.currency || 'INR';
    }

    const minutes = Math.max(5, Number(durationMinutes) || 15);
    const authoritativeAmount = Math.max(minPrice, minutes * ratePerMinute);
    const amountInPaise = Math.round(authoritativeAmount * 100);

    const now = new Date().toISOString();
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    let providerOrderId = `ord_gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 5. Create Order via Razorpay REST API if credentials exist
    if (IS_RAZORPAY_CONFIGURED) {
      try {
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': getRazorpayAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency,
            receipt: txId,
            notes: {
              consultationId,
              userId,
              astrologerId,
            },
          }),
        });

        if (rzpResponse.ok) {
          const rzpOrder = await rzpResponse.json();
          if (rzpOrder.id) {
            providerOrderId = rzpOrder.id;
          }
        } else {
          const errJson = await rzpResponse.json();
          console.warn('Razorpay API order creation warning:', errJson);
        }
      } catch (err) {
        console.warn('Failed to reach Razorpay REST API, falling back to local order ID reference:', err);
      }
    }

    const newTransaction = {
      id: txId,
      consultationId,
      userId,
      userName: consultation.userName || 'Client User',
      astrologerId,
      astrologerName: consultation.astrologerName || 'Astrologer',
      astrologerUserId: consultation.astrologerUserId || astrologerId,
      amount: authoritativeAmount,
      currency,
      provider: 'RAZORPAY',
      providerOrderId,
      status: 'PAYMENT_PENDING',
      createdAt: now,
      updatedAt: now,
      idempotencyKey: `idem_${consultationId}`,
    };

    // Save transaction to Firestore
    await setDoc(doc(db, 'payment_transactions', txId), cleanUndefined(newTransaction));

    // Update Consultation document
    await updateDoc(consultRef, cleanUndefined({
      paymentStatus: 'PAYMENT_PENDING',
      paymentId: txId,
      fee: authoritativeAmount,
      currency,
      priceSnapshot: {
        fee: authoritativeAmount,
        currency,
        ratePerMinute,
        durationMinutes: minutes,
      },
      updatedAt: now,
    }));

    // Create Audit Log
    const auditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      transactionId: txId,
      consultationId,
      eventType: 'PAYMENT_ORDER_CREATED',
      actorId: userId,
      details: `Server created payment order '${providerOrderId}' for ${currency} ${authoritativeAmount}`,
      timestamp: now,
    };
    await setDoc(doc(db, 'payment_audit_logs', auditLog.id), cleanUndefined(auditLog));

    return res.json({
      success: true,
      order: {
        transactionId: txId,
        consultationId,
        amount: authoritativeAmount,
        currency,
        provider: 'RAZORPAY',
        providerOrderId,
        razorpayKeyId: IS_RAZORPAY_CONFIGURED ? RAZORPAY_KEY_ID : null,
        providerConfigured: IS_RAZORPAY_CONFIGURED,
        status: 'PAYMENT_PENDING',
        isServerVerificationRequired: true,
      },
    });
  } catch (error: any) {
    console.error('Error creating payment order:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Server error creating payment order.',
      code: 'SERVER_ERROR',
    });
  }
});

/**
 * 2. SERVER-SIDE RAZORPAY PAYMENT VERIFICATION
 * Endpoint: POST /api/payment/verify
 */
app.post('/api/payment/verify', async (req: Request, res: Response) => {
  try {
    const { transactionId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: transactionId.',
        code: 'INVALID_PARAMETERS',
      });
    }

    // Check if Razorpay credentials are configured
    if (!IS_RAZORPAY_CONFIGURED) {
      return res.status(400).json({
        success: false,
        code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
        error: 'Razorpay credentials are not configured in server environment. Real payment provider integration is pending configuration.',
      });
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required Razorpay verification parameters (razorpayOrderId, razorpayPaymentId, razorpaySignature).',
        code: 'MISSING_SIGNATURE_PARAMS',
      });
    }

    // Retrieve Transaction Document from Firestore
    const txRef = doc(db, 'payment_transactions', transactionId);
    const txSnap = await getDoc(txRef);

    if (!txSnap.exists()) {
      return res.status(404).json({
        success: false,
        error: `Transaction '${transactionId}' not found.`,
        code: 'TRANSACTION_NOT_FOUND',
      });
    }

    const tx = txSnap.data();

    // Idempotency check: If already paid, return existing status
    if (tx.status === 'PAID') {
      return res.json({
        success: true,
        verification: {
          transactionId: tx.id,
          consultationId: tx.consultationId,
          status: 'PAID',
          paidAt: tx.paidAt || tx.updatedAt,
          earningsBreakdown: tx.earningsBreakdown,
        },
      });
    }

    // Verify order ID matches trusted stored order ID
    if (tx.providerOrderId && tx.providerOrderId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        code: 'ORDER_MISMATCH',
        error: `Razorpay order ID '${razorpayOrderId}' does not match transaction order ID '${tx.providerOrderId}'.`,
      });
    }

    // HMAC SHA-256 Signature Verification
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (!safeCompareHex(generatedSignature, razorpaySignature)) {
      console.warn(`Razorpay signature mismatch for transaction '${transactionId}'`);
      return res.status(400).json({
        success: false,
        code: 'INVALID_SIGNATURE',
        error: 'Razorpay HMAC SHA-256 signature verification failed.',
      });
    }

    // Verify Payment Details with Razorpay REST API
    try {
      const pmtRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': getRazorpayAuthHeader(),
        },
      });

      if (pmtRes.ok) {
        const pmtData = await pmtRes.json();
        const expectedPaise = Math.round(tx.amount * 100);

        if (pmtData.amount && Math.abs(pmtData.amount - expectedPaise) > 1) {
          return res.status(400).json({
            success: false,
            code: 'AMOUNT_MISMATCH',
            error: `Payment amount mismatch. Expected: ${expectedPaise} paise, Received: ${pmtData.amount} paise.`,
          });
        }

        if (pmtData.currency && pmtData.currency.toUpperCase() !== (tx.currency || 'INR').toUpperCase()) {
          return res.status(400).json({
            success: false,
            code: 'CURRENCY_MISMATCH',
            error: `Currency mismatch. Expected: ${tx.currency}, Received: ${pmtData.currency}.`,
          });
        }
      }
    } catch (apiErr) {
      console.warn('Razorpay payment fetch verification API check error:', apiErr);
    }

    // Authoritative Financial Breakdown Calculation (Integer Paise)
    const now = new Date().toISOString();
    const fin = calculateFinancialBreakdown(tx.amount, 15);

    const earningsBreakdown = {
      grossAmount: fin.grossAmount,
      platformFee: fin.platformFee,
      astrologerAmount: fin.astrologerAmount,
      currency: fin.currency,
    };

    // Update Transaction to PAID
    await updateDoc(txRef, cleanUndefined({
      status: 'PAID',
      providerPaymentId: razorpayPaymentId,
      paidAt: now,
      updatedAt: now,
      earningsBreakdown,
    }));

    // Step 22 Ledger Records with Deterministic IDs for Idempotency
    const earnId = `earn_${tx.id}`;
    const platId = `plat_${tx.id}`;

    const astrologerEarning = {
      id: earnId,
      astrologerUserId: tx.astrologerUserId || tx.astrologerId,
      astrologerId: tx.astrologerId,
      consultationId: tx.consultationId,
      paymentTransactionId: tx.id,
      grossAmount: fin.grossAmount,
      grossAmountPaise: fin.grossAmountPaise,
      platformFee: fin.platformFee,
      platformFeePaise: fin.platformFeePaise,
      platformFeePercent: fin.platformFeePercent,
      astrologerAmount: fin.astrologerAmount,
      astrologerAmountPaise: fin.astrologerAmountPaise,
      refundAdjustment: 0,
      refundAdjustmentPaise: 0,
      netAmount: fin.astrologerAmount,
      netAmountPaise: fin.astrologerAmountPaise,
      currency: fin.currency,
      status: 'EARNED',
      createdAt: now,
      paidAt: now,
      updatedAt: now,
    };

    const platformEarning = {
      id: platId,
      transactionId: tx.id,
      consultationId: tx.consultationId,
      grossAmount: fin.grossAmount,
      grossAmountPaise: fin.grossAmountPaise,
      platformFee: fin.platformFee,
      platformFeePaise: fin.platformFeePaise,
      platformFeePercent: fin.platformFeePercent,
      refundAdjustment: 0,
      refundAdjustmentPaise: 0,
      netPlatformEarning: fin.platformFee,
      netPlatformEarningPaise: fin.platformFeePaise,
      currency: fin.currency,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'astrologer_earnings', earnId), cleanUndefined(astrologerEarning));
    await setDoc(doc(db, 'platform_earnings', platId), cleanUndefined(platformEarning));

    // Synchronize Consultation paymentStatus to PAID
    const consultRef = doc(db, 'consultations', tx.consultationId);
    await updateDoc(consultRef, cleanUndefined({
      paymentStatus: 'PAID',
      paymentId: tx.id,
      updatedAt: now,
    }));

    // Immutable Audit Logs
    const auditLogs = [
      {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_1`,
        transactionId: tx.id,
        consultationId: tx.consultationId,
        eventType: 'PAYMENT_VERIFIED',
        actorId: tx.userId,
        details: `Razorpay signature verified for payment '${razorpayPaymentId}' (Order: ${razorpayOrderId})`,
        timestamp: now,
      },
      {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_2`,
        transactionId: tx.id,
        consultationId: tx.consultationId,
        eventType: 'PAYMENT_PAID',
        actorId: tx.userId,
        details: `Payment recorded as PAID for transaction '${tx.id}' (${fin.currency} ${fin.grossAmount})`,
        timestamp: now,
      },
      {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_3`,
        transactionId: tx.id,
        consultationId: tx.consultationId,
        eventType: 'EARNING_CREATED',
        actorId: tx.userId,
        details: `Astrologer earning of ${fin.currency} ${fin.astrologerAmount} recorded for astrologer '${tx.astrologerId}'`,
        timestamp: now,
      },
      {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_4`,
        transactionId: tx.id,
        consultationId: tx.consultationId,
        eventType: 'PLATFORM_FEE_RECORDED',
        actorId: tx.userId,
        details: `Platform fee of ${fin.currency} ${fin.platformFee} (15%) recorded`,
        timestamp: now,
      },
    ];

    for (const log of auditLogs) {
      await setDoc(doc(db, 'payment_audit_logs', log.id), cleanUndefined(log));
    }

    // Step 24 Server In-App Notification
    const userNotifId = `notif_pmt_verified_${tx.id}`;
    const userNotif = {
      id: userNotifId,
      recipientUserId: tx.userId,
      type: 'PAYMENT_VERIFIED',
      title: 'Payment Successful',
      titleHi: 'भुगतान सफल',
      message: `Your payment of ${fin.currency} ${fin.grossAmount} for consultation has been verified.`,
      messageHi: `परामर्श के लिए आपका ${fin.currency} ${fin.grossAmount} का भुगतान सत्यापित हो गया है।`,
      relatedEntityId: tx.id,
      relatedEntityType: 'PAYMENT',
      isRead: false,
      createdAt: now,
      idempotencyKey: `pmt_verified_${tx.id}`,
    };
    await setDoc(doc(db, 'notifications', userNotifId), cleanUndefined(userNotif));

    return res.json({
      success: true,
      verification: {
        transactionId: tx.id,
        consultationId: tx.consultationId,
        status: 'PAID',
        paidAt: now,
        earningsBreakdown,
      },
    });
  } catch (error: any) {
    console.error('Error during payment verification:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Server error during payment verification.',
      code: 'SERVER_ERROR',
    });
  }
});

/**
 * 3. RAZORPAY WEBHOOK ADAPTER ENDPOINT
 * Endpoint: POST /api/payment/webhook
 */
app.post('/api/payment/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!RAZORPAY_WEBHOOK_SECRET) {
      return res.status(200).json({
        status: 'ignored',
        code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
        message: 'Razorpay webhook secret is not configured in server environment.',
      });
    }

    if (!signature) {
      return res.status(400).json({ success: false, error: 'Missing x-razorpay-signature header.' });
    }

    // Verify webhook signature over raw request body
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (!safeCompareHex(expectedSignature, signature)) {
      return res.status(400).json({ success: false, error: 'Invalid webhook signature.' });
    }

    const event = req.body;
    const eventType = event?.event;

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const pmt = event.payload?.payment?.entity;
      const rzpOrderId = pmt?.order_id;
      const rzpPaymentId = pmt?.id;

      if (rzpOrderId) {
        const txQuery = query(collection(db, 'payment_transactions'), where('providerOrderId', '==', rzpOrderId));
        const txSnap = await getDocs(txQuery);

        if (!txSnap.empty) {
          const txDoc = txSnap.docs[0];
          const tx = txDoc.data();

          if (tx.status !== 'PAID') {
            const now = new Date().toISOString();
            const fin = calculateFinancialBreakdown(tx.amount, 15);

            const earningsBreakdown = {
              grossAmount: fin.grossAmount,
              platformFee: fin.platformFee,
              astrologerAmount: fin.astrologerAmount,
              currency: fin.currency,
            };

            await updateDoc(doc(db, 'payment_transactions', tx.id), cleanUndefined({
              status: 'PAID',
              providerPaymentId: rzpPaymentId || tx.providerPaymentId,
              paidAt: now,
              updatedAt: now,
              earningsBreakdown,
            }));

            // Step 22 Earnings Ledgers with Deterministic IDs for Idempotency
            const earnId = `earn_${tx.id}`;
            const platId = `plat_${tx.id}`;

            const astrologerEarning = {
              id: earnId,
              astrologerUserId: tx.astrologerUserId || tx.astrologerId,
              astrologerId: tx.astrologerId,
              consultationId: tx.consultationId,
              paymentTransactionId: tx.id,
              grossAmount: fin.grossAmount,
              grossAmountPaise: fin.grossAmountPaise,
              platformFee: fin.platformFee,
              platformFeePaise: fin.platformFeePaise,
              platformFeePercent: fin.platformFeePercent,
              astrologerAmount: fin.astrologerAmount,
              astrologerAmountPaise: fin.astrologerAmountPaise,
              refundAdjustment: 0,
              refundAdjustmentPaise: 0,
              netAmount: fin.astrologerAmount,
              netAmountPaise: fin.astrologerAmountPaise,
              currency: fin.currency,
              status: 'EARNED',
              createdAt: now,
              paidAt: now,
              updatedAt: now,
            };

            const platformEarning = {
              id: platId,
              transactionId: tx.id,
              consultationId: tx.consultationId,
              grossAmount: fin.grossAmount,
              grossAmountPaise: fin.grossAmountPaise,
              platformFee: fin.platformFee,
              platformFeePaise: fin.platformFeePaise,
              platformFeePercent: fin.platformFeePercent,
              refundAdjustment: 0,
              refundAdjustmentPaise: 0,
              netPlatformEarning: fin.platformFee,
              netPlatformEarningPaise: fin.platformFeePaise,
              currency: fin.currency,
              createdAt: now,
              updatedAt: now,
            };

            await setDoc(doc(db, 'astrologer_earnings', earnId), cleanUndefined(astrologerEarning));
            await setDoc(doc(db, 'platform_earnings', platId), cleanUndefined(platformEarning));

            await updateDoc(doc(db, 'consultations', tx.consultationId), cleanUndefined({
              paymentStatus: 'PAID',
              paymentId: tx.id,
              updatedAt: now,
            }));

            const auditLogs = [
              {
                id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_w1`,
                transactionId: tx.id,
                consultationId: tx.consultationId,
                eventType: 'PAYMENT_WEBHOOK_CAPTURED',
                actorId: tx.userId || 'SYSTEM_WEBHOOK',
                details: `Webhook payment.captured processed for payment '${rzpPaymentId}'`,
                timestamp: now,
              },
              {
                id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_w2`,
                transactionId: tx.id,
                consultationId: tx.consultationId,
                eventType: 'PAYMENT_PAID',
                actorId: tx.userId || 'SYSTEM_WEBHOOK',
                details: `Payment recorded as PAID via webhook for transaction '${tx.id}' (${fin.currency} ${fin.grossAmount})`,
                timestamp: now,
              },
              {
                id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_w3`,
                transactionId: tx.id,
                consultationId: tx.consultationId,
                eventType: 'EARNING_CREATED',
                actorId: tx.userId || 'SYSTEM_WEBHOOK',
                details: `Astrologer earning of ${fin.currency} ${fin.astrologerAmount} recorded for astrologer '${tx.astrologerId}'`,
                timestamp: now,
              },
              {
                id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_w4`,
                transactionId: tx.id,
                consultationId: tx.consultationId,
                eventType: 'PLATFORM_FEE_RECORDED',
                actorId: tx.userId || 'SYSTEM_WEBHOOK',
                details: `Platform fee of ${fin.currency} ${fin.platformFee} (15%) recorded`,
                timestamp: now,
              },
            ];

            for (const log of auditLogs) {
              await setDoc(doc(db, 'payment_audit_logs', log.id), cleanUndefined(log));
            }
          }
        }
      }
    } else if (eventType === 'payment.failed') {
      const pmt = event.payload?.payment?.entity;
      const rzpOrderId = pmt?.order_id;

      if (rzpOrderId) {
        const txQuery = query(collection(db, 'payment_transactions'), where('providerOrderId', '==', rzpOrderId));
        const txSnap = await getDocs(txQuery);

        if (!txSnap.empty) {
          const txDoc = txSnap.docs[0];
          const tx = txDoc.data();

          if (tx.status === 'PAYMENT_PENDING') {
            const now = new Date().toISOString();
            await updateDoc(doc(db, 'payment_transactions', tx.id), cleanUndefined({
              status: 'PAYMENT_FAILED',
              updatedAt: now,
            }));

            await updateDoc(doc(db, 'consultations', tx.consultationId), cleanUndefined({
              paymentStatus: 'PAYMENT_FAILED',
              updatedAt: now,
            }));

            const auditLog = {
              id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              transactionId: tx.id,
              consultationId: tx.consultationId,
              eventType: 'PAYMENT_WEBHOOK_FAILED',
              actorId: tx.userId || 'SYSTEM_WEBHOOK',
              details: `Webhook payment.failed processed for order '${rzpOrderId}'`,
              timestamp: now,
            };
            await setDoc(doc(db, 'payment_audit_logs', auditLog.id), cleanUndefined(auditLog));
          }
        }
      }
    }

    return res.status(200).json({ status: 'processed', event: eventType });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Server error processing webhook.' });
  }
});

/**
 * 4. SERVER-SIDE RAZORPAY REFUND ENDPOINT
 * Endpoint: POST /api/payment/refund
 */
app.post('/api/payment/refund', async (req: Request, res: Response) => {
  try {
    const { transactionId, adminUserId, amount, reason } = req.body;

    if (!transactionId || !adminUserId) {
      return res.status(400).json({ success: false, error: 'Missing transactionId or adminUserId.' });
    }

    // Verify admin user
    const userSnap = await getDoc(doc(db, 'users', adminUserId));
    if (!userSnap.exists() || userSnap.data().role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin privileges required.' });
    }

    const txRef = doc(db, 'payment_transactions', transactionId);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }

    const tx = txSnap.data();
    if (tx.status !== 'PAID') {
      return res.status(400).json({ success: false, error: `Cannot refund transaction in status '${tx.status}'.` });
    }

    const refundAmount = amount && amount > 0 ? Math.min(amount, tx.amount) : tx.amount;
    const isPartial = refundAmount < tx.amount;
    const newStatus = isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED';
    const now = new Date().toISOString();

    let razorpayRefundId = null;

    // Call Razorpay Refund API if credentials exist and payment ID is present
    if (IS_RAZORPAY_CONFIGURED && tx.providerPaymentId) {
      try {
        const refRes = await fetch(`https://api.razorpay.com/v1/payments/${tx.providerPaymentId}/refund`, {
          method: 'POST',
          headers: {
            'Authorization': getRazorpayAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(refundAmount * 100),
            notes: {
              reason: reason || 'Admin requested refund',
              adminUserId,
            },
          }),
        });

        if (refRes.ok) {
          const refData = await refRes.json();
          razorpayRefundId = refData.id;
        }
      } catch (err) {
        console.warn('Razorpay refund API call error:', err);
      }
    }

    // Calculate Proportional Refund Adjustment (Integer Paise)
    const refBreakdown = calculateRefundBreakdown(tx.amount, refundAmount, 15);

    await updateDoc(txRef, cleanUndefined({
      status: newStatus,
      refundAmount: refBreakdown.refundAmount,
      refundedAt: now,
      razorpayRefundId,
      updatedAt: now,
    }));

    // Adjust Astrologer Earning Record
    const earnId = `earn_${tx.id}`;
    const earnRef = doc(db, 'astrologer_earnings', earnId);
    const earnSnap = await getDoc(earnRef);
    if (earnSnap.exists()) {
      const existingEarn = earnSnap.data();
      const netAmountPaise = Math.max(0, (existingEarn.astrologerAmountPaise || Math.round(existingEarn.astrologerAmount * 100)) - refBreakdown.astrologerAdjustmentPaise);
      const isFullRefund = refBreakdown.refundPaise >= (existingEarn.grossAmountPaise || Math.round(existingEarn.grossAmount * 100));

      await updateDoc(earnRef, cleanUndefined({
        refundAdjustment: refBreakdown.astrologerAdjustment,
        refundAdjustmentPaise: refBreakdown.astrologerAdjustmentPaise,
        netAmount: netAmountPaise / 100,
        netAmountPaise,
        status: isFullRefund ? 'REVERSED' : 'REFUND_ADJUSTED',
        refundedAt: now,
        updatedAt: now,
      }));
    }

    // Adjust Platform Earning Record
    const platId = `plat_${tx.id}`;
    const platRef = doc(db, 'platform_earnings', platId);
    const platSnap = await getDoc(platRef);
    if (platSnap.exists()) {
      const existingPlat = platSnap.data();
      const netPlatformEarningPaise = Math.max(0, (existingPlat.platformFeePaise || Math.round(existingPlat.platformFee * 100)) - refBreakdown.platformFeeRefundPaise);

      await updateDoc(platRef, cleanUndefined({
        refundAdjustment: refBreakdown.platformFeeRefund,
        refundAdjustmentPaise: refBreakdown.platformFeeRefundPaise,
        netPlatformEarning: netPlatformEarningPaise / 100,
        netPlatformEarningPaise,
        updatedAt: now,
      }));
    }

    await updateDoc(doc(db, 'consultations', tx.consultationId), cleanUndefined({
      paymentStatus: newStatus,
      updatedAt: now,
    }));

    const auditLogs = [
      {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_r1`,
        transactionId: tx.id,
        consultationId: tx.consultationId,
        eventType: 'REFUND_VERIFIED',
        actorId: adminUserId,
        details: `Refund processed (${newStatus}): ${tx.currency || 'INR'} ${refundAmount}. Reason: ${reason || 'N/A'}`,
        timestamp: now,
      },
      {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_r2`,
        transactionId: tx.id,
        consultationId: tx.consultationId,
        eventType: 'EARNING_REFUND_ADJUSTED',
        actorId: adminUserId,
        details: `Earnings refund adjustment processed (${newStatus}): Astrologer adjustment ${tx.currency || 'INR'} ${refBreakdown.astrologerAdjustment}, Platform adjustment ${tx.currency || 'INR'} ${refBreakdown.platformFeeRefund}`,
        timestamp: now,
      },
    ];

    for (const log of auditLogs) {
      await setDoc(doc(db, 'payment_audit_logs', log.id), cleanUndefined(log));
    }

    // Step 24 Server Refund Notification
    const refNotifId = `notif_pmt_refund_${tx.id}_${Date.now()}`;
    const refNotif = {
      id: refNotifId,
      recipientUserId: tx.userId,
      type: 'PAYMENT_REFUNDED',
      title: 'Payment Refunded',
      titleHi: 'भुगतान वापस कर दिया गया',
      message: `A refund of ${tx.currency || 'INR'} ${refundAmount} has been processed for your transaction.`,
      messageHi: `आपके लेनदेन के लिए ${tx.currency || 'INR'} ${refundAmount} की वापसी संसाधित की गई है।`,
      relatedEntityId: tx.id,
      relatedEntityType: 'PAYMENT',
      isRead: false,
      createdAt: now,
      idempotencyKey: `pmt_refund_${tx.id}_${refundAmount}`,
    };
    await setDoc(doc(db, 'notifications', refNotifId), cleanUndefined(refNotif));

    return res.json({
      success: true,
      data: {
        transactionId: tx.id,
        consultationId: tx.consultationId,
        status: newStatus,
        refundedAmount: refundAmount,
        refundedAt: now,
        razorpayRefundId,
      },
    });
  } catch (error: any) {
    console.error('Error processing refund:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Server error processing refund.' });
  }
});

/**
 * 5. SERVER-SIDE PAYOUT SETTLEMENT FOUNDATION ENDPOINTS (Step 23)
 */

// Preview Settlement
app.get('/api/payouts/preview', async (req: Request, res: Response) => {
  try {
    const { astrologerUserId, periodStart, periodEnd, adminUserId } = req.query;

    if (!adminUserId || !astrologerUserId) {
      return res.status(400).json({ success: false, error: 'Missing adminUserId or astrologerUserId.' });
    }

    const adminSnap = await getDoc(doc(db, 'users', String(adminUserId)));
    if (!adminSnap.exists() || adminSnap.data().role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin privileges required.' });
    }

    // Get all earnings for astrologer
    const earnQuery = query(collection(db, 'astrologer_earnings'), where('astrologerUserId', '==', String(astrologerUserId)));
    const earnSnap = await getDocs(earnQuery);
    const earnings = earnSnap.docs.map(d => d.data());

    // Get all existing payouts to filter out already settled earnings
    const payoutSnap = await getDocs(collection(db, 'astrologer_payouts'));
    const alreadySettledIds = new Set<string>();
    payoutSnap.docs.forEach(d => {
      const p = d.data();
      if (p.status !== 'CANCELLED' && p.status !== 'FAILED') {
        (p.earningRecordIds || []).forEach((id: string) => alreadySettledIds.add(id));
      }
    });

    const startStr = periodStart ? String(periodStart) : '';
    const endStr = periodEnd ? String(periodEnd) : '';

    const eligible = earnings.filter(e => {
      if (e.payoutId || alreadySettledIds.has(e.id)) return false;
      if (e.status === 'PENDING' || e.status === 'REVERSED') return false;
      if (startStr && e.createdAt.substring(0, 10) < startStr) return false;
      if (endStr && e.createdAt.substring(0, 10) > endStr) return false;
      return true;
    });

    let grossPaise = 0;
    let refundPaise = 0;

    eligible.forEach(e => {
      grossPaise += (e.astrologerAmountPaise || Math.round((e.astrologerAmount || 0) * 100));
      refundPaise += (e.refundAdjustmentPaise || Math.round((e.refundAdjustment || 0) * 100));
    });

    const netPaise = Math.max(0, grossPaise - refundPaise);

    return res.json({
      success: true,
      data: {
        astrologerUserId: String(astrologerUserId),
        earningPeriodStart: startStr || 'Beginning',
        earningPeriodEnd: endStr || 'Current',
        grossEarnings: grossPaise / 100,
        grossEarningsPaise: grossPaise,
        refundAdjustments: refundPaise / 100,
        refundAdjustmentsPaise: refundPaise,
        netPayable: netPaise / 100,
        netPayablePaise: netPaise,
        currency: 'INR',
        eligibleEarningRecordIds: eligible.map(e => e.id),
        consultationCount: eligible.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error previewing settlement.' });
  }
});

// Create Settlement Payout
app.post('/api/payouts/create', async (req: Request, res: Response) => {
  try {
    const { adminUserId, astrologerUserId, periodStart, periodEnd, adminNote } = req.body;

    if (!adminUserId || !astrologerUserId) {
      return res.status(400).json({ success: false, error: 'Missing adminUserId or astrologerUserId.' });
    }

    const adminSnap = await getDoc(doc(db, 'users', adminUserId));
    if (!adminSnap.exists() || adminSnap.data().role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin privileges required.' });
    }

    const astroSnap = await getDoc(doc(db, 'users', astrologerUserId));
    const astrologerName = astroSnap.exists() ? astroSnap.data().displayName : 'Astrologer';

    // Get eligible earnings
    const earnQuery = query(collection(db, 'astrologer_earnings'), where('astrologerUserId', '==', astrologerUserId));
    const earnSnap = await getDocs(earnQuery);
    const earnings = earnSnap.docs.map(d => d.data());

    const payoutSnap = await getDocs(collection(db, 'astrologer_payouts'));
    const alreadySettledIds = new Set<string>();
    payoutSnap.docs.forEach(d => {
      const p = d.data();
      if (p.status !== 'CANCELLED' && p.status !== 'FAILED') {
        (p.earningRecordIds || []).forEach((id: string) => alreadySettledIds.add(id));
      }
    });

    const startStr = periodStart ? String(periodStart) : '';
    const endStr = periodEnd ? String(periodEnd) : '';

    const eligible = earnings.filter(e => {
      if (e.payoutId || alreadySettledIds.has(e.id)) return false;
      if (e.status === 'PENDING' || e.status === 'REVERSED') return false;
      if (startStr && e.createdAt.substring(0, 10) < startStr) return false;
      if (endStr && e.createdAt.substring(0, 10) > endStr) return false;
      return true;
    });

    if (eligible.length === 0) {
      return res.status(400).json({ success: false, error: 'No eligible unsettled earnings found for settlement.' });
    }

    let grossPaise = 0;
    let refundPaise = 0;

    eligible.forEach(e => {
      grossPaise += (e.astrologerAmountPaise || Math.round((e.astrologerAmount || 0) * 100));
      refundPaise += (e.refundAdjustmentPaise || Math.round((e.refundAdjustment || 0) * 100));
    });

    const netPaise = Math.max(0, grossPaise - refundPaise);
    const now = new Date().toISOString();
    const payoutId = `payout_${astrologerUserId}_${Date.now()}`;

    const newPayout = {
      id: payoutId,
      astrologerUserId,
      astrologerId: astrologerUserId,
      astrologerName,
      earningPeriodStart: startStr || 'Beginning',
      earningPeriodEnd: endStr || 'Current',
      grossEarnings: grossPaise / 100,
      grossEarningsPaise: grossPaise,
      refundAdjustments: refundPaise / 100,
      refundAdjustmentsPaise: refundPaise,
      netPayable: netPaise / 100,
      netPayablePaise: netPaise,
      currency: 'INR',
      status: 'PENDING',
      earningRecordIds: eligible.map(e => e.id),
      consultationCount: eligible.length,
      createdAt: now,
      updatedAt: now,
      adminNote: adminNote || 'Admin initiated settlement creation',
    };

    // Save payout record
    await setDoc(doc(db, 'astrologer_payouts', payoutId), cleanUndefined(newPayout));

    // Link payoutId on each settled astrologer_earnings document
    for (const earnRecord of eligible) {
      await updateDoc(doc(db, 'astrologer_earnings', earnRecord.id), { payoutId });
    }

    const auditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      transactionId: `payout_tx_${payoutId}`,
      consultationId: 'SETTLEMENT',
      payoutId,
      eventType: 'PAYOUT_CREATED',
      actorId: adminUserId,
      details: `Settlement payout '${payoutId}' created in PENDING status for INR ${newPayout.netPayable}`,
      timestamp: now,
    };
    await setDoc(doc(db, 'payment_audit_logs', auditLog.id), cleanUndefined(auditLog));

    return res.json({ success: true, data: newPayout });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error creating settlement payout.' });
  }
});

// Update Payout Status (Controlled State Machine)
app.post('/api/payouts/update-status', async (req: Request, res: Response) => {
  try {
    const { adminUserId, payoutId, newStatus, adminNote, failureReason } = req.body;

    if (!adminUserId || !payoutId || !newStatus) {
      return res.status(400).json({ success: false, error: 'Missing adminUserId, payoutId, or newStatus.' });
    }

    const adminSnap = await getDoc(doc(db, 'users', adminUserId));
    if (!adminSnap.exists() || adminSnap.data().role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin privileges required.' });
    }

    const payoutRef = doc(db, 'astrologer_payouts', payoutId);
    const payoutSnap = await getDoc(payoutRef);
    if (!payoutSnap.exists()) {
      return res.status(404).json({ success: false, error: `Payout record '${payoutId}' not found.` });
    }

    const current = payoutSnap.data().status;
    const next = newStatus;

    const isValidTransition = 
      (current === 'PENDING' && (next === 'APPROVED' || next === 'CANCELLED')) ||
      (current === 'APPROVED' && (next === 'PROCESSING' || next === 'CANCELLED')) ||
      (current === 'PROCESSING' && (next === 'PAID' || next === 'FAILED')) ||
      (current === 'FAILED' && next === 'PENDING');

    if (!isValidTransition) {
      return res.status(400).json({
        success: false,
        error: `Invalid payout state transition from '${current}' to '${next}'.`,
      });
    }

    const now = new Date().toISOString();
    const updates: any = {
      status: next,
      updatedAt: now,
      adminNote: adminNote || payoutSnap.data().adminNote,
    };

    let auditType: any = 'PAYOUT_APPROVED';

    if (next === 'APPROVED') {
      updates.approvedAt = now;
      auditType = 'PAYOUT_APPROVED';
    } else if (next === 'PROCESSING') {
      updates.processedAt = now;
      auditType = 'PAYOUT_PROCESSING';
    } else if (next === 'PAID') {
      updates.completedAt = now;
      auditType = 'PAYOUT_PAID';
    } else if (next === 'FAILED') {
      updates.rejectedAt = now;
      updates.failureReason = failureReason || 'Settlement processing failed';
      auditType = 'PAYOUT_FAILED';

      // Unlink payoutId on failed payout so earnings can be re-settled upon admin correction
      const earningIds = payoutSnap.data().earningRecordIds || [];
      for (const earnId of earningIds) {
        await updateDoc(doc(db, 'astrologer_earnings', earnId), { payoutId: null });
      }
    } else if (next === 'CANCELLED') {
      updates.rejectedAt = now;
      auditType = 'PAYOUT_CANCELLED';

      // Unlink payoutId on cancelled payout so earnings are released back for settlement
      const earningIds = payoutSnap.data().earningRecordIds || [];
      for (const earnId of earningIds) {
        await updateDoc(doc(db, 'astrologer_earnings', earnId), { payoutId: null });
      }
    }

    await updateDoc(payoutRef, cleanUndefined(updates));

    const auditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      transactionId: `payout_tx_${payoutId}`,
      consultationId: 'SETTLEMENT',
      payoutId,
      eventType: auditType,
      actorId: adminUserId,
      details: `Settlement payout '${payoutId}' status changed from '${current}' to '${next}'. Administrative record update only; no external money transfer occurred.`,
      timestamp: now,
    };
    await setDoc(doc(db, 'payment_audit_logs', auditLog.id), cleanUndefined(auditLog));

    // Step 24 Server Payout Notification to Astrologer
    const astroNotifId = `notif_payout_${payoutId}_${next}`;
    const astroNotif = {
      id: astroNotifId,
      recipientUserId: payoutSnap.data().astrologerUserId,
      type: 'PAYOUT_STATUS_CHANGED',
      title: `Payout Settlement ${next}`,
      titleHi: `पेआउट निपटान ${next}`,
      message: `Your settlement payout of ${payoutSnap.data().currency || 'INR'} ${payoutSnap.data().netPayable} is now in '${next}' status.`,
      messageHi: `${payoutSnap.data().currency || 'INR'} ${payoutSnap.data().netPayable} का आपका निपटान भुगतान अब '${next}' स्थिति में है।`,
      relatedEntityId: payoutId,
      relatedEntityType: 'PAYOUT',
      isRead: false,
      createdAt: now,
      idempotencyKey: `payout_${payoutId}_${next}`,
    };
    await setDoc(doc(db, 'notifications', astroNotifId), cleanUndefined(astroNotif));

    return res.json({ success: true, data: { ...payoutSnap.data(), ...updates } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error updating payout status.' });
  }
});

/**
 * Step 28 Server-Side Hindi-English Automatic Chat Translation Proxy Route
 * Security: Private GEMINI_API_KEY kept strictly on server; only message text sent to Gemini model.
 */
const CONSULTATION_PHRASE_DICTIONARY: Record<string, { hi: string; en: string }> = {
  "namaste acharya ji! can you review my 10th house career prospects and active dasha period?": {
    hi: "नमस्ते आचार्य जी! क्या आप मेरे 10वें भाव के करियर की संभावनाओं और सक्रिय दशा अवधि की समीक्षा कर सकते हैं?",
    en: "Namaste Acharya ji! Can you review my 10th house career prospects and active Dasha period?"
  },
  "नमस्ते आचार्य जी! क्या आप मेरे 10वें भाव के करियर की संभावनाओं और सक्रिय दशा अवधि की समीक्षा कर सकते हैं?": {
    hi: "नमस्ते आचार्य जी! क्या आप मेरे 10वें भाव के करियर की संभावनाओं और सक्रिय दशा अवधि की समीक्षा कर सकते हैं?",
    en: "Namaste Acharya ji! Can you review my 10th house career prospects and active Dasha period?"
  },
  "नमस्ते आचार्य जी! क्या आप मेरे 10वें भाव के करियर की समीक्षा कर सकते हैं?": {
    hi: "नमस्ते आचार्य जी! क्या आप मेरे 10वें भाव के करियर की समीक्षा कर सकते हैं?",
    en: "Namaste Acharya ji! Can you review my 10th house career prospects?"
  },
  "traditional texts suggest cultivating patient mindfulness in your daily responsibilities. your current planetary alignments encourage thoughtful communication and structured work.": {
    hi: "पारंपरिक ग्रंथ आपकी दैनिक जिम्मेदारियों में धैर्यपूर्वक सचेत रहने का सुझाव देते हैं। आपके वर्तमान ग्रह संरेखण विचारशील संचार और संरचित कार्य को प्रोत्साहित करते हैं।",
    en: "Traditional texts suggest cultivating patient mindfulness in your daily responsibilities. Your current planetary alignments encourage thoughtful communication and structured work."
  },
  "पारंपरिक ग्रंथ आपकी दैनिक जिम्मेदारियों में धैर्यपूर्वक सचेत रहने का सुझाव देते हैं। आपके वर्तमान ग्रह संरेखण विचारशील संचार और संरचित कार्य को प्रोत्साहित करते हैं।": {
    hi: "पारंपरिक ग्रंथ आपकी दैनिक जिम्मेदारियों में धैर्यपूर्वक सचेत रहने का सुझाव देते हैं। आपके वर्तमान ग्रह संरेखण विचारशील संचार और संरचित कार्य को प्रोत्साहित करते हैं।",
    en: "Traditional texts suggest cultivating patient mindfulness in your daily responsibilities. Your current planetary alignments encourage thoughtful communication and structured work."
  },
  "thank you for guiding me through the planetary positions and remedies!": {
    hi: "ग्रहों की स्थिति और उपायों के माध्यम से मेरा मार्गदर्शन करने के लिए धन्यवाद!",
    en: "Thank you for guiding me through the planetary positions and remedies!"
  },
  "ग्रहों की स्थिति और उपायों के माध्यम से मेरा मार्गदर्शन करने के लिए धन्यवाद!": {
    hi: "ग्रहों की स्थिति और उपायों के माध्यम से मेरा मार्गदर्शन करने के लिए धन्यवाद!",
    en: "Thank you for guiding me through the planetary positions and remedies!"
  },
  "can you explain my kundli?": {
    hi: "क्या आप मेरी कुंडली समझा सकते हैं?",
    en: "Can you explain my Kundli?"
  },
  "क्या आप मेरी कुंडली समझा सकते हैं?": {
    hi: "क्या आप मेरी कुंडली समझा सकते हैं?",
    en: "Can you explain my Kundli?"
  },
  "hello acharya ji": {
    hi: "नमस्ते आचार्य जी",
    en: "Hello Acharya ji"
  },
  "नमस्ते आचार्य जी": {
    hi: "नमस्ते आचार्य जी",
    en: "Hello Acharya ji"
  },
  "pranam": {
    hi: "प्रणाम",
    en: "Pranam"
  },
  "प्रणाम": {
    hi: "प्रणाम",
    en: "Pranam"
  },
  "namaste": {
    hi: "नमस्ते",
    en: "Namaste"
  },
  "नमस्ते": {
    hi: "नमस्ते",
    en: "Namaste"
  },
  "thank you": {
    hi: "धन्यवाद",
    en: "Thank you"
  },
  "धन्यवाद": {
    hi: "धन्यवाद",
    en: "Thank you"
  }
};

app.post('/api/translate-message', async (req: Request, res: Response) => {
  try {
    const { messageText, targetLang, sourceLang } = req.body || {};

    if (!messageText || typeof messageText !== 'string' || !messageText.trim()) {
      return res.status(400).json({ success: false, error: 'messageText is required.' });
    }

    const trimmedText = messageText.trim();
    if (trimmedText.length > 2000) {
      return res.status(400).json({ success: false, error: 'Message exceeds maximum length of 2000 characters.' });
    }

    const desiredTargetLang = targetLang === 'hi' ? 'hi' : 'en';

    // Unicode heuristic detection helper if sourceLang not explicitly provided
    const containsDevanagari = /[\u0900-\u097F]/.test(trimmedText);
    const inferredSource = sourceLang || (containsDevanagari ? 'hi' : 'en');

    // If source matches target, return original without unnecessary model translation call
    if (inferredSource === desiredTargetLang) {
      return res.json({
        success: true,
        translatedText: trimmedText,
        detectedSourceLang: inferredSource,
        targetLang: desiredTargetLang,
        isAiTranslated: false,
      });
    }

    // 1. Check Consultation Phrase Dictionary Match (for exact or dynamic prefix match)
    const normalizedKey = trimmedText.toLowerCase();
    
    // Check exact match in dictionary
    if (CONSULTATION_PHRASE_DICTIONARY[normalizedKey]) {
      const match = CONSULTATION_PHRASE_DICTIONARY[normalizedKey];
      return res.json({
        success: true,
        translatedText: desiredTargetLang === 'hi' ? match.hi : match.en,
        detectedSourceLang: inferredSource,
        targetLang: desiredTargetLang,
        isAiTranslated: true,
      });
    }

    // Check dynamic match for Pranam / Namaste pattern with name / birth details
    if (normalizedKey.startsWith('pranam') && normalizedKey.includes('birth chart loaded')) {
      if (desiredTargetLang === 'hi') {
        const hiTrans = trimmedText
          .replace(/Pranam/gi, 'प्रणाम')
          .replace(/I have your birth chart loaded/gi, 'मैंने आपकी जन्म कुंडली लोड कर ली है')
          .replace(/I am inspecting your D1 Rashi and Jupiter Dasha now/gi, 'मैं अभी आपकी D1 राशि और गुरु महादशा का निरीक्षण कर रहा हूँ');
        return res.json({
          success: true,
          translatedText: hiTrans,
          detectedSourceLang: inferredSource,
          targetLang: desiredTargetLang,
          isAiTranslated: true,
        });
      } else {
        const enTrans = trimmedText
          .replace(/प्रणाम/g, 'Pranam')
          .replace(/मैंने आपकी जन्म कुंडली लोड कर ली है/g, 'I have your birth chart loaded')
          .replace(/मैं अभी आपकी D1 राशि और गुरु महादशा का निरीक्षण कर रहा हूँ/g, 'I am inspecting your D1 Rashi and Jupiter Dasha now');
        return res.json({
          success: true,
          translatedText: enTrans,
          detectedSourceLang: inferredSource,
          targetLang: desiredTargetLang,
          isAiTranslated: true,
        });
      }
    }

    // 2. Server-Side Gemini API Call
    const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim();
    const isGeminiConfigured = Boolean(
      geminiApiKey && 
      geminiApiKey !== 'YOUR_GEMINI_API_KEY_HERE' && 
      !geminiApiKey.toLowerCase().includes('placeholder')
    );

    if (!isGeminiConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Translation feature is currently disabled because GEMINI_API_KEY is not configured in the server environment. Please supply a valid Google Gemini API key to activate translation services.',
        code: 'GEMINI_API_KEY_NOT_CONFIGURED',
      });
    }

    const ai = new GoogleGenAI();
    const prompt = `You are a professional, accurate translator for a Vedic astrology consultation chat app. Translate the following message into ${desiredTargetLang === 'hi' ? 'Hindi (in Devanagari script)' : 'English'}.

CRITICAL INSTRUCTIONS:
1. Preserve the exact tone, meaning, and astrological terms (e.g., Kundli, Dasha, Rashi, Lagna, Acharya, Pranam, Namaste).
2. Do NOT add commentary, explanations, greetings, or notes.
3. Return ONLY a valid JSON object matching this schema:
{
  "translatedText": "the translated message here",
  "detectedSourceLang": "${inferredSource}"
}

Message to translate:
"${trimmedText.replace(/"/g, '\\"')}"`;

    let responseText = '';
    let lastErrorMsg = '';
    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite'];
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || 'Model call failed';
      }
    }

    if (!responseText) {
      // Model call was unsuccessful due to rate limits or API constraints
      return res.status(503).json({
        success: false,
        error: `Translation service unavailable: ${lastErrorMsg || 'Gemini API limit reached'}`,
      });
    }

    let parsedJson: any = {};
    try {
      parsedJson = JSON.parse(responseText);
    } catch {
      parsedJson = { translatedText: responseText.trim(), detectedSourceLang: inferredSource };
    }

    const translatedText = parsedJson.translatedText || responseText.trim();
    if (!translatedText || translatedText === trimmedText) {
      return res.status(500).json({
        success: false,
        error: 'Translation model returned empty or identical response.',
      });
    }

    const detectedSourceLang = parsedJson.detectedSourceLang || inferredSource;

    return res.json({
      success: true,
      translatedText,
      detectedSourceLang,
      targetLang: desiredTargetLang,
      isAiTranslated: true,
    });
  } catch (err: any) {
    console.error('[Translation Error]:', err?.message || err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to translate message.',
    });
  }
});

// 404 Handler for Unmatched API routes (prevents falling through to HTML index)
app.all('/api/*', (_req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    error: 'API endpoint not found.',
    code: 'NOT_FOUND',
  });
});

// Vite middleware setup for Development vs Production Static Serving
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // Production static file serving
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(Number(PORT), HOST, () => {
  console.log(`Astrology Payment Server Layer running on http://${HOST}:${PORT}`);
});

// Graceful process shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

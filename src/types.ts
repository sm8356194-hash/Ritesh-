export type ScreenType = 'splash' | 'welcome' | 'birth-details' | 'chart-prep' | 'dashboard' | 'login' | 'language-select';

export type DashboardSection = 
  | 'overview'
  | 'kundli'
  | 'horoscope'
  | 'ai-astrologer'
  | 'talk'
  | 'compatibility'
  | 'kundli-matching'
  | 'numerology'
  | 'panchang'
  | 'profile';

export type Gender = 'male' | 'female' | 'other' | 'unspecified';

export interface AstrologySettings {
  system: 'VEDIC_SIDEREAL' | string;
  zodiac: 'SIDEREAL' | string;
  ayanamsha: 'LAHIRI' | string;
  ayanamshaMode: 'SE_SIDM_LAHIRI' | string;
  houseSystem: 'WHOLE_SIGN' | string;
  houseSystemCode: 'W' | string;
  nodeType: 'TRUE_NODE' | 'MEAN_NODE' | string;
  nakshatraSystem: '27_NAKSHATRA' | string;
  nakshatraPadas: number; // 4
  divisionalCharts: string[]; // ["D1", "D9"]
  dashaSystem: 'VIMSHOTTARI' | string;
  coordinateType: 'GEOCENTRIC' | string;
  timezoneStandard: 'IANA' | string;
  calculationPrecision: 'FULL' | string;
  calculationProvider: 'DEMO' | 'REAL' | string;
  dashaYearLengthDays?: number; // Configurable (e.g. 365.2422 or 365.25)
  coordinateSystem?: string; // "GEOCENTRIC"
  calculationEngine?: string;
}

export interface BirthPlaceLocation {
  city?: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string; // IANA
  elevationMeters?: number;
}

/**
 * Structured birth profile representing user-submitted birth parameters
 * for traditional astrology calculations.
 */
export interface BirthProfile {
  name: string;
  dateOfBirth: string; // YYYY-MM-DD (local civil date)
  timeOfBirth?: string; // HH:MM
  birthTime: string; // HH:MM (local civil time)
  birthTimeKnown: boolean;
  gender?: string;
  birthPlace: string; // Formatted location string (e.g. "New Delhi, Delhi, India")
  city?: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string; // IANA timezone e.g. "Asia/Kolkata"
  elevationMeters?: number;
  isDemoData?: boolean;
}

/**
 * Backward-compatible profile interface linking legacy fields
 */
export interface UserBirthDetails extends BirthProfile {
  fullName?: string;
  dob?: string;
  isTimeUnknown?: boolean;
}

export interface LagnaPosition {
  sign: string;
  degree: string;
  decimalLongitude?: number;
  nakshatra?: string;
  pada?: number;
}

export interface StandardPlanetPosition {
  name: string;
  planet: string; // compat
  sanskritName?: string;
  decimalLongitude?: number;
  sign: string;
  degree: string;
  house: number;
  retrograde: boolean;
  isRetrograde?: boolean; // compat
  nakshatra: string;
  pada: number;
  status?: 'Exalted' | 'Debilitated' | 'Own Sign' | 'Friendly' | 'Neutral' | 'Enemy' | string;
}

export interface StandardHousePosition {
  houseNumber: number;
  sign: string;
  signName?: string; // compat
  signNumber?: number;
  degree: string;
  planets?: string[];
  significance?: string;
}

export interface NakshatraCalculationResult {
  name: string;
  pada: number;
  lord: string;
  deity?: string;
  symbol?: string;
  gana?: string;
  isDemo?: boolean;
}

export interface DivisionalChartsResult {
  D1: Record<string, any>;
  D9: Record<string, any>;
  [key: string]: Record<string, any>;
}

export interface DashaPeriodItem {
  planet: string;
  level?: string;
  startDate?: string;
  endDate?: string;
  startYear?: string;
  endYear?: string;
  duration?: string;
  isCurrent?: boolean;
  status?: string;
  influence?: string;
  isDemoCalculation?: boolean;
}

export interface DashaCalculationResult {
  mahadasha: string;
  antardasha: string;
  pratyantardasha?: string;
  startDate: string;
  endDate: string;
  periods?: DashaPeriodItem[];
}

export type CalculationProviderType = 'DEMO' | 'REAL';
export type CalculationEngineStatus = 'DEMO' | 'REAL' | 'REAL_ENGINE_NOT_CONNECTED';

/**
 * Adapter Boundary: Required Input for Future Real Ephemeris Engine
 */
export interface RealEphemerisCalculationInput {
  dateOfBirth: string; // YYYY-MM-DD
  exactBirthTime: string; // HH:MM:SS or HH:MM
  latitude: number; // Decimal degrees (-90.0 to +90.0)
  longitude: number; // Decimal degrees (-180.0 to +180.0)
  ianaTimezone: string; // e.g. "Asia/Kolkata", "America/New_York"
  siderealSystem: 'Vedic' | 'Sidereal';
  ayanamsha: 'Lahiri' | 'Raman' | 'Krishnamurti' | 'Fagan-Bradley' | string;
  houseSystem: 'Placidus' | 'Equal' | 'WholeSign' | 'Sripati' | 'Porphyry' | 'Campanus' | string;
  altitudeMeters?: number;
}

/**
 * Adapter Boundary: Required Output from Future Real Ephemeris Engine
 */
export interface RealEphemerisCalculationOutput {
  ascendant: {
    sign: string;
    degree: string;
    decimalLongitude: number;
    nakshatra: string;
    pada: number;
  };
  planetaryPositions: Array<{
    name: string;
    sanskritName: string;
    decimalLongitude: number;
    dailySpeed: number;
    sign: string;
    degree: string;
    house: number;
    isRetrograde: boolean;
    nakshatra: string;
    pada: number;
    latitude?: number;
    distanceAU?: number;
  }>;
  houses: Array<{
    houseNumber: number;
    sign: string;
    degree: string;
    cuspLongitude: number;
    planets: string[];
  }>;
  nakshatra: {
    name: string;
    pada: number;
    lord: string;
    longitudeInNakshatra: string;
    totalLongitude: number;
  };
  divisionalCharts: {
    D1: Record<string, any>;
    D9: Record<string, any>;
    [chartCode: string]: Record<string, any>;
  };
  vimshottariDasha: DashaCalculationResult;
  calculationMetadata: {
    calculationStatus: CalculationEngineStatus;
    calculationEngine: string;
    engineVersion: string;
    astrologySystem: string;
    ayanamsha: string;
    houseSystem: string;
    nodeType: string;
    calculationTimestamp: string;
    calculatedAt: string;
    julianDay?: number;
    deltaT?: number;
    ayanamshaDegree?: number;
    coordinateSystem: string;
  };
  engineMetadata: {
    engineName: string;
    version: string;
    isLicensed: boolean;
    status: CalculationEngineStatus;
  };
}

export interface StandardBirthChartData {
  calculationStatus: 'DEMO' | 'REAL' | 'REAL_ENGINE_NOT_CONNECTED';
  calculationEngine: string;
  settings: AstrologySettings;
  lagna: LagnaPosition;
  planets: StandardPlanetPosition[];
  houses: StandardHousePosition[];
  nakshatra: NakshatraCalculationResult;
  divisionalCharts: DivisionalChartsResult;
  dasha: DashaCalculationResult;

  // Backward-compatibility fields
  isCalculated: boolean;
  calculationEngineStatus: 'NOT_CONNECTED_DEMO_DATA' | 'CONNECTED' | 'REAL_ENGINE_NOT_CONNECTED';
  calculationNotice: string;
  chartType: string;
  profile: BirthProfile;
  ascendant: {
    sign: string;
    degree: string;
    decimalLongitude?: number;
    nakshatra: string;
    pada: number;
    isDemo: boolean;
  };
  moonSign: {
    sign: string;
    nakshatra: string;
    pada: number;
    isDemo: boolean;
  };
}

export type BirthChartCalculationResult = StandardBirthChartData;

export interface AstrologyCalculationProvider {
  readonly providerName: string;
  readonly providerType: CalculationProviderType;
  readonly isRealEngineConnected: boolean;
  settings: AstrologySettings;
  calculateBirthChart(birthProfile: BirthProfile): StandardBirthChartData;
  calculatePlanetaryPositions(birthProfile: BirthProfile): StandardPlanetPosition[];
  calculateHouses(birthProfile: BirthProfile): StandardHousePosition[];
  calculateNakshatra(birthProfile: BirthProfile): NakshatraCalculationResult;
  calculateDivisionalCharts(birthProfile: BirthProfile): DivisionalChartsResult;
  calculateDasha(birthProfile: BirthProfile): DashaCalculationResult;
  calculateKundliMatch(person1Profile: BirthProfile, person2Profile: BirthProfile): KundliMatchingResult;
  calculatePanchang(date: string, location?: string): PanchangData;
}

export interface AshtakootaKootaItem {
  id: string;
  name: string; // e.g. "Varna — Demo"
  maxScore: number;
  obtainedScore: number;
  area: string;
  status: string;
  meaning: string;
  detail: string;
}

export interface KundliMatchingResult {
  isCalculated: boolean;
  calculationEngineStatus: 'REAL_EPHEMERIS_ASHTAKOOTA' | 'NOT_CONNECTED_DEMO_DATA' | 'VALIDATION_FAILED' | string;
  calculationNotice: string;
  person1: BirthProfile;
  person2: BirthProfile;
  gunaMilan: {
    totalScore: number; // 24
    maxScore: number; // 36
    label: string; // "SAMPLE SCORE"
    verdictDisclaimer: string;
    level: string;
  };
  ashtakoota: AshtakootaKootaItem[];
  moonSignComparison: {
    title: string;
    person1Moon: string;
    person2Moon: string;
    relationship: string;
    note: string;
  };
  nakshatraComparison: {
    title: string;
    person1Nakshatra: string;
    person2Nakshatra: string;
    compatibilityNote: string;
  };
  manglikCheck: {
    title: string;
    person1Status: string;
    person2Status: string;
    reconciliationNote: string;
  };
  bhakootCheck: {
    title: string;
    status: string;
    score: string;
    reconciliationNote: string;
  };
  nadiCheck: {
    title: string;
    status: string;
    score: string;
    reconciliationNote: string;
  };
  overallInterpretation: {
    title: string;
    summary: string;
    guidance: string;
  };
}

export interface ZodiacSign {
  id: string;
  name: string;
  sanskritName: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  rulingPlanet: string;
  dateRange: string;
  dailyScore: number;
  dailySummary: string;
  love: string;
  career: string;
  health: string;
  wealth: string;
  luckyColor: string;
  luckyNumber: number;
  favorableTime: string;
}

export interface Astrologer {
  id: string;
  name: string;
  title: string;
  skills: string[];
  experienceYears: number;
  languages: string[];
  rating?: number;
  totalOrders?: number;
  isOnline: boolean;
  perMinuteCharge: number;
  avatarUrl?: string;
  bio: string;
  education: string;
  isDemoProfile?: boolean;
}

export interface PanchangDetail {
  date: string;
  tithi: {
    name: string;
    paksha: string;
    endTime: string;
  };
  nakshatra: {
    name: string;
    lord: string;
    endTime: string;
  };
  yoga: {
    name: string;
    meaning: string;
    endTime: string;
  };
  karana: {
    name: string;
    endTime: string;
  };
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  rahuKaal: {
    start: string;
    end: string;
    status: 'Upcoming' | 'Active' | 'Passed';
  };
  abhijitMuhurat: {
    start: string;
    end: string;
  };
  shubhHora: string;
  season: string;
  ayana: string;
}

export interface PlanetPosition {
  planet: string;
  sanskritName: string;
  sign: string;
  degree: string;
  house: number;
  isRetrograde: boolean;
  status: 'Exalted' | 'Debilitated' | 'Own Sign' | 'Friendly' | 'Neutral' | 'Enemy';
}

export interface KundliHouse {
  houseNumber: number;
  signName: string;
  signNumber: number;
  planets: string[];
  significance: string;
}

export type AppPortalMode = 'client' | 'astrologer' | 'admin';

export type AstrologerPanelTab = 'dashboard' | 'clients' | 'consultations' | 'profile';

export type AdminSection = 
  | 'dashboard' 
  | 'users' 
  | 'astrologers' 
  | 'consultations' 
  | 'payments' 
  | 'reports' 
  | 'content' 
  | 'settings';

export interface AdminUserItem {
  id: string;
  name: string;
  emailDemo: string;
  status: 'Active' | 'Suspended' | 'Pending';
  birthProfileStatus: 'Complete' | 'Incomplete';
  consultationCount: number;
  joinedDate: string;
  birthProfile: BirthProfile;
  isDemoData: true;
}

export interface AdminAstrologerItem {
  id: string;
  name: string;
  specialization: string;
  languages: string[];
  status: 'Approved' | 'Pending' | 'Suspended';
  consultationModes: ('Chat' | 'Voice' | 'Video')[];
  demoPrice: number;
  experienceYears: number;
  bio: string;
  isDemoProfile: true;
}

export interface AdminConsultationRecord {
  id: string;
  userId: string;
  userName: string;
  astrologerId: string;
  astrologerName: string;
  type: 'Chat' | 'Voice' | 'Video';
  status: 'Requested' | 'Active' | 'Completed' | 'Cancelled';
  date: string;
  time: string;
  durationMinutes: number;
  demoAmount: number;
  topic: string;
  isDemoData: true;
}

export interface AdminPaymentRecord {
  id: string;
  consultationId: string;
  userName: string;
  astrologerName: string;
  demoAmount: number;
  platformCommission: number;
  astrologerAmount: number;
  status: 'Settled' | 'Pending' | 'Refunded';
  date: string;
  methodDemo: string;
  isDemoData: true;
}

export interface AdminSupportTicket {
  id: string;
  category: 'User Complaint' | 'Astrologer Complaint' | 'Consultation Dispute' | 'Support Request';
  title: string;
  submittedBy: string;
  userRole: 'Client' | 'Astrologer';
  description: string;
  status: 'Open' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High';
  date: string;
  isDemoData: true;
}

export interface AdminBannerItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  active: boolean;
  ctaText: string;
}

export interface AdminFaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'Astrology Basics' | 'Consultations' | 'Kundli Matching';
}

export interface AdminPlatformSettings {
  platformCommissionPercent: number;
  minConsultationPrice: number;
  currency: string;
  maintenanceMode: boolean;
  astrologyCalculationEngine: 'Lahiri (Chitrapaksha) — Default' | 'KP (Krishnamurti Padhdhati)' | 'Raman (B.V. Raman)';
  allowNewAstrologerRegistrations: boolean;
  general?: {
    appName: string;
    logoText: string;
    defaultLanguage: string;
    currency: string;
  };
  consultation?: {
    chatEnabled: boolean;
    voiceEnabled: boolean;
    videoEnabled: boolean;
    defaultSessionMinutes: number;
  };
  astrologer?: {
    approvalRequired: boolean;
    demoAvailabilityRules: string;
    maxActiveSessionsPerAstrologer: number;
  };
  privacy?: {
    privacyPolicyNotice: string;
    termsNotice: string;
    dataRetentionDays: number;
    allowDemoDataReset: boolean;
  };
}

export interface DemoClient {
  id: string;
  name: string;
  dateOfBirth: string;
  birthTime: string;
  birthTimeKnown: boolean;
  birthPlace: string;
  city?: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  gender?: string;
  lastConsultation: string;
  totalConsultations: number;
  summary: string;
  notes: string;
  isCurrentAppUser?: boolean;
  isDemoData: true;
}

export interface DemoConsultationItem {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  type: 'Chat Consultation' | 'Voice Call (Preview)';
  status: 'Completed' | 'Upcoming' | 'In Progress' | 'Requested';
  topic: string;
  durationMinutes: number;
  notes?: string;
  isDemoData: true;
}

export type NumerologyNumberType = 
  | 'life-path' 
  | 'destiny' 
  | 'soul-urge' 
  | 'personality' 
  | 'birth-day';

export interface NumerologyNumberItem {
  id: NumerologyNumberType;
  name: string; // e.g. "Life Path Number"
  shortName: string; // e.g. "Life Path"
  numberValue: number; // e.g. 7
  sampleBadge: string; // "SAMPLE"
  title: string; // e.g. "The Analytical Thinker & Seeker"
  traditionalMeaning: string;
  strengths: string[];
  commonThemes: string[];
  calculationSource: string; // e.g. "Derived conceptually from Date of Birth"
  disclaimer: string;
}

export interface NumerologyCalculationResult {
  isCalculated: false;
  calculationEngineStatus: 'NOT_CONNECTED_DEMO_DATA';
  calculationNotice: string;
  demoLabel: string; // "NUMEROLOGY — DEMO MODE"
  disclaimer: string;
  birthProfile: BirthProfile;
  numbers: {
    lifePath: NumerologyNumberItem;
    destiny: NumerologyNumberItem;
    soulUrge: NumerologyNumberItem;
    personality: NumerologyNumberItem;
    birthDay: NumerologyNumberItem;
  };
}

export interface PanchangTithiDetail {
  name: string;
  paksha: string;
  endTime: string;
  deity?: string;
  significance?: string;
}

export interface PanchangNakshatraDetail {
  name: string;
  lord: string;
  endTime: string;
  pada?: number;
  symbol?: string;
}

export interface PanchangYogaDetail {
  name: string;
  meaning: string;
  endTime: string;
}

export interface PanchangKaranaDetail {
  name: string;
  endTime: string;
  deity?: string;
}

export interface PanchangTimeWindow {
  start: string;
  end: string;
  status?: 'Upcoming' | 'Active' | 'Passed';
  type?: 'Auspicious' | 'Inauspicious' | 'Neutral';
  description?: string;
}

/**
 * Reusable Panchang data structure required by user specification:
 * panchangData = {
 *   date,
 *   location,
 *   tithi,
 *   nakshatra,
 *   yoga,
 *   karana,
 *   vara,
 *   paksha,
 *   sunrise,
 *   sunset,
 *   moonrise,
 *   moonset,
 *   abhijitMuhurat,
 *   brahmaMuhurat,
 *   rahuKaal,
 *   yamagandam,
 *   gulikaKaal,
 *   moonSign,
 *   sunSign,
 *   festival
 * }
 */
export interface PanchangData {
  date: string;
  formattedDate: string;
  location: string;
  tithi: PanchangTithiDetail;
  nakshatra: PanchangNakshatraDetail;
  yoga: PanchangYogaDetail;
  karana: PanchangKaranaDetail;
  vara: string;
  varaLord: string;
  paksha: string;
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  abhijitMuhurat: PanchangTimeWindow;
  brahmaMuhurat: PanchangTimeWindow;
  rahuKaal: PanchangTimeWindow;
  yamagandam: PanchangTimeWindow;
  gulikaKaal: PanchangTimeWindow;
  moonSign: string;
  sunSign: string;
  festival: string;
  festivalDescription?: string;
  season?: string;
  ayana?: string;
  traditionalExplanation?: string;
  isDemoData: true;
  demoLabel: string;
  disclaimer: string;
}

// ============================================================================
// STEP 9 — PRODUCTION BACKEND & DATA ARCHITECTURE TYPES
// ============================================================================

export type UserRole = 'USER' | 'ASTROLOGER' | 'ADMIN';
export type UserAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type AuthProviderType = 'email' | 'google' | 'phone' | 'demo';
export type AuthMode = 'DEMO' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

export interface UserAccount {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  status: UserAccountStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  phone?: string;
  avatarUrl?: string;
  walletBalance?: number; // Demo client wallet balance (default ₹250)
  provider?: AuthProviderType;
  preferredLanguage?: 'en' | 'hi';
  lastSignInAt?: string;
  isDemoUser?: boolean;
}

export type RelationshipType = 'SELF' | 'FATHER' | 'MOTHER' | 'SPOUSE' | 'CHILD' | 'FRIEND' | 'OTHER';

export interface PersistentBirthProfile {
  id: string;
  userId: string;
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
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface StoredKundliRecord {
  id: string;
  birthProfileId: string;
  userId: string;
  calculationProvider: 'REAL';
  calculationEngine: string;
  engineVersion: string;
  astrologySettingsVersion: string;
  astrologySettings: AstrologySettings;
  chartData: StandardBirthChartData;
  calculationStatus: 'REAL' | 'REAL_ENGINE_NOT_CONNECTED';
  calculatedAt: string; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export type AstrologerAccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type AstrologerAvailabilityStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'UNAVAILABLE';

export interface AstrologerRates {
  chat: number;
  voice: number;
  video: number;
}

export interface AstrologerProfile {
  id: string;
  userId: string;
  name: string;
  displayName?: string;
  email?: string;
  phone?: string;
  title: string;
  bio: string;
  education: string;
  skills: string[];
  languages: string[];
  experienceYears: number;
  perMinuteCharge: number;
  rates?: AstrologerRates;
  isOnline: boolean;
  availabilityStatus?: AstrologerAvailabilityStatus;
  rating: number;
  totalOrders: number;
  avatarUrl?: string;
  status?: AstrologerAccountStatus;
  isApproved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  isDemoUser?: boolean;
  preferredLanguage?: 'en' | 'hi';
  createdAt: string;
  updatedAt: string;
}

export interface AstrologerKycRecord {
  kycId: string;
  astrologerId: string;
  userId: string;
  documentType: 'Aadhaar' | 'PAN' | 'Passport' | 'Certificate' | 'Other';
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  idNumberLast4?: string;
  documentReference?: string;
  submittedAt: string; // ISO 8601
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export type ConsultationStatus = 'REQUESTED' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'Requested' | 'Accepted';
export type ConsultationType = 'Chat' | 'Voice' | 'Video';

// ============================================================================
// STEP 18 — PAYMENT ARCHITECTURE & BILLING FOUNDATION TYPES
// ============================================================================

export type PaymentStatus = 
  | 'UNPAID' 
  | 'PAYMENT_PENDING' 
  | 'PAID' 
  | 'PAYMENT_FAILED' 
  | 'REFUND_PENDING' 
  | 'REFUNDED' 
  | 'PARTIALLY_REFUNDED';

export type PaymentProviderType = 'GENERIC_GATEWAY' | 'PENDING_CONFIG' | 'RAZORPAY' | 'STRIPE' | 'NONE';

export interface PaymentEarningsBreakdown {
  grossAmount: number;
  platformFee: number;
  astrologerAmount: number;
  currency: string;
}

export interface PaymentTransaction {
  id: string;
  consultationId: string;
  userId: string;
  userName?: string;
  astrologerId: string;
  astrologerName?: string;
  astrologerUserId?: string;
  amount: number;
  currency: string; // "INR"
  provider: PaymentProviderType | string;
  providerOrderId?: string;
  providerPaymentId?: string;
  providerSignatureId?: string;
  status: PaymentStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  paidAt?: string; // ISO 8601
  refundedAt?: string; // ISO 8601
  refundAmount?: number;
  failureReason?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
  earningsBreakdown?: PaymentEarningsBreakdown;
}

export type PaymentAuditEventType = 
  | 'PAYMENT_ORDER_CREATED' 
  | 'PAYMENT_VERIFIED' 
  | 'PAYMENT_PAID'
  | 'EARNING_CREATED'
  | 'PLATFORM_FEE_RECORDED'
  | 'PAYMENT_FAILED' 
  | 'REFUND_REQUESTED' 
  | 'REFUND_VERIFIED'
  | 'EARNING_REFUND_ADJUSTED'
  | 'PAYOUT_CREATED'
  | 'PAYOUT_APPROVED'
  | 'PAYOUT_PROCESSING'
  | 'PAYOUT_PAID'
  | 'PAYOUT_FAILED'
  | 'PAYOUT_CANCELLED';

export interface PaymentAuditLog {
  id: string;
  transactionId: string;
  consultationId: string;
  payoutId?: string;
  eventType: PaymentAuditEventType;
  actorId: string;
  details: string;
  timestamp: string; // ISO 8601
}

export type EarningStatus = 'PENDING' | 'EARNED' | 'REFUND_ADJUSTED' | 'REVERSED';

export type PayoutStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface AstrologerPayoutRecord {
  id: string; // e.g. "payout_{astrologerId}_{timestamp}"
  astrologerUserId: string;
  astrologerId: string;
  astrologerName?: string;
  earningPeriodStart: string; // YYYY-MM-DD
  earningPeriodEnd: string; // YYYY-MM-DD
  grossEarnings: number; // Rupees
  grossEarningsPaise: number; // Integer paise
  refundAdjustments: number; // Rupees
  refundAdjustmentsPaise: number; // Integer paise
  netPayable: number; // Rupees
  netPayablePaise: number; // Integer paise
  currency: string; // "INR"
  status: PayoutStatus;
  earningRecordIds: string[];
  consultationCount: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  approvedAt?: string; // ISO 8601
  processedAt?: string; // ISO 8601
  completedAt?: string; // ISO 8601
  rejectedAt?: string; // ISO 8601
  failureReason?: string;
  adminNote?: string;
  provider?: string;
  providerReference?: string;
  idempotencyKey?: string;
  reviewedBy?: string;
  isDemo?: boolean;
}

export interface SettlementPreviewResult {
  astrologerUserId: string;
  astrologerId: string;
  astrologerName: string;
  earningPeriodStart: string;
  earningPeriodEnd: string;
  grossEarnings: number;
  grossEarningsPaise: number;
  refundAdjustments: number;
  refundAdjustmentsPaise: number;
  netPayable: number;
  netPayablePaise: number;
  currency: string;
  eligibleEarningRecordIds: string[];
  consultationCount: number;
}

export interface AstrologerEarningRecord {
  id: string; // e.g. "earn_{paymentTransactionId}"
  astrologerUserId: string;
  astrologerId: string;
  consultationId: string;
  paymentTransactionId: string;
  grossAmount: number; // Rupees
  grossAmountPaise: number; // Integer paise
  platformFee: number; // Rupees
  platformFeePaise: number; // Integer paise
  platformFeePercent: number; // default 15
  astrologerAmount: number; // Rupees
  astrologerAmountPaise: number; // Integer paise
  refundAdjustment: number; // Rupees
  refundAdjustmentPaise: number; // Integer paise
  netAmount: number; // Rupees
  netAmountPaise: number; // Integer paise
  currency: string; // "INR"
  status: EarningStatus;
  payoutId?: string | null;
  createdAt: string; // ISO 8601
  paidAt?: string; // ISO 8601
  refundedAt?: string; // ISO 8601
  updatedAt: string; // ISO 8601
  consultationType?: ConsultationType;
  durationSeconds?: number;
  isDemo?: boolean;
}

export interface PlatformEarningRecord {
  id: string; // e.g. "plat_{paymentTransactionId}"
  transactionId: string;
  consultationId: string;
  grossAmount: number; // Rupees
  grossAmountPaise: number; // Integer paise
  platformFee: number; // Rupees
  platformFeePaise: number; // Integer paise
  platformFeePercent: number; // default 15
  refundAdjustment: number; // Rupees
  refundAdjustmentPaise: number; // Integer paise
  netPlatformEarning: number; // Rupees
  netPlatformEarningPaise: number; // Integer paise
  currency: string; // "INR"
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface ConsultationPriceSnapshot {
  fee: number;
  currency: string;
  ratePerMinute: number;
  durationMinutes: number;
}

export interface ConsultationRecord {
  id: string;
  userId: string;
  userName: string;
  astrologerId: string;
  astrologerName: string;
  astrologerUserId?: string;
  birthProfileId?: string;
  type: ConsultationType;
  status: ConsultationStatus;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  durationMinutes: number;
  topic?: string;
  notes?: string;
  rating?: number;
  feedback?: string;
  // Step 18 Billing Fields
  paymentStatus?: PaymentStatus;
  paymentId?: string;
  fee?: number;
  currency?: string;
  priceSnapshot?: ConsultationPriceSnapshot;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  rejectedAt?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ChatMessageSenderRole = 'USER' | 'ASTROLOGER' | 'SYSTEM';

export type ChatMessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface ConsultationChatMessage {
  id: string;
  consultationId: string;
  senderId: string;
  senderName: string;
  senderRole: ChatMessageSenderRole;
  receiverId?: string;
  message: string;
  timestamp: string; // ISO 8601
  updatedAt?: string; // ISO 8601
  readAt?: string; // ISO 8601
  isRead: boolean;
  status?: ChatMessageStatus;
  isDemo?: boolean;
  // Step 28 Translation extensions
  sourceLanguage?: 'en' | 'hi' | 'other';
  translatedText?: string;
  targetLanguage?: 'en' | 'hi';
  translationStatus?: 'NONE' | 'PENDING' | 'COMPLETED' | 'FAILED';
  isAiTranslated?: boolean;
}

export interface AppSettingsRecord {
  id: string;
  appName: string;
  version: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  defaultAyanamsha: string;
  defaultHouseSystem: string;
  platformCommissionPercent: number;
  minConsultationPrice: number;
  currency: string;
  privacyPolicyNotice: string;
  termsNotice: string;
  updatedAt: string;
}

export type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code: string; details?: any };

// ============================================================================
// STEP 24 — IN-APP NOTIFICATIONS SYSTEM TYPES
// ============================================================================

export type NotificationType =
  | 'CONSULTATION_REQUESTED'
  | 'CONSULTATION_ACCEPTED'
  | 'CONSULTATION_REJECTED'
  | 'CONSULTATION_CANCELLED'
  | 'CONSULTATION_STATUS_CHANGED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'PAYOUT_STATUS_CHANGED';

export type RelatedEntityType = 'CONSULTATION' | 'PAYMENT' | 'PAYOUT' | 'SYSTEM';

export interface InAppNotification {
  id: string; // e.g. "notif_{recipientUserId}_{timestamp}" or "notif_{idempotencyKey}"
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  titleHi?: string; // Hindi title
  messageHi?: string; // Hindi message
  relatedEntityId?: string;
  relatedEntityType?: RelatedEntityType;
  isRead: boolean;
  createdAt: string; // ISO 8601
  readAt?: string; // ISO 8601
  idempotencyKey?: string;
}

// ============================================================================
// STEP 70 — PRODUCTION WALLET & TRANSACTION LEDGER TYPES
// ============================================================================

export type ProductionWalletStatus = 'ACTIVE' | 'FROZEN' | 'SUSPENDED';

export interface ProductionWallet {
  userId: string; // Firebase UID
  balancePaise: number; // Integer paise (100 paise = ₹1.00)
  balance: number; // Rupees (balancePaise / 100)
  currency: string; // 'INR'
  status: ProductionWalletStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export type WalletTransactionType = 'CREDIT' | 'DEBIT';

export type WalletTransactionSource = 
  | 'PAYMENT_GATEWAY' 
  | 'CONSULTATION_DEBIT' 
  | 'REFUND_CREDIT' 
  | 'BONUS_CREDIT' 
  | 'ADMIN_ADJUSTMENT' 
  | 'DEMO_INITIAL';

export type WalletTransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export interface ProductionWalletTransaction {
  id: string; // e.g. "wtx_123..."
  userId: string; // Firebase UID
  type: WalletTransactionType;
  amountPaise: number; // Integer paise
  amount: number; // Rupees
  balanceAfterPaise: number; // Integer paise after transaction
  balanceAfter: number; // Rupees after transaction
  source: WalletTransactionSource;
  description: string;
  paymentTransactionId?: string;
  consultationId?: string;
  provider?: string;
  providerReference?: string;
  status: WalletTransactionStatus;
  createdAt: string; // ISO 8601
  isDemo: boolean; // false for production, true for demo mode
}

// ============================================================================
// STEP 73 — REAL VOICE & VIDEO CONSULTATION TYPES
// ============================================================================

export type CallSessionState = 
  | 'REQUESTED' 
  | 'RINGING' 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'RECONNECTING' 
  | 'ENDED' 
  | 'FAILED' 
  | 'DECLINED';

export type RtcCallType = 'VOICE' | 'VIDEO';

export interface RtcCredentials {
  roomId: string;
  token: string;
  expiresAt: string; // ISO 8601
  provider: 'WEBRTC' | 'AGORA' | 'DAILY' | 'MOCK_DEV';
  isLiveConfigured: boolean;
}

export interface RtcCallSession {
  id: string; // e.g. "csess_..."
  consultationId: string;
  callerId: string; // Firebase UID
  callerName?: string;
  recipientId: string; // Firebase UID
  recipientName?: string;
  type: RtcCallType;
  status: CallSessionState;
  startedAt: string; // ISO 8601
  connectedAt?: string; // ISO 8601
  endedAt?: string; // ISO 8601
  durationSeconds: number;
  endReason?: string;
  credentials?: RtcCredentials;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  isDemo: boolean;
}

// ============================================================================
// STEP 75 — PRODUCTION PUSH NOTIFICATIONS TYPES
// ============================================================================

export interface FCMDeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'web' | 'android' | 'ios';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FCMDeliveryStatus =
  | 'QUEUED'
  | 'ATTEMPTED'
  | 'ACCEPTED_BY_PROVIDER'
  | 'CONFIRMED_DELIVERY'
  | 'FAILED_DISABLED'
  | 'FAILED_EXPIRED_TOKEN'
  | 'FAILED_ERROR';

export interface PushNotificationDelivery {
  id: string;
  recipientUserId: string;
  notificationId: string;
  type: string;
  status: FCMDeliveryStatus;
  tokensCount: number;
  providerResponse?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
}




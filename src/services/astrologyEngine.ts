import { 
  BirthProfile, 
  AstrologySettings, 
  StandardBirthChartData, 
  StandardPlanetPosition, 
  StandardHousePosition, 
  NakshatraCalculationResult, 
  DivisionalChartsResult, 
  DashaCalculationResult, 
  KundliMatchingResult, 
  PanchangData, 
  AstrologyCalculationProvider,
  CalculationProviderType,
  RealEphemerisCalculationInput,
  RealEphemerisCalculationOutput
} from '../types';
import { 
  KUNDLI_HOUSES_DATA, 
  PLANET_POSITIONS, 
  SAMPLE_NAKSHATRA_DETAILS, 
  SAMPLE_DASHA_PERIODS 
} from '../data/astrologyMockData';
import { calculateKundliMatch as calculateKundliMatchService } from './kundliMatchingService';
import { calculatePanchang as calculatePanchangService } from './panchangService';
import { realEphemerisAdapter } from './realEphemerisAdapter';

/**
 * ============================================================================
 * SINGLE CONFIGURATION POINT
 * ============================================================================
 * Change this single value to toggle between providers:
 * - 'DEMO': Active default (uses DemoAstrologyProvider with verified demo fixtures)
 * - 'REAL': Real Swiss Ephemeris Provider (active in Step 8 controlled test)
 */
export const CALCULATION_PROVIDER: CalculationProviderType = 'REAL';

/**
 * Locked Vedic Calculation Engine Settings
 * Future real ephemeris provider will adhere strictly to these locked calculation rules.
 */
export const astrologySettings: AstrologySettings = {
  system: 'VEDIC_SIDEREAL',
  zodiac: 'SIDEREAL',
  ayanamsha: 'LAHIRI',
  ayanamshaMode: 'SE_SIDM_LAHIRI',
  houseSystem: 'WHOLE_SIGN',
  houseSystemCode: 'W',
  nodeType: 'TRUE_NODE',
  nakshatraSystem: '27_NAKSHATRA',
  nakshatraPadas: 4,
  divisionalCharts: ['D1', 'D9'],
  dashaSystem: 'VIMSHOTTARI',
  coordinateType: 'GEOCENTRIC',
  timezoneStandard: 'IANA',
  calculationPrecision: 'FULL',
  calculationProvider: 'DEMO',
  dashaYearLengthDays: 365.242199,
  coordinateSystem: 'GEOCENTRIC',
  calculationEngine: 'DEMO - Real engine not connected',
};

/**
 * ============================================================================
 * DEMO ASTROLOGY PROVIDER (ACTIVE DEFAULT)
 * ============================================================================
 * Implements AstrologyCalculationProvider interface.
 * Returns clearly marked DEMO / SAMPLE calculations.
 */
export class DemoAstrologyProvider implements AstrologyCalculationProvider {
  public readonly providerName = 'DemoAstrologyProvider';
  public readonly providerType: CalculationProviderType = 'DEMO';
  public readonly isRealEngineConnected = false;
  public settings: AstrologySettings;

  constructor(settings: AstrologySettings = astrologySettings) {
    this.settings = { ...settings };
  }

  /**
   * Calculates the full Standard Birth Chart for a given birth profile.
   */
  public calculateBirthChart(birthProfile: BirthProfile): StandardBirthChartData {
    const planets = this.calculatePlanetaryPositions(birthProfile);
    const houses = this.calculateHouses(birthProfile);
    const nakshatra = this.calculateNakshatra(birthProfile);
    const divisionalCharts = this.calculateDivisionalCharts(birthProfile);
    const dasha = this.calculateDasha(birthProfile);

    // Standard Ascendant (Lagna)
    const lagna = {
      sign: 'Leo (Simha)',
      degree: "28° 14'",
      nakshatra: 'Uttara Phalguni',
      pada: 1,
    };

    // Standard Moon Sign
    const moonSign = {
      sign: 'Taurus (Vrishabha) - Exalted',
      nakshatra: 'Rohini',
      pada: 2,
      isDemo: true,
    };

    return {
      calculationStatus: 'DEMO',
      calculationEngine: this.settings.calculationEngine || 'DEMO - Real engine not connected',
      settings: this.settings,
      lagna,
      planets,
      houses,
      nakshatra,
      divisionalCharts,
      dasha,

      // Backward-compatible fields
      isCalculated: false,
      calculationEngineStatus: 'NOT_CONNECTED_DEMO_DATA',
      calculationNotice: 'Sample / Demo Calculation (Central Provider)',
      chartType: 'D1 Rashi',
      profile: birthProfile,
      ascendant: {
        ...lagna,
        isDemo: true,
      },
      moonSign,
    };
  }

  /**
   * Calculates the standard 9 Vedic planetary positions.
   */
  public calculatePlanetaryPositions(_birthProfile: BirthProfile): StandardPlanetPosition[] {
    return PLANET_POSITIONS.map(p => ({
      name: p.planet,
      planet: p.planet,
      sanskritName: p.planet,
      sign: p.sign,
      degree: p.degree,
      house: p.house,
      retrograde: p.isRetrograde || false,
      isRetrograde: p.isRetrograde || false,
      nakshatra: 'Rohini',
      pada: 2,
      status: p.status,
    }));
  }

  /**
   * Calculates the 12 Vedic Bhavas (Houses).
   */
  public calculateHouses(_birthProfile: BirthProfile): StandardHousePosition[] {
    return KUNDLI_HOUSES_DATA.map(h => ({
      houseNumber: h.houseNumber,
      sign: h.signName,
      signName: h.signName,
      signNumber: h.signNumber,
      degree: "00° 00'",
      planets: h.planets,
      significance: h.significance,
    }));
  }

  /**
   * Calculates the Janma Nakshatra and Pada.
   */
  public calculateNakshatra(_birthProfile: BirthProfile): NakshatraCalculationResult {
    return {
      name: SAMPLE_NAKSHATRA_DETAILS.nakshatraName,
      pada: SAMPLE_NAKSHATRA_DETAILS.pada,
      lord: SAMPLE_NAKSHATRA_DETAILS.lord,
      deity: SAMPLE_NAKSHATRA_DETAILS.deity,
      symbol: SAMPLE_NAKSHATRA_DETAILS.symbol,
      gana: SAMPLE_NAKSHATRA_DETAILS.gana,
      isDemo: true,
    };
  }

  /**
   * Calculates Divisional Charts (D1 Rashi, D9 Navamsha).
   */
  public calculateDivisionalCharts(_birthProfile: BirthProfile): DivisionalChartsResult {
    return {
      D1: {
        chartName: 'Rashi (D1)',
        description: 'Physical manifestation and general life path (Sample Data)',
        houses: KUNDLI_HOUSES_DATA,
      },
      D9: {
        chartName: 'Navamsha (D9)',
        description: 'Spiritual potential, inner strength, and partnership (Sample Data)',
        houses: KUNDLI_HOUSES_DATA.map(h => ({
          ...h,
          signName: 'Navamsha ' + h.signName,
        })),
      },
    };
  }

  /**
   * Calculates the Vimshottari Dasha cycles.
   */
  public calculateDasha(_birthProfile: BirthProfile): DashaCalculationResult {
    return {
      mahadasha: 'Jupiter (Brihaspati)',
      antardasha: 'Saturn (Shani)',
      pratyantardasha: 'Mercury (Budha)',
      startDate: '2024-03-15',
      endDate: '2027-01-20',
      periods: SAMPLE_DASHA_PERIODS,
    };
  }

  /**
   * Calculates 8-fold Ashtakoota Kundli matching between two birth profiles.
   */
  public calculateKundliMatch(
    person1Profile: BirthProfile,
    person2Profile: BirthProfile
  ): KundliMatchingResult {
    return calculateKundliMatchService(person1Profile, person2Profile);
  }

  /**
   * Calculates the daily Panchang for a given date and location.
   */
  public calculatePanchang(date: string, location?: string): PanchangData {
    return calculatePanchangService(date, location);
  }
}

/**
 * ============================================================================
 * REAL ASTROLOGY PROVIDER (FUTURE PLACEHOLDER / INACTIVE)
 * ============================================================================
 * Implements the identical AstrologyCalculationProvider interface for a future
 * licensed Swiss Ephemeris / Astronomical calculation backend.
 * 
 * CRITICAL SAFETY DIRECTIVE:
 * RealAstrologyProvider MUST NOT return invented planetary positions.
 * Until a real licensed calculation engine is connected, it returns controlled
 * status structures with calculationStatus = "REAL_ENGINE_NOT_CONNECTED".
 */
export interface InputValidationResult {
  isValid: boolean;
  errors: string[];
}

export class RealAstrologyEngineNotConnectedError extends Error {
  public readonly code = 'REAL_ENGINE_NOT_CONNECTED';
  constructor(message: string = 'Real astrology calculation engine is not connected.') {
    super(message);
    this.name = 'RealAstrologyEngineNotConnectedError';
  }
}

export class RealAstrologyProvider implements AstrologyCalculationProvider {
  public readonly providerName = 'RealAstrologyProvider';
  public readonly providerType: CalculationProviderType = 'REAL';
  public readonly isRealEngineConnected = true;
  public readonly engineVersion = '2.10.03';
  public settings: AstrologySettings;

  constructor(settings: AstrologySettings = astrologySettings) {
    this.settings = {
      ...settings,
      calculationEngine: 'SwissEphemerisAdapter (sweph-wasm @ 2.6.9)',
    };
  }

  /**
   * Validates all incoming birth profile / ephemeris parameters before calculation.
   */
  public validateInput(profile: Partial<BirthProfile> | Partial<RealEphemerisCalculationInput>): InputValidationResult {
    const errors: string[] = [];

    // 1. Date of Birth Validation
    const dob = ('dateOfBirth' in profile ? profile.dateOfBirth : '') || '';
    if (!dob || dob.trim() === '') {
      errors.push('Missing date of birth.');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      errors.push(`Invalid date format '${dob}'. Expected YYYY-MM-DD.`);
    } else {
      const [year, month, day] = dob.split('-').map(Number);
      const parsedDate = new Date(year, month - 1, day);
      if (
        isNaN(parsedDate.getTime()) ||
        parsedDate.getFullYear() !== year ||
        parsedDate.getMonth() !== month - 1 ||
        parsedDate.getDate() !== day
      ) {
        errors.push(`Invalid calendar date '${dob}'.`);
      }
    }

    // 2. Exact Birth Time Validation
    const birthTime = ('birthTime' in profile && profile.birthTime) 
      ? profile.birthTime 
      : ('exactBirthTime' in profile && profile.exactBirthTime) 
      ? profile.exactBirthTime 
      : '';
    const birthTimeKnown = 'birthTimeKnown' in profile ? profile.birthTimeKnown : true;
    if (birthTimeKnown === false || !birthTime || birthTime.trim() === '') {
      errors.push('Missing exact birth time.');
    } else if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(birthTime)) {
      errors.push(`Invalid birth time format '${birthTime}'. Expected HH:MM or HH:MM:SS.`);
    } else {
      const parts = birthTime.split(':').map(Number);
      const hours = parts[0];
      const minutes = parts[1];
      const seconds = parts[2] || 0;
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
        errors.push(`Birth time '${birthTime}' is out of valid range (00:00:00 - 23:59:59).`);
      }
    }

    // 3. Geographic Coordinates Validation
    const lat = profile.latitude;
    if (lat === undefined || lat === null || typeof lat !== 'number' || isNaN(lat)) {
      errors.push('Missing or invalid latitude coordinate.');
    } else if (lat < -90 || lat > 90) {
      errors.push(`Latitude ${lat} is out of valid range [-90, +90].`);
    }

    const lon = profile.longitude;
    if (lon === undefined || lon === null || typeof lon !== 'number' || isNaN(lon)) {
      errors.push('Missing or invalid longitude coordinate.');
    } else if (lon < -180 || lon > 180) {
      errors.push(`Longitude ${lon} is out of valid range [-180, +180].`);
    }

    // 4. IANA Timezone Validation
    const tz = ('timezone' in profile && profile.timezone)
      ? profile.timezone
      : ('ianaTimezone' in profile && profile.ianaTimezone)
      ? profile.ianaTimezone
      : '';
    if (!tz || tz.trim() === '') {
      errors.push('Missing IANA timezone identifier.');
    } else {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
      } catch {
        errors.push(`Invalid IANA timezone identifier '${tz}'.`);
      }
    }

    // 5. Birth Place Validation (if profile object)
    if ('birthPlace' in profile) {
      const place = profile.birthPlace;
      if (!place || typeof place !== 'string' || place.trim() === '') {
        errors.push('Missing birth place location name.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Adapter transformation helper converting BirthProfile to RealEphemerisCalculationInput
   */
  public toEphemerisInput(profile: BirthProfile): RealEphemerisCalculationInput {
    const validation = this.validateInput(profile);
    if (!validation.isValid) {
      console.warn(`[RealAstrologyProvider] Input validation warnings: ${validation.errors.join('; ')}`);
    }

    return {
      dateOfBirth: profile.dateOfBirth,
      exactBirthTime: profile.birthTime || '12:00:00',
      latitude: profile.latitude,
      longitude: profile.longitude,
      ianaTimezone: profile.timezone || 'Asia/Kolkata',
      siderealSystem: 'Vedic',
      ayanamsha: this.settings.ayanamsha || 'LAHIRI',
      houseSystem: this.settings.houseSystem || 'WHOLE_SIGN',
      altitudeMeters: profile.elevationMeters,
    };
  }

  /**
   * Returns the structured future RealEphemerisCalculationOutput contract boundary.
   * Does NOT invent coordinates; strictly designates status as REAL_ENGINE_NOT_CONNECTED.
   */
  public getExpectedOutputContract(input: RealEphemerisCalculationInput): RealEphemerisCalculationOutput {
    const timestamp = new Date().toISOString();
    return {
      ascendant: {
        sign: 'Uncalculated',
        degree: "0° 00'",
        decimalLongitude: 0,
        nakshatra: 'Uncalculated',
        pada: 0,
      },
      planetaryPositions: [],
      houses: [],
      nakshatra: {
        name: 'Uncalculated',
        pada: 0,
        lord: 'Uncalculated',
        longitudeInNakshatra: "0° 00'",
        totalLongitude: 0,
      },
      divisionalCharts: {
        D1: {},
        D9: {},
      },
      vimshottariDasha: {
        mahadasha: 'Uncalculated',
        antardasha: 'Uncalculated',
        startDate: '',
        endDate: '',
        periods: [],
      },
      calculationMetadata: {
        calculationStatus: 'REAL_ENGINE_NOT_CONNECTED',
        calculationEngine: 'RealEphemerisAdapter',
        engineVersion: '2.10-stub',
        astrologySystem: this.settings.system,
        ayanamsha: this.settings.ayanamsha,
        houseSystem: input.houseSystem,
        nodeType: this.settings.nodeType,
        calculationTimestamp: timestamp,
        calculatedAt: timestamp,
        coordinateSystem: this.settings.coordinateType,
        ayanamshaDegree: 0,
      },
      engineMetadata: {
        engineName: 'RealEphemerisAdapter',
        version: '2.10-stub',
        isLicensed: false,
        status: 'REAL_ENGINE_NOT_CONNECTED',
      },
    };
  }

  public calculateBirthChart(birthProfile: BirthProfile): StandardBirthChartData {
    const ephemerisInput = this.toEphemerisInput(birthProfile);
    const standardChart = realEphemerisAdapter.toStandardChartData(ephemerisInput, birthProfile.name);
    return {
      ...standardChart,
      profile: birthProfile,
    };
  }

  public calculatePlanetaryPositions(birthProfile: BirthProfile): StandardPlanetPosition[] {
    return this.calculateBirthChart(birthProfile).planets;
  }

  public calculateHouses(birthProfile: BirthProfile): StandardHousePosition[] {
    return this.calculateBirthChart(birthProfile).houses;
  }

  public calculateNakshatra(birthProfile: BirthProfile): NakshatraCalculationResult {
    return this.calculateBirthChart(birthProfile).nakshatra;
  }

  public calculateDivisionalCharts(birthProfile: BirthProfile): DivisionalChartsResult {
    return this.calculateBirthChart(birthProfile).divisionalCharts;
  }

  public calculateDasha(birthProfile: BirthProfile): DashaCalculationResult {
    return this.calculateBirthChart(birthProfile).dasha;
  }

  public calculateKundliMatch(
    person1Profile: BirthProfile,
    person2Profile: BirthProfile
  ): KundliMatchingResult {
    console.warn('[RealAstrologyProvider] calculateKundliMatch: Real ephemeris engine not connected.');
    return {
      isCalculated: false,
      calculationEngineStatus: 'NOT_CONNECTED_DEMO_DATA',
      calculationNotice: 'Real astrology calculation engine is not connected. Awaiting ephemeris backend.',
      person1: person1Profile,
      person2: person2Profile,
      gunaMilan: {
        totalScore: 0,
        maxScore: 36,
        label: 'REAL ENGINE NOT CONNECTED',
        verdictDisclaimer: 'Real calculation engine is not connected.',
        level: 'Pending Engine',
      },
      ashtakoota: [],
      moonSignComparison: {
        title: 'Moon Sign Comparison',
        person1Moon: 'Uncalculated',
        person2Moon: 'Uncalculated',
        relationship: 'Pending Engine',
        note: 'Real ephemeris not connected.',
      },
      nakshatraComparison: {
        title: 'Nakshatra Compatibility',
        person1Nakshatra: 'Uncalculated',
        person2Nakshatra: 'Uncalculated',
        compatibilityNote: 'Pending Engine',
      },
      manglikCheck: {
        title: 'Manglik Dosha Analysis',
        person1Status: 'Uncalculated',
        person2Status: 'Uncalculated',
        reconciliationNote: 'Pending Engine Connection',
      },
      bhakootCheck: {
        title: 'Bhakoot Koota Analysis',
        status: 'Uncalculated',
        score: '0 / 7',
        reconciliationNote: 'Pending Engine Connection',
      },
      nadiCheck: {
        title: 'Nadi Koota Analysis',
        status: 'Uncalculated',
        score: '0 / 8',
        reconciliationNote: 'Pending Engine Connection',
      },
      overallInterpretation: {
        title: 'Compatibility Synthesis',
        summary: 'Real calculation engine is not connected.',
        guidance: 'Awaiting connection to a licensed Swiss Ephemeris or astronomical calculation backend.',
      },
    };
  }

  public calculatePanchang(date: string, location?: string): PanchangData {
    console.warn('[RealAstrologyProvider] calculatePanchang: Falling back to sample panchang service.');
    return calculatePanchangService(date, location);
  }
}

/**
 * ============================================================================
 * PROVIDER FACTORY & SINGLETON ENGINE INSTANCE
 * ============================================================================
 */
export function createAstrologyProvider(
  providerType: CalculationProviderType = CALCULATION_PROVIDER,
  customSettings?: Partial<AstrologySettings>
): AstrologyCalculationProvider {
  const mergedSettings: AstrologySettings = { ...astrologySettings, ...customSettings };
  if (providerType === 'REAL') {
    return new RealAstrologyProvider(mergedSettings);
  }
  return new DemoAstrologyProvider(mergedSettings);
}

/**
 * Singleton centralized astrologyEngine instance initialized via configuration point.
 */
export const astrologyEngine: AstrologyCalculationProvider = createAstrologyProvider(CALCULATION_PROVIDER);

/**
 * ============================================================================
 * DIRECT EXPORTED FUNCTIONS DELEGATED TO CENTRAL ENGINE
 * ============================================================================
 */
export const calculateBirthChart = (birthProfile: BirthProfile): StandardBirthChartData =>
  astrologyEngine.calculateBirthChart(birthProfile);

export const calculatePlanetaryPositions = (birthProfile: BirthProfile): StandardPlanetPosition[] =>
  astrologyEngine.calculatePlanetaryPositions(birthProfile);

export const calculateHouses = (birthProfile: BirthProfile): StandardHousePosition[] =>
  astrologyEngine.calculateHouses(birthProfile);

export const calculateNakshatra = (birthProfile: BirthProfile): NakshatraCalculationResult =>
  astrologyEngine.calculateNakshatra(birthProfile);

export const calculateDivisionalCharts = (birthProfile: BirthProfile): DivisionalChartsResult =>
  astrologyEngine.calculateDivisionalCharts(birthProfile);

export const calculateDasha = (birthProfile: BirthProfile): DashaCalculationResult =>
  astrologyEngine.calculateDasha(birthProfile);

export const calculateKundliMatch = (
  person1Profile: BirthProfile,
  person2Profile: BirthProfile
): KundliMatchingResult => astrologyEngine.calculateKundliMatch(person1Profile, person2Profile);

export const calculatePanchang = (date: string, location?: string): PanchangData =>
  astrologyEngine.calculatePanchang(date, location);

/**
 * Shared Data Architecture: getClientChart(clientId, customProfile)
 * Returns shared chart data produced by the central engine.
 */
export function getClientChart(clientId: string, customProfile?: BirthProfile): StandardBirthChartData {
  if (customProfile) {
    return calculateBirthChart(customProfile);
  }

  const fallbackProfile: BirthProfile = {
    name: 'Demo Client',
    dateOfBirth: '1998-08-15',
    birthTime: '08:30',
    birthTimeKnown: true,
    birthPlace: 'New Delhi, Delhi, India',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
    gender: 'female',
    isDemoData: true,
  };

  console.info(`[Astrology Engine] getClientChart called for clientId: ${clientId}. Returning shared chart from centralized engine.`);
  return calculateBirthChart(fallbackProfile);
}

/**
 * ============================================================================
 * REAL EPHEMERIS ADAPTER BOUNDARY — SWISS EPHEMERIS INTEGRATION
 * ============================================================================
 * 
 * Production adapter interface connecting the application's standardized
 * input/output contracts to the official Swiss Ephemeris engine (sweph-wasm @ 2.6.9).
 * 
 * CORE ASTRONOMICAL RULES ENFORCED:
 * 1. Vedic Sidereal Zodiac (SEFLG_SIDEREAL)
 * 2. Official Lahiri Ayanamsha (SE_SIDM_LAHIRI)
 * 3. Whole Sign House System ('W')
 * 4. True Lunar Nodes (SE_TRUE_NODE default)
 * 5. Geocentric Coordinates Standard
 * 6. 27 Nakshatras with 4 Padas per Nakshatra (108 Navamshas)
 * 7. Vimshottari Dasha derived from exact birth Moon longitude
 * 
 * ARCHITECTURAL BOUNDARY:
 * - The UI and frontend components never interact with Swiss Ephemeris directly.
 * - All ephemeris calculations flow through this adapter.
 * - CALCULATION_PROVIDER toggle remains centrally controlled in astrologyEngine.ts.
 */

import SwissEPH from 'sweph-wasm';
import {
  RealEphemerisCalculationInput,
  RealEphemerisCalculationOutput,
  AstrologySettings,
  StandardBirthChartData,
  StandardPlanetPosition,
  StandardHousePosition,
  DashaPeriodItem,
} from '../types';
import { KUNDLI_HOUSES_DATA } from '../data/astrologyMockData';

export const lockedAstrologySettings: AstrologySettings = {
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
  calculationProvider: 'REAL',
  dashaYearLengthDays: 365.242199,
  coordinateSystem: 'GEOCENTRIC',
  calculationEngine: 'SwissEphemerisAdapter (sweph-wasm @ 2.6.9)',
};

export interface EphemerisAdapterValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface RealEphemerisCalculationError {
  success: false;
  calculationStatus: 'REAL_ENGINE_NOT_CONNECTED' | 'VALIDATION_FAILED' | 'CALCULATION_FAILED';
  message: string;
  errors: string[];
  metadata: {
    calculationStatus: 'REAL_ENGINE_NOT_CONNECTED' | 'VALIDATION_FAILED' | 'CALCULATION_FAILED';
    calculationEngine: string;
    engineVersion: string;
    astrologySystem: string;
    ayanamsha: string;
    houseSystem: string;
    nodeType: string;
    calculationTimestamp: string;
  };
}

export interface RealEphemerisAdapter {
  readonly adapterName: string;
  readonly engineVersion: string;
  readonly isConnected: boolean;
  readonly lockedSettings: AstrologySettings;

  validateInput(input: RealEphemerisCalculationInput): EphemerisAdapterValidationResult;
  calculateEphemeris(
    input: RealEphemerisCalculationInput
  ): RealEphemerisCalculationOutput | RealEphemerisCalculationError;
  calculateEphemerisAsync(
    input: RealEphemerisCalculationInput
  ): Promise<RealEphemerisCalculationOutput | RealEphemerisCalculationError>;
  toStandardChartData(
    input: RealEphemerisCalculationInput,
    profileName?: string
  ): StandardBirthChartData;
}

// 12 Zodiac Rashi Signs
const ZODIAC_SIGNS = [
  { name: 'Aries', sanskrit: 'Mesha', element: 'Fire', lord: 'Mars' },
  { name: 'Taurus', sanskrit: 'Vrishabha', element: 'Earth', lord: 'Venus' },
  { name: 'Gemini', sanskrit: 'Mithuna', element: 'Air', lord: 'Mercury' },
  { name: 'Cancer', sanskrit: 'Karka', element: 'Water', lord: 'Moon' },
  { name: 'Leo', sanskrit: 'Simha', element: 'Fire', lord: 'Sun' },
  { name: 'Virgo', sanskrit: 'Kanya', element: 'Earth', lord: 'Mercury' },
  { name: 'Libra', sanskrit: 'Tula', element: 'Air', lord: 'Venus' },
  { name: 'Scorpio', sanskrit: 'Vrishchika', element: 'Water', lord: 'Mars' },
  { name: 'Sagittarius', sanskrit: 'Dhanu', element: 'Fire', lord: 'Jupiter' },
  { name: 'Capricorn', sanskrit: 'Makara', element: 'Earth', lord: 'Saturn' },
  { name: 'Aquarius', sanskrit: 'Kumbha', element: 'Air', lord: 'Saturn' },
  { name: 'Pisces', sanskrit: 'Meena', element: 'Water', lord: 'Jupiter' },
];

// 27 Nakshatras & Lords
const NAKSHATRAS = [
  { name: 'Ashwini', lord: 'Ketu', deity: 'Ashwini Kumaras', symbol: 'Horse Head', gana: 'Deva' },
  { name: 'Bharani', lord: 'Venus', deity: 'Yama', symbol: 'Yoni', gana: 'Manushya' },
  { name: 'Krittika', lord: 'Sun', deity: 'Agni', symbol: 'Razor/Flame', gana: 'Rakshasa' },
  { name: 'Rohini', lord: 'Moon', deity: 'Brahma', symbol: 'Chariot/Cart', gana: 'Manushya' },
  { name: 'Mrigashira', lord: 'Mars', deity: 'Soma', symbol: 'Deer Head', gana: 'Deva' },
  { name: 'Ardra', lord: 'Rahu', deity: 'Rudra', symbol: 'Teardrop', gana: 'Manushya' },
  { name: 'Punarvasu', lord: 'Jupiter', deity: 'Aditi', symbol: 'Bow and Quiver', gana: 'Deva' },
  { name: 'Pushya', lord: 'Saturn', deity: 'Brihaspati', symbol: 'Cow Udder/Flower', gana: 'Deva' },
  { name: 'Ashlesha', lord: 'Mercury', deity: 'Sarpa/Nagas', symbol: 'Coiled Serpent', gana: 'Rakshasa' },
  { name: 'Magha', lord: 'Ketu', deity: 'Pitris', symbol: 'Royal Throne', gana: 'Rakshasa' },
  { name: 'Purva Phalguni', lord: 'Venus', deity: 'Bhaga', symbol: 'Front Legs of Bed', gana: 'Manushya' },
  { name: 'Uttara Phalguni', lord: 'Sun', deity: 'Aryaman', symbol: 'Back Legs of Bed', gana: 'Manushya' },
  { name: 'Hasta', lord: 'Moon', deity: 'Savitar', symbol: 'Open Hand', gana: 'Deva' },
  { name: 'Chitra', lord: 'Mars', deity: 'Tvashtar', symbol: 'Bright Jewel', gana: 'Rakshasa' },
  { name: 'Swati', lord: 'Rahu', deity: 'Vayu', symbol: 'Young Plant Shoot', gana: 'Deva' },
  { name: 'Vishakha', lord: 'Jupiter', deity: 'Indragni', symbol: 'Triumphal Arch', gana: 'Rakshasa' },
  { name: 'Anuradha', lord: 'Saturn', deity: 'Mitra', symbol: 'Lotus', gana: 'Deva' },
  { name: 'Jyeshtha', lord: 'Mercury', deity: 'Indra', symbol: 'Circular Amulet/Earring', gana: 'Rakshasa' },
  { name: 'Mula', lord: 'Ketu', deity: 'Nirriti', symbol: 'Tied Bunch of Roots', gana: 'Rakshasa' },
  { name: 'Purva Ashadha', lord: 'Venus', deity: 'Apas', symbol: 'Elephant Tusk/Winnowing Fan', gana: 'Manushya' },
  { name: 'Uttara Ashadha', lord: 'Sun', deity: 'Vishwadevas', symbol: 'Small Cot', gana: 'Manushya' },
  { name: 'Shravana', lord: 'Moon', deity: 'Vishnu', symbol: 'Ear/Three Footprints', gana: 'Deva' },
  { name: 'Dhanishta', lord: 'Mars', deity: 'Eight Vasus', symbol: 'Drum/Flute', gana: 'Rakshasa' },
  { name: 'Shatabhisha', lord: 'Rahu', deity: 'Varuna', symbol: 'Empty Circle/100 Flowers', gana: 'Rakshasa' },
  { name: 'Purva Bhadrapada', lord: 'Jupiter', deity: 'Aja Ekapada', symbol: 'Swords/Front of Funeral Cot', gana: 'Manushya' },
  { name: 'Uttara Bhadrapada', lord: 'Saturn', deity: 'Ahir Budhnya', symbol: 'Back of Funeral Cot/Twins', gana: 'Manushya' },
  { name: 'Revati', lord: 'Mercury', deity: 'Pushan', symbol: 'Fish/Drum', gana: 'Deva' },
];

// Vimshottari Dasha Lord Cycle and Duration in Years
const VIMSHOTTARI_LORDS: Array<{ planet: string; years: number }> = [
  { planet: 'Ketu', years: 7 },
  { planet: 'Venus', years: 20 },
  { planet: 'Sun', years: 6 },
  { planet: 'Moon', years: 10 },
  { planet: 'Mars', years: 7 },
  { planet: 'Rahu', years: 18 },
  { planet: 'Jupiter', years: 16 },
  { planet: 'Saturn', years: 19 },
  { planet: 'Mercury', years: 17 },
];

/**
 * Format decimal degrees into standard astrological Degree Minutes notation (e.g. 14° 23')
 */
function formatDegreeMinutes(degrees: number): string {
  const norm = ((degrees % 30) + 30) % 30;
  const deg = Math.floor(norm);
  const min = Math.floor((norm - deg) * 60);
  return `${deg.toString().padStart(2, '0')}° ${min.toString().padStart(2, '0')}'`;
}

/**
 * Converts local civil date, time and IANA timezone to Universal Time (UT) date components.
 */
function localCivilTimeToUTC(
  dateOfBirth: string,
  exactBirthTime: string,
  ianaTimezone: string
): { year: number; month: number; day: number; hour: number; minute: number; second: number; decimalUT: number } {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const timeParts = exactBirthTime.split(':').map(Number);
  const hour = timeParts[0] || 0;
  const minute = timeParts[1] || 0;
  const second = timeParts[2] || 0;

  // Initial estimate of UTC epoch timestamp
  const targetLocalMs = Date.UTC(year, month - 1, day, hour, minute, second);

  // Timezone formatter for extracting local components in the target IANA timezone
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: ianaTimezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  function getLocalTimeFromUtcMs(utcMs: number): number {
    const parts = dtf.formatToParts(new Date(utcMs));
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== 'literal') {
        map[p.type] = parseInt(p.value, 10);
      }
    }
    const h = map.hour === 24 ? 0 : map.hour;
    return Date.UTC(map.year, map.month - 1, map.day, h, map.minute, map.second);
  }

  // Iterate to find exact UTC offset at the given civil moment
  let utcMs = targetLocalMs;
  for (let i = 0; i < 3; i++) {
    const localMsAtUtc = getLocalTimeFromUtcMs(utcMs);
    const diff = localMsAtUtc - targetLocalMs;
    if (Math.abs(diff) === 0) break;
    utcMs -= diff;
  }

  const utcDate = new Date(utcMs);
  const utcYear = utcDate.getUTCFullYear();
  const utcMonth = utcDate.getUTCMonth() + 1;
  const utcDay = utcDate.getUTCDate();
  const utcHour = utcDate.getUTCHours();
  const utcMinute = utcDate.getUTCMinutes();
  const utcSecond = utcDate.getUTCSeconds();
  const decimalUT = utcHour + utcMinute / 60 + utcSecond / 3600;

  return {
    year: utcYear,
    month: utcMonth,
    day: utcDay,
    hour: utcHour,
    minute: utcMinute,
    second: utcSecond,
    decimalUT,
  };
}

/**
 * Calculates Navamsha (D9) sign index (0-11) for a given sidereal longitude.
 * Formula: Each Navamsha is 3°20' (3.333333°). Total 108 Navamshas across the zodiac.
 */
function calculateNavamshaSignIndex(longitude: number): number {
  const norm = ((longitude % 360) + 360) % 360;
  const navamshaIndex = Math.floor(norm / (360 / 108));
  return navamshaIndex % 12;
}

/**
 * Calculates High-Precision Vimshottari Dasha timeline derived from exact Moon longitude
 * using configured astronomical solar year length (365.242199 days).
 */
function calculateVimshottariDashaTimeline(
  dateOfBirth: string,
  exactBirthTime: string,
  ianaTimezone: string,
  moonLongitude: number,
  dashaYearLengthDays: number = 365.242199
): {
  mahadasha: string;
  antardasha: string;
  startDate: string;
  endDate: string;
  periods: DashaPeriodItem[];
  elapsedFraction: number;
  remainingFraction: number;
  balanceYears: number;
} {
  const nakSpan = 360 / 27; // 13.333333333333334° (13° 20')
  const moonNakIdx = Math.floor(moonLongitude / nakSpan);
  const lonInNak = moonLongitude % nakSpan;
  const elapsedFraction = lonInNak / nakSpan;
  const remainingFraction = 1 - elapsedFraction;

  const lordCycleIdx = moonNakIdx % 9;
  const initialLord = VIMSHOTTARI_LORDS[lordCycleIdx];
  const balanceYears = remainingFraction * initialLord.years;

  const utc = localCivilTimeToUTC(dateOfBirth, exactBirthTime, ianaTimezone);
  const birthEpochMs = Date.UTC(utc.year, utc.month - 1, utc.day, utc.hour, utc.minute, utc.second);

  const msPerDay = 86400 * 1000;
  const msPerDashaYear = dashaYearLengthDays * msPerDay;

  const periods: DashaPeriodItem[] = [];

  // 1. Initial Mahadasha
  const initialEndMs = birthEpochMs + (balanceYears * msPerDashaYear);
  const initialEndDateStr = new Date(initialEndMs).toISOString().split('T')[0];

  periods.push({
    planet: initialLord.planet,
    level: 'Mahadasha',
    startDate: dateOfBirth,
    endDate: initialEndDateStr,
    startYear: dateOfBirth.split('-')[0],
    endYear: initialEndDateStr.split('-')[0],
    duration: `${balanceYears.toFixed(2)} yrs (Balance)`,
    influence: `Initial Mahadasha balance of ${initialLord.planet}`,
    isDemoCalculation: false,
  });

  // 2. Subsequent 8 Mahadashas
  let runningEndMs = initialEndMs;
  for (let i = 1; i < 9; i++) {
    const nextLord = VIMSHOTTARI_LORDS[(lordCycleIdx + i) % 9];
    const nextEndMs = runningEndMs + (nextLord.years * msPerDashaYear);
    const nextStartDateStr = new Date(runningEndMs).toISOString().split('T')[0];
    const nextEndDateStr = new Date(nextEndMs).toISOString().split('T')[0];

    periods.push({
      planet: nextLord.planet,
      level: 'Mahadasha',
      startDate: nextStartDateStr,
      endDate: nextEndDateStr,
      startYear: nextStartDateStr.split('-')[0],
      endYear: nextEndDateStr.split('-')[0],
      duration: `${nextLord.years} yrs`,
      influence: `Major life cycle governed by ${nextLord.planet}`,
      isDemoCalculation: false,
    });
    runningEndMs = nextEndMs;
  }

  // Calculate Antardasha at birth
  let runningAntarStartMs = birthEpochMs - (elapsedFraction * initialLord.years * msPerDashaYear);
  let atBirthAntardasha = initialLord.planet;

  for (let j = 0; j < 9; j++) {
    const antarLord = VIMSHOTTARI_LORDS[(lordCycleIdx + j) % 9];
    const antarDurationYears = (initialLord.years * antarLord.years) / 120;
    const antarEndMs = runningAntarStartMs + (antarDurationYears * msPerDashaYear);

    if (birthEpochMs >= runningAntarStartMs && birthEpochMs < antarEndMs) {
      atBirthAntardasha = antarLord.planet;
      break;
    }
    runningAntarStartMs = antarEndMs;
  }

  return {
    mahadasha: initialLord.planet,
    antardasha: atBirthAntardasha,
    startDate: dateOfBirth,
    endDate: initialEndDateStr,
    periods,
    elapsedFraction,
    remainingFraction,
    balanceYears,
  };
}

/**
 * Singleton holder for initialized SwissEPH instance
 */
let swissEphInstance: any = null;
let swissEphInitPromise: Promise<any> | null = null;

async function getSwissEphInstance(): Promise<any> {
  if (swissEphInstance) {
    return swissEphInstance;
  }
  if (swissEphInitPromise) {
    return swissEphInitPromise;
  }

  swissEphInitPromise = (async () => {
    try {
      if (typeof window === 'undefined') {
        try {
          const fsMod = await import('fs');
          const pathMod = await import('path');
          const wasmPath = pathMod.resolve(process.cwd(), 'node_modules/sweph-wasm/dist/wasm/swisseph.wasm');
          if (fsMod.existsSync(wasmPath)) {
            const wasmBase64 = fsMod.readFileSync(wasmPath).toString('base64');
            const wasmDataUrl = `data:application/wasm;base64,${wasmBase64}`;
            swissEphInstance = await SwissEPH.init(wasmDataUrl);
            return swissEphInstance;
          }
        } catch (nodeErr) {
          console.warn('[SwissEphemerisAdapter] Node dynamic loader fallback:', nodeErr);
        }
      }
      try {
        swissEphInstance = await SwissEPH.init('/swisseph.wasm');
      } catch (browserErr) {
        console.warn('[SwissEphemerisAdapter] Primary WASM path load failed, trying default init:', browserErr);
        swissEphInstance = await SwissEPH.init();
      }
      return swissEphInstance;
    } catch (err) {
      swissEphInitPromise = null;
      throw err;
    }
  })();

  return swissEphInitPromise;
}

// Trigger eager background initialization in both environments
getSwissEphInstance().catch(err => {
  console.warn('[SwissEphemerisAdapter] Background WASM initialization:', err?.message || err);
});

/**
 * ============================================================================
 * SWISS EPHEMERIS ADAPTER IMPLEMENTATION
 * ============================================================================
 */
export class SwissEphemerisAdapter implements RealEphemerisAdapter {
  public readonly adapterName = 'SwissEphemerisAdapter (sweph-wasm)';
  public readonly engineVersion = '2.10.03';
  public readonly isConnected = true;
  public readonly lockedSettings: AstrologySettings = lockedAstrologySettings;

  /**
   * Validates standard RealEphemerisCalculationInput
   */
  public validateInput(input: RealEphemerisCalculationInput): EphemerisAdapterValidationResult {
    const errors: string[] = [];

    if (!input) {
      return { isValid: false, errors: ['Input object is null or undefined'] };
    }

    // 1. Date Validation (YYYY-MM-DD)
    if (!input.dateOfBirth || typeof input.dateOfBirth !== 'string') {
      errors.push('Missing or invalid dateOfBirth.');
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(input.dateOfBirth)) {
        errors.push(`dateOfBirth must be in YYYY-MM-DD format (received "${input.dateOfBirth}").`);
      } else {
        const [year, month, day] = input.dateOfBirth.split('-').map(Number);
        if (month < 1 || month > 12) {
          errors.push(`Invalid month ${month} in dateOfBirth.`);
        }
        const maxDaysInMonth = new Date(year, month, 0).getDate();
        if (day < 1 || day > maxDaysInMonth) {
          errors.push(`Invalid day ${day} for month ${month} (max ${maxDaysInMonth} days).`);
        }
      }
    }

    // 2. Exact Birth Time Validation (HH:MM or HH:MM:SS)
    if (!input.exactBirthTime || typeof input.exactBirthTime !== 'string') {
      errors.push('Missing exactBirthTime.');
    } else {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
      if (!timeRegex.test(input.exactBirthTime)) {
        errors.push(`exactBirthTime must be valid 24h format HH:MM or HH:MM:SS (received "${input.exactBirthTime}").`);
      }
    }

    // 3. Coordinate Bounds Validation
    if (typeof input.latitude !== 'number' || isNaN(input.latitude)) {
      errors.push('Latitude must be a valid number.');
    } else if (input.latitude < -90 || input.latitude > 90) {
      errors.push(`Latitude out of range [-90, +90]: ${input.latitude}.`);
    }

    if (typeof input.longitude !== 'number' || isNaN(input.longitude)) {
      errors.push('Longitude must be a valid number.');
    } else if (input.longitude < -180 || input.longitude > 180) {
      errors.push(`Longitude out of range [-180, +180]: ${input.longitude}.`);
    }

    // 4. IANA Timezone Validation
    if (!input.ianaTimezone || typeof input.ianaTimezone !== 'string') {
      errors.push('Missing IANA timezone identifier.');
    } else {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: input.ianaTimezone });
      } catch {
        errors.push(`Invalid IANA timezone identifier "${input.ianaTimezone}".`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Performs full Swiss Ephemeris calculation asynchronously.
   */
  public async calculateEphemerisAsync(
    input: RealEphemerisCalculationInput
  ): Promise<RealEphemerisCalculationOutput | RealEphemerisCalculationError> {
    const validation = this.validateInput(input);
    const timestamp = new Date().toISOString();

    if (!validation.isValid) {
      return {
        success: false,
        calculationStatus: 'VALIDATION_FAILED',
        message: `Input validation failed: ${validation.errors.join('; ')}`,
        errors: validation.errors,
        metadata: {
          calculationStatus: 'VALIDATION_FAILED',
          calculationEngine: this.adapterName,
          engineVersion: this.engineVersion,
          astrologySystem: this.lockedSettings.system,
          ayanamsha: this.lockedSettings.ayanamsha,
          houseSystem: this.lockedSettings.houseSystem,
          nodeType: this.lockedSettings.nodeType,
          calculationTimestamp: timestamp,
        },
      };
    }

    try {
      const swe = await getSwissEphInstance();

      // 1. Calculate UT Date and Julian Day UT
      const utc = localCivilTimeToUTC(input.dateOfBirth, input.exactBirthTime, input.ianaTimezone);
      const jd_ut = swe.swe_julday(utc.year, utc.month, utc.day, utc.decimalUT, swe.SE_GREG_CAL);

      // 2. Set Lahiri Sidereal Mode (SE_SIDM_LAHIRI)
      swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
      const ayanamshaDegree = swe.swe_get_ayanamsa_ut(jd_ut);

      // 3. Ascendant & Whole Sign Houses ('W')
      // SEFLG_SIDEREAL calculates sidereal house cusps and Ascendant directly
      const houseResult = swe.swe_houses_ex(jd_ut, swe.SEFLG_SIDEREAL, input.latitude, input.longitude, 'W');
      const ascLongitude = ((houseResult.ascmc[0] % 360) + 360) % 360;
      const ascSignIdx = Math.floor(ascLongitude / 30);
      const ascSign = ZODIAC_SIGNS[ascSignIdx];

      const ascNakshatraIdx = Math.floor(ascLongitude / (360 / 27));
      const ascPada = Math.floor((ascLongitude % (360 / 27)) / (360 / 108)) + 1;

      const ascendant = {
        sign: `${ascSign.name} (${ascSign.sanskrit})`,
        degree: formatDegreeMinutes(ascLongitude),
        decimalLongitude: ascLongitude,
        nakshatra: NAKSHATRAS[ascNakshatraIdx].name,
        pada: ascPada,
      };

      // 4. Planetary Positions (7 classical planets + True Node Rahu/Ketu)
      const bodiesToCalc = [
        { id: swe.SE_SUN, name: 'Sun', sanskritName: 'Surya' },
        { id: swe.SE_MOON, name: 'Moon', sanskritName: 'Chandra' },
        { id: swe.SE_MARS, name: 'Mars', sanskritName: 'Mangala' },
        { id: swe.SE_MERCURY, name: 'Mercury', sanskritName: 'Budha' },
        { id: swe.SE_JUPITER, name: 'Jupiter', sanskritName: 'Guru' },
        { id: swe.SE_VENUS, name: 'Venus', sanskritName: 'Shukra' },
        { id: swe.SE_SATURN, name: 'Saturn', sanskritName: 'Shani' },
        { id: swe.SE_TRUE_NODE, name: 'Rahu', sanskritName: 'Rahu' },
      ];

      const planetaryPositions: RealEphemerisCalculationOutput['planetaryPositions'] = [];
      let moonLongitude = 0;
      let rahuLongitude = 0;
      let rahuSpeed = 0;

      for (const b of bodiesToCalc) {
        const res = swe.swe_calc_ut(jd_ut, b.id, swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED);
        const lon = ((res[0] % 360) + 360) % 360;
        const speed = res[3];
        const isRetro = speed < 0;

        const signIdx = Math.floor(lon / 30);
        const signObj = ZODIAC_SIGNS[signIdx];
        const nakIdx = Math.floor(lon / (360 / 27));
        const pada = Math.floor((lon % (360 / 27)) / (360 / 108)) + 1;

        // Whole sign house assignment relative to Ascendant sign
        const houseNum = ((signIdx - ascSignIdx + 12) % 12) + 1;

        if (b.name === 'Moon') {
          moonLongitude = lon;
        } else if (b.name === 'Rahu') {
          rahuLongitude = lon;
          rahuSpeed = speed;
        }

        planetaryPositions.push({
          name: b.name,
          sanskritName: b.sanskritName,
          decimalLongitude: lon,
          dailySpeed: speed,
          sign: `${signObj.name} (${signObj.sanskrit})`,
          degree: formatDegreeMinutes(lon),
          house: houseNum,
          isRetrograde: isRetro,
          nakshatra: NAKSHATRAS[nakIdx].name,
          pada,
          latitude: res[1],
          distanceAU: res[2],
        });
      }

      // Ketu is exactly 180° opposite Rahu
      const ketuLon = (rahuLongitude + 180) % 360;
      const ketuSignIdx = Math.floor(ketuLon / 30);
      const ketuSignObj = ZODIAC_SIGNS[ketuSignIdx];
      const ketuNakIdx = Math.floor(ketuLon / (360 / 27));
      const ketuPada = Math.floor((ketuLon % (360 / 27)) / (360 / 108)) + 1;
      const ketuHouseNum = ((ketuSignIdx - ascSignIdx + 12) % 12) + 1;

      planetaryPositions.push({
        name: 'Ketu',
        sanskritName: 'Ketu',
        decimalLongitude: ketuLon,
        dailySpeed: rahuSpeed,
        sign: `${ketuSignObj.name} (${ketuSignObj.sanskrit})`,
        degree: formatDegreeMinutes(ketuLon),
        house: ketuHouseNum,
        isRetrograde: rahuSpeed < 0,
        nakshatra: NAKSHATRAS[ketuNakIdx].name,
        pada: ketuPada,
      });

      // 5. Build Whole Sign Houses (1 to 12)
      const houses: RealEphemerisCalculationOutput['houses'] = [];
      for (let h = 1; h <= 12; h++) {
        const signIndex = (ascSignIdx + (h - 1)) % 12;
        const signObj = ZODIAC_SIGNS[signIndex];
        const cuspLon = signIndex * 30;

        const occupyingPlanets = planetaryPositions
          .filter(p => p.house === h)
          .map(p => p.name);

        houses.push({
          houseNumber: h,
          sign: `${signObj.name} (${signObj.sanskrit})`,
          degree: '00° 00\'',
          cuspLongitude: cuspLon,
          planets: occupyingPlanets,
        });
      }

      // 6. Moon's Birth Nakshatra & Longitude in Nakshatra
      const moonNakIdx = Math.floor(moonLongitude / (360 / 27));
      const moonPada = Math.floor((moonLongitude % (360 / 27)) / (360 / 108)) + 1;
      const nakSpan = 360 / 27; // 13.333333°
      const lonInNak = moonLongitude % nakSpan;

      const birthNakshatra = {
        name: NAKSHATRAS[moonNakIdx].name,
        pada: moonPada,
        lord: NAKSHATRAS[moonNakIdx].lord,
        longitudeInNakshatra: formatDegreeMinutes(lonInNak),
        totalLongitude: moonLongitude,
      };

      // 7. Divisional Charts (D1 Rashi and D9 Navamsha)
      const d1HouseMap: Record<string, any> = {};
      const d9HouseMap: Record<string, any> = {};

      for (let h = 1; h <= 12; h++) {
        const d1SignIndex = (ascSignIdx + (h - 1)) % 12;
        d1HouseMap[`house${h}`] = {
          houseNumber: h,
          sign: ZODIAC_SIGNS[d1SignIndex].name,
          planets: planetaryPositions.filter(p => p.house === h).map(p => p.name),
        };
      }

      const ascNavSignIdx = calculateNavamshaSignIndex(ascLongitude);
      for (let h = 1; h <= 12; h++) {
        const d9SignIndex = (ascNavSignIdx + (h - 1)) % 12;
        const planetsInD9House = planetaryPositions
          .filter(p => {
            const pNavSignIdx = calculateNavamshaSignIndex(p.decimalLongitude);
            const pD9House = ((pNavSignIdx - ascNavSignIdx + 12) % 12) + 1;
            return pD9House === h;
          })
          .map(p => p.name);

        d9HouseMap[`house${h}`] = {
          houseNumber: h,
          sign: ZODIAC_SIGNS[d9SignIndex].name,
          planets: planetsInD9House,
        };
      }

      // 8. Vimshottari Dasha derived from Moon's birth Nakshatra
      const dashaTimeline = calculateVimshottariDashaTimeline(
        input.dateOfBirth,
        input.exactBirthTime,
        input.ianaTimezone,
        moonLongitude,
        this.lockedSettings.dashaYearLengthDays || 365.242199
      );

      const vimshottariDasha = {
        mahadasha: dashaTimeline.mahadasha,
        antardasha: dashaTimeline.antardasha,
        startDate: dashaTimeline.startDate,
        endDate: dashaTimeline.endDate,
        periods: dashaTimeline.periods,
      };

      return {
        ascendant,
        planetaryPositions,
        houses,
        nakshatra: birthNakshatra,
        divisionalCharts: {
          D1: d1HouseMap,
          D9: d9HouseMap,
        },
        vimshottariDasha,
        calculationMetadata: {
          calculationStatus: 'REAL',
          calculationEngine: this.adapterName,
          engineVersion: this.engineVersion,
          astrologySystem: this.lockedSettings.system,
          ayanamsha: this.lockedSettings.ayanamsha,
          houseSystem: this.lockedSettings.houseSystem,
          nodeType: this.lockedSettings.nodeType,
          calculationTimestamp: timestamp,
          calculatedAt: timestamp,
          julianDay: jd_ut,
          ayanamshaDegree,
          coordinateSystem: this.lockedSettings.coordinateType,
        },
        engineMetadata: {
          engineName: this.adapterName,
          version: this.engineVersion,
          isLicensed: true,
          status: 'REAL',
        },
      };
    } catch (err: any) {
      return {
        success: false,
        calculationStatus: 'CALCULATION_FAILED',
        message: `Ephemeris calculation failed: ${err.message || String(err)}`,
        errors: [err.message || String(err)],
        metadata: {
          calculationStatus: 'CALCULATION_FAILED',
          calculationEngine: this.adapterName,
          engineVersion: this.engineVersion,
          astrologySystem: this.lockedSettings.system,
          ayanamsha: this.lockedSettings.ayanamsha,
          houseSystem: this.lockedSettings.houseSystem,
          nodeType: this.lockedSettings.nodeType,
          calculationTimestamp: timestamp,
        },
      };
    }
  }

  /**
   * Synchronous interface method: delegates to async or returns error if not yet initialized.
   */
  public calculateEphemeris(
    input: RealEphemerisCalculationInput
  ): RealEphemerisCalculationOutput | RealEphemerisCalculationError {
    const validation = this.validateInput(input);
    const timestamp = new Date().toISOString();

    if (!validation.isValid) {
      return {
        success: false,
        calculationStatus: 'VALIDATION_FAILED',
        message: `Input validation failed: ${validation.errors.join('; ')}`,
        errors: validation.errors,
        metadata: {
          calculationStatus: 'VALIDATION_FAILED',
          calculationEngine: this.adapterName,
          engineVersion: this.engineVersion,
          astrologySystem: this.lockedSettings.system,
          ayanamsha: this.lockedSettings.ayanamsha,
          houseSystem: this.lockedSettings.houseSystem,
          nodeType: this.lockedSettings.nodeType,
          calculationTimestamp: timestamp,
        },
      };
    }

    // When called synchronously, check if swissEphInstance is already initialized
    if (!swissEphInstance) {
      return {
        success: false,
        calculationStatus: 'CALCULATION_FAILED',
        message: 'Swiss Ephemeris WASM engine is loading asynchronously. Use calculateEphemerisAsync().',
        errors: ['WASM engine pending initialization'],
        metadata: {
          calculationStatus: 'CALCULATION_FAILED',
          calculationEngine: this.adapterName,
          engineVersion: this.engineVersion,
          astrologySystem: this.lockedSettings.system,
          ayanamsha: this.lockedSettings.ayanamsha,
          houseSystem: this.lockedSettings.houseSystem,
          nodeType: this.lockedSettings.nodeType,
          calculationTimestamp: timestamp,
        },
      };
    }

    const swe = swissEphInstance;
    const utc = localCivilTimeToUTC(input.dateOfBirth, input.exactBirthTime, input.ianaTimezone);
    const jd_ut = swe.swe_julday(utc.year, utc.month, utc.day, utc.decimalUT, swe.SE_GREG_CAL);

    swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
    const ayanamshaDegree = swe.swe_get_ayanamsa_ut(jd_ut);

    const houseResult = swe.swe_houses_ex(jd_ut, swe.SEFLG_SIDEREAL, input.latitude, input.longitude, 'W');
    const ascLongitude = ((houseResult.ascmc[0] % 360) + 360) % 360;
    const ascSignIdx = Math.floor(ascLongitude / 30);
    const ascSign = ZODIAC_SIGNS[ascSignIdx];
    const ascNakshatraIdx = Math.floor(ascLongitude / (360 / 27));
    const ascPada = Math.floor((ascLongitude % (360 / 27)) / (360 / 108)) + 1;

    const ascendant = {
      sign: `${ascSign.name} (${ascSign.sanskrit})`,
      degree: formatDegreeMinutes(ascLongitude),
      decimalLongitude: ascLongitude,
      nakshatra: NAKSHATRAS[ascNakshatraIdx].name,
      pada: ascPada,
    };

    const bodiesToCalc = [
      { id: swe.SE_SUN, name: 'Sun', sanskritName: 'Surya' },
      { id: swe.SE_MOON, name: 'Moon', sanskritName: 'Chandra' },
      { id: swe.SE_MARS, name: 'Mars', sanskritName: 'Mangala' },
      { id: swe.SE_MERCURY, name: 'Mercury', sanskritName: 'Budha' },
      { id: swe.SE_JUPITER, name: 'Jupiter', sanskritName: 'Guru' },
      { id: swe.SE_VENUS, name: 'Venus', sanskritName: 'Shukra' },
      { id: swe.SE_SATURN, name: 'Saturn', sanskritName: 'Shani' },
      { id: swe.SE_TRUE_NODE, name: 'Rahu', sanskritName: 'Rahu' },
    ];

    const planetaryPositions: RealEphemerisCalculationOutput['planetaryPositions'] = [];
    let moonLongitude = 0;
    let rahuLongitude = 0;
    let rahuSpeed = 0;

    for (const b of bodiesToCalc) {
      const res = swe.swe_calc_ut(jd_ut, b.id, swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED);
      const lon = ((res[0] % 360) + 360) % 360;
      const speed = res[3];
      const isRetro = speed < 0;

      const signIdx = Math.floor(lon / 30);
      const signObj = ZODIAC_SIGNS[signIdx];
      const nakIdx = Math.floor(lon / (360 / 27));
      const pada = Math.floor((lon % (360 / 27)) / (360 / 108)) + 1;
      const houseNum = ((signIdx - ascSignIdx + 12) % 12) + 1;

      if (b.name === 'Moon') {
        moonLongitude = lon;
      } else if (b.name === 'Rahu') {
        rahuLongitude = lon;
        rahuSpeed = speed;
      }

      planetaryPositions.push({
        name: b.name,
        sanskritName: b.sanskritName,
        decimalLongitude: lon,
        dailySpeed: speed,
        sign: `${signObj.name} (${signObj.sanskrit})`,
        degree: formatDegreeMinutes(lon),
        house: houseNum,
        isRetrograde: isRetro,
        nakshatra: NAKSHATRAS[nakIdx].name,
        pada,
        latitude: res[1],
        distanceAU: res[2],
      });
    }

    const ketuLon = (rahuLongitude + 180) % 360;
    const ketuSignIdx = Math.floor(ketuLon / 30);
    const ketuSignObj = ZODIAC_SIGNS[ketuSignIdx];
    const ketuNakIdx = Math.floor(ketuLon / (360 / 27));
    const ketuPada = Math.floor((ketuLon % (360 / 27)) / (360 / 108)) + 1;
    const ketuHouseNum = ((ketuSignIdx - ascSignIdx + 12) % 12) + 1;

    planetaryPositions.push({
      name: 'Ketu',
      sanskritName: 'Ketu',
      decimalLongitude: ketuLon,
      dailySpeed: rahuSpeed,
      sign: `${ketuSignObj.name} (${ketuSignObj.sanskrit})`,
      degree: formatDegreeMinutes(ketuLon),
      house: ketuHouseNum,
      isRetrograde: rahuSpeed < 0,
      nakshatra: NAKSHATRAS[ketuNakIdx].name,
      pada: ketuPada,
    });

    const houses: RealEphemerisCalculationOutput['houses'] = [];
    for (let h = 1; h <= 12; h++) {
      const signIndex = (ascSignIdx + (h - 1)) % 12;
      const signObj = ZODIAC_SIGNS[signIndex];
      const cuspLon = signIndex * 30;

      const occupyingPlanets = planetaryPositions
        .filter(p => p.house === h)
        .map(p => p.name);

      houses.push({
        houseNumber: h,
        sign: `${signObj.name} (${signObj.sanskrit})`,
        degree: '00° 00\'',
        cuspLongitude: cuspLon,
        planets: occupyingPlanets,
      });
    }

    const moonNakIdx = Math.floor(moonLongitude / (360 / 27));
    const moonPada = Math.floor((moonLongitude % (360 / 27)) / (360 / 108)) + 1;
    const nakSpan = 360 / 27;
    const lonInNak = moonLongitude % nakSpan;

    const birthNakshatra = {
      name: NAKSHATRAS[moonNakIdx].name,
      pada: moonPada,
      lord: NAKSHATRAS[moonNakIdx].lord,
      longitudeInNakshatra: formatDegreeMinutes(lonInNak),
      totalLongitude: moonLongitude,
    };

    const d1HouseMap: Record<string, any> = {};
    const d9HouseMap: Record<string, any> = {};

    for (let h = 1; h <= 12; h++) {
      const d1SignIndex = (ascSignIdx + (h - 1)) % 12;
      d1HouseMap[`house${h}`] = {
        houseNumber: h,
        sign: ZODIAC_SIGNS[d1SignIndex].name,
        planets: planetaryPositions.filter(p => p.house === h).map(p => p.name),
      };
    }

    const ascNavSignIdx = calculateNavamshaSignIndex(ascLongitude);
    for (let h = 1; h <= 12; h++) {
      const d9SignIndex = (ascNavSignIdx + (h - 1)) % 12;
      const planetsInD9House = planetaryPositions
        .filter(p => {
          const pNavSignIdx = calculateNavamshaSignIndex(p.decimalLongitude);
          const pD9House = ((pNavSignIdx - ascNavSignIdx + 12) % 12) + 1;
          return pD9House === h;
        })
        .map(p => p.name);

      d9HouseMap[`house${h}`] = {
        houseNumber: h,
        sign: ZODIAC_SIGNS[d9SignIndex].name,
        planets: planetsInD9House,
      };
    }

    const dashaTimeline = calculateVimshottariDashaTimeline(
      input.dateOfBirth,
      input.exactBirthTime,
      input.ianaTimezone,
      moonLongitude,
      this.lockedSettings.dashaYearLengthDays || 365.242199
    );

    const vimshottariDasha = {
      mahadasha: dashaTimeline.mahadasha,
      antardasha: dashaTimeline.antardasha,
      startDate: dashaTimeline.startDate,
      endDate: dashaTimeline.endDate,
      periods: dashaTimeline.periods,
    };

    return {
      ascendant,
      planetaryPositions,
      houses,
      nakshatra: birthNakshatra,
      divisionalCharts: {
        D1: d1HouseMap,
        D9: d9HouseMap,
      },
      vimshottariDasha,
      calculationMetadata: {
        calculationStatus: 'REAL',
        calculationEngine: this.adapterName,
        engineVersion: this.engineVersion,
        astrologySystem: this.lockedSettings.system,
        ayanamsha: this.lockedSettings.ayanamsha,
        houseSystem: this.lockedSettings.houseSystem,
        nodeType: this.lockedSettings.nodeType,
        calculationTimestamp: timestamp,
        calculatedAt: timestamp,
        julianDay: jd_ut,
        ayanamshaDegree,
        coordinateSystem: this.lockedSettings.coordinateType,
      },
      engineMetadata: {
        engineName: this.adapterName,
        version: this.engineVersion,
        isLicensed: true,
        status: 'REAL',
      },
    };
  }

  /**
   * Transforms input and adapter output into application-compatible StandardBirthChartData
   */
  public toStandardChartData(
    input: RealEphemerisCalculationInput,
    profileName: string = 'User'
  ): StandardBirthChartData {
    const calculation = this.calculateEphemeris(input);
    const isError = 'success' in calculation && calculation.success === false;

    if (isError) {
      const err = calculation as RealEphemerisCalculationError;
      return {
        calculationStatus: 'REAL_ENGINE_NOT_CONNECTED',
        calculationEngine: this.adapterName,
        calculationNotice: `Calculation error: ${err.message}`,
        calculationEngineStatus: 'REAL_ENGINE_NOT_CONNECTED',
        isCalculated: false,
        chartType: 'D1 Rashi',
        profile: {
          name: profileName,
          dateOfBirth: input.dateOfBirth,
          birthTime: input.exactBirthTime,
          birthTimeKnown: true,
          birthPlace: `${input.latitude.toFixed(2)}°, ${input.longitude.toFixed(2)}°`,
          latitude: input.latitude,
          longitude: input.longitude,
          timezone: input.ianaTimezone,
          elevationMeters: input.altitudeMeters,
        },
        settings: this.lockedSettings,
        lagna: {
          sign: 'Uncalculated',
          degree: '00° 00\'',
          nakshatra: 'Uncalculated',
          pada: 0,
        },
        ascendant: {
          sign: 'Uncalculated',
          degree: '00° 00\'',
          nakshatra: 'Uncalculated',
          pada: 0,
          isDemo: false,
        },
        moonSign: {
          sign: 'Uncalculated',
          nakshatra: 'Uncalculated',
          pada: 0,
          isDemo: false,
        },
        planets: [],
        houses: KUNDLI_HOUSES_DATA.map(h => ({
          houseNumber: h.houseNumber,
          sign: h.signName,
          signName: h.signName,
          signNumber: h.signNumber,
          degree: "00° 00'",
          planets: h.planets,
          significance: h.significance,
        })),
        nakshatra: {
          name: 'Uncalculated',
          pada: 0,
          lord: 'Uncalculated',
          isDemo: false,
        },
        divisionalCharts: {
          D1: {},
          D9: {},
        },
        dasha: {
          mahadasha: 'Uncalculated',
          antardasha: 'Uncalculated',
          startDate: '',
          endDate: '',
          periods: [],
        },
      };
    }

    const output = calculation as RealEphemerisCalculationOutput;
    const moonPos = output.planetaryPositions.find(p => p.name === 'Moon');

    const planets: StandardPlanetPosition[] = output.planetaryPositions.map(p => ({
      name: p.name,
      planet: p.name,
      sanskritName: p.sanskritName,
      decimalLongitude: p.decimalLongitude,
      sign: p.sign,
      degree: p.degree,
      house: p.house,
      retrograde: p.isRetrograde,
      isRetrograde: p.isRetrograde,
      nakshatra: p.nakshatra,
      pada: p.pada,
    }));

    const houses: StandardHousePosition[] = output.houses.map(h => ({
      houseNumber: h.houseNumber,
      sign: h.sign,
      signName: h.sign,
      signNumber: h.houseNumber,
      degree: h.degree,
      planets: h.planets,
      significance: KUNDLI_HOUSES_DATA[h.houseNumber - 1]?.significance || `Bhava ${h.houseNumber}`,
    }));

    return {
      calculationStatus: 'REAL',
      calculationEngine: this.adapterName,
      calculationNotice: 'Calculated via Swiss Ephemeris (Vedic Sidereal Lahiri / Whole Sign)',
      calculationEngineStatus: 'CONNECTED',
      isCalculated: true,
      chartType: 'D1 Rashi',
      profile: {
        name: profileName,
        dateOfBirth: input.dateOfBirth,
        birthTime: input.exactBirthTime,
        birthTimeKnown: true,
        birthPlace: `${input.latitude.toFixed(2)}°, ${input.longitude.toFixed(2)}°`,
        latitude: input.latitude,
        longitude: input.longitude,
        timezone: input.ianaTimezone,
        elevationMeters: input.altitudeMeters,
      },
      settings: this.lockedSettings,
      lagna: {
        sign: output.ascendant.sign,
        degree: output.ascendant.degree,
        decimalLongitude: output.ascendant.decimalLongitude,
        nakshatra: output.ascendant.nakshatra,
        pada: output.ascendant.pada,
      },
      ascendant: {
        sign: output.ascendant.sign,
        degree: output.ascendant.degree,
        decimalLongitude: output.ascendant.decimalLongitude,
        nakshatra: output.ascendant.nakshatra,
        pada: output.ascendant.pada,
        isDemo: false,
      },
      moonSign: {
        sign: moonPos ? moonPos.sign : 'Uncalculated',
        nakshatra: output.nakshatra.name,
        pada: output.nakshatra.pada,
        isDemo: false,
      },
      planets,
      houses,
      nakshatra: {
        name: output.nakshatra.name,
        pada: output.nakshatra.pada,
        lord: output.nakshatra.lord,
        isDemo: false,
      },
      divisionalCharts: {
        D1: output.divisionalCharts.D1,
        D9: output.divisionalCharts.D9,
      },
      dasha: {
        mahadasha: output.vimshottariDasha.mahadasha,
        antardasha: output.vimshottariDasha.antardasha,
        startDate: output.vimshottariDasha.startDate,
        endDate: output.vimshottariDasha.endDate,
        periods: output.vimshottariDasha.periods,
      },
    };
  }
}

/**
 * Singleton instance of the real ephemeris adapter boundary.
 */
export const realEphemerisAdapter: RealEphemerisAdapter = new SwissEphemerisAdapter();

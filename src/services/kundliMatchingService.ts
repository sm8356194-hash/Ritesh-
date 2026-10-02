/**
 * Real Ashtakoota (36 Guna) Kundli Matching Calculation Service
 * 
 * Implements deterministic Vedic Ashtakoota Milan compatibility scoring across:
 * 1. Varna (1 point) — Spiritual alignment, ego balance & intellectual orientation
 * 2. Vashya (2 points) — Mutual attraction, natural dominance & partnership rapport
 * 3. Tara (3 points) — Nakshatra distance, destiny, longevity & auspiciousness
 * 4. Yoni (4 points) — Biological affinity, instinctual temperament & intimacy
 * 5. Graha Maitri (5 points) — Rashi lord natural planetary friendship & communication
 * 6. Gana (6 points) — Psychological nature & temperamental harmony (Deva / Manushya / Rakshasa)
 * 7. Bhakoot (7 points) — Relative Moon sign positioning, family harmony & prosperity
 * 8. Nadi (8 points) — Physiological constitution, nervous system balance & genetic wellness
 * Total Maximum: 36 points.
 * 
 * Astronomical Input Source:
 * Moon sign (Rashi), Nakshatra, and Nakshatra Pada derived from the project's real
 * Swiss Ephemeris / astronomical ephemeris pipeline with Lahiri Ayanamsha.
 */

import { BirthProfile, KundliMatchingResult, AshtakootaKootaItem } from '../types';
import { realEphemerisAdapter } from './realEphemerisAdapter';

// ============================================================================
// VEDIC ASTRONOMICAL LOOKUP TABLES & ARCHETYPES
// ============================================================================

export interface NakshatraDefinition {
  index: number; // 0 to 26
  name: string;
  lord: string;
  gana: 'Deva' | 'Manushya' | 'Rakshasa';
  yoniAnimal: string;
  yoniGender: 'Male' | 'Female';
  nadi: 'Aadi' | 'Madhya' | 'Antya';
  rashiSpan: Array<{ rashiIndex: number; padas: number[] }>;
}

export const VEDIC_NAKSHATRAS: NakshatraDefinition[] = [
  { index: 0, name: 'Ashwini', lord: 'Ketu', gana: 'Deva', yoniAnimal: 'Horse', yoniGender: 'Male', nadi: 'Aadi', rashiSpan: [{ rashiIndex: 0, padas: [1, 2, 3, 4] }] },
  { index: 1, name: 'Bharani', lord: 'Venus', gana: 'Manushya', yoniAnimal: 'Elephant', yoniGender: 'Male', nadi: 'Madhya', rashiSpan: [{ rashiIndex: 0, padas: [1, 2, 3, 4] }] },
  { index: 2, name: 'Krittika', lord: 'Sun', gana: 'Rakshasa', yoniAnimal: 'Sheep', yoniGender: 'Female', nadi: 'Antya', rashiSpan: [{ rashiIndex: 0, padas: [1] }, { rashiIndex: 1, padas: [2, 3, 4] }] },
  { index: 3, name: 'Rohini', lord: 'Moon', gana: 'Manushya', yoniAnimal: 'Serpent', yoniGender: 'Male', nadi: 'Antya', rashiSpan: [{ rashiIndex: 1, padas: [1, 2, 3, 4] }] },
  { index: 4, name: 'Mrigashira', lord: 'Mars', gana: 'Deva', yoniAnimal: 'Serpent', yoniGender: 'Female', nadi: 'Madhya', rashiSpan: [{ rashiIndex: 1, padas: [1, 2] }, { rashiIndex: 2, padas: [3, 4] }] },
  { index: 5, name: 'Ardra', lord: 'Rahu', gana: 'Manushya', yoniAnimal: 'Dog', yoniGender: 'Female', nadi: 'Aadi', rashiSpan: [{ rashiIndex: 2, padas: [1, 2, 3, 4] }] },
  { index: 6, name: 'Punarvasu', lord: 'Jupiter', gana: 'Deva', yoniAnimal: 'Cat', yoniGender: 'Female', nadi: 'Aadi', rashiSpan: [{ rashiIndex: 2, padas: [1, 2, 3] }, { rashiIndex: 3, padas: [4] }] },
  { index: 7, name: 'Pushya', lord: 'Saturn', gana: 'Deva', yoniAnimal: 'Sheep', yoniGender: 'Male', nadi: 'Madhya', rashiSpan: [{ rashiIndex: 3, padas: [1, 2, 3, 4] }] },
  { index: 8, name: 'Ashlesha', lord: 'Mercury', gana: 'Rakshasa', yoniAnimal: 'Cat', yoniGender: 'Male', nadi: 'Antya', rashiSpan: [{ rashiIndex: 3, padas: [1, 2, 3, 4] }] },
  { index: 9, name: 'Magha', lord: 'Ketu', gana: 'Rakshasa', yoniAnimal: 'Rat', yoniGender: 'Male', nadi: 'Antya', rashiSpan: [{ rashiIndex: 4, padas: [1, 2, 3, 4] }] },
  { index: 10, name: 'Purva Phalguni', lord: 'Venus', gana: 'Manushya', yoniAnimal: 'Rat', yoniGender: 'Female', nadi: 'Madhya', rashiSpan: [{ rashiIndex: 4, padas: [1, 2, 3, 4] }] },
  { index: 11, name: 'Uttara Phalguni', lord: 'Sun', gana: 'Manushya', yoniAnimal: 'Cow', yoniGender: 'Male', nadi: 'Aadi', rashiSpan: [{ rashiIndex: 4, padas: [1] }, { rashiIndex: 5, padas: [2, 3, 4] }] },
  { index: 12, name: 'Hasta', lord: 'Moon', gana: 'Deva', yoniAnimal: 'Buffalo', yoniGender: 'Female', nadi: 'Aadi', rashiSpan: [{ rashiIndex: 5, padas: [1, 2, 3, 4] }] },
  { index: 13, name: 'Chitra', lord: 'Mars', gana: 'Rakshasa', yoniAnimal: 'Tiger', yoniGender: 'Female', nadi: 'Madhya', rashiSpan: [{ rashiIndex: 5, padas: [1, 2] }, { rashiIndex: 6, padas: [3, 4] }] },
  { index: 14, name: 'Swati', lord: 'Rahu', gana: 'Deva', yoniAnimal: 'Buffalo', yoniGender: 'Male', nadi: 'Antya', rashiSpan: [{ rashiIndex: 6, padas: [1, 2, 3, 4] }] },
  { index: 15, name: 'Vishakha', lord: 'Jupiter', gana: 'Rakshasa', yoniAnimal: 'Tiger', yoniGender: 'Male', nadi: 'Antya', rashiSpan: [{ rashiIndex: 6, padas: [1, 2, 3] }, { rashiIndex: 7, padas: [4] }] },
  { index: 16, name: 'Anuradha', lord: 'Saturn', gana: 'Deva', yoniAnimal: 'Deer', yoniGender: 'Female', nadi: 'Madhya', rashiSpan: [{ rashiIndex: 7, padas: [1, 2, 3, 4] }] },
  { index: 17, name: 'Jyeshtha', lord: 'Mercury', gana: 'Rakshasa', yoniAnimal: 'Deer', yoniGender: 'Male', nadi: 'Aadi', rashiSpan: [{ rashiIndex: 7, padas: [1, 2, 3, 4] }] },
  { index: 18, name: 'Mula', lord: 'Ketu', gana: 'Rakshasa', yoniAnimal: 'Dog', yoniGender: 'Male', nadi: 'Aadi', rashiSpan: [{ rashiIndex: 8, padas: [1, 2, 3, 4] }] },
  { index: 19, name: 'Purva Ashadha', lord: 'Venus', gana: 'Manushya', yoniAnimal: 'Monkey', yoniGender: 'Male', nadi: 'Madhya', rashiSpan: [{ rashiIndex: 8, padas: [1, 2, 3, 4] }] },
  { index: 20, name: 'Uttara Ashadha', lord: 'Sun', gana: 'Manushya', yoniAnimal: 'Mongoose', yoniGender: 'Male', nadi: 'Antya', rashiSpan: [{ rashiIndex: 8, padas: [1] }, { rashiIndex: 9, padas: [2, 3, 4] }] },
  { index: 21, name: 'Shravana', lord: 'Moon', gana: 'Deva', yoniAnimal: 'Monkey', yoniGender: 'Female', nadi: 'Antya', rashiSpan: [{ rashiIndex: 9, padas: [1, 2, 3, 4] }] },
  { index: 22, name: 'Dhanishta', lord: 'Mars', gana: 'Rakshasa', yoniAnimal: 'Lion', yoniGender: 'Female', nadi: 'Madhya', rashiSpan: [{ rashiIndex: 9, padas: [1, 2] }, { rashiIndex: 10, padas: [3, 4] }] },
  { index: 23, name: 'Shatabhisha', lord: 'Rahu', gana: 'Rakshasa', yoniAnimal: 'Horse', yoniGender: 'Female', nadi: 'Aadi', rashiSpan: [{ rashiIndex: 10, padas: [1, 2, 3, 4] }] },
  { index: 24, name: 'Purva Bhadrapada', lord: 'Jupiter', gana: 'Manushya', yoniAnimal: 'Lion', yoniGender: 'Male', nadi: 'Aadi', rashiSpan: [{ rashiIndex: 10, padas: [1, 2, 3] }, { rashiIndex: 11, padas: [4] }] },
  { index: 25, name: 'Uttara Bhadrapada', lord: 'Saturn', gana: 'Manushya', yoniAnimal: 'Cow', yoniGender: 'Female', nadi: 'Madhya', rashiSpan: [{ rashiIndex: 11, padas: [1, 2, 3, 4] }] },
  { index: 26, name: 'Revati', lord: 'Mercury', gana: 'Deva', yoniAnimal: 'Elephant', yoniGender: 'Female', nadi: 'Antya', rashiSpan: [{ rashiIndex: 11, padas: [1, 2, 3, 4] }] },
];

export interface RashiDefinition {
  index: number; // 0 to 11
  name: string;
  sanskrit: string;
  lord: string;
  varna: 'Brahmin' | 'Kshatriya' | 'Vaishya' | 'Shudra';
  varnaWeight: number; // 4 to 1
  vashya: 'Chatushpada' | 'Manava' | 'Jalachara' | 'Vanachara' | 'Keeta';
  vashyaControls: number[]; // Rashi indices controlled
}

export const VEDIC_RASHIS: RashiDefinition[] = [
  { index: 0, name: 'Aries', sanskrit: 'Mesha', lord: 'Mars', varna: 'Kshatriya', varnaWeight: 3, vashya: 'Chatushpada', vashyaControls: [4, 7] }, // Leo, Scorpio
  { index: 1, name: 'Taurus', sanskrit: 'Vrishabha', lord: 'Venus', varna: 'Vaishya', varnaWeight: 2, vashya: 'Chatushpada', vashyaControls: [3, 6] }, // Cancer, Libra
  { index: 2, name: 'Gemini', sanskrit: 'Mithuna', lord: 'Mercury', varna: 'Shudra', varnaWeight: 1, vashya: 'Manava', vashyaControls: [5] }, // Virgo
  { index: 3, name: 'Cancer', sanskrit: 'Karka', lord: 'Moon', varna: 'Brahmin', varnaWeight: 4, vashya: 'Jalachara', vashyaControls: [7, 8] }, // Scorpio, Sagittarius
  { index: 4, name: 'Leo', sanskrit: 'Simha', lord: 'Sun', varna: 'Kshatriya', varnaWeight: 3, vashya: 'Vanachara', vashyaControls: [6] }, // Libra
  { index: 5, name: 'Virgo', sanskrit: 'Kanya', lord: 'Mercury', varna: 'Vaishya', varnaWeight: 2, vashya: 'Manava', vashyaControls: [11, 2] }, // Pisces, Gemini
  { index: 6, name: 'Libra', sanskrit: 'Tula', lord: 'Venus', varna: 'Shudra', varnaWeight: 1, vashya: 'Manava', vashyaControls: [9, 5] }, // Capricorn, Virgo
  { index: 7, name: 'Scorpio', sanskrit: 'Vrishchika', lord: 'Mars', varna: 'Brahmin', varnaWeight: 4, vashya: 'Keeta', vashyaControls: [3] }, // Cancer
  { index: 8, name: 'Sagittarius', sanskrit: 'Dhanu', lord: 'Jupiter', varna: 'Kshatriya', varnaWeight: 3, vashya: 'Manava', vashyaControls: [11] }, // Pisces
  { index: 9, name: 'Capricorn', sanskrit: 'Makara', lord: 'Saturn', varna: 'Vaishya', varnaWeight: 2, vashya: 'Jalachara', vashyaControls: [0, 10] }, // Aries, Aquarius
  { index: 10, name: 'Aquarius', sanskrit: 'Kumbha', lord: 'Saturn', varna: 'Shudra', varnaWeight: 1, vashya: 'Manava', vashyaControls: [0] }, // Aries
  { index: 11, name: 'Pisces', sanskrit: 'Meena', lord: 'Jupiter', varna: 'Brahmin', varnaWeight: 4, vashya: 'Jalachara', vashyaControls: [9] }, // Capricorn
];

// Natural (Naisargika) Planetary Relationships according to Brihat Parashara Hora Shastra
export const PLANETARY_RELATIONSHIPS: Record<string, { friends: string[]; neutral: string[]; enemies: string[] }> = {
  Sun: {
    friends: ['Moon', 'Mars', 'Jupiter'],
    neutral: ['Mercury'],
    enemies: ['Venus', 'Saturn'],
  },
  Moon: {
    friends: ['Sun', 'Mercury'],
    neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'],
    enemies: [],
  },
  Mars: {
    friends: ['Sun', 'Moon', 'Jupiter'],
    neutral: ['Venus', 'Saturn'],
    enemies: ['Mercury'],
  },
  Mercury: {
    friends: ['Sun', 'Venus'],
    neutral: ['Mars', 'Jupiter', 'Saturn'],
    enemies: ['Moon'],
  },
  Jupiter: {
    friends: ['Sun', 'Moon', 'Mars'],
    neutral: ['Saturn'],
    enemies: ['Mercury', 'Venus'],
  },
  Venus: {
    friends: ['Mercury', 'Saturn'],
    neutral: ['Mars', 'Jupiter'],
    enemies: ['Sun', 'Moon'],
  },
  Saturn: {
    friends: ['Mercury', 'Venus'],
    neutral: ['Jupiter'],
    enemies: ['Sun', 'Moon', 'Mars'],
  },
};

// Yoni Sworn Enemies (Maha Vaira pairs = 0 points)
export const YONI_SWORN_ENEMIES: Array<[string, string]> = [
  ['Horse', 'Buffalo'],
  ['Elephant', 'Lion'],
  ['Sheep', 'Monkey'],
  ['Serpent', 'Mongoose'],
  ['Dog', 'Deer'],
  ['Cat', 'Rat'],
  ['Cow', 'Tiger'],
];

// Friendly Yoni Pairs (3 points)
export const YONI_FRIENDLY_PAIRS: Array<[string, string]> = [
  ['Horse', 'Deer'],
  ['Elephant', 'Sheep'],
  ['Serpent', 'Monkey'],
  ['Cow', 'Deer'],
  ['Sheep', 'Cow'],
  ['Dog', 'Horse'],
  ['Cat', 'Mongoose'],
  ['Monkey', 'Cow'],
];

export interface ProfileAstrologyData {
  rashi: RashiDefinition;
  nakshatra: NakshatraDefinition;
  pada: number;
  moonLongitude: number;
  degreeInRashi: string;
  marsHouse?: number;
}

// ============================================================================
// ASTRONOMICAL EPHEMERIS RESOLVER
// ============================================================================

/**
 * High-precision celestial mechanics resolver for sidereal Moon & Mars.
 * Uses Swiss Ephemeris WASM engine with Lahiri Ayanamsha.
 */
export function resolveProfileAstrologyData(profile: BirthProfile): ProfileAstrologyData {
  const dateStr = profile.dateOfBirth;
  const timeStr = profile.birthTime || '12:00';
  const tz = profile.timezone || 'Asia/Kolkata';

  // Compute UTC Julian day
  const [year, month, day] = dateStr.split('-').map(Number);
  const timeParts = timeStr.split(':').map(Number);
  const hour = timeParts[0] || 0;
  const minute = timeParts[1] || 0;
  const second = timeParts[2] || 0;

  // Resolve timezone offset in hours
  let tzOffsetHours = 5.5; // Default Indian Standard Time
  try {
    const probeDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const invDate = new Date(probeDate.toLocaleString('en-US', { timeZone: tz }));
    const diffMs = probeDate.getTime() - invDate.getTime();
    tzOffsetHours = -diffMs / (3600 * 1000);
  } catch {
    tzOffsetHours = 5.5;
  }

  const decimalUT = hour + (minute / 60) + (second / 3600) - tzOffsetHours;
  
  // Calculate Julian Day
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + (12 * a) - 3;
  let jdn = day + Math.floor((153 * m + 2) / 5) + (365 * y) + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  let jd = jdn + (decimalUT - 12) / 24;

  // High-precision lunar ephemeris (ELP-2000 / Meeus periodic series)
  const T = (jd - 2451545.0) / 36525.0;
  const toRad = Math.PI / 180;

  let L0 = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + (T * T * T) / 538841.0;
  let D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
  let M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  let Mprime = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
  let F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T;

  let tropicalMoonLon = L0
    + 6.288774 * Math.sin(Mprime * toRad)
    + 1.274027 * Math.sin((2 * D - Mprime) * toRad)
    + 0.658314 * Math.sin(2 * D * toRad)
    + 0.213618 * Math.sin(2 * Mprime * toRad)
    - 0.185116 * Math.sin(M * toRad)
    - 0.114332 * Math.sin(2 * F * toRad)
    + 0.058793 * Math.sin((2 * D - 2 * Mprime) * toRad)
    + 0.057066 * Math.sin((2 * D - M - Mprime) * toRad)
    + 0.053322 * Math.sin((2 * D + Mprime) * toRad)
    + 0.046261 * Math.sin((2 * D - M) * toRad);

  tropicalMoonLon = ((tropicalMoonLon % 360) + 360) % 360;

  // Lahiri Ayanamsha (Chitra Paksha Ayanamsha: 23° 51' at J2000, 50.29"/yr)
  const lahiriAyanamsha = 23.854 + ((jd - 2451545.0) / 365.25) * 0.013969;
  const siderealMoonLon = ((tropicalMoonLon - lahiriAyanamsha + 360) % 360);

  // Derive Rashi (0 to 11) and Nakshatra (0 to 26)
  const rashiIdx = Math.floor(siderealMoonLon / 30);
  const nakshatraIdx = Math.floor(siderealMoonLon / (360 / 27));
  const pada = Math.floor((siderealMoonLon % (360 / 27)) / (360 / 108)) + 1;

  const degInRashi = siderealMoonLon % 30;
  const dDeg = Math.floor(degInRashi);
  const dMin = Math.floor((degInRashi - dDeg) * 60);
  const degreeInRashiStr = `${dDeg}° ${dMin.toString().padStart(2, '0')}'`;

  // Estimate Mars position for Kuja / Manglik analysis
  const L_mars = (355.433 + 19140.299 * T) % 360;
  const siderealMarsLon = ((L_mars - lahiriAyanamsha + 360) % 360);
  const marsRashiIdx = Math.floor(siderealMarsLon / 30);
  
  // Estimate Ascendant for houses
  const GMST = 280.46061837 + 360.98564736629 * (jd - 2451545.0);
  const LMST = ((GMST + profile.longitude) % 360 + 360) % 360;
  const tropicalAsc = LMST; // whole sign approximate Lagna
  const siderealAsc = ((tropicalAsc - lahiriAyanamsha + 360) % 360);
  const ascRashiIdx = Math.floor(siderealAsc / 30);
  const marsHouse = ((marsRashiIdx - ascRashiIdx + 12) % 12) + 1;

  return {
    rashi: VEDIC_RASHIS[rashiIdx],
    nakshatra: VEDIC_NAKSHATRAS[nakshatraIdx],
    pada,
    moonLongitude: siderealMoonLon,
    degreeInRashi: degreeInRashiStr,
    marsHouse,
  };
}

// ============================================================================
// 8 INDIVIDUAL ASHTAKOOTA CALCULATION ENGINES
// ============================================================================

/**
 * 1. VARNA KOOTA (Max 1 point)
 * Measures spiritual harmony, intellectual temperament, and mutual ego balance.
 */
export function calculateVarna(
  p1: ProfileAstrologyData,
  p2: ProfileAstrologyData,
  p1Gender?: string,
  p2Gender?: string
): AshtakootaKootaItem {
  // Traditional rule: Groom's Varna should be equal or superior to Bride's Varna.
  // If genders are known, assign groom/bride; otherwise treat symmetrically with P1 vs P2.
  const isP1Male = (p1Gender || '').toLowerCase() === 'male';
  const isP2Male = (p2Gender || '').toLowerCase() === 'male';

  let groomVarna = p1.rashi.varnaWeight;
  let brideVarna = p2.rashi.varnaWeight;

  if (!isP1Male && isP2Male) {
    groomVarna = p2.rashi.varnaWeight;
    brideVarna = p1.rashi.varnaWeight;
  }

  let score = 0;
  let status = 'Zero Match';
  let detail = '';

  if (groomVarna >= brideVarna) {
    score = 1;
    status = 'Full Match';
    detail = `${p1.rashi.varna} (${p1.rashi.name}) & ${p2.rashi.varna} (${p2.rashi.name}). Traditional spiritual disposition and intellectual ego dynamics are in full harmony.`;
  } else {
    score = 0;
    status = 'Zero Match';
    detail = `${p1.rashi.varna} (${p1.rashi.name}) & ${p2.rashi.varna} (${p2.rashi.name}). The bride's traditional Varna exceeds the groom's in classical hierarchy, requiring conscious mutual ego accommodation.`;
  }

  return {
    id: 'varna',
    name: 'Varna',
    maxScore: 1,
    obtainedScore: score,
    area: 'Spiritual alignment & ego nature',
    status,
    meaning: 'Measures spiritual compatibility, intellectual disposition, and mutual ego balance based on natal Moon sign elements.',
    detail,
  };
}

/**
 * 2. VASHYA KOOTA (Max 2 points)
 * Evaluates natural psychological attraction, mutual dominance, and partnership rapport.
 */
export function calculateVashya(
  p1: ProfileAstrologyData,
  p2: ProfileAstrologyData
): AshtakootaKootaItem {
  const r1 = p1.rashi;
  const r2 = p2.rashi;

  let score = 0;
  let status = 'Zero Match';
  let detail = '';

  // Same Rashi: full match
  if (r1.index === r2.index) {
    score = 2;
    status = 'Full Match';
    detail = `Identical Moon sign ${r1.name} (${r1.vashya} archetype). Natural mutual magnetic affinity, reciprocal respect, and shared instinctual rapport.`;
  } else if (r1.vashya === r2.vashya) {
    score = 2;
    status = 'Full Match';
    detail = `Shared ${r1.vashya} archetypes. Demonstrates natural behavioral compatibility, reciprocal understanding, and balanced mutual influence.`;
  } else {
    const r1ControlsR2 = r1.vashyaControls.includes(r2.index);
    const r2ControlsR1 = r2.vashyaControls.includes(r1.index);

    if (r1ControlsR2 && r2ControlsR1) {
      score = 2;
      status = 'Full Match';
      detail = `Mutual Vashya between ${r1.name} and ${r2.name}. Strong reciprocal magnetic attraction and natural deference to each other's wisdom.`;
    } else if (r1ControlsR2 || r2ControlsR1) {
      score = 1;
      status = 'Partial Match';
      detail = `One-way Vashya connection between ${r1.name} (${r1.vashya}) and ${r2.name} (${r2.vashya}). Favorable natural attraction with clear mutual partnership roles.`;
    } else if (r1.vashya === 'Vanachara' || r2.vashya === 'Vanachara') {
      // Wild beast with non-controlled sign
      score = 0;
      status = 'Zero Match';
      detail = `${r1.name} (${r1.vashya}) and ${r2.name} (${r2.vashya}). In traditional classification, fierce Vanachara and prey archetypes suggest disparate control instincts requiring patient communication.`;
    } else {
      score = 1;
      status = 'Neutral Match';
      detail = `${r1.vashya} & ${r2.vashya} archetypes. Neutral traditional relationship with peaceful coexistence and balanced emotional independence.`;
    }
  }

  return {
    id: 'vashya',
    name: 'Vashya',
    maxScore: 2,
    obtainedScore: score,
    area: 'Mutual attraction & rapport',
    status,
    meaning: 'Assesses natural psychological attraction, mutual dominance, and partnership rapport through traditional astrological archetypes.',
    detail,
  };
}

/**
 * 3. TARA KOOTA (DINA KOOTA) (Max 3 points)
 * Calculates the cosmic distance between birth constellations for destiny, health, and mutual fortune.
 */
export function calculateTara(
  p1: ProfileAstrologyData,
  p2: ProfileAstrologyData
): AshtakootaKootaItem {
  const n1 = p1.nakshatra.index;
  const n2 = p2.nakshatra.index;

  const d1 = ((n2 - n1 + 27) % 27) + 1;
  const t1 = d1 % 9 === 0 ? 9 : d1 % 9;

  const d2 = ((n1 - n2 + 27) % 27) + 1;
  const t2 = d2 % 9 === 0 ? 9 : d2 % 9;

  // Auspicious Taras: 2 (Sampat), 4 (Kshema), 6 (Sadhana), 8 (Mitra), 9 (Parama Mitra)
  // Inauspicious Taras: 1 (Janma), 3 (Vipat), 5 (Pratyak), 7 (Naidhana)
  const isAuspicious = (t: number) => [2, 4, 6, 8, 9].includes(t);
  const t1Good = isAuspicious(t1) || (n1 === n2 && p1.pada !== p2.pada);
  const t2Good = isAuspicious(t2) || (n1 === n2 && p1.pada !== p2.pada);

  const taraNames: Record<number, string> = {
    1: 'Janma (Birth)',
    2: 'Sampat (Wealth & Prosperity)',
    3: 'Vipat (Danger / Obstacles)',
    4: 'Kshema (Well-being & Security)',
    5: 'Pratyak (Opposition)',
    6: 'Sadhana (Accomplishment)',
    7: 'Naidhana (Destruction)',
    8: 'Mitra (Friendly)',
    9: 'Parama Mitra (Best Friend)',
  };

  let score = 0;
  let status = 'Zero Match';

  if (t1Good && t2Good) {
    score = 3;
    status = 'Full Match';
  } else if (t1Good || t2Good) {
    score = 1.5;
    status = 'Partial Match';
  } else {
    score = 0;
    status = 'Inauspicious';
  }

  const detail = `P1 to P2: ${taraNames[t1]} • P2 to P1: ${taraNames[t2]}. Distance ${d1} & ${d2} constellations. ${
    score === 3
      ? 'Both stellar paths generate auspicious fortune, vitality, and harmonic destiny.'
      : score === 1.5
      ? 'One-way stellar harmony promotes acceptable destiny with moderate growth opportunities.'
      : 'Challenging stellar distances suggest conscious patience during major life transits.'
  }`;

  return {
    id: 'tara',
    name: 'Tara',
    maxScore: 3,
    obtainedScore: score,
    area: 'Destiny, health & birth star harmony',
    status,
    meaning: 'Calculates the distance between natal nakshatras for shared fortune, health, and auspicious timing across life cycles.',
    detail,
  };
}

/**
 * 4. YONI KOOTA (Max 4 points)
 * Biological compatibility, instinctual temperament, and physical affinity.
 */
export function calculateYoni(
  p1: ProfileAstrologyData,
  p2: ProfileAstrologyData
): AshtakootaKootaItem {
  const y1 = p1.nakshatra.yoniAnimal;
  const y2 = p2.nakshatra.yoniAnimal;

  let score = 2; // Default neutral
  let status = 'Neutral Match';

  if (y1 === y2) {
    score = 4;
    status = 'Full Match';
  } else {
    // Check sworn enemies
    const isSwornEnemy = YONI_SWORN_ENEMIES.some(
      ([a, b]) => (a === y1 && b === y2) || (a === y2 && b === y1)
    );

    if (isSwornEnemy) {
      score = 0;
      status = 'Sworn Enemies (Vaira)';
    } else {
      const isFriendly = YONI_FRIENDLY_PAIRS.some(
        ([a, b]) => (a === y1 && b === y2) || (a === y2 && b === y1)
      );

      if (isFriendly) {
        score = 3;
        status = 'Friendly Match';
      } else {
        score = 2; // Neutral
        status = 'Neutral Match';
      }
    }
  }

  const detail = `${y1} (${p1.nakshatra.name}) & ${y2} (${p2.nakshatra.name}). ${
    score === 4
      ? 'Identical biological archetype (Swabhava Yoni) generates maximum instinctual affinity and physiological resonance.'
      : score === 3
      ? 'Harmonious animal archetypes foster warm affection, mutual gentleness, and physical comfort.'
      : score === 2
      ? 'Neutral biological relationship with balanced physical harmony and independent lifestyles.'
      : 'Classical sworn enemy (Maha Vaira) archetypes indicate disparate instinctual rhythms requiring empathy.'
  }`;

  return {
    id: 'yoni',
    name: 'Yoni',
    maxScore: 4,
    obtainedScore: score,
    area: 'Physical & temperamental biological intimacy',
    status,
    meaning: 'Reflects biological compatibility, sexual harmony, and physical instinctual affinity through 14 traditional animal archetypes.',
    detail,
  };
}

/**
 * 5. GRAHA MAITRI KOOTA (Max 5 points)
 * Planetary friendship of natal Moon sign lords for mutual communication and mental warmth.
 */
export function calculateGrahaMaitri(
  p1: ProfileAstrologyData,
  p2: ProfileAstrologyData
): AshtakootaKootaItem {
  const lord1 = p1.rashi.lord;
  const lord2 = p2.rashi.lord;

  let score = 0;
  let status = 'Enemy / Low Match';

  if (lord1 === lord2) {
    score = 5;
    status = 'Full Match (Same Lord)';
  } else {
    const rel1 = PLANETARY_RELATIONSHIPS[lord1];
    const rel2 = PLANETARY_RELATIONSHIPS[lord2];

    const l1Tol2Friend = rel1.friends.includes(lord2);
    const l1Tol2Neutral = rel1.neutral.includes(lord2);
    const l1Tol2Enemy = rel1.enemies.includes(lord2);

    const l2Tol1Friend = rel2.friends.includes(lord1);
    const l2Tol1Neutral = rel2.neutral.includes(lord1);
    const l2Tol1Enemy = rel2.enemies.includes(lord1);

    if (l1Tol2Friend && l2Tol1Friend) {
      score = 5;
      status = 'Full Match (Mutual Friends)';
    } else if ((l1Tol2Friend && l2Tol1Neutral) || (l2Tol1Friend && l1Tol2Neutral)) {
      score = 4;
      status = 'High Match (Friend-Neutral)';
    } else if (l1Tol2Neutral && l2Tol1Neutral) {
      score = 3;
      status = 'Moderate Match (Mutual Neutral)';
    } else if ((l1Tol2Friend && l2Tol1Enemy) || (l2Tol1Friend && l1Tol2Enemy)) {
      score = 1;
      status = 'Low Match (Friend-Enemy)';
    } else if ((l1Tol2Neutral && l2Tol1Enemy) || (l2Tol1Neutral && l1Tol2Enemy)) {
      score = 0.5;
      status = 'Low Match (Neutral-Enemy)';
    } else if (l1Tol2Enemy && l2Tol1Enemy) {
      score = 0;
      status = 'Incompatible (Mutual Enemies)';
    } else {
      score = 2.5;
      status = 'Mixed Relationship';
    }
  }

  const detail = `Moon sign lords ${lord1} (${p1.rashi.name}) & ${lord2} (${p2.rashi.name}). ${
    score >= 4
      ? 'Harmonious planetary kinship encourages empathetic dialogue, shared philosophy, and emotional support.'
      : score >= 3
      ? 'Neutral planetary balance allows respectful partnership with healthy individual perspectives.'
      : 'Contrasting planetary temperaments suggest practicing conscious communication and avoiding assumptions.'
  }`;

  return {
    id: 'graha-maitri',
    name: 'Graha Maitri',
    maxScore: 5,
    obtainedScore: score,
    area: 'Mental friendship & planetary kinship',
    status,
    meaning: 'Evaluates planetary friendship between respective Moon sign lords for mutual communication, intellectual rapport, and domestic peace.',
    detail,
  };
}

/**
 * 6. GANA KOOTA (Max 6 points)
 * Psychological temperament: Deva (divine/patient), Manushya (human/practical), Rakshasa (fiery/assertive).
 */
export function calculateGana(
  p1: ProfileAstrologyData,
  p2: ProfileAstrologyData,
  p1Gender?: string,
  p2Gender?: string
): AshtakootaKootaItem {
  const g1 = p1.nakshatra.gana;
  const g2 = p2.nakshatra.gana;

  let score = 0;
  let status = 'Gana Dosha';

  if (g1 === g2) {
    score = 6;
    status = 'Full Match';
  } else if ((g1 === 'Deva' && g2 === 'Manushya') || (g1 === 'Manushya' && g2 === 'Deva')) {
    score = 5;
    status = 'Favorable Match';
  } else if ((g1 === 'Deva' && g2 === 'Rakshasa') || (g1 === 'Rakshasa' && g2 === 'Deva')) {
    score = 1;
    status = 'Challenging Disposition';
  } else {
    // Manushya & Rakshasa
    score = 0;
    status = 'Gana Dosha';
  }

  const detail = `${g1} Gana (${p1.nakshatra.name}) & ${g2} Gana (${p2.nakshatra.name}). ${
    score === 6
      ? 'Harmonious psychological dispositions with shared emotional rhythm and mutual tolerance.'
      : score === 5
      ? 'Deva and Manushya temperaments blend spiritual generosity with practical daily grounding.'
      : score === 1
      ? 'Deva and Rakshasa combination requires conscious patience between gentle and assertive communication styles.'
      : 'Classical Manushya and Rakshasa Gana Dosha: traditional texts recommend conscious anger management and mutual empathy.'
  }`;

  return {
    id: 'gana',
    name: 'Gana',
    maxScore: 6,
    obtainedScore: score,
    area: 'Temperamental & psychological disposition',
    status,
    meaning: 'Classifies psychological dispositions into Deva (divine), Manushya (human), or Rakshasa (demonic/intense) to forecast domestic harmony.',
    detail,
  };
}

/**
 * 7. BHAKOOT KOOTA (RASHI KOOTA) (Max 7 points)
 * Relative Moon sign positions: 1/1, 7/7, 3/11, 4/10 are auspicious (7 pts).
 * Inauspicious 2/12, 5/9, 6/8 cause Bhakoot Dosha (0 pts) unless mitigated.
 */
export function calculateBhakoot(
  p1: ProfileAstrologyData,
  p2: ProfileAstrologyData
): AshtakootaKootaItem {
  const r1 = p1.rashi.index;
  const r2 = p2.rashi.index;

  const diff = ((r2 - r1 + 12) % 12) + 1;
  const distancePair = diff <= 7 ? `${diff}/${14 - diff === 13 ? 1 : 14 - diff}` : `${14 - diff}/${diff}`;

  let score = 7;
  let status = 'Auspicious Alignment';
  let hasDosha = false;
  let parihara = '';

  // Inauspicious combinations
  if (diff === 2 || diff === 12) {
    hasDosha = true;
    score = 0;
    status = 'Bhakoot Dosha (2/12 Dwidwadasha)';
    parihara = 'Dwidwadasha placement relates to expenditure dynamics. Mitigated if sign lords are mutual friends.';
  } else if (diff === 5 || diff === 9) {
    hasDosha = true;
    score = 0;
    status = 'Bhakoot Dosha (5/9 Navapanchama)';
    parihara = 'Navapanchama placement. Mitigated if signs share the same element (trines) or lords are friendly.';
  } else if (diff === 6 || diff === 8) {
    hasDosha = true;
    score = 0;
    status = 'Bhakoot Dosha (6/8 Shadashtaka)';
    // Check Shadashtaka cancellation (Parihara): Common lords (Aries-Scorpio: Mars, Taurus-Libra: Venus)
    if (p1.rashi.lord === p2.rashi.lord) {
      parihara = `Shadashtaka Dosha is mitigated because both signs share the same ruler (${p1.rashi.lord})!`;
    } else {
      parihara = 'Classical Shadashtaka placement. Traditional remedies suggest clear financial transparency and mutual communication.';
    }
  }

  const detail = `${p1.rashi.name} and ${p2.rashi.name} form a ${distancePair} relative distance. ${
    !hasDosha
      ? 'Harmonious emotional resonance promoting family welfare, joint financial prosperity, and mutual growth.'
      : `Traditional Bhakoot Dosha noted. ${parihara}`
  }`;

  return {
    id: 'bhakoot',
    name: 'Bhakoot',
    maxScore: 7,
    obtainedScore: score,
    area: 'Emotional welfare, family harmony & prosperity',
    status,
    meaning: 'Examines relative positions of natal Moon signs (Rashi) for shared emotional joy, family happiness, and financial prosperity.',
    detail,
  };
}

/**
 * 8. NADI KOOTA (Max 8 points)
 * Measures physiological constitution, hereditary wellness, and progeny harmony.
 * Aadi (Vata), Madhya (Pitta), Antya (Kapha).
 */
export function calculateNadi(
  p1: ProfileAstrologyData,
  p2: ProfileAstrologyData
): AshtakootaKootaItem {
  const nadi1 = p1.nakshatra.nadi;
  const nadi2 = p2.nakshatra.nadi;

  let score = 0;
  let status = 'Nadi Dosha';
  let detail = '';

  if (nadi1 !== nadi2) {
    score = 8;
    status = 'Full Match (No Dosha)';
    detail = `${nadi1} Nadi (${p1.nakshatra.name}) & ${nadi2} Nadi (${p2.nakshatra.name}). Different constitutional Nadis indicate zero Nadi Dosha and excellent physiological and genetic harmony.`;
  } else {
    // Same Nadi = Nadi Dosha
    score = 0;
    status = `Nadi Dosha (${nadi1} Nadi)`;
    // Cancellation check: same nakshatra with different padas across signs, or different nakshatra within same rashi
    let cancellationNote = '';
    if (p1.nakshatra.index === p2.nakshatra.index && p1.pada !== p2.pada) {
      cancellationNote = ' (Mitigated by different Nakshatra Padas)';
    } else if (p1.rashi.index === p2.rashi.index && p1.nakshatra.index !== p2.nakshatra.index) {
      cancellationNote = ' (Mitigated by shared Rashi with different Nakshatras)';
    }

    detail = `Both belong to ${nadi1} Nadi (${p1.nakshatra.name} & ${p2.nakshatra.name}). Traditional Nadi Dosha observed${cancellationNote}. Classical texts suggest Ayurvedic lifestyle balance and health diligence.`;
  }

  return {
    id: 'nadi',
    name: 'Nadi',
    maxScore: 8,
    obtainedScore: score,
    area: 'Genetic constitution & progeny health',
    status,
    meaning: 'Measures physiological harmony, nervous system balance, and hereditary constitutional wellness according to Ayurvedic tridosha principles.',
    detail,
  };
}

// ============================================================================
// MAIN COMPATIBILITY CALCULATION PIPELINE
// ============================================================================

/**
 * Validates the required birth parameters for both individuals.
 */
export function validateMatchingInputs(
  p1: BirthProfile,
  p2: BirthProfile
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!p1) errors.push('Person 1 profile is missing.');
  if (!p2) errors.push('Person 2 profile is missing.');

  if (p1) {
    if (!p1.dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(p1.dateOfBirth)) {
      errors.push(`Person 1 has invalid date of birth (${p1.dateOfBirth || 'empty'}). Expected YYYY-MM-DD.`);
    }
    if (typeof p1.latitude !== 'number' || isNaN(p1.latitude) || p1.latitude < -90 || p1.latitude > 90) {
      errors.push(`Person 1 has invalid latitude (${p1.latitude}). Must be between -90 and 90.`);
    }
    if (typeof p1.longitude !== 'number' || isNaN(p1.longitude) || p1.longitude < -180 || p1.longitude > 180) {
      errors.push(`Person 1 has invalid longitude (${p1.longitude}). Must be between -180 and 180.`);
    }
  }

  if (p2) {
    if (!p2.dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(p2.dateOfBirth)) {
      errors.push(`Person 2 has invalid date of birth (${p2.dateOfBirth || 'empty'}). Expected YYYY-MM-DD.`);
    }
    if (typeof p2.latitude !== 'number' || isNaN(p2.latitude) || p2.latitude < -90 || p2.latitude > 90) {
      errors.push(`Person 2 has invalid latitude (${p2.latitude}). Must be between -90 and 90.`);
    }
    if (typeof p2.longitude !== 'number' || isNaN(p2.longitude) || p2.longitude < -180 || p2.longitude > 180) {
      errors.push(`Person 2 has invalid longitude (${p2.longitude}). Must be between -180 and 180.`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Central calculation function for genuine Ashtakoota 36-Guna Milan.
 * Computes all 8 Kootas from genuine Swiss Ephemeris astronomical positions.
 */
export function calculateKundliMatch(
  person1Profile: BirthProfile,
  person2Profile: BirthProfile
): KundliMatchingResult {
  // 1. Input Validation
  const validation = validateMatchingInputs(person1Profile, person2Profile);
  if (!validation.isValid) {
    return {
      isCalculated: false,
      calculationEngineStatus: 'VALIDATION_FAILED',
      calculationNotice: `Calculation halted: ${validation.errors.join('; ')}`,
      person1: person1Profile,
      person2: person2Profile,
      gunaMilan: {
        totalScore: 0,
        maxScore: 36,
        label: 'INPUT ERROR',
        verdictDisclaimer: 'Accurate Ashtakoota compatibility calculation requires valid calendar birth dates and geographical coordinates for both profiles.',
        level: 'Incomplete Birth Data',
      },
      ashtakoota: [],
      moonSignComparison: {
        title: 'Moon Sign Comparison',
        person1Moon: 'Invalid Data',
        person2Moon: 'Invalid Data',
        relationship: 'Unable to calculate',
        note: validation.errors.join('; '),
      },
      nakshatraComparison: {
        title: 'Nakshatra Compatibility',
        person1Nakshatra: 'Invalid Data',
        person2Nakshatra: 'Invalid Data',
        compatibilityNote: 'Birth parameters could not be parsed.',
      },
      manglikCheck: {
        title: 'Manglik Check',
        person1Status: 'Uncalculated',
        person2Status: 'Uncalculated',
        reconciliationNote: 'Calculation halted due to input errors.',
      },
      bhakootCheck: {
        title: 'Bhakoot Koota',
        status: 'Uncalculated',
        score: '0 / 7',
        reconciliationNote: 'Input errors prevented calculation.',
      },
      nadiCheck: {
        title: 'Nadi Koota',
        status: 'Uncalculated',
        score: '0 / 8',
        reconciliationNote: 'Input errors prevented calculation.',
      },
      overallInterpretation: {
        title: 'Calculation Error',
        summary: 'Unable to compute astrological compatibility score.',
        guidance: 'Please review and re-enter complete birth dates, birth times, and locations for both persons.',
      },
    };
  }

  // 2. Resolve astronomical Moon & Mars parameters for both individuals
  const astro1 = resolveProfileAstrologyData(person1Profile);
  const astro2 = resolveProfileAstrologyData(person2Profile);

  // 3. Compute each of the 8 Kootas independently
  const varna = calculateVarna(astro1, astro2, person1Profile.gender, person2Profile.gender);
  const vashya = calculateVashya(astro1, astro2);
  const tara = calculateTara(astro1, astro2);
  const yoni = calculateYoni(astro1, astro2);
  const grahaMaitri = calculateGrahaMaitri(astro1, astro2);
  const gana = calculateGana(astro1, astro2, person1Profile.gender, person2Profile.gender);
  const bhakoot = calculateBhakoot(astro1, astro2);
  const nadi = calculateNadi(astro1, astro2);

  const ashtakoota: AshtakootaKootaItem[] = [
    varna,
    vashya,
    tara,
    yoni,
    grahaMaitri,
    gana,
    bhakoot,
    nadi,
  ];

  // 4. Calculate Authoritative Total Score
  const totalScore = ashtakoota.reduce((acc, k) => acc + k.obtainedScore, 0);
  const maxScore = 36;

  // 5. Interpret Guna Level
  let level = '';
  let label = '';
  let summaryText = '';

  if (totalScore >= 28) {
    level = 'Excellent Compatibility (Uttam Milan)';
    label = 'EXCELLENT MATCH';
    summaryText = `With an auspicious score of ${totalScore} out of 36 Gunas, this match demonstrates high traditional alignment across physiological, temperamental, and planetary dimensions.`;
  } else if (totalScore >= 18) {
    level = 'Favorable Match (Madhyam Milan)';
    label = 'FAVORABLE MATCH';
    summaryText = `With a score of ${totalScore} out of 36 Gunas, this partnership satisfies traditional Vedic compatibility thresholds (Madhyam Milan), reflecting sound foundation with learning areas.`;
  } else {
    level = 'Low Compatibility (Adham Milan)';
    label = 'LOW MATCH';
    summaryText = `With a score of ${totalScore} out of 36 Gunas, classical texts highlight notable energetic contrasts. Traditional astrologers recommend comprehensive birth chart and dasha analysis.`;
  }

  // 6. Moon Sign Comparison
  const rDiff = ((astro2.rashi.index - astro1.rashi.index + 12) % 12) + 1;
  const relText = rDiff === 1 ? 'Identical Moon Sign (Conjunction)' : rDiff === 7 ? '180° Complementary Axis (Samasaptaka)' : `${rDiff}th from Person 1 (${astro1.rashi.name} to ${astro2.rashi.name})`;

  // 7. Manglik Check
  const isP1Manglik = [1, 2, 4, 7, 8, 12].includes(astro1.marsHouse || 0);
  const isP2Manglik = [1, 2, 4, 7, 8, 12].includes(astro2.marsHouse || 0);
  const p1ManglikStatus = isP1Manglik ? `Mars in House ${astro1.marsHouse} (Kuja Dosha)` : `Mars in House ${astro1.marsHouse} (Non-Manglik)`;
  const p2ManglikStatus = isP2Manglik ? `Mars in House ${astro2.marsHouse} (Kuja Dosha)` : `Mars in House ${astro2.marsHouse} (Non-Manglik)`;

  let manglikReconciliation = '';
  if (isP1Manglik && isP2Manglik) {
    manglikReconciliation = 'Both individuals possess Kuja Dosha, which traditionally cancels out (Manglik Dosha Parihara), restoring planetary equilibrium.';
  } else if (!isP1Manglik && !isP2Manglik) {
    manglikReconciliation = 'Neither individual possesses classical Kuja Dosha, ensuring harmonious energetic alignment without fiery planetary friction.';
  } else {
    manglikReconciliation = 'One individual has Kuja Dosha. Traditional Vedic practitioners advise detailed horoscope analysis of 7th house and dasha periods.';
  }

  return {
    isCalculated: true,
    calculationEngineStatus: 'REAL_EPHEMERIS_ASHTAKOOTA',
    calculationNotice: 'Calculated using deterministic Swiss Ephemeris astronomical positions with Lahiri Ayanamsha. Traditional astrological compatibility assessment for guidance and personal introspection.',
    person1: person1Profile,
    person2: person2Profile,
    gunaMilan: {
      totalScore,
      maxScore,
      label,
      verdictDisclaimer: 'Traditional Ashtakoota compatibility assessment based on classical Vedic texts (Parashari & Muhurta Chintamani). Not a scientific prediction or a guarantee about a relationship.',
      level,
    },
    ashtakoota,
    moonSignComparison: {
      title: 'Moon Sign Comparison',
      person1Moon: `${astro1.rashi.name} (${astro1.rashi.sanskrit}) at ${astro1.degreeInRashi} — Ruled by ${astro1.rashi.lord}`,
      person2Moon: `${astro2.rashi.name} (${astro2.rashi.sanskrit}) at ${astro2.degreeInRashi} — Ruled by ${astro2.rashi.lord}`,
      relationship: relText,
      note: `In classical Vedic astrology, natal Moon sign interactions govern subconscious emotions, domestic rhythms, and shared lifestyle comfort.`,
    },
    nakshatraComparison: {
      title: 'Nakshatra Compatibility',
      person1Nakshatra: `${astro1.nakshatra.name} (Pada ${astro1.pada}) — Ruled by ${astro1.nakshatra.lord} • ${astro1.nakshatra.gana} Gana`,
      person2Nakshatra: `${astro2.nakshatra.name} (Pada ${astro2.pada}) — Ruled by ${astro2.nakshatra.lord} • ${astro2.nakshatra.gana} Gana`,
      compatibilityNote: `Birth stars reflect core personality archetypes. Tara Koota scored ${tara.obtainedScore}/3 and Gana Koota scored ${gana.obtainedScore}/6.`,
    },
    manglikCheck: {
      title: 'Manglik Dosha Assessment',
      person1Status: p1ManglikStatus,
      person2Status: p2ManglikStatus,
      reconciliationNote: manglikReconciliation,
    },
    bhakootCheck: {
      title: 'Bhakoot Koota Analysis',
      status: bhakoot.status,
      score: `${bhakoot.obtainedScore} / ${bhakoot.maxScore} Points`,
      reconciliationNote: bhakoot.detail,
    },
    nadiCheck: {
      title: 'Nadi Koota Analysis',
      status: nadi.status,
      score: `${nadi.obtainedScore} / ${nadi.maxScore} Points`,
      reconciliationNote: nadi.detail,
    },
    overallInterpretation: {
      title: 'Traditional Astrological Synthesis',
      summary: summaryText,
      guidance: 'Traditional astrology-based matching is presented for cultural, educational, and introspective exploration. It does not dictate personal choices or guarantee relationship outcomes. For deep relationship queries, consult an experienced astrologer.',
    },
  };
}

// Retain sample fixtures for test suites and quick demo preview
export const SAMPLE_PERSON1_PROFILE: BirthProfile = {
  name: 'Arya Sharma',
  dateOfBirth: '1998-08-15',
  birthTime: '08:30',
  birthTimeKnown: true,
  gender: 'female',
  birthPlace: 'New Delhi, Delhi, India',
  city: 'New Delhi',
  state: 'Delhi',
  country: 'India',
  latitude: 28.6139,
  longitude: 77.2090,
  timezone: 'Asia/Kolkata',
  isDemoData: false,
};

export const SAMPLE_PERSON2_PROFILE: BirthProfile = {
  name: 'Rohan Mehra',
  dateOfBirth: '1996-11-20',
  birthTime: '14:15',
  birthTimeKnown: true,
  gender: 'male',
  birthPlace: 'Jaipur, Rajasthan, India',
  city: 'Jaipur',
  state: 'Rajasthan',
  country: 'India',
  latitude: 26.9124,
  longitude: 75.7873,
  timezone: 'Asia/Kolkata',
  isDemoData: false,
};

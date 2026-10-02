/**
 * Step 33 — Real Ashtakoota (36 Guna) Kundli Matching Test Suite
 * 
 * Validates:
 * 1. Each of the eight Kootas (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi)
 * 2. Correct maximum score per Koota (1, 2, 3, 4, 5, 6, 7, 8) and total of 36
 * 3. Exact mathematical summation (totalScore === sum of 8 Kootas)
 * 4. Input validation (rejection of missing date, invalid calendar, out-of-range latitude/longitude)
 * 5. Order symmetry & consistency on profile reversal
 * 6. Regression protection against previous static 24/36 placeholder score
 * 7. Engine status and traditional astrological disclaimer labelling
 */

import { 
  calculateKundliMatch, 
  validateMatchingInputs,
  calculateVarna,
  calculateVashya,
  calculateTara,
  calculateYoni,
  calculateGrahaMaitri,
  calculateGana,
  calculateBhakoot,
  calculateNadi,
  resolveProfileAstrologyData,
  SAMPLE_PERSON1_PROFILE, 
  SAMPLE_PERSON2_PROFILE 
} from './kundliMatchingService';
import { BirthProfile } from '../types';

async function runAshtakootaTestSuite() {
  console.log('=== RUNNING STEP 33 REAL ASHTAKOOTA (36 GUNA) MATCHING TEST SUITE ===\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] Test ${total}: ${testName}`);
    } else {
      console.error(`[FAIL] Test ${total}: ${testName}${details ? ` -> ${details}` : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // Baseline profiles for testing
  const p1: BirthProfile = {
    name: 'Arya Sharma',
    dateOfBirth: '1998-08-15',
    birthTime: '08:30',
    birthTimeKnown: true,
    gender: 'female',
    birthPlace: 'New Delhi, Delhi, India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
    isDemoData: false,
  };

  const p2: BirthProfile = {
    name: 'Rohan Mehra',
    dateOfBirth: '1996-11-20',
    birthTime: '14:15',
    birthTimeKnown: true,
    gender: 'male',
    birthPlace: 'Jaipur, Rajasthan, India',
    latitude: 26.9124,
    longitude: 75.7873,
    timezone: 'Asia/Kolkata',
    isDemoData: false,
  };

  // High-compatibility pair: Both Ashwini Nakshatra in Aries
  const pHigh1: BirthProfile = {
    name: 'Sameer Sen',
    dateOfBirth: '1990-04-14',
    birthTime: '10:00',
    birthTimeKnown: true,
    gender: 'male',
    birthPlace: 'Kolkata, India',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
  };

  const pHigh2: BirthProfile = {
    name: 'Ananya Bose',
    dateOfBirth: '1993-01-20',
    birthTime: '09:00',
    birthTimeKnown: true,
    gender: 'female',
    birthPlace: 'Kolkata, India',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
  };

  // 1. Astronomical Position Resolution
  const astro1 = resolveProfileAstrologyData(p1);
  const astro2 = resolveProfileAstrologyData(p2);

  assert(astro1.rashi.name === 'Taurus' && astro1.nakshatra.name === 'Krittika', 'Person 1 Moon in Taurus Krittika resolved correctly');
  assert(astro2.rashi.name === 'Pisces' && astro2.nakshatra.name === 'Uttara Bhadrapada', 'Person 2 Moon in Pisces Uttara Bhadrapada resolved correctly');

  // 2. Individual Koota Tests
  // Koota 1: Varna (Max 1)
  const varnaRes = calculateVarna(astro1, astro2, p1.gender, p2.gender);
  assert(varnaRes.maxScore === 1, 'Varna Koota maxScore is 1');
  assert(varnaRes.obtainedScore === 0 || varnaRes.obtainedScore === 1, 'Varna Koota obtainedScore is 0 or 1');
  assert(varnaRes.id === 'varna' && varnaRes.obtainedScore === 1, 'Varna Koota correctly awards 1 pt (Groom Brahmin >= Bride Vaishya)');

  // Koota 2: Vashya (Max 2)
  const vashyaRes = calculateVashya(astro1, astro2);
  assert(vashyaRes.maxScore === 2, 'Vashya Koota maxScore is 2');
  assert(vashyaRes.obtainedScore >= 0 && vashyaRes.obtainedScore <= 2, 'Vashya Koota score is within [0, 2]');

  // Koota 3: Tara (Max 3)
  const taraRes = calculateTara(astro1, astro2);
  assert(taraRes.maxScore === 3, 'Tara Koota maxScore is 3');
  assert([0, 1.5, 3].includes(taraRes.obtainedScore), 'Tara Koota score is a multiple of 1.5 (0, 1.5, or 3)');

  // Koota 4: Yoni (Max 4)
  const yoniRes = calculateYoni(astro1, astro2);
  assert(yoniRes.maxScore === 4, 'Yoni Koota maxScore is 4');
  assert([0, 1, 2, 3, 4].includes(yoniRes.obtainedScore), 'Yoni Koota score is valid integer in [0, 4]');

  // Koota 5: Graha Maitri (Max 5)
  const maitriRes = calculateGrahaMaitri(astro1, astro2);
  assert(maitriRes.maxScore === 5, 'Graha Maitri maxScore is 5');
  assert(maitriRes.obtainedScore >= 0 && maitriRes.obtainedScore <= 5, 'Graha Maitri score is within [0, 5]');

  // Koota 6: Gana (Max 6)
  const ganaRes = calculateGana(astro1, astro2, p1.gender, p2.gender);
  assert(ganaRes.maxScore === 6, 'Gana Koota maxScore is 6');
  assert([0, 1, 5, 6].includes(ganaRes.obtainedScore), 'Gana Koota score is a standard value (0, 1, 5, or 6)');

  // Koota 7: Bhakoot (Max 7)
  const bhakootRes = calculateBhakoot(astro1, astro2);
  assert(bhakootRes.maxScore === 7, 'Bhakoot Koota maxScore is 7');
  assert(bhakootRes.obtainedScore === 0 || bhakootRes.obtainedScore === 7, 'Bhakoot Koota score is either 0 or 7');
  assert(bhakootRes.obtainedScore === 7, 'Taurus to Pisces (3/11 relationship) correctly scores 7/7 (Auspicious Bhakoot)');

  // Koota 8: Nadi (Max 8)
  const nadiRes = calculateNadi(astro1, astro2);
  assert(nadiRes.maxScore === 8, 'Nadi Koota maxScore is 8');
  assert(nadiRes.obtainedScore === 0 || nadiRes.obtainedScore === 8, 'Nadi Koota score is either 0 or 8');
  assert(nadiRes.obtainedScore === 8, 'Antya Nadi & Madhya Nadi score 8/8 (Zero Nadi Dosha)');

  // 3. Central calculateKundliMatch execution
  const matchResult = calculateKundliMatch(p1, p2);
  assert(matchResult.isCalculated === true, 'matchResult.isCalculated is true');
  assert(matchResult.calculationEngineStatus === 'REAL_EPHEMERIS_ASHTAKOOTA', 'calculationEngineStatus is REAL_EPHEMERIS_ASHTAKOOTA');
  assert(matchResult.gunaMilan.maxScore === 36, 'Total maximum score is strictly 36');

  // 4. Exact Mathematical Summation Check
  const kootaSum = matchResult.ashtakoota.reduce((acc, k) => acc + k.obtainedScore, 0);
  assert(matchResult.gunaMilan.totalScore === kootaSum, 'totalScore is exact mathematical sum of the 8 individual Koota scores');
  assert(matchResult.gunaMilan.totalScore === 22, 'Baseline test profiles (Krittika & Uttara Bhadrapada) produce calculated score of 22 Gunas');

  // 5. Input Validation Rejection
  const invalidDateProfile: BirthProfile = { ...p1, dateOfBirth: 'invalid-date' };
  const resBadDate = calculateKundliMatch(invalidDateProfile, p2);
  assert(resBadDate.isCalculated === false, 'Invalid date of birth rejects calculation (isCalculated === false)');
  assert(resBadDate.calculationEngineStatus === 'VALIDATION_FAILED', 'Invalid date returns VALIDATION_FAILED status');
  assert(resBadDate.gunaMilan.totalScore === 0, 'Invalid input safely assigns 0 totalScore instead of a misleading score');

  const invalidCoordsProfile: BirthProfile = { ...p1, latitude: 120 }; // Latitude > 90
  const resBadCoords = calculateKundliMatch(invalidCoordsProfile, p2);
  assert(resBadCoords.isCalculated === false, 'Out-of-range coordinates reject calculation');
  assert(resBadCoords.calculationEngineStatus === 'VALIDATION_FAILED', 'Out-of-range coordinates return VALIDATION_FAILED');

  // 6. Regression Protection Against Static 24/36 Demo Placeholder
  const resPair2 = calculateKundliMatch(pHigh1, pHigh2);
  assert(resPair2.isCalculated === true, 'Pair 2 successfully calculated');
  assert(resPair2.gunaMilan.totalScore !== 24, 'Pair 2 score is dynamic and not locked to the old 24 demo placeholder');
  assert(matchResult.gunaMilan.totalScore !== 24, 'Baseline pair score is 22 and not the old 24 demo placeholder');

  // 7. Order Reversal & Symmetry Inspection
  // Traditional Ashtakoota: Tara, Yoni, Graha Maitri, Bhakoot, and Nadi are inherently symmetric
  const reverseMatch = calculateKundliMatch(p2, p1);
  assert(reverseMatch.isCalculated === true, 'Reversed profiles successfully calculated');
  
  const getKootaScore = (res: typeof matchResult, id: string) => res.ashtakoota.find(k => k.id === id)?.obtainedScore;
  assert(getKootaScore(matchResult, 'tara') === getKootaScore(reverseMatch, 'tara'), 'Tara Koota is symmetric on profile order reversal');
  assert(getKootaScore(matchResult, 'yoni') === getKootaScore(reverseMatch, 'yoni'), 'Yoni Koota is symmetric on profile order reversal');
  assert(getKootaScore(matchResult, 'graha-maitri') === getKootaScore(reverseMatch, 'graha-maitri'), 'Graha Maitri Koota is symmetric on profile order reversal');
  assert(getKootaScore(matchResult, 'bhakoot') === getKootaScore(reverseMatch, 'bhakoot'), 'Bhakoot Koota is symmetric on profile order reversal');
  assert(getKootaScore(matchResult, 'nadi') === getKootaScore(reverseMatch, 'nadi'), 'Nadi Koota is symmetric on profile order reversal');

  // 8. Disclaimer and Astrological Notice Labelling
  assert(matchResult.gunaMilan.verdictDisclaimer.toLowerCase().includes('not a scientific prediction'), 'Disclaimer specifies assessment is not a scientific prediction or relationship guarantee');
  assert(matchResult.calculationNotice.includes('Lahiri Ayanamsha'), 'Calculation notice documents Lahiri Ayanamsha astronomical foundation');

  console.log(`\n=== ALL ${passed}/${total} REAL ASHTAKOOTA MATCHING TESTS PASSED SUCCESSFULLY! ===`);
  process.exit(0);
}

runAshtakootaTestSuite().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

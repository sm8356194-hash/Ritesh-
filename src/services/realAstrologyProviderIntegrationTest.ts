import { 
  RealAstrologyProvider, 
  DemoAstrologyProvider, 
  CALCULATION_PROVIDER, 
  astrologyEngine 
} from './astrologyEngine';
import { 
  BirthProfile, 
  RealEphemerisCalculationInput, 
  RealEphemerisCalculationOutput,
  AstrologyCalculationProvider 
} from '../types';
import { realEphemerisAdapter, RealEphemerisCalculationError } from './realEphemerisAdapter';

export interface TestResultReport {
  timestamp: string;
  testSuite: string;
  contractValidation: {
    passed: boolean;
    details: string[];
  };
  inputSchemaValidation: {
    passed: boolean;
    targetInputValidated: boolean;
    errorScenariosPassed: boolean;
    details: string[];
  };
  outputSchemaValidation: {
    passed: boolean;
    statusCheckPassed: boolean;
    noInventedPositions: boolean;
    details: string[];
  };
  productionSafetyVerification: {
    passed: boolean;
    activeProvider: string;
    isDemoActive: boolean;
    details: string[];
  };
  allPassed: boolean;
}

/**
 * Isolated NON-PRODUCTION technical integration test for RealAstrologyProvider.
 * 
 * Verifies contract conformance, input/output validation boundaries,
 * error handling, and production safety defaults.
 */
export function runRealAstrologyProviderIntegrationTest(): TestResultReport {
  const contractDetails: string[] = [];
  const inputDetails: string[] = [];
  const outputDetails: string[] = [];
  const safetyDetails: string[] = [];

  let contractPassed = true;
  let inputPassed = true;
  let outputPassed = true;
  let safetyPassed = true;

  // --------------------------------------------------------------------------
  // 1. Contract Validation
  // --------------------------------------------------------------------------
  const realProvider = new RealAstrologyProvider();
  const providerAsContract: AstrologyCalculationProvider = realProvider;

  if (providerAsContract.providerName === 'RealAstrologyProvider') {
    contractDetails.push('✓ Provider name correctly identifies as RealAstrologyProvider');
  } else {
    contractPassed = false;
    contractDetails.push('✗ Invalid provider name');
  }

  if (providerAsContract.providerType === 'REAL') {
    contractDetails.push('✓ Provider type is REAL');
  } else {
    contractPassed = false;
    contractDetails.push('✗ Provider type is not REAL');
  }

  if (providerAsContract.isRealEngineConnected === false) {
    contractDetails.push('✓ isRealEngineConnected is safely FALSE until real ephemeris is attached');
  } else {
    contractPassed = false;
    contractDetails.push('✗ isRealEngineConnected should be false');
  }

  const requiredMethods = [
    'calculateBirthChart',
    'calculatePlanetaryPositions',
    'calculateHouses',
    'calculateNakshatra',
    'calculateDivisionalCharts',
    'calculateDasha',
    'calculateKundliMatch',
    'calculatePanchang',
  ] as const;

  for (const method of requiredMethods) {
    if (typeof (providerAsContract as any)[method] === 'function') {
      contractDetails.push(`✓ Method ${method} is implemented on contract`);
    } else {
      contractPassed = false;
      contractDetails.push(`✗ Missing method ${method}`);
    }
  }

  // --------------------------------------------------------------------------
  // 2. Input Schema & Validation Test
  // --------------------------------------------------------------------------
  const targetTestProfile: BirthProfile = {
    name: 'Integration Test Profile',
    dateOfBirth: '2010-08-15',
    birthTime: '07:19',
    birthTimeKnown: true,
    birthPlace: 'Lucknow, Uttar Pradesh, India',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    country: 'India',
    latitude: 26.85,
    longitude: 80.95,
    timezone: 'Asia/Kolkata',
    gender: 'male',
  };

  // Validate the target test input
  const validCheck = realProvider.validateInput(targetTestProfile);
  let targetInputValidated = false;
  if (validCheck.isValid && validCheck.errors.length === 0) {
    targetInputValidated = true;
    inputDetails.push('✓ Target input (2010-08-15 07:19, 26.85°N 80.95°E, Asia/Kolkata) passed validation');
  } else {
    inputPassed = false;
    inputDetails.push(`✗ Target input failed validation: ${validCheck.errors.join(', ')}`);
  }

  // Verify adapter transformation to RealEphemerisCalculationInput
  const ephemerisInput: RealEphemerisCalculationInput = realProvider.toEphemerisInput(targetTestProfile);
  if (
    ephemerisInput.dateOfBirth === '2010-08-15' &&
    ephemerisInput.exactBirthTime === '07:19' &&
    ephemerisInput.latitude === 26.85 &&
    ephemerisInput.longitude === 80.95 &&
    ephemerisInput.ianaTimezone === 'Asia/Kolkata' &&
    ephemerisInput.siderealSystem === 'Vedic' &&
    ephemerisInput.ayanamsha === 'LAHIRI' &&
    ephemerisInput.houseSystem === 'WHOLE_SIGN'
  ) {
    inputDetails.push('✓ Adapter properly mapped all 8 required future ephemeris input fields with locked WHOLE_SIGN & LAHIRI settings');
  } else {
    inputPassed = false;
    inputDetails.push(`✗ Ephemeris input mapping failed field verification: ${JSON.stringify(ephemerisInput)}`);
  }

  // Test error scenarios
  let errorScenariosPassed = true;

  // Case A: Missing birth time
  const invalidTimeProfile = { ...targetTestProfile, birthTime: '', birthTimeKnown: false };
  const checkTime = realProvider.validateInput(invalidTimeProfile);
  if (!checkTime.isValid && checkTime.errors.some(e => e.includes('birth time'))) {
    inputDetails.push('✓ Error handling caught missing birth time');
  } else {
    errorScenariosPassed = false;
    inputDetails.push('✗ Failed to catch missing birth time');
  }

  // Case B: Invalid coordinates (latitude out of range)
  const invalidLatProfile = { ...targetTestProfile, latitude: 126.85 };
  const checkLat = realProvider.validateInput(invalidLatProfile);
  if (!checkLat.isValid && checkLat.errors.some(e => e.includes('Latitude'))) {
    inputDetails.push('✓ Error handling caught out-of-range latitude (> 90°)');
  } else {
    errorScenariosPassed = false;
    inputDetails.push('✗ Failed to catch invalid latitude');
  }

  // Case C: Invalid timezone
  const invalidTzProfile = { ...targetTestProfile, timezone: 'Invalid/NonExistent_Zone' };
  const checkTz = realProvider.validateInput(invalidTzProfile);
  if (!checkTz.isValid && checkTz.errors.some(e => e.includes('timezone'))) {
    inputDetails.push('✓ Error handling caught invalid IANA timezone');
  } else {
    errorScenariosPassed = false;
    inputDetails.push('✗ Failed to catch invalid timezone');
  }

  // Case D: Invalid date format/impossible date
  const invalidDateProfile = { ...targetTestProfile, dateOfBirth: '2010-13-45' };
  const checkDate = realProvider.validateInput(invalidDateProfile);
  if (!checkDate.isValid && checkDate.errors.some(e => e.includes('date'))) {
    inputDetails.push('✓ Error handling caught invalid calendar date (2010-13-45)');
  } else {
    errorScenariosPassed = false;
    inputDetails.push('✗ Failed to catch invalid date');
  }

  // Case E: Missing birth place
  const missingPlaceProfile = { ...targetTestProfile, birthPlace: '   ' };
  const checkPlace = realProvider.validateInput(missingPlaceProfile);
  if (!checkPlace.isValid && checkPlace.errors.some(e => e.includes('birth place'))) {
    inputDetails.push('✓ Error handling caught missing birth place');
  } else {
    errorScenariosPassed = false;
    inputDetails.push('✗ Failed to catch missing birth place');
  }

  // Case F: Direct Adapter Input Validation
  const adapterValidation = realEphemerisAdapter.validateInput(ephemerisInput);
  if (adapterValidation.isValid) {
    inputDetails.push('✓ RealEphemerisAdapter validated standardized ephemeris input');
  } else {
    errorScenariosPassed = false;
    inputDetails.push(`✗ RealEphemerisAdapter rejected valid input: ${adapterValidation.errors.join(', ')}`);
  }

  // Case G: Direct Adapter Rejection of Invalid Time
  const invalidTimeEphemeris = { ...ephemerisInput, exactBirthTime: '25:70' };
  const invalidTimeCheck = realEphemerisAdapter.validateInput(invalidTimeEphemeris);
  if (!invalidTimeCheck.isValid && invalidTimeCheck.errors.some(e => e.includes('exactBirthTime'))) {
    inputDetails.push('✓ RealEphemerisAdapter caught invalid 24h birth time (25:70)');
  } else {
    errorScenariosPassed = false;
    inputDetails.push('✗ RealEphemerisAdapter failed to catch invalid time 25:70');
  }

  // Case H: Direct Adapter Calculation Error on Invalid Input
  const adapterErrorResult = realEphemerisAdapter.calculateEphemeris(invalidTimeEphemeris);
  if ('success' in adapterErrorResult && adapterErrorResult.success === false && adapterErrorResult.calculationStatus === 'VALIDATION_FAILED') {
    inputDetails.push('✓ RealEphemerisAdapter strictly returned structured calculation error for invalid input');
  } else {
    errorScenariosPassed = false;
    inputDetails.push('✗ RealEphemerisAdapter failed to return structured error on invalid input');
  }

  inputPassed = inputPassed && targetInputValidated && errorScenariosPassed;

  // --------------------------------------------------------------------------
  // 3. Output Schema & Safety Test
  // --------------------------------------------------------------------------
  const chartOutput = realProvider.calculateBirthChart(targetTestProfile);
  const contractOutput: RealEphemerisCalculationOutput = realProvider.getExpectedOutputContract(ephemerisInput);

  let statusCheckPassed = false;
  let noInventedPositions = false;

  if (
    chartOutput.calculationStatus === 'REAL_ENGINE_NOT_CONNECTED' &&
    chartOutput.calculationEngineStatus === 'REAL_ENGINE_NOT_CONNECTED' &&
    chartOutput.isCalculated === false
  ) {
    statusCheckPassed = true;
    outputDetails.push('✓ calculationStatus strictly returned "REAL_ENGINE_NOT_CONNECTED"');
  } else {
    outputPassed = false;
    outputDetails.push(`✗ Invalid calculationStatus: ${chartOutput.calculationStatus}`);
  }

  if (
    chartOutput.planets.length === 0 &&
    chartOutput.houses.length === 0 &&
    chartOutput.lagna.sign.includes('Uncalculated')
  ) {
    noInventedPositions = true;
    outputDetails.push('✓ Real provider safely returned ZERO invented planetary coordinates');
  } else {
    outputPassed = false;
    outputDetails.push('✗ Real provider improperly returned invented planetary values');
  }

  // Verify contract output schema contains all required output fields
  const requiredOutputKeys = [
    'ascendant',
    'planetaryPositions',
    'houses',
    'nakshatra',
    'divisionalCharts',
    'vimshottariDasha',
    'calculationMetadata',
    'engineMetadata',
  ] as const;

  for (const key of requiredOutputKeys) {
    if (key in contractOutput) {
      outputDetails.push(`✓ Expected output schema contains '${key}'`);
    } else {
      outputPassed = false;
      outputDetails.push(`✗ Output schema missing required key '${key}'`);
    }
  }

  if (
    contractOutput.divisionalCharts.D1 !== undefined &&
    contractOutput.divisionalCharts.D9 !== undefined &&
    contractOutput.engineMetadata.status === 'REAL_ENGINE_NOT_CONNECTED'
  ) {
    outputDetails.push('✓ Output contract includes D1, D9, and engine status metadata');
  } else {
    outputPassed = false;
    outputDetails.push('✗ Divisional charts or engine metadata missing in output contract');
  }

  // Verify all 8 locked calculation metadata fields
  const meta = contractOutput.calculationMetadata;
  if (
    meta.calculationStatus === 'REAL_ENGINE_NOT_CONNECTED' &&
    meta.calculationEngine === 'RealEphemerisAdapter' &&
    meta.engineVersion === '2.10-stub' &&
    meta.astrologySystem === 'VEDIC_SIDEREAL' &&
    meta.ayanamsha === 'LAHIRI' &&
    meta.houseSystem === 'WHOLE_SIGN' &&
    meta.nodeType === 'TRUE_NODE' &&
    typeof meta.calculationTimestamp === 'string' && meta.calculationTimestamp.length > 0
  ) {
    outputDetails.push('✓ All 8 locked calculation metadata fields verified (calculationStatus, calculationEngine, engineVersion, astrologySystem, ayanamsha, houseSystem, nodeType, calculationTimestamp)');
  } else {
    outputPassed = false;
    outputDetails.push(`✗ Locked calculation metadata missing required values: ${JSON.stringify(meta)}`);
  }

  outputPassed = outputPassed && statusCheckPassed && noInventedPositions;

  // --------------------------------------------------------------------------
  // 4. Production Safety Verification
  // --------------------------------------------------------------------------
  const isDemoActive = CALCULATION_PROVIDER === 'DEMO';
  const isEngineDemo = astrologyEngine instanceof DemoAstrologyProvider;

  if (isDemoActive) {
    safetyDetails.push('✓ CALCULATION_PROVIDER is strictly configured to "DEMO"');
  } else {
    safetyPassed = false;
    safetyDetails.push(`✗ CALCULATION_PROVIDER is '${CALCULATION_PROVIDER}', expected 'DEMO'`);
  }

  if (isEngineDemo) {
    safetyDetails.push('✓ Central astrologyEngine singleton is instance of DemoAstrologyProvider');
  } else {
    safetyPassed = false;
    safetyDetails.push('✗ Central astrologyEngine is not DemoAstrologyProvider');
  }

  safetyPassed = safetyPassed && isDemoActive && isEngineDemo;

  const allPassed = contractPassed && inputPassed && outputPassed && safetyPassed;

  return {
    timestamp: new Date().toISOString(),
    testSuite: 'RealAstrologyProvider Technical Integration Test',
    contractValidation: {
      passed: contractPassed,
      details: contractDetails,
    },
    inputSchemaValidation: {
      passed: inputPassed,
      targetInputValidated,
      errorScenariosPassed,
      details: inputDetails,
    },
    outputSchemaValidation: {
      passed: outputPassed,
      statusCheckPassed,
      noInventedPositions,
      details: outputDetails,
    },
    productionSafetyVerification: {
      passed: safetyPassed,
      activeProvider: CALCULATION_PROVIDER,
      isDemoActive,
      details: safetyDetails,
    },
    allPassed,
  };
}

/**
 * Strict Data Validation Layer for Astrology Backend & Data Services
 * 
 * Enforces strict boundaries on:
 * - Date of Birth (format, calendar validity, leap years, reasonable year bounds)
 * - Time of Birth (24-hour format, valid hours/minutes/seconds)
 * - Geographical Coordinates (Latitude [-90, +90], Longitude [-180, +180])
 * - IANA Timezones (verified via Intl.DateTimeFormat)
 * - User and Entity IDs (non-empty, non-malformed)
 * - Email format and Role constraints
 */

export interface ValidationFailure {
  field: string;
  message: string;
  rejectedValue?: any;
}

export interface ValidationOutcome {
  isValid: boolean;
  errors: ValidationFailure[];
}

/**
 * Validates a local civil date string in YYYY-MM-DD format with full calendar precision.
 */
export function validateDateOfBirth(dob: string): ValidationFailure[] {
  const errors: ValidationFailure[] = [];

  if (!dob || typeof dob !== 'string') {
    errors.push({ field: 'dateOfBirth', message: 'Date of birth is required and must be a string.', rejectedValue: dob });
    return errors;
  }

  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dob.trim().match(dateRegex);
  if (!match) {
    errors.push({ field: 'dateOfBirth', message: 'Date of birth must be in YYYY-MM-DD format.', rejectedValue: dob });
    return errors;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1800 || year > 2200) {
    errors.push({ field: 'dateOfBirth', message: `Year ${year} is outside the supported ephemeris range [1800, 2200].`, rejectedValue: dob });
  }

  if (month < 1 || month > 12) {
    errors.push({ field: 'dateOfBirth', message: `Month ${month} is invalid (must be 1-12).`, rejectedValue: dob });
    return errors;
  }

  // Days in month calculation
  const daysInMonth = [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maxDay = daysInMonth[month - 1];

  if (day < 1 || day > maxDay) {
    errors.push({ 
      field: 'dateOfBirth', 
      message: `Day ${day} is invalid for month ${month} in year ${year} (max days: ${maxDay}).`, 
      rejectedValue: dob 
    });
  }

  return errors;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Validates 24-hour civil birth time in HH:MM or HH:MM:SS format.
 */
export function validateTimeOfBirth(time: string): ValidationFailure[] {
  const errors: ValidationFailure[] = [];

  if (!time || typeof time !== 'string') {
    errors.push({ field: 'timeOfBirth', message: 'Time of birth is required and must be a string.', rejectedValue: time });
    return errors;
  }

  const timeRegex = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;
  const match = time.trim().match(timeRegex);
  if (!match) {
    errors.push({ field: 'timeOfBirth', message: 'Time of birth must be in HH:MM or HH:MM:SS format (24-hour).', rejectedValue: time });
    return errors;
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] !== undefined ? parseInt(match[3], 10) : 0;

  if (hours < 0 || hours > 23) {
    errors.push({ field: 'timeOfBirth', message: `Hours ${hours} are invalid (must be 00-23).`, rejectedValue: time });
  }

  if (minutes < 0 || minutes > 59) {
    errors.push({ field: 'timeOfBirth', message: `Minutes ${minutes} are invalid (must be 00-59).`, rejectedValue: time });
  }

  if (seconds < 0 || seconds > 59) {
    errors.push({ field: 'timeOfBirth', message: `Seconds ${seconds} are invalid (must be 00-59).`, rejectedValue: time });
  }

  return errors;
}

/**
 * Validates decimal geographic latitude in degrees [-90.0, +90.0].
 */
export function validateLatitude(lat: number): ValidationFailure[] {
  const errors: ValidationFailure[] = [];

  if (typeof lat !== 'number' || isNaN(lat) || !isFinite(lat)) {
    errors.push({ field: 'latitude', message: 'Latitude must be a valid finite number.', rejectedValue: lat });
    return errors;
  }

  if (lat < -90.0 || lat > 90.0) {
    errors.push({ field: 'latitude', message: `Latitude ${lat} is out of valid range [-90.0, +90.0].`, rejectedValue: lat });
  }

  return errors;
}

/**
 * Validates decimal geographic longitude in degrees [-180.0, +180.0].
 */
export function validateLongitude(lon: number): ValidationFailure[] {
  const errors: ValidationFailure[] = [];

  if (typeof lon !== 'number' || isNaN(lon) || !isFinite(lon)) {
    errors.push({ field: 'longitude', message: 'Longitude must be a valid finite number.', rejectedValue: lon });
    return errors;
  }

  if (lon < -180.0 || lon > 180.0) {
    errors.push({ field: 'longitude', message: `Longitude ${lon} is out of valid range [-180.0, +180.0].`, rejectedValue: lon });
  }

  return errors;
}

/**
 * Validates that a string is a recognized standard IANA timezone.
 */
export function validateIanaTimezone(tz: string): ValidationFailure[] {
  const errors: ValidationFailure[] = [];

  if (!tz || typeof tz !== 'string' || tz.trim().length === 0) {
    errors.push({ field: 'timezone', message: 'Timezone is required and must be a valid IANA timezone string.', rejectedValue: tz });
    return errors;
  }

  const trimmed = tz.trim();

  try {
    // Standard validation via ECMAScript Internationalization API
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
  } catch {
    errors.push({ 
      field: 'timezone', 
      message: `Timezone '${trimmed}' is not a valid IANA timezone identifier (e.g. 'Asia/Kolkata', 'America/New_York').`, 
      rejectedValue: tz 
    });
  }

  return errors;
}

/**
 * Validates an email address.
 */
export function validateEmail(email: string): ValidationFailure[] {
  const errors: ValidationFailure[] = [];

  if (!email || typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required.', rejectedValue: email });
    return errors;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    errors.push({ field: 'email', message: `Email '${email}' is not a valid email address.`, rejectedValue: email });
  }

  return errors;
}

/**
 * Validates a generic required ID string.
 */
export function validateEntityId(id: string, fieldName: string = 'id'): ValidationFailure[] {
  const errors: ValidationFailure[] = [];

  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    errors.push({ field: fieldName, message: `${fieldName} is required and must not be empty.`, rejectedValue: id });
  }

  return errors;
}

/**
 * Complete validator for persistent birth profile parameters.
 */
export function validateBirthProfileParams(params: {
  userId?: string;
  name?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  birthPlace?: string;
}): ValidationOutcome {
  const errors: ValidationFailure[] = [];

  if (params.userId !== undefined) {
    errors.push(...validateEntityId(params.userId, 'userId'));
  }

  if (!params.name || typeof params.name !== 'string' || params.name.trim().length < 1) {
    errors.push({ field: 'name', message: 'Name is required.', rejectedValue: params.name });
  }

  if (params.dateOfBirth) {
    errors.push(...validateDateOfBirth(params.dateOfBirth));
  } else {
    errors.push({ field: 'dateOfBirth', message: 'dateOfBirth is required.', rejectedValue: params.dateOfBirth });
  }

  if (params.timeOfBirth) {
    errors.push(...validateTimeOfBirth(params.timeOfBirth));
  } else {
    errors.push({ field: 'timeOfBirth', message: 'timeOfBirth is required.', rejectedValue: params.timeOfBirth });
  }

  if (params.latitude !== undefined) {
    errors.push(...validateLatitude(params.latitude));
  } else {
    errors.push({ field: 'latitude', message: 'latitude is required.', rejectedValue: params.latitude });
  }

  if (params.longitude !== undefined) {
    errors.push(...validateLongitude(params.longitude));
  } else {
    errors.push({ field: 'longitude', message: 'longitude is required.', rejectedValue: params.longitude });
  }

  if (params.timezone) {
    errors.push(...validateIanaTimezone(params.timezone));
  } else {
    errors.push({ field: 'timezone', message: 'timezone is required.', rejectedValue: params.timezone });
  }

  if (!params.birthPlace || typeof params.birthPlace !== 'string' || params.birthPlace.trim().length < 2) {
    errors.push({ field: 'birthPlace', message: 'birthPlace location description is required.', rejectedValue: params.birthPlace });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

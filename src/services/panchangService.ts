import { PanchangData } from '../types';

/**
 * Traditional Vedic Reference Data for Demo Panchang Engine
 */
const WEEKDAYS = [
  { name: 'Ravivara (Sunday)', lord: 'Sun (Surya Dev)', rahu: { start: '04:30 PM', end: '06:00 PM' }, yama: { start: '12:00 PM', end: '01:30 PM' }, gulika: { start: '03:00 PM', end: '04:30 PM' } },
  { name: 'Somavara (Monday)', lord: 'Moon (Chandra Dev)', rahu: { start: '07:30 AM', end: '09:00 AM' }, yama: { start: '10:30 AM', end: '12:00 PM' }, gulika: { start: '01:30 PM', end: '03:00 PM' } },
  { name: 'Mangalavara (Tuesday)', lord: 'Mars (Mangal Dev)', rahu: { start: '03:00 PM', end: '04:30 PM' }, yama: { start: '09:00 AM', end: '10:30 AM' }, gulika: { start: '12:00 PM', end: '01:30 PM' } },
  { name: 'Budhavara (Wednesday)', lord: 'Mercury (Budh Dev)', rahu: { start: '12:00 PM', end: '01:30 PM' }, yama: { start: '07:30 AM', end: '09:00 AM' }, gulika: { start: '10:30 AM', end: '12:00 PM' } },
  { name: 'Guruvara (Thursday)', lord: 'Jupiter (Brihaspati Dev)', rahu: { start: '01:30 PM', end: '03:00 PM' }, yama: { start: '06:00 AM', end: '07:30 AM' }, gulika: { start: '09:00 AM', end: '10:30 AM' } },
  { name: 'Shukravara (Friday)', lord: 'Venus (Shukra Dev)', rahu: { start: '10:30 AM', end: '12:00 PM' }, yama: { start: '03:00 PM', end: '04:30 PM' }, gulika: { start: '07:30 AM', end: '09:00 AM' } },
  { name: 'Shanivara (Saturday)', lord: 'Saturn (Shani Dev)', rahu: { start: '09:00 AM', end: '10:30 AM' }, yama: { start: '01:30 PM', end: '03:00 PM' }, gulika: { start: '06:00 AM', end: '07:30 AM' } },
];

const TITHIS = [
  { name: 'Pratipada', paksha: 'Shukla Paksha', deity: 'Agni (Fire)', significance: 'Ideal for religious rituals and new learning' },
  { name: 'Dwitiya', paksha: 'Shukla Paksha', deity: 'Brahma (Creator)', significance: 'Auspicious for ceremonies, foundations and journeys' },
  { name: 'Tritiya', paksha: 'Shukla Paksha', deity: 'Gauri (Grace)', significance: 'Auspicious for artistic pursuits and marriages' },
  { name: 'Chaturthi', paksha: 'Shukla Paksha', deity: 'Ganesha (Wisdom)', significance: 'Ideal for overcoming obstacles and studying' },
  { name: 'Panchami', paksha: 'Shukla Paksha', deity: 'Nagadevata / Saraswati', significance: 'Favorable for knowledge, arts, and creative learning' },
  { name: 'Shashthi', paksha: 'Shukla Paksha', deity: 'Kartikeya (Valour)', significance: 'Favorable for courage, sports and leadership' },
  { name: 'Saptami', paksha: 'Shukla Paksha', deity: 'Surya (Sun)', significance: 'Traditional focus on vitality, study and journeys' },
  { name: 'Ashtami', paksha: 'Shukla Paksha', deity: 'Durga (Protection)', significance: 'Spiritual contemplation, protection and charity' },
  { name: 'Navami', paksha: 'Shukla Paksha', deity: 'Durga / Rama', significance: 'Ideal for perseverance and overcoming difficulties' },
  { name: 'Dashami', paksha: 'Shukla Paksha', deity: 'Yama (Righteousness)', significance: 'Highly auspicious for inaugurations and ventures' },
  { name: 'Ekadashi', paksha: 'Shukla Paksha', deity: 'Vishnu (Preserver)', significance: 'Sacred fast day (Vrata) for spiritual elevation' },
  { name: 'Dwadashi', paksha: 'Shukla Paksha', deity: 'Vishnu', significance: 'Sacred for charity, breaking fast, and auspicious gifts' },
  { name: 'Trayodashi', paksha: 'Shukla Paksha', deity: 'Kamadeva / Shiva (Pradosh)', significance: 'Auspicious for friendship, rituals, and Pradosh Puja' },
  { name: 'Chaturdashi', paksha: 'Shukla Paksha', deity: 'Shiva (Rudra)', significance: 'Spiritual inwardness and Shiva worship' },
  { name: 'Purnima', paksha: 'Shukla Paksha', deity: 'Chandra (Full Moon)', significance: 'Maximum lunar illumination, meditation and Satyanarayan Puja' },
  { name: 'Krishna Pratipada', paksha: 'Krishna Paksha', deity: 'Agni', significance: 'Discipline, grounding, and administrative review' },
  { name: 'Krishna Tritiya', paksha: 'Krishna Paksha', deity: 'Gauri', significance: 'Patience and reflection on ongoing projects' },
  { name: 'Krishna Panchami', paksha: 'Krishna Paksha', deity: 'Saraswati', significance: 'Study of deeper philosophical texts' },
  { name: 'Krishna Ashtami', paksha: 'Krishna Paksha', deity: 'Krishna (Kala Ashtami)', significance: 'Inward meditation and Bhairava contemplation' },
  { name: 'Krishna Ekadashi', paksha: 'Krishna Paksha', deity: 'Vishnu', significance: 'Apara / Indira Ekadashi holy fasting day' },
  { name: 'Amavasya', paksha: 'Krishna Paksha', deity: 'Pitrus (Ancestors)', significance: 'Solemn ancestral prayers, quiet reflection and charity' },
];

const NAKSHATRAS = [
  { name: 'Ashwini', lord: 'Ketu', symbol: 'Horse Head', meaning: 'The Swift Healers' },
  { name: 'Bharani', lord: 'Venus', symbol: 'Yoni', meaning: 'The Bearer of Transformation' },
  { name: 'Krittika', lord: 'Sun', symbol: 'Knife / Flame', meaning: 'The Pure Radiance' },
  { name: 'Rohini', lord: 'Moon', symbol: 'Cart / Chariot', meaning: 'The Star of Abundance' },
  { name: 'Mrigashira', lord: 'Mars', symbol: 'Deer Head', meaning: 'The Inquiring Searcher' },
  { name: 'Ardra', lord: 'Rahu', symbol: 'Teardrop', meaning: 'The Transformative Storm' },
  { name: 'Punarvasu', lord: 'Jupiter', symbol: 'Bow & Quiver', meaning: 'The Return of the Light' },
  { name: 'Pushya', lord: 'Saturn', symbol: 'Lotus / Udder', meaning: 'The Most Auspicious Nourisher' },
  { name: 'Ashlesha', lord: 'Mercury', symbol: 'Coiled Serpent', meaning: 'The Deep Intuitive' },
  { name: 'Magha', lord: 'Ketu', symbol: 'Royal Throne', meaning: 'The Ancestral Majesty' },
  { name: 'Purva Phalguni', lord: 'Venus', symbol: 'Couch / Hammock', meaning: 'Joy and Creative Fulfillment' },
  { name: 'Uttara Phalguni', lord: 'Sun', symbol: 'Bed Legs', meaning: 'Steadfast Patronage & Duty' },
  { name: 'Hasta', lord: 'Moon', symbol: 'Open Hand', meaning: 'Mastery of Craft & Healing' },
  { name: 'Chitra', lord: 'Mars', symbol: 'Bright Jewel', meaning: 'Brilliance and Architectural Grace' },
  { name: 'Swati', lord: 'Rahu', symbol: 'Young Sprout', meaning: 'Independence and Flexibility' },
  { name: 'Vishakha', lord: 'Jupiter', symbol: 'Triumphal Arch', meaning: 'Focused Purpose and Victory' },
  { name: 'Anuradha', lord: 'Saturn', symbol: 'Lotus Staff', meaning: 'Devoted Fellowship and Success' },
  { name: 'Jyeshtha', lord: 'Mercury', symbol: 'Talisman', meaning: 'Elder Wisdom and Authority' },
  { name: 'Mula', lord: 'Ketu', symbol: 'Root Bunch', meaning: 'Core Truth and Foundational Insight' },
  { name: 'Purva Ashadha', lord: 'Venus', symbol: 'Winnowing Fan', meaning: 'Invincible Aspiration' },
  { name: 'Uttara Ashadha', lord: 'Sun', symbol: 'Elephant Tusk', meaning: 'Enduring Victory and Duty' },
  { name: 'Shravana', lord: 'Moon', symbol: 'Ear / Trident', meaning: 'Attentive Listening and Divine Knowledge' },
  { name: 'Dhanishta', lord: 'Mars', symbol: 'Musical Drum', meaning: 'Rhythm, Wealth, and Fame' },
  { name: 'Shatabhisha', lord: 'Rahu', symbol: 'Hundred Healers', meaning: 'Holistic Cure and Mystery' },
  { name: 'Purva Bhadrapada', lord: 'Jupiter', symbol: 'Front of Funeral Bed', meaning: 'Spiritual Aspiration and Fire' },
  { name: 'Uttara Bhadrapada', lord: 'Saturn', symbol: 'Twin Fish / Deep Ocean', meaning: 'Deep Wisdom and Serenity' },
  { name: 'Revati', lord: 'Mercury', symbol: 'Fish / Traveler Staff', meaning: 'Gentle Safe Journey and Abundance' },
];

const YOGAS = [
  { name: 'Vishkumbha', meaning: 'Fortified Foundation; protective and resolute energy' },
  { name: 'Priti', meaning: 'Affection and harmonious mutual affinity; good for alliances' },
  { name: 'Ayushman', meaning: 'Longevity and vitality; confers health and mental calm' },
  { name: 'Saubhagya', meaning: 'Sublime good fortune and prosperity in all undertakings' },
  { name: 'Shobhana', meaning: 'Aesthetic elegance and moral radiance; ideal for arts' },
  { name: 'Atiganda', meaning: 'Subtle hurdles; requires careful navigation and diligence' },
  { name: 'Sukarma', meaning: 'Virtuous deeds and honorable actions yielding noble fruit' },
  { name: 'Dhriti', meaning: 'Fortitude, resilience, and calm endurance through tasks' },
  { name: 'Shula', meaning: 'Intense focus; handle sensitive interactions with gentleness' },
  { name: 'Ganda', meaning: 'Dynamic shifts; recommended for meditation and patience' },
  { name: 'Vriddhi', meaning: 'Expansion, growth, and continuous progressive development' },
  { name: 'Dhruva', meaning: 'Steadfast permanence and unwavering stability' },
  { name: 'Vyaghata', meaning: 'Forceful propulsion; exercise restraint in debates' },
  { name: 'Harshana', meaning: 'Delight, celebration, and festive cheer in relationships' },
  { name: 'Vajra', meaning: 'Invulnerable diamond strength; powerful resolve' },
  { name: 'Siddhi', meaning: 'Attainment of skill, mastery, and triumphant fulfillment' },
  { name: 'Vyatipata', meaning: 'Introspective period; optimal for charity and prayer' },
  { name: 'Variyan', meaning: 'Superior nobility, refinement, and elevated reputation' },
  { name: 'Parigha', meaning: 'Protective barricade; safeguard personal boundaries' },
  { name: 'Shiva', meaning: 'Auspicious grace of Lord Shiva; serene peace and purity' },
  { name: 'Siddha', meaning: 'Accomplished success; highly supportive for auspicious actions' },
  { name: 'Sadhya', meaning: 'Feasible accomplishment; rewards steady dedication' },
  { name: 'Shubha', meaning: 'Pure benevolence, goodness, and spiritual radiance' },
  { name: 'Shukla', meaning: 'Clear illumination, truthfulness, and mental purity' },
  { name: 'Brahma', meaning: 'Divine creative contemplation and intellectual clarity' },
  { name: 'Indra', meaning: 'Leadership supremacy, respect, and executive influence' },
  { name: 'Vaidhriti', meaning: 'Careful scrutiny required; best for sacred japa and quiet contemplation' },
];

const KARANAS = [
  { name: 'Bava', deity: 'Indra', endTime: '02:40 PM' },
  { name: 'Balava', deity: 'Brahma', endTime: '03:15 PM' },
  { name: 'Kaulava', deity: 'Mitra', endTime: '04:10 PM' },
  { name: 'Taitila', deity: 'Aryama', endTime: '05:05 PM' },
  { name: 'Gara', deity: 'Bhumi', endTime: '06:12 PM' },
  { name: 'Vanija', deity: 'Shri / Lakshmi', endTime: '04:12 PM' },
  { name: 'Vishti (Bhadra)', deity: 'Yama', endTime: '03:50 PM' },
  { name: 'Shakuni', deity: 'Vayu', endTime: '05:30 PM' },
  { name: 'Chatushpada', deity: 'Rudra', endTime: '06:20 PM' },
  { name: 'Naga', deity: 'Sarpa', endTime: '07:15 PM' },
  { name: 'Kintughna', deity: 'Maruts', endTime: '08:00 PM' },
];

const RASHIS = [
  'Mesha (Aries)', 'Vrishabha (Taurus)', 'Mithuna (Gemini)', 'Karka (Cancer)',
  'Simha (Leo)', 'Kanya (Virgo)', 'Tula (Libra)', 'Vrischika (Scorpio)',
  'Dhanu (Sagittarius)', 'Makara (Capricorn)', 'Kumbha (Aquarius)', 'Meena (Pisces)'
];

const FESTIVALS_BY_MONTH: Record<number, string[]> = {
  0: ['Makar Sankranti', 'Pongal', 'Pausha Putrada Ekadashi'],
  1: ['Maha Shivaratri', 'Vasant Panchami', 'Jaya Ekadashi'],
  2: ['Holi / Dhulandi', 'Chaitra Navratri Ghatasthapana', 'Amalaki Ekadashi'],
  3: ['Ram Navami', 'Hanuman Jayanti', 'Kamada Ekadashi'],
  4: ['Akshaya Tritiya', 'Buddha Purnima', 'Mohini Ekadashi'],
  5: ['Nirjala Ekadashi', 'Vat Purnima', 'Ganga Dussehra'],
  6: ['Guru Purnima', 'Devshayani Ekadashi', 'Jagannath Ratha Yatra'],
  7: ['Raksha Bandhan', 'Krishna Janmashtami', 'Shravana Putrada Ekadashi'],
  8: ['Ganesh Chaturthi', 'Anant Chaturdashi', 'Indira Ekadashi Vrat'],
  9: ['Sharad Purnima', 'Dussehra / Vijayadashami', 'Navratri Celebrations'],
  10: ['Diwali / Deepawali', 'Govardhan Puja', 'Kartik Purnima / Dev Diwali'],
  11: ['Gita Jayanti', 'Mokshada Ekadashi', 'Dattatreya Jayanti'],
};

/**
 * Clean reusable placeholder function:
 * calculatePanchang(date, location)
 * 
 * Returns sample/demo Panchang data conforming strictly to user specification.
 * It provides deterministic variation so Previous / Next day date navigation updates
 * with coherent calendar values (Vara, Tithi, Nakshatra, Muhurats).
 */
export function calculatePanchang(dateStr: string, locationStr?: string): PanchangData {
  // Parse date safely
  let dateObj: Date;
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      dateObj = new Date(dateStr);
    }
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }
  } catch {
    dateObj = new Date();
  }

  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ...
  const dayOfMonth = dateObj.getDate();
  const month = dateObj.getMonth();
  const year = dateObj.getFullYear();

  // Deterministic seed based on date
  const dayIndex = Math.floor(dateObj.getTime() / (1000 * 60 * 60 * 24));
  const absIndex = Math.abs(dayIndex);

  // Formatted date string
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const weekdayInfo = WEEKDAYS[dayOfWeek];
  const tithiInfo = TITHIS[absIndex % TITHIS.length];
  const nakshatraInfo = NAKSHATRAS[(absIndex + 3) % NAKSHATRAS.length];
  const yogaInfo = YOGAS[(absIndex + 7) % YOGAS.length];
  const karanaInfo = KARANAS[(absIndex + 2) % KARANAS.length];
  const moonSign = RASHIS[(absIndex + 1) % RASHIS.length];
  
  // Sun sign progresses roughly 1 per month
  const sunSign = RASHIS[(month + 8) % 12];

  // Location handling
  const location = locationStr && locationStr.trim().length > 0 
    ? locationStr 
    : 'New Delhi, Delhi, India';

  // Festivals list for the month
  const monthFestivals = FESTIVALS_BY_MONTH[month] || ['Special Vrata Day', 'Ekadashi Vrat'];
  const festival = dayOfMonth % 5 === 0 
    ? monthFestivals[dayOfMonth % monthFestivals.length] 
    : dayOfMonth % 2 === 0 
      ? `${tithiInfo.name} Vrat` 
      : 'Shubh Daily Muhurat';

  const festivalDescription = dayOfMonth % 5 === 0 
    ? `A traditionally auspicious observance celebrated across Vedic traditions with fasting, meditation, and devotional remembrance.`
    : `Daily cosmic alignment favorable for routine duties, charitable offerings, and personal spiritual practice.`;

  return {
    date: dateStr,
    formattedDate,
    location,
    tithi: {
      name: `${tithiInfo.paksha} ${tithiInfo.name}`,
      paksha: tithiInfo.paksha,
      endTime: '04:18 PM',
      deity: tithiInfo.deity,
      significance: tithiInfo.significance,
    },
    nakshatra: {
      name: nakshatraInfo.name,
      lord: nakshatraInfo.lord,
      endTime: '07:45 PM',
      pada: ((absIndex % 4) + 1),
      symbol: nakshatraInfo.symbol,
    },
    yoga: {
      name: yogaInfo.name,
      meaning: yogaInfo.meaning,
      endTime: '02:35 PM',
    },
    karana: {
      name: karanaInfo.name,
      endTime: karanaInfo.endTime,
      deity: karanaInfo.deity,
    },
    vara: weekdayInfo.name,
    varaLord: weekdayInfo.lord,
    paksha: tithiInfo.paksha,
    sunrise: '06:10 AM',
    sunset: '06:21 PM',
    moonrise: '03:45 PM',
    moonset: '03:12 AM',
    abhijitMuhurat: {
      start: '11:51 AM',
      end: '12:40 PM',
      status: 'Active',
      type: 'Auspicious',
      description: 'Traditionally favored midday window for positive commencements, ceremonies, and journeys.',
    },
    brahmaMuhurat: {
      start: '04:34 AM',
      end: '05:22 AM',
      status: 'Passed',
      type: 'Auspicious',
      description: 'Sacred pre-dawn window of Lord Brahma. Premier time for meditation, yoga, study, and spiritual contemplation.',
    },
    rahuKaal: {
      start: weekdayInfo.rahu.start,
      end: weekdayInfo.rahu.end,
      status: 'Upcoming',
      type: 'Inauspicious',
      description: 'Traditionally regarded as a period to avoid starting certain major activities.',
    },
    yamagandam: {
      start: weekdayInfo.yama.start,
      end: weekdayInfo.yama.end,
      status: 'Passed',
      type: 'Inauspicious',
      description: 'Period governed by Yama. In traditional practice, major new undertakings and departures are deferred.',
    },
    gulikaKaal: {
      start: weekdayInfo.gulika.start,
      end: weekdayInfo.gulika.end,
      status: 'Upcoming',
      type: 'Neutral',
      description: 'Period governed by Gulika (son of Saturn). Considered favorable for recurring activities, building, and routines.',
    },
    moonSign,
    sunSign,
    festival,
    festivalDescription,
    season: 'Sharad Ritu (Autumn)',
    ayana: 'Dakshinayana (Southern Solstice)',
    traditionalExplanation: 'In classical Vedic astrology, the Panchang comprises the five sacred limbs (Pancha-Anga) of time: Tithi (Lunar Day, traditionally associated with prosperity), Nakshatra (Lunar Mansion, traditionally associated with experiences and themes), Yoga (Planetary combination, traditionally interpreted as relating to harmony and daily themes), Karana (Half-tithi, traditionally associated with daily activities), and Vara (Weekday, traditionally associated with energy and activity). Harmonizing one\'s rhythm with these celestial indicators is a timeless traditional practice.',
    isDemoData: true,
    demoLabel: 'PANCHANG — DEMO DATA',
    disclaimer: 'Illustrative demonstration frontend only. All celestial timings, muhurats, and planetary positions are curated sample prototype data and not certified astronomical ephemeris. Does not guarantee outcomes or provide medical or financial predictions.',
  };
}

/**
 * Horoscope Service - Traditional Vedic Astrology Guidance
 * 
 * SAFETY & ACCURACY CONSTRAINTS:
 * - Traditional, interpretive Vedic guidance only.
 * - Never presents astrology as scientifically proven fact.
 * - Never makes guaranteed predictions or definitive claims.
 * - Never provides medical diagnosis or treatment advice.
 * - Never gives financial investment instructions or guaranteed wealth outcomes.
 * - Avoids fear-based predictions.
 * - Consistently uses phrases like "traditionally interpreted as", "according to Vedic astrology", "may indicate", and "may be associated with".
 * - All content clearly designated as DEMO / SAMPLE.
 */

import { BirthProfile, UserBirthDetails } from '../types';
import { calculateBirthChart } from './astrologyEngine';

export type HoroscopePeriod = 'daily' | 'weekly' | 'monthly';

export interface LuckyInsightData {
  favorableColor: string;
  harmoniousNumber: string | number;
  traditionalTimeWindow: string;
  contemplativeFocus: string;
}

export interface HoroscopePeriodDetail {
  period: HoroscopePeriod;
  periodLabel: string;
  dateRange: string;
  headline: string;
  overview: string;
  mainTheme: string;
  relationships: string;
  careerAndWork: string;
  personalGrowth: string;
  luckyInsight: LuckyInsightData;
  dailyInsight?: string; // Specific calm daily reflection
}

export interface BirthProfileSummary {
  name: string;
  moonSign: string;
  moonSignSanskrit: string;
  nakshatra: string;
  ascendant: string;
  isDemoData: boolean;
}

/**
 * Structured demo horoscope database for Daily, Weekly, and Monthly cycles.
 */
export const horoscopeData: Record<HoroscopePeriod, Record<string, HoroscopePeriodDetail>> = {
  daily: {
    taurus: {
      period: 'daily',
      periodLabel: 'Daily Horoscope',
      dateRange: 'Today',
      headline: 'Serene Emotional Grounding & Measured Action',
      overview: 'According to Vedic astrology, the Moon\'s presence in Taurus is traditionally interpreted as fostering emotional calm, patient endurance, and an appreciation for harmonious surroundings.',
      mainTheme: 'Traditional astrology suggests focusing on steady continuation of routine duties rather than initiating rushed departures.',
      relationships: 'In Vedic relationship philosophy, this lunar phase is traditionally associated with thoughtful listening, mutual loyalty, and gentle appreciation between partners and family.',
      careerAndWork: 'Workplace themes may indicate favorable conditions for methodical tasks, organizing backlog work, and fostering courteous, respectful communication with peers.',
      personalGrowth: 'Traditional contemplative lore encourages grounding exercises, mindful walks in natural settings, and balancing external responsibilities with quiet inner reflection.',
      luckyInsight: {
        favorableColor: 'Lotus White & Soft Emerald',
        harmoniousNumber: '6',
        traditionalTimeWindow: '10:15 AM – 11:45 AM (Sample)',
        contemplativeFocus: 'Steadfastness & Peace',
      },
      dailyInsight: 'Today\'s planetary alignments are traditionally interpreted as an invitation to move at an unhurried, graceful pace. Cultivating calm patience in interactions may be associated with emotional serenity and clarity.',
    },
    leo: {
      period: 'daily',
      periodLabel: 'Daily Horoscope',
      dateRange: 'Today',
      headline: 'Solar Warmth & Noble Purpose',
      overview: 'In classical Vedic astrology, solar influences today are traditionally interpreted as supporting sincere creative expression, righteous purpose, and dignified self-discipline.',
      mainTheme: 'Traditional texts emphasize aligning personal ambition with honorable service to one\'s community and loved ones.',
      relationships: 'May indicate opportunities for warm generosity and heartfelt words. Traditional wisdom suggests balancing natural self-assurance with receptive empathy.',
      careerAndWork: 'Traditional astrology suggests that organizational responsibilities and leadership responsibilities may flow smoothly when approached with fairness and clarity.',
      personalGrowth: 'According to Vedic tradition, contemplating one\'s higher ideals and upholding daily ethical commitments supports enduring inner contentment.',
      luckyInsight: {
        favorableColor: 'Warm Saffron & Sunlit Gold',
        harmoniousNumber: '1',
        traditionalTimeWindow: '08:30 AM – 10:00 AM (Sample)',
        contemplativeFocus: 'Dignity & Benevolence',
      },
      dailyInsight: 'Vedic tradition reminds us that true nobility is rooted in kindness. Offering sincere encouragement to a colleague or loved one today is traditionally viewed as a source of mutual elevation.',
    },
    aries: {
      period: 'daily',
      periodLabel: 'Daily Horoscope',
      dateRange: 'Today',
      headline: 'Vitality & Focused Direction',
      overview: 'According to Vedic astrology, Martian archetypes today are traditionally associated with constructive drive, disciplined initiative, and overcoming hesitations.',
      mainTheme: 'Traditional guidance emphasizes channeling active energy into structured tasks rather than reactive debates.',
      relationships: 'May indicate the value of open, honest conversations tempered with patience and gentle phrasing.',
      careerAndWork: 'Traditional astrology suggests strong momentum for completing pending technical or administrative obligations.',
      personalGrowth: 'Contemplating calm self-restraint alongside physical vitality is traditionally regarded as fostering lasting resilience.',
      luckyInsight: {
        favorableColor: 'Crimson & Sandalwood',
        harmoniousNumber: '9',
        traditionalTimeWindow: '09:00 AM – 10:30 AM (Sample)',
        contemplativeFocus: 'Mindful Courage',
      },
      dailyInsight: 'Traditional Vedic philosophy observes that conscious restraint transforms raw vitality into purposeful wisdom.',
    },
    default: {
      period: 'daily',
      periodLabel: 'Daily Horoscope',
      dateRange: 'Today',
      headline: 'Harmonious Balance & Mindful Awareness',
      overview: 'According to Vedic astrology, today\'s celestial rhythm is traditionally interpreted as highlighting inner composure, steady duty, and reflective awareness.',
      mainTheme: 'Traditional guidance suggests prioritizing well-aligned priorities and thoughtful pacing throughout the day.',
      relationships: 'In traditional Jyotish thought, cultivating gentle patience and listening openly is traditionally associated with deeper mutual understanding.',
      careerAndWork: 'May indicate favorable conditions for structured organization, collaborative respect, and sustained focus on core duties.',
      personalGrowth: 'Traditional contemplation encourages dedicating quiet moments to breath awareness, gratitude, and moral clarity.',
      luckyInsight: {
        favorableColor: 'Soft Gold & Ivory',
        harmoniousNumber: '7',
        traditionalTimeWindow: '11:00 AM – 12:30 PM (Sample)',
        contemplativeFocus: 'Clarity & Equanimity',
      },
      dailyInsight: 'A peaceful mind is traditionally regarded as the highest foundation for skillful action. Approaching each situation with tranquility brings natural alignment.',
    },
  },

  weekly: {
    taurus: {
      period: 'weekly',
      periodLabel: 'Weekly Horoscope',
      dateRange: 'This Week',
      headline: 'Steadfast Progress & Environmental Harmony',
      overview: 'According to Vedic astrology, this week\'s transits are traditionally interpreted as favoring patient consolidation, establishing sustainable routines, and nurturing long-term intentions.',
      mainTheme: 'The main traditional theme for the week emphasizes endurance over quick speed—building sturdy foundations step by step.',
      relationships: 'In traditional Vedic relationship analysis, this week may indicate favorable opportunities for resolving past misunderstandings through warm, steady presence and quiet loyalty.',
      careerAndWork: 'Traditional astrology suggests that collaborative projects and administrative planning may experience smooth coordination when clear expectations are established.',
      personalGrowth: 'Contemplative lore highlights the benefits of simplifying daily obligations, spending restorative moments outdoors, and practicing gratitude for ongoing stability.',
      luckyInsight: {
        favorableColor: 'Moss Green & Pearl White',
        harmoniousNumber: '5 & 6',
        traditionalTimeWindow: 'Midday Transitions (Sample)',
        contemplativeFocus: 'Foundation Building',
      },
    },
    leo: {
      period: 'weekly',
      periodLabel: 'Weekly Horoscope',
      dateRange: 'This Week',
      headline: 'Creative Vision & Collaborative Leadership',
      overview: 'In traditional Vedic lore, the unfolding weekly cycle is traditionally interpreted as highlighting creative clarity, ethical mentorship, and collaborative goodwill.',
      mainTheme: 'The primary traditional theme encourages leading by example with humility, allowing others to shine alongside you.',
      relationships: 'May be associated with deepening trust through shared aspirations and transparent expressions of appreciation.',
      careerAndWork: 'Traditional astrology suggests that strategic discussions and creative presentations may receive constructive consideration when rooted in thorough preparation.',
      personalGrowth: 'Classical wisdom encourages dedicating time to artistic or philosophical study, aligning outer ambitions with internal spiritual principles.',
      luckyInsight: {
        favorableColor: 'Deep Ochre & Bronze',
        harmoniousNumber: '1 & 3',
        traditionalTimeWindow: 'Morning Hours (Sample)',
        contemplativeFocus: 'Righteous Leadership',
      },
    },
    aries: {
      period: 'weekly',
      periodLabel: 'Weekly Horoscope',
      dateRange: 'This Week',
      headline: 'Constructive Initiative & Disciplined Pacing',
      overview: 'According to Vedic astrology, planetary aspects this week may indicate strong motivation to tackle complex challenges, balanced by a need for conscious pacing.',
      mainTheme: 'The central traditional theme is channeling passion through disciplined schedules to avoid unnecessary fatigue.',
      relationships: 'Traditional perspectives recommend listening with patience and avoiding hurried conclusions during sensitive family or partner dialogues.',
      careerAndWork: 'May indicate productive outcomes for negotiations and technical problem-solving when paired with measured diplomatic phrasing.',
      personalGrowth: 'Traditional philosophy highlights the value of quiet morning contemplation and mindful body relaxation.',
      luckyInsight: {
        favorableColor: 'Scarlet & Copper',
        harmoniousNumber: '9 & 4',
        traditionalTimeWindow: 'Early Afternoon (Sample)',
        contemplativeFocus: 'Steadfast Focus',
      },
    },
    default: {
      period: 'weekly',
      periodLabel: 'Weekly Horoscope',
      dateRange: 'This Week',
      headline: 'Progressive Alignment & Steady Cultivation',
      overview: 'According to Vedic astrology, this week\'s planetary configuration is traditionally interpreted as a supportive window for gradual accomplishment, organized planning, and steady balance.',
      mainTheme: 'Traditional guidance emphasizes harmonizing daily responsibilities with thoughtful restorative breaks.',
      relationships: 'May be interpreted as favoring meaningful dialogue, forgiveness of minor shortcomings, and shared domestic harmony.',
      careerAndWork: 'Traditional astrology suggests reviewing ongoing commitments, refining workflows, and maintaining ethical consistency in all transactions.',
      personalGrowth: 'Vedic philosophy encourages regular contemplative self-check-ins to nurture mental clarity and inner peace.',
      luckyInsight: {
        favorableColor: 'Silver & Sky Blue',
        harmoniousNumber: '2 & 7',
        traditionalTimeWindow: 'Mid-Morning (Sample)',
        contemplativeFocus: 'Balanced Living',
      },
    },
  },

  monthly: {
    taurus: {
      period: 'monthly',
      periodLabel: 'Monthly Horoscope',
      dateRange: 'This Month',
      headline: 'Enduring Stability & Harmonious Growth',
      overview: 'According to Vedic astrology, the overarching monthly transit cycle is traditionally interpreted as an auspicious interval for consolidating material stewardship, deepening familial roots, and practicing philosophical contentment (Santosha).',
      mainTheme: 'Major traditional themes center on long-term sustainability, refining personal values, and protecting peaceful environments.',
      relationships: 'In traditional Vedic thought, this month may indicate the deepening of mature bonds through shared practical responsibilities and enduring mutual respect.',
      careerAndWork: 'Traditional astrology suggests that sustained diligence and methodical attention to detail are classically favored over speculative ventures.',
      personalGrowth: 'Classical lore recommends dedicating time each week to study, nature walks, and grounding rituals that nurture inner tranquility.',
      luckyInsight: {
        favorableColor: 'Forest Green & Ivory',
        harmoniousNumber: '6 & 15',
        traditionalTimeWindow: 'Venusian Hours / Friday Mornings (Sample)',
        contemplativeFocus: 'Santosha (Contentment)',
      },
    },
    leo: {
      period: 'monthly',
      periodLabel: 'Monthly Horoscope',
      dateRange: 'This Month',
      headline: 'Noble Vision & Purposeful Expansion',
      overview: 'In classical Jyotish philosophy, the broader monthly movement of the Sun and supporting planets is traditionally interpreted as illuminating personal dharma, professional integrity, and generous service.',
      mainTheme: 'The dominant traditional theme highlights purposeful self-mastery—directing one\'s energy toward honorable, community-uplifting endeavors.',
      relationships: 'May be associated with opportunities to celebrate family milestones and foster mutual pride with loved ones through generous recognition.',
      careerAndWork: 'Traditional astrology suggests favorable conditions for long-range planning, establishing professional reputations, and ethical mentorship.',
      personalGrowth: 'According to classical Vedic philosophy, aligning daily deeds with universal righteousness (Dharma) brings profound inner fulfillment.',
      luckyInsight: {
        favorableColor: 'Golden Amber & Royal Indigo',
        harmoniousNumber: '1 & 19',
        traditionalTimeWindow: 'Solar Hours / Sunday Midday (Sample)',
        contemplativeFocus: 'Dharma & Integrity',
      },
    },
    aries: {
      period: 'monthly',
      periodLabel: 'Monthly Horoscope',
      dateRange: 'This Month',
      headline: 'Strategic Vitality & Maturing Wisdom',
      overview: 'According to Vedic astrology, the planetary archetypes this month traditionally suggest a balance between vigorous initiative and mature reflection.',
      mainTheme: 'Major traditional themes encourage deliberate strategy over impulsive action, ensuring that efforts produce enduring results.',
      relationships: 'Traditional guidance emphasizes maintaining calm diplomacy during familial discussions and cultivating deeper emotional receptivity.',
      careerAndWork: 'May indicate constructive periods for setting quarterly goals, acquiring new technical skills, and solidifying professional alliances.',
      personalGrowth: 'Classical perspectives recommend integrating mindful breathwork (Pranayama) and regular quietude to harmonize active energy.',
      luckyInsight: {
        favorableColor: 'Burnt Coral & Terracotta',
        harmoniousNumber: '9 & 18',
        traditionalTimeWindow: 'Tuesday Mid-Morning (Sample)',
        contemplativeFocus: 'Purposeful Perseverance',
      },
    },
    default: {
      period: 'monthly',
      periodLabel: 'Monthly Horoscope',
      dateRange: 'This Month',
      headline: 'Wholesome Alignment & Mindful Transformation',
      overview: 'According to Vedic astrology, this monthly transit cycle is traditionally interpreted as an opportunity to review life priorities, nurture physical and mental harmony, and cultivate enduring peace.',
      mainTheme: 'Major traditional themes focus on steady self-refinement, mindful habits, and harmonious coexistence with family and community.',
      relationships: 'In traditional Jyotish philosophy, prioritizing patience, emotional empathy, and honest appreciation is traditionally seen as fortifying relationships.',
      careerAndWork: 'Traditional astrology suggests that systematic preparation, continuous learning, and courteous collaboration create a supportive working atmosphere.',
      personalGrowth: 'Classical wisdom encourages weekly moments of silent reflection, contemplation of sacred texts, and fostering equanimity in all circumstances.',
      luckyInsight: {
        favorableColor: 'Sandalwood & Soft Gold',
        harmoniousNumber: '3 & 8',
        traditionalTimeWindow: 'Dawn & Twilight Hours (Sample)',
        contemplativeFocus: 'Equanimity & Wisdom',
      },
    },
  },
};

/**
 * Placeholder function for generating horoscope content.
 * Returns curated sample traditional Vedic interpretations based on period, birthProfile, and chartData.
 */
export function generateHoroscope(
  period: HoroscopePeriod = 'daily',
  birthProfile?: BirthProfile | UserBirthDetails,
  chartData?: any,
  selectedSignId?: string
): HoroscopePeriodDetail {
  // Determine sign key from parameter, user birth details, or default to 'taurus'
  let signKey = 'taurus';

  if (selectedSignId) {
    signKey = selectedSignId.toLowerCase();
  } else if (birthProfile?.name) {
    // If user profile is available, match their traditional Moon sign if possible
    signKey = 'taurus'; // Default demo profile has Moon in Taurus
  }

  const periodGroup = horoscopeData[period] || horoscopeData.daily;
  const match = periodGroup[signKey] || periodGroup.default;

  return {
    ...match,
    period,
  };
}

/**
 * Extracts and formats the user's birth profile for the Horoscope Zodiac/Profile card.
 */
export function getHoroscopeUserProfile(userDetails?: UserBirthDetails | BirthProfile): BirthProfileSummary {
  const name = (userDetails && 'fullName' in userDetails && userDetails.fullName)
    ? userDetails.fullName
    : userDetails?.name || 'Demo Profile';

  if (userDetails) {
    const chart = calculateBirthChart(userDetails as BirthProfile);
    return {
      name,
      moonSign: chart.moonSign?.sign || 'Taurus (Vrishabha) - Exalted',
      moonSignSanskrit: 'Vrishabha',
      nakshatra: `${chart.nakshatra?.name || 'Rohini'} (Pada ${chart.nakshatra?.pada || 2})`,
      ascendant: `${chart.lagna?.sign || 'Leo (Simha)'} ${chart.lagna?.degree || "28° 14'"}`,
      isDemoData: chart.calculationStatus === 'DEMO',
    };
  }
  
  return {
    name,
    moonSign: 'Taurus (Vrishabha) - Exalted',
    moonSignSanskrit: 'Vrishabha',
    nakshatra: 'Rohini (Pada 2)',
    ascendant: 'Leo (Simha) 28° 14\'',
    isDemoData: true,
  };
}

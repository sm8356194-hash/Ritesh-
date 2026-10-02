/**
 * AI Astrologer Demo Response Service
 * 
 * Provides traditional, interpretive Vedic astrology guidance for demo simulation.
 * 
 * ARCHITECTURE DIRECTIVE:
 * The AI layer receives structured chart data from the centralized astrologyEngine:
 *   generateAstrologyResponse(question, birthChartData)
 * 
 * The AI layer must interpret the structured chart data and must NOT calculate
 * planetary positions itself.
 * 
 * SAFETY & ACCURACY CONSTRAINTS:
 * - Explains astrology as traditional/interpretive guidance only.
 * - Never presents astrology as scientifically proven fact.
 * - Never makes guaranteed predictions.
 * - Never provides medical diagnosis or treatment.
 * - Never gives financial investment instructions or guaranteed outcomes.
 * - Avoids fear-based or fatalistic predictions.
 * - Consistently uses phrases like "traditionally interpreted", "in Vedic astrology", and "may be associated with".
 * - All calculations and readings remain in DEMO/SAMPLE mode.
 */

import { StandardBirthChartData } from '../types';

export interface BirthChartContext {
  sunSign: string;
  moonSign: string;
  ascendant: string;
  nakshatra: string;
  currentDasha: string;
  userName?: string;
}

export const DEFAULT_CHART_CONTEXT: BirthChartContext = {
  sunSign: 'Leo (Simha)',
  moonSign: 'Taurus (Vrishabha) - Exalted',
  ascendant: 'Leo (Simha) 28° 14\'',
  nakshatra: 'Rohini (Pada 2)',
  currentDasha: 'Jupiter - Saturn - Mercury (Active)',
  userName: 'Demo Profile',
};

export const SUGGESTED_QUESTIONS = [
  'What does my Moon sign represent?',
  'What is my Ascendant?',
  'Tell me about my Nakshatra',
  'What does my current Dasha mean?',
  'What are my career themes?',
  'What are my relationship themes?',
  'Give me a general reading',
] as const;

export type SuggestedQuestion = typeof SUGGESTED_QUESTIONS[number];

/**
 * Normalizes input to BirthChartContext whether passed as StandardBirthChartData or BirthChartContext
 */
function extractChartContext(
  birthChartData?: StandardBirthChartData | BirthChartContext
): BirthChartContext {
  if (!birthChartData) {
    return DEFAULT_CHART_CONTEXT;
  }

  // If it's already BirthChartContext
  if ('sunSign' in birthChartData && 'ascendant' in birthChartData && typeof birthChartData.ascendant === 'string') {
    return birthChartData as BirthChartContext;
  }

  // If it's StandardBirthChartData from central astrologyEngine
  const stdChart = birthChartData as StandardBirthChartData;
  const sunPlanet = stdChart.planets?.find((p) => p.name === 'Sun' || p.planet === 'Sun');
  const moonPlanet = stdChart.planets?.find((p) => p.name === 'Moon' || p.planet === 'Moon');

  return {
    sunSign: sunPlanet ? sunPlanet.sign : 'Leo (Simha)',
    moonSign: stdChart.moonSign?.sign || (moonPlanet ? `${moonPlanet.sign} - Exalted` : 'Taurus (Vrishabha) - Exalted'),
    ascendant: stdChart.lagna ? `${stdChart.lagna.sign} ${stdChart.lagna.degree}` : (stdChart.ascendant?.sign || 'Leo (Simha) 28° 14\''),
    nakshatra: stdChart.nakshatra ? `${stdChart.nakshatra.name} (Pada ${stdChart.nakshatra.pada})` : 'Rohini (Pada 2)',
    currentDasha: stdChart.dasha ? `${stdChart.dasha.mahadasha} - ${stdChart.dasha.antardasha} (Active)` : 'Jupiter - Saturn - Mercury (Active)',
    userName: stdChart.profile?.name || 'Demo Profile',
  };
}

/**
 * Generates an AI Astrologer interpretive response for a given question and structured chart data.
 * The AI layer interprets the structured chart data produced by the centralized astrologyEngine.
 */
export function generateAstrologyResponse(
  question: string,
  birthChartData?: StandardBirthChartData | BirthChartContext
): string {
  const chartContext = extractChartContext(birthChartData);
  const normalized = question.trim().toLowerCase();

  // 1. Safety Filter: Medical / Health
  if (
    normalized.includes('health') ||
    normalized.includes('disease') ||
    normalized.includes('cure') ||
    normalized.includes('sick') ||
    normalized.includes('illness') ||
    normalized.includes('surgery') ||
    normalized.includes('doctor') ||
    normalized.includes('pregnant') ||
    normalized.includes('medicine') ||
    normalized.includes('cancer')
  ) {
    return `In Vedic astrology, planetary configurations are traditionally interpreted through symbolic archetypes and philosophical contemplation. 

Astrology is not a science and does not provide medical diagnosis, prognosis, or treatment for any physical or mental health condition. For any medical or health-related matters, please always consult a qualified, licensed healthcare professional.`;
  }

  // 2. Safety Filter: Financial investments / Guaranteed wealth
  if (
    normalized.includes('invest') ||
    normalized.includes('stock') ||
    normalized.includes('crypto') ||
    normalized.includes('lottery') ||
    normalized.includes('bitcoin') ||
    normalized.includes('jackpot') ||
    normalized.includes('gamble') ||
    normalized.includes('rich overnight')
  ) {
    return `In traditional Jyotish philosophy, wealth houses (Dhana and Labha Bhavas) are traditionally associated with disciplined stewardship, ethical labor, and sustained habits rather than speculative fortunes.

Astrology does not provide financial investment instructions or guaranteed financial returns. For investment decisions, market advice, or financial planning, please consult a certified financial advisor.`;
  }

  // 3. Safety Filter: Fear-based / Death / Curses
  if (
    normalized.includes('die') ||
    normalized.includes('death') ||
    normalized.includes('curse') ||
    normalized.includes('doom') ||
    normalized.includes('danger') ||
    normalized.includes('accident') ||
    normalized.includes('bad omen')
  ) {
    return `Traditional Vedic astrology is regarded as Jyotir-Vidya—the 'Science of Light'—intended to inspire moral clarity, mindfulness, and constructive self-development.

Classical traditions strongly advise against fatalistic or fear-based interpretations. We encourage directing attention toward peaceful reflection, righteous conduct (Dharma), and positive daily actions.`;
  }

  // 4. Question 1: What does my Moon sign represent?
  if (normalized.includes('moon sign') || normalized.includes('chandra')) {
    return `In Vedic astrology, the Moon sign (Chandra Rashi) is traditionally interpreted as governing the mind (Manas), emotional rhythm, instinctive responses, and inner perception of peace.

With your sample Moon placed in Taurus (${chartContext.moonSign})—where the Moon is classically regarded as exalted (Uccha)—traditional texts associate this placement with emotional stability, patience, an appreciation for serene environments, and steady loyalty. In Vedic astrology, this placement may be associated with a grounded approach to life's ebbs and flows.

Please keep in mind that these traditional descriptions serve as contemplative archetypes rather than predetermined behavioral absolutes.`;
  }

  // 5. Question 2: What is my Ascendant?
  if (normalized.includes('ascendant') || normalized.includes('lagna')) {
    return `In Vedic astrology, your Ascendant (Lagna) represents the zodiac sign rising on the eastern horizon at the moment of your birth. It is traditionally interpreted as relating to your vitality, physical demeanor, and the lens through which you interact with the world.

With a sample Leo (${chartContext.ascendant}) Ascendant ruled by the Sun (Surya Dev), classical traditions associate this placement with natural warmth, dignity, creative courage, and organizational presence. In traditional Vedic thought, it may be associated with an inclination toward sincere self-expression and honorable leadership.

These classical descriptions are symbolic frameworks designed for personal self-reflection, rather than rigid personality definitions.`;
  }

  // 6. Question 3: Tell me about my Nakshatra
  if (normalized.includes('nakshatra') || normalized.includes('birth star') || normalized.includes('rohini')) {
    return `In traditional Vedic cosmology, your Janma Nakshatra (birth lunar mansion) is ${chartContext.nakshatra}, positioned in the constellation of Taurus and governed by Chandra (the Moon). Rohini is mythologically presided over by Prajapati (the divine creator).

In classical Jyotish lore, Rohini is traditionally associated with creative fertility, aesthetic refinement, charm, and steady determination. In Vedic astrology, natives born under this star may be associated with an appreciation for the arts, agriculture or nurturing crafts, and steady perseverance in long-term goals.

These ancient symbolisms are traditionally contemplated for spiritual mindfulness and self-knowledge, not as fatalistic predictions.`;
  }

  // 7. Question 4: What does my current Dasha mean?
  if (normalized.includes('dasha') || normalized.includes('period') || normalized.includes('cycle')) {
    return `In Vedic astrology, the Vimshottari Dasha system maps the unfolding of life themes through planetary cycles. Your sample chart reflects an active period of ${chartContext.currentDasha}.

In classical interpretation, the convergence of expansive Jupiter and disciplined Saturn is traditionally viewed as a balance between wisdom and sustained effort. In Vedic astrology, this phase is traditionally interpreted as a period emphasizing structured learning, ethical consolidation, steady professional endurance, and measured progress rather than hasty changes.

Traditional dasha analysis provides symbolic timing themes to encourage disciplined reflection and dharmic action.`;
  }

  // 8. Question 5: What are my career themes?
  if (normalized.includes('career') || normalized.includes('job') || normalized.includes('work') || normalized.includes('profession')) {
    return `In traditional Vedic chart analysis, professional themes are primarily explored through the 10th house (Karma Bhava), the 1st house (Lagna), and their governing planetary aspects.

In your sample chart, the 10th house falls in Taurus with an exalted Moon, while the 1st house is enlivened by the Sun and Mercury. Classical interpretations suggest potential affinities with vocations involving communication, creative stewardship, leadership, counseling, or aesthetic enterprise. These placements are traditionally associated with valuing tangible results and ethical respect in one's work environment.

Astrology offers these themes as exploratory metaphors for personal reflection—never as guaranteed career outcomes or professional mandates.`;
  }

  // 9. Question 6: What are my relationship themes?
  if (normalized.includes('relationship') || normalized.includes('marriage') || normalized.includes('partner') || normalized.includes('love')) {
    return `In Vedic astrology, partnership and interpersonal dynamics are traditionally contemplated through the 7th house (Yuvati Bhava), which in your sample chart is ruled by Saturn in Aquarius.

In traditional Jyotish perspectives, Saturnian influence over the partnership realm is classically associated with bonds that value maturity, steadfast loyalty, shared responsibilities, and emotional patience. Rather than rapid, superficial connections, it is traditionally interpreted as favoring enduring alliances built over time through mutual respect.

These classical insights offer interpretive perspectives for conscious relating, rather than definitive relationship forecasts.`;
  }

  // 10. Question 7: Give me a general reading
  if (normalized.includes('general') || normalized.includes('reading') || normalized.includes('overview') || normalized.includes('summary')) {
    return `In classical Vedic astrology, your overall birth chart presents an intriguing synergy: a radiant Leo Ascendant ruled by the Sun, paired with an exalted Moon in peaceful Taurus and an active Jupiter-Saturn dasha cycle.

In traditional interpretation, this combination is often viewed as uniting visionary enthusiasm with practical endurance and emotional stability. Classical texts suggest a native path focused on balanced self-expression, steady dedication to one's duties, and the harmonious integration of ambition with inner peace.

Remember that Vedic astrology is traditionally intended as a sacred, symbolic lens for self-inquiry, personal mindfulness, and ethical living—never as a substitute for personal agency or deterministic prophecy.`;
  }

  // 11. Polite Fallback for any other custom question
  return `In Vedic astrology, queries such as "${question}" are traditionally explored by examining planetary archetypes, houses, and transits as symbolic mirrors for personal reflection.

Based on your sample birth chart—featuring a Leo Ascendant (${chartContext.ascendant}) and exalted Taurus Moon (${chartContext.moonSign})—classical traditions emphasize steady personal clarity, thoughtful expression, and balanced action. In traditional Vedic thought, planetary archetypes are intended as contemplative metaphors to support self-inquiry and mindful living rather than fatalistic prophecies.`;
}

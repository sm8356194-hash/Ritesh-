export interface DemoLocation {
  id: string;
  city: string;
  state: string;
  country: string;
  displayName: string;
  latitude: number;
  longitude: number;
  timezone: string;
  aliases?: string[];
}

/**
 * Curated list of verified sample and cultural locations with authentic geographical coordinates and IANA timezones.
 * 
 * LOCAL DATASET NOTICE:
 * This is a curated local dataset of major cities and astrological cultural centers.
 * It does NOT connect to a live third-party geocoding API or paid external search service.
 */
export const SAMPLE_LOCATIONS: DemoLocation[] = [
  // Major Indian Metros & Tier 1 Cities
  {
    id: 'delhi-in',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    displayName: 'New Delhi, Delhi, India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
    aliases: ['Delhi', 'Dilli', 'Newdelhi', 'NCR'],
  },
  {
    id: 'mumbai-in',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    displayName: 'Mumbai, Maharashtra, India',
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
    aliases: ['Bombay', 'BOM'],
  },
  {
    id: 'bengaluru-in',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    displayName: 'Bengaluru, Karnataka, India',
    latitude: 12.9716,
    longitude: 77.5946,
    timezone: 'Asia/Kolkata',
    aliases: ['Bangalore', 'BLR'],
  },
  {
    id: 'kolkata-in',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    displayName: 'Kolkata, West Bengal, India',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
    aliases: ['Calcutta', 'CCU'],
  },
  {
    id: 'chennai-in',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    displayName: 'Chennai, Tamil Nadu, India',
    latitude: 13.0827,
    longitude: 80.2707,
    timezone: 'Asia/Kolkata',
    aliases: ['Madras', 'MAA'],
  },
  {
    id: 'hyderabad-in',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    displayName: 'Hyderabad, Telangana, India',
    latitude: 17.3850,
    longitude: 78.4867,
    timezone: 'Asia/Kolkata',
    aliases: ['HYD', 'Secunderabad'],
  },
  {
    id: 'pune-in',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    displayName: 'Pune, Maharashtra, India',
    latitude: 18.5204,
    longitude: 73.8567,
    timezone: 'Asia/Kolkata',
    aliases: ['Poona', 'PNQ'],
  },
  {
    id: 'ahmedabad-in',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    displayName: 'Ahmedabad, Gujarat, India',
    latitude: 23.0225,
    longitude: 72.5714,
    timezone: 'Asia/Kolkata',
    aliases: ['Amdavad', 'Karnavati', 'AMD'],
  },
  {
    id: 'jaipur-in',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    displayName: 'Jaipur, Rajasthan, India',
    latitude: 26.9124,
    longitude: 75.7873,
    timezone: 'Asia/Kolkata',
    aliases: ['Pink City', 'JAI'],
  },

  // Cultural, Vedic & Astrological Hubs in India
  {
    id: 'varanasi-in',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    country: 'India',
    displayName: 'Varanasi, Uttar Pradesh, India',
    latitude: 25.3176,
    longitude: 82.9739,
    timezone: 'Asia/Kolkata',
    aliases: ['Banaras', 'Benares', 'Kashi', 'VNS'],
  },
  {
    id: 'ujjain-in',
    city: 'Ujjain',
    state: 'Madhya Pradesh',
    country: 'India',
    displayName: 'Ujjain, Madhya Pradesh, India',
    latitude: 23.1765,
    longitude: 75.7885,
    timezone: 'Asia/Kolkata',
    aliases: ['Avantika', 'Mahakal', 'Prime Meridian of Jyotish'],
  },
  {
    id: 'haridwar-in',
    city: 'Haridwar',
    state: 'Uttarakhand',
    country: 'India',
    displayName: 'Haridwar, Uttarakhand, India',
    latitude: 29.9457,
    longitude: 78.1642,
    timezone: 'Asia/Kolkata',
    aliases: ['Hardwar', 'Mayapuri', 'Ganga'],
  },
  {
    id: 'rishikesh-in',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    country: 'India',
    displayName: 'Rishikesh, Uttarakhand, India',
    latitude: 30.0869,
    longitude: 78.2676,
    timezone: 'Asia/Kolkata',
    aliases: ['Hrishikesh', 'Yoga Capital'],
  },
  {
    id: 'prayagraj-in',
    city: 'Prayagraj',
    state: 'Uttar Pradesh',
    country: 'India',
    displayName: 'Prayagraj, Uttar Pradesh, India',
    latitude: 25.4358,
    longitude: 81.8463,
    timezone: 'Asia/Kolkata',
    aliases: ['Allahabad', 'Prayag', 'Sangam'],
  },
  {
    id: 'ayodhya-in',
    city: 'Ayodhya',
    state: 'Uttar Pradesh',
    country: 'India',
    displayName: 'Ayodhya, Uttar Pradesh, India',
    latitude: 26.7922,
    longitude: 82.1998,
    timezone: 'Asia/Kolkata',
    aliases: ['Saket', 'Faizabad'],
  },
  {
    id: 'mathura-in',
    city: 'Mathura',
    state: 'Uttar Pradesh',
    country: 'India',
    displayName: 'Mathura, Uttar Pradesh, India',
    latitude: 27.4924,
    longitude: 77.6737,
    timezone: 'Asia/Kolkata',
    aliases: ['Braj', 'Vrindavan'],
  },
  {
    id: 'lucknow-in',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    country: 'India',
    displayName: 'Lucknow, Uttar Pradesh, India',
    latitude: 26.8467,
    longitude: 80.9462,
    timezone: 'Asia/Kolkata',
    aliases: ['LKO', 'Awadh'],
  },
  {
    id: 'chandigarh-in',
    city: 'Chandigarh',
    state: 'Punjab/Haryana',
    country: 'India',
    displayName: 'Chandigarh, India',
    latitude: 30.7333,
    longitude: 76.7794,
    timezone: 'Asia/Kolkata',
    aliases: ['IXC', 'Mohali', 'Panchkula'],
  },
  {
    id: 'amritsar-in',
    city: 'Amritsar',
    state: 'Punjab',
    country: 'India',
    displayName: 'Amritsar, Punjab, India',
    latitude: 31.6340,
    longitude: 74.8723,
    timezone: 'Asia/Kolkata',
    aliases: ['Ambarsar', 'Golden Temple', 'ATQ'],
  },
  {
    id: 'kochi-in',
    city: 'Kochi',
    state: 'Kerala',
    country: 'India',
    displayName: 'Kochi, Kerala, India',
    latitude: 9.9312,
    longitude: 76.2673,
    timezone: 'Asia/Kolkata',
    aliases: ['Cochin', 'Ernakulam', 'COK'],
  },
  {
    id: 'trivandrum-in',
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    country: 'India',
    displayName: 'Thiruvananthapuram, Kerala, India',
    latitude: 8.5241,
    longitude: 76.9366,
    timezone: 'Asia/Kolkata',
    aliases: ['Trivandrum', 'TRV'],
  },
  {
    id: 'patna-in',
    city: 'Patna',
    state: 'Bihar',
    country: 'India',
    displayName: 'Patna, Bihar, India',
    latitude: 25.5941,
    longitude: 85.1376,
    timezone: 'Asia/Kolkata',
    aliases: ['Pataliputra', 'PAT'],
  },
  {
    id: 'surat-in',
    city: 'Surat',
    state: 'Gujarat',
    country: 'India',
    displayName: 'Surat, Gujarat, India',
    latitude: 21.1702,
    longitude: 72.8311,
    timezone: 'Asia/Kolkata',
    aliases: ['Suryapur', 'STV'],
  },
  {
    id: 'indore-in',
    city: 'Indore',
    state: 'Madhya Pradesh',
    country: 'India',
    displayName: 'Indore, Madhya Pradesh, India',
    latitude: 22.7196,
    longitude: 75.8577,
    timezone: 'Asia/Kolkata',
    aliases: ['Indhur', 'IDR'],
  },
  {
    id: 'bhopal-in',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    country: 'India',
    displayName: 'Bhopal, Madhya Pradesh, India',
    latitude: 23.2599,
    longitude: 77.4126,
    timezone: 'Asia/Kolkata',
    aliases: ['Bhojpal', 'BHO'],
  },
  {
    id: 'nagpur-in',
    city: 'Nagpur',
    state: 'Maharashtra',
    country: 'India',
    displayName: 'Nagpur, Maharashtra, India',
    latitude: 21.1458,
    longitude: 79.0882,
    timezone: 'Asia/Kolkata',
    aliases: ['NAG', 'Orange City'],
  },
  {
    id: 'bhubaneswar-in',
    city: 'Bhubaneswar',
    state: 'Odisha',
    country: 'India',
    displayName: 'Bhubaneswar, Odisha, India',
    latitude: 20.2961,
    longitude: 85.8245,
    timezone: 'Asia/Kolkata',
    aliases: ['Bhubaneshwar', 'BBI', 'Temple City'],
  },
  {
    id: 'guwahati-in',
    city: 'Guwahati',
    state: 'Assam',
    country: 'India',
    displayName: 'Guwahati, Assam, India',
    latitude: 26.1445,
    longitude: 91.7362,
    timezone: 'Asia/Kolkata',
    aliases: ['Gauhati', 'GAU', 'Kamakhya'],
  },
  {
    id: 'dehradun-in',
    city: 'Dehradun',
    state: 'Uttarakhand',
    country: 'India',
    displayName: 'Dehradun, Uttarakhand, India',
    latitude: 30.3165,
    longitude: 78.0322,
    timezone: 'Asia/Kolkata',
    aliases: ['Dehra Doon', 'DED'],
  },
  {
    id: 'shimla-in',
    city: 'Shimla',
    state: 'Himachal Pradesh',
    country: 'India',
    displayName: 'Shimla, Himachal Pradesh, India',
    latitude: 31.1048,
    longitude: 77.1734,
    timezone: 'Asia/Kolkata',
    aliases: ['Simla', 'SLV'],
  },
  {
    id: 'agra-in',
    city: 'Agra',
    state: 'Uttar Pradesh',
    country: 'India',
    displayName: 'Agra, Uttar Pradesh, India',
    latitude: 27.1767,
    longitude: 78.0081,
    timezone: 'Asia/Kolkata',
    aliases: ['Taj Mahal', 'AGR'],
  },
  {
    id: 'kanpur-in',
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    country: 'India',
    displayName: 'Kanpur, Uttar Pradesh, India',
    latitude: 26.4499,
    longitude: 80.3319,
    timezone: 'Asia/Kolkata',
    aliases: ['Cawnpore', 'KNP'],
  },
  {
    id: 'gonda-in',
    city: 'Gonda',
    state: 'Uttar Pradesh',
    country: 'India',
    displayName: 'Gonda, Uttar Pradesh, India',
    latitude: 27.1332,
    longitude: 81.9619,
    timezone: 'Asia/Kolkata',
    aliases: ['Gonda City', 'GD'],
  },

  // Neighboring & Global Metros
  {
    id: 'kathmandu-np',
    city: 'Kathmandu',
    state: 'Bagmati',
    country: 'Nepal',
    displayName: 'Kathmandu, Bagmati, Nepal',
    latitude: 27.7172,
    longitude: 85.3240,
    timezone: 'Asia/Kathmandu',
    aliases: ['KTM', 'Pashupatinath'],
  },
  {
    id: 'dubai-ae',
    city: 'Dubai',
    state: 'Dubai',
    country: 'United Arab Emirates',
    displayName: 'Dubai, UAE',
    latitude: 25.2048,
    longitude: 55.2708,
    timezone: 'Asia/Dubai',
    aliases: ['DXB', 'United Arab Emirates', 'UAE'],
  },
  {
    id: 'london-uk',
    city: 'London',
    state: 'Greater London',
    country: 'United Kingdom',
    displayName: 'London, Greater London, UK',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
    aliases: ['LON', 'UK', 'United Kingdom', 'England'],
  },
  {
    id: 'new-york-us',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    displayName: 'New York, NY, USA',
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: 'America/New_York',
    aliases: ['NYC', 'New York City', 'USA', 'United States', 'America'],
  },
  {
    id: 'san-francisco-us',
    city: 'San Francisco',
    state: 'California',
    country: 'United States',
    displayName: 'San Francisco, CA, USA',
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
    aliases: ['SF', 'Bay Area', 'SFO', 'California'],
  },
  {
    id: 'los-angeles-us',
    city: 'Los Angeles',
    state: 'California',
    country: 'United States',
    displayName: 'Los Angeles, CA, USA',
    latitude: 34.0522,
    longitude: -118.2437,
    timezone: 'America/Los_Angeles',
    aliases: ['LA', 'SoCal', 'LAX'],
  },
  {
    id: 'chicago-us',
    city: 'Chicago',
    state: 'Illinois',
    country: 'United States',
    displayName: 'Chicago, IL, USA',
    latitude: 41.8781,
    longitude: -87.6298,
    timezone: 'America/Chicago',
    aliases: ['ORD', 'Windy City', 'CHI'],
  },
  {
    id: 'toronto-ca',
    city: 'Toronto',
    state: 'Ontario',
    country: 'Canada',
    displayName: 'Toronto, Ontario, Canada',
    latitude: 43.6532,
    longitude: -79.3832,
    timezone: 'America/Toronto',
    aliases: ['GTA', 'YYZ', 'Ontario'],
  },
  {
    id: 'singapore-sg',
    city: 'Singapore',
    state: 'Central',
    country: 'Singapore',
    displayName: 'Singapore, Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    timezone: 'Asia/Singapore',
    aliases: ['SG', 'SIN'],
  },
  {
    id: 'sydney-au',
    city: 'Sydney',
    state: 'New South Wales',
    country: 'Australia',
    displayName: 'Sydney, NSW, Australia',
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: 'Australia/Sydney',
    aliases: ['SYD', 'NSW'],
  },
  {
    id: 'paris-fr',
    city: 'Paris',
    state: 'Île-de-France',
    country: 'France',
    displayName: 'Paris, France',
    latitude: 48.8566,
    longitude: 2.3522,
    timezone: 'Europe/Paris',
    aliases: ['CDG', 'France'],
  },
  {
    id: 'tokyo-jp',
    city: 'Tokyo',
    state: 'Kanto',
    country: 'Japan',
    displayName: 'Tokyo, Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
    aliases: ['TYO', 'Japan', 'Edo'],
  },
];

export const DEFAULT_DEMO_LOCATION = SAMPLE_LOCATIONS[0]; // New Delhi

/**
 * Searches curated sample locations with:
 * - Case insensitivity
 * - Leading, trailing, and multiple internal whitespace normalization
 * - Partial city/state/country matching
 * - Multi-word token matching (e.g. "India Delhi" or "Delhi India")
 * - Common historical / colloquial aliases (e.g. "Bangalore" -> Bengaluru, "Bombay" -> Mumbai, "Kashi" -> Varanasi)
 * - Intelligent prioritization (exact city match > prefix match > substring > alias > tokens)
 */
export function searchDemoLocations(query: string): DemoLocation[] {
  // Normalize whitespace and lowercase
  const clean = (query || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

  // If query is empty, return popular default locations
  if (!clean) {
    return SAMPLE_LOCATIONS.slice(0, 7);
  }

  const tokens = clean.split(' ').filter(Boolean);

  // Score and filter each location
  const matches: Array<{ loc: DemoLocation; score: number }> = [];

  for (const loc of SAMPLE_LOCATIONS) {
    const cityLower = loc.city.toLowerCase();
    const stateLower = loc.state.toLowerCase();
    const countryLower = loc.country.toLowerCase();
    const displayLower = loc.displayName.toLowerCase();
    const aliasesLower = (loc.aliases || []).map((a) => a.toLowerCase());

    const allHaystack = [cityLower, stateLower, countryLower, displayLower, ...aliasesLower].join(' ');

    let score = -1;

    // 1. Exact match on city
    if (cityLower === clean) {
      score = 100;
    }
    // 2. Exact match on an alias
    else if (aliasesLower.some((a) => a === clean)) {
      score = 90;
    }
    // 3. City starts with query
    else if (cityLower.startsWith(clean)) {
      score = 80;
    }
    // 4. Any alias starts with query
    else if (aliasesLower.some((a) => a.startsWith(clean))) {
      score = 75;
    }
    // 5. City contains query
    else if (cityLower.includes(clean)) {
      score = 70;
    }
    // 6. Display name contains query
    else if (displayLower.includes(clean)) {
      score = 60;
    }
    // 7. State or Country starts with query
    else if (stateLower.startsWith(clean) || countryLower.startsWith(clean)) {
      score = 50;
    }
    // 8. Any alias contains query
    else if (aliasesLower.some((a) => a.includes(clean))) {
      score = 45;
    }
    // 9. All tokens present in the location metadata
    else if (tokens.length > 1 && tokens.every((token) => allHaystack.includes(token))) {
      score = 30;
    }
    // 10. General substring in state or country
    else if (stateLower.includes(clean) || countryLower.includes(clean)) {
      score = 20;
    }

    if (score >= 0) {
      matches.push({ loc, score });
    }
  }

  // Sort descending by relevance score, then alphabetically by city
  matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.loc.city.localeCompare(b.loc.city);
  });

  return matches.map((m) => m.loc);
}

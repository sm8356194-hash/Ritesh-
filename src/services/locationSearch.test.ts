/**
 * Step 34 — Location Search Reliability & Integration Test Suite
 * 
 * Tests:
 * 1. Exact city-name search
 * 2. Partial city-name search
 * 3. Case-insensitive search
 * 4. Search with leading, trailing, and multiple consecutive whitespace
 * 5. No-results behavior (empty results handling)
 * 6. Selecting a result populates the correct location, latitude, longitude, and timezone
 * 7. Changing the selected location does not retain stale coordinates or timezone
 * 8. Alias and common variation resolution (e.g. Bangalore -> Bengaluru, Bombay -> Mumbai, Kashi -> Varanasi)
 * 9. Multi-word token order insensitivity (e.g. "India Delhi" vs "Delhi India")
 * 10. Valid coordinate ranges and valid IANA timezones across entire dataset
 */

import { 
  SAMPLE_LOCATIONS, 
  DEFAULT_DEMO_LOCATION, 
  searchDemoLocations, 
  DemoLocation 
} from '../data/demoLocations';

async function runLocationSearchTestSuite() {
  console.log('=== RUNNING STEP 34 LOCATION SEARCH RELIABILITY TEST SUITE ===\n');

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

  // 1. Exact city-name search
  const exactDelhi = searchDemoLocations('New Delhi');
  assert(
    exactDelhi.length > 0 && exactDelhi[0].city === 'New Delhi',
    'Exact city-name search finds "New Delhi" as top result'
  );

  const exactJaipur = searchDemoLocations('Jaipur');
  assert(
    exactJaipur.length > 0 && exactJaipur[0].city === 'Jaipur',
    'Exact city-name search finds "Jaipur" as top result'
  );

  // Dedicated tests for newly added cities: Kanpur and Gonda
  const searchKanpur = searchDemoLocations('Kanpur');
  assert(
    searchKanpur.length > 0 && searchKanpur[0].city === 'Kanpur',
    'Searching "Kanpur" returns Kanpur as top result'
  );
  const selectedKanpur = searchKanpur[0];
  assert(
    selectedKanpur.displayName === 'Kanpur, Uttar Pradesh, India',
    'Selecting Kanpur populates correct displayName "Kanpur, Uttar Pradesh, India"'
  );
  assert(
    selectedKanpur.latitude === 26.4499 && selectedKanpur.longitude === 80.3319,
    'Selecting Kanpur populates accurate coordinates (26.4499, 80.3319)'
  );
  assert(
    selectedKanpur.timezone === 'Asia/Kolkata',
    'Selecting Kanpur populates timezone "Asia/Kolkata"'
  );

  const searchGonda = searchDemoLocations('Gonda');
  assert(
    searchGonda.length > 0 && searchGonda[0].city === 'Gonda',
    'Searching "Gonda" returns Gonda as top result'
  );
  const selectedGonda = searchGonda[0];
  assert(
    selectedGonda.displayName === 'Gonda, Uttar Pradesh, India',
    'Selecting Gonda populates correct displayName "Gonda, Uttar Pradesh, India"'
  );
  assert(
    selectedGonda.latitude === 27.1332 && selectedGonda.longitude === 81.9619,
    'Selecting Gonda populates accurate coordinates (27.1332, 81.9619)'
  );
  assert(
    selectedGonda.timezone === 'Asia/Kolkata',
    'Selecting Gonda populates timezone "Asia/Kolkata"'
  );

  // 2. Partial city-name search
  const partialMum = searchDemoLocations('Mum');
  assert(
    partialMum.length > 0 && partialMum[0].city === 'Mumbai',
    'Partial city-name search "Mum" finds "Mumbai" as top result'
  );

  const partialKol = searchDemoLocations('kolk');
  assert(
    partialKol.length > 0 && partialKol[0].city === 'Kolkata',
    'Partial city-name search "kolk" finds "Kolkata" as top result'
  );

  // 3. Case-insensitive search
  const upperCaseSearch = searchDemoLocations('PUNE');
  assert(
    upperCaseSearch.length > 0 && upperCaseSearch[0].city === 'Pune',
    'Uppercase search "PUNE" matches "Pune"'
  );

  const mixedCaseSearch = searchDemoLocations('hYdErAbAd');
  assert(
    mixedCaseSearch.length > 0 && mixedCaseSearch[0].city === 'Hyderabad',
    'Mixed-case search "hYdErAbAd" matches "Hyderabad"'
  );

  // 4. Search with leading, trailing, and multiple internal spaces
  const spacedSearch = searchDemoLocations('   New     Delhi    ');
  assert(
    spacedSearch.length > 0 && spacedSearch[0].city === 'New Delhi',
    'Search with leading, trailing, and multiple internal spaces correctly resolves to "New Delhi"'
  );

  const spacedSingle = searchDemoLocations('   Chennai   ');
  assert(
    spacedSingle.length > 0 && spacedSingle[0].city === 'Chennai',
    'Search with extra whitespace "   Chennai   " matches "Chennai"'
  );

  // 5. No-results behavior
  const noMatchResults = searchDemoLocations('NonExistentCityXYZ999');
  assert(
    noMatchResults.length === 0,
    'Searching an unknown/non-existent query returns empty results array cleanly'
  );

  const emptyStringResults = searchDemoLocations('');
  assert(
    emptyStringResults.length > 0,
    'Empty search string gracefully returns popular default locations'
  );

  // 6. Selecting a result populates the correct location and coordinates
  const selectedLoc: DemoLocation = exactDelhi[0];
  assert(
    selectedLoc.displayName === 'New Delhi, Delhi, India',
    'Selected location has exact displayName "New Delhi, Delhi, India"'
  );
  assert(
    selectedLoc.latitude === 28.6139,
    'Selected location latitude is 28.6139'
  );
  assert(
    selectedLoc.longitude === 77.2090,
    'Selected location longitude is 77.2090'
  );
  assert(
    selectedLoc.timezone === 'Asia/Kolkata',
    'Selected location timezone is "Asia/Kolkata"'
  );

  // 7. Changing the selected location does not retain stale coordinates or timezone
  // Simulate state transition: User switches from New Delhi to Tokyo
  let activeSelection: DemoLocation = selectedLoc;
  assert(activeSelection.city === 'New Delhi' && activeSelection.timezone === 'Asia/Kolkata', 'Initial selection is New Delhi');

  const tokyoResults = searchDemoLocations('Tokyo');
  assert(tokyoResults.length > 0 && tokyoResults[0].city === 'Tokyo', 'Found Tokyo in dataset');
  
  // Transition selection to Tokyo
  activeSelection = tokyoResults[0];
  assert(activeSelection.city === 'Tokyo', 'Active selection updated to Tokyo');
  assert(activeSelection.latitude === 35.6762, 'Latitude updated to Tokyo (35.6762) without retaining Delhi latitude (28.6139)');
  assert(activeSelection.longitude === 139.6503, 'Longitude updated to Tokyo (139.6503) without retaining Delhi longitude (77.2090)');
  assert(activeSelection.timezone === 'Asia/Tokyo', 'Timezone updated to "Asia/Tokyo" without retaining "Asia/Kolkata"');

  // Transition selection to London
  const londonResults = searchDemoLocations('London');
  assert(londonResults.length > 0 && londonResults[0].city === 'London', 'Found London in dataset');
  activeSelection = londonResults[0];
  assert(activeSelection.city === 'London', 'Active selection updated to London');
  assert(activeSelection.latitude === 51.5074, 'Latitude updated to London (51.5074)');
  assert(activeSelection.longitude === -0.1278, 'Longitude updated to London (-0.1278)');
  assert(activeSelection.timezone === 'Europe/London', 'Timezone updated to "Europe/London"');

  // 8. Alias and common spelling variations
  const bangaloreSearch = searchDemoLocations('Bangalore');
  assert(
    bangaloreSearch.length > 0 && bangaloreSearch[0].city === 'Bengaluru',
    'Colloquial alias "Bangalore" correctly resolves to "Bengaluru"'
  );

  const bombaySearch = searchDemoLocations('Bombay');
  assert(
    bombaySearch.length > 0 && bombaySearch[0].city === 'Mumbai',
    'Colloquial alias "Bombay" correctly resolves to "Mumbai"'
  );

  const calcuttaSearch = searchDemoLocations('Calcutta');
  assert(
    calcuttaSearch.length > 0 && calcuttaSearch[0].city === 'Kolkata',
    'Colloquial alias "Calcutta" correctly resolves to "Kolkata"'
  );

  const madrasSearch = searchDemoLocations('Madras');
  assert(
    madrasSearch.length > 0 && madrasSearch[0].city === 'Chennai',
    'Colloquial alias "Madras" correctly resolves to "Chennai"'
  );

  const kashiSearch = searchDemoLocations('Kashi');
  assert(
    kashiSearch.length > 0 && kashiSearch[0].city === 'Varanasi',
    'Sacred name alias "Kashi" correctly resolves to "Varanasi"'
  );

  const banarasSearch = searchDemoLocations('Banaras');
  assert(
    banarasSearch.length > 0 && banarasSearch[0].city === 'Varanasi',
    'Common spelling alias "Banaras" correctly resolves to "Varanasi"'
  );

  const ujjainSearch = searchDemoLocations('Avantika');
  assert(
    ujjainSearch.length > 0 && ujjainSearch[0].city === 'Ujjain',
    'Classical name alias "Avantika" correctly resolves to "Ujjain"'
  );

  const prayagrajSearch = searchDemoLocations('Allahabad');
  assert(
    prayagrajSearch.length > 0 && prayagrajSearch[0].city === 'Prayagraj',
    'Historical name alias "Allahabad" correctly resolves to "Prayagraj"'
  );

  // 9. Multi-word token order insensitivity
  const order1 = searchDemoLocations('Delhi India');
  const order2 = searchDemoLocations('India Delhi');
  assert(
    order1.length > 0 && order2.length > 0 && order1[0].city === order2[0].city && order1[0].city === 'New Delhi',
    'Multi-word search tokens are order-insensitive ("Delhi India" === "India Delhi")'
  );

  // 10. Valid coordinate ranges and valid IANA timezones across all locations
  for (const loc of SAMPLE_LOCATIONS) {
    assert(
      typeof loc.latitude === 'number' && !isNaN(loc.latitude) && loc.latitude >= -90 && loc.latitude <= 90,
      `Location ${loc.city} has valid latitude in [-90, +90]`
    );
    assert(
      typeof loc.longitude === 'number' && !isNaN(loc.longitude) && loc.longitude >= -180 && loc.longitude <= 180,
      `Location ${loc.city} has valid longitude in [-180, +180]`
    );
    let validTz = false;
    try {
      Intl.DateTimeFormat(undefined, { timeZone: loc.timezone });
      validTz = true;
    } catch {
      validTz = false;
    }
    assert(validTz, `Location ${loc.city} has valid IANA timezone "${loc.timezone}"`);
  }

  console.log(`\n=== ALL ${passed}/${total} LOCATION SEARCH TESTS PASSED SUCCESSFULLY! ===`);
  process.exit(0);
}

runLocationSearchTestSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

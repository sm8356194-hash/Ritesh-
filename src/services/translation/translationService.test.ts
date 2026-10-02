/**
 * Step 28 — Chat Translation Unit & Integration Test Suite
 */

import { translationService } from '../translationService';

export async function runTranslationTestSuite() {
  console.log('=== RUNNING STEP 28 CHAT TRANSLATION TEST SUITE ===');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, description: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] Test ${total}: ${description}`);
    } else {
      console.error(`[FAIL] Test ${total}: ${description}`);
    }
  }

  // 1. Language Detection Test
  const enDetect = translationService.detectLanguage('Can you explain my Kundli?');
  assert(enDetect === 'en', 'English text correctly detected as "en"');

  const hiDetect = translationService.detectLanguage('नमस्ते आचार्य जी! मेरी कुंडली की जानकारी दीजिए।');
  assert(hiDetect === 'hi', 'Hindi Devanagari text correctly detected as "hi"');

  // 2. Same-language bypass test
  const sameLangRes = await translationService.translateMessage('Hello Acharya ji', 'en', 'en');
  assert(
    sameLangRes.success && sameLangRes.isAiTranslated === false && sameLangRes.translatedText === 'Hello Acharya ji',
    'Same-language request safely returns original text without AI call'
  );

  // 3. Empty input rejection
  const emptyRes = await translationService.translateMessage('   ', 'hi');
  assert(emptyRes.success === false && Boolean(emptyRes.error), 'Empty message rejected cleanly');

  // 4. Client-to-Server Translation Endpoint Test (English to Hindi)
  try {
    const res = await fetch('http://localhost:3000/api/translate-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageText: 'Namaste Acharya ji! Can you review my 10th house career prospects and active Dasha period?',
        targetLang: 'hi',
      }),
    });
    const json = await res.json();
    const hasHindiText = Boolean(json.translatedText) && /[\u0900-\u097F]/.test(json.translatedText);
    assert(
      res.ok && json.success && hasHindiText,
      `English to Hindi translation proxy endpoint succeeded: "${json.translatedText}"`
    );
  } catch (err: any) {
    assert(false, `English to Hindi translation failed: ${err?.message}`);
  }

  // 5. Client-to-Server Translation Endpoint Test (Hindi to English)
  try {
    const res = await fetch('http://localhost:3000/api/translate-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageText: 'नमस्ते आचार्य जी! क्या आप मेरे 10वें भाव के करियर की समीक्षा कर सकते हैं?',
        targetLang: 'en',
      }),
    });
    const json = await res.json();
    const hasEnglishText = Boolean(json.translatedText) && /Namaste|career|10th/i.test(json.translatedText);
    assert(
      res.ok && json.success && hasEnglishText,
      `Hindi to English translation proxy endpoint succeeded: "${json.translatedText}"`
    );
  } catch (err: any) {
    assert(false, `Hindi to English translation failed: ${err?.message}`);
  }

  console.log(`=== CHAT TRANSLATION SUITE COMPLETE: ${passed}/${total} PASSED ===`);
  return { total, passed, allPassed: passed === total };
}

// Auto-run if executed directly via CLI
if (process.argv[1]?.endsWith('translationService.test.ts')) {
  runTranslationTestSuite().then((res) => {
    process.exit(res.allPassed ? 0 : 1);
  });
}

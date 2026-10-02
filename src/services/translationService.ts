/**
 * Translation Service
 * Step 28 — Hindi-English Automatic Chat Translation Client Boundary
 */

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  detectedSourceLang?: 'en' | 'hi' | 'other';
  targetLang?: 'en' | 'hi';
  isAiTranslated?: boolean;
  error?: string;
}

export class TranslationService {
  /**
   * Helper: Detects whether text contains Devanagari Hindi characters
   */
  public detectLanguage(text: string): 'hi' | 'en' {
    if (!text) return 'en';
    const devanagariRegex = /[\u0900-\u097F]/;
    return devanagariRegex.test(text) ? 'hi' : 'en';
  }

  /**
   * Translates chat text via secure server proxy endpoint /api/translate-message
   */
  public async translateMessage(
    messageText: string,
    targetLang: 'en' | 'hi',
    sourceLang?: string
  ): Promise<TranslationResult> {
    if (!messageText || !messageText.trim()) {
      return {
        success: false,
        error: 'Message text is empty.',
      };
    }

    const detectedSource = sourceLang || this.detectLanguage(messageText);

    // Skip redundant same-language translation
    if (detectedSource === targetLang) {
      return {
        success: true,
        translatedText: messageText,
        detectedSourceLang: detectedSource as 'en' | 'hi',
        targetLang,
        isAiTranslated: false,
      };
    }

    try {
      const response = await fetch('/api/translate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageText,
          targetLang,
          sourceLang: detectedSource,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errJson.error || `Server returned status ${response.status}`,
          detectedSourceLang: detectedSource as 'en' | 'hi',
          targetLang,
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Translation request failed',
          detectedSourceLang: detectedSource as 'en' | 'hi',
          targetLang,
        };
      }

      return {
        success: true,
        translatedText: result.translatedText,
        detectedSourceLang: result.detectedSourceLang || detectedSource,
        targetLang: result.targetLang,
        isAiTranslated: result.isAiTranslated ?? true,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Network error requesting translation.',
        detectedSourceLang: detectedSource as 'en' | 'hi',
        targetLang,
      };
    }
  }
}

export const translationService = new TranslationService();

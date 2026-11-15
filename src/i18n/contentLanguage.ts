import type { LanguageCode } from '../types/meeting';

// 회의 주 언어를 모를 때의 기본값. 보통은 한국어 회의를 가정한다
export const DEFAULT_MEETING_LANGUAGE: LanguageCode = 'ko';

/**
 * 보는 사람 언어가 원문 언어와 다를 때만 번역을 보여 준다.
 * 회의 언어를 한국어로 고정하지 않기 위해 'ko' 와 비교하지 않고 원문 언어와 비교한다.
 */
export function needsTranslation(
  viewerLanguage: LanguageCode,
  contentLanguage: LanguageCode | 'auto' | undefined
): boolean {
  const source = !contentLanguage || contentLanguage === 'auto' ? DEFAULT_MEETING_LANGUAGE : contentLanguage;
  return viewerLanguage !== source;
}

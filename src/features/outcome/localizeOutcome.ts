import type { LanguageCode, OutcomeItem } from '../../types/meeting';

export interface LocalizedItem {
  // 내 언어로 읽을 문장
  text: string;
  // 내 언어와 다를 때만: 회의에서 쓴 원래 문장(확인용으로 옅게 보인다)
  original?: string;
}

/**
 * 회의 결과 항목을 내 언어로 고른다. 결과는 회의 주 언어(기본 한국어)로 쓰이고, 서버가 참여자 언어로 번역해 붙인다.
 * 번역이 아직 없으면 원문을 그대로 보인다.
 */
export function localizeItem(
  item: OutcomeItem,
  outcomeLanguage: LanguageCode | undefined,
  myLanguage: LanguageCode
): LocalizedItem {
  if ((outcomeLanguage ?? 'ko') === myLanguage) return { text: item.text };
  const translated = item.translations?.[myLanguage];
  if (!translated || translated === item.text) return { text: item.text };
  return { text: translated, original: item.text };
}

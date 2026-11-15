/**
 * Languages a participant can choose as "My Language".
 * Labels are written in each language's own script, as in the Figma.
 * Add or remove entries here; the login select and (later) the header
 * language dropdown both read from this list.
 */
export const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'es', label: 'Español' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

export const DEFAULT_LANGUAGE: LanguageCode = 'ko'

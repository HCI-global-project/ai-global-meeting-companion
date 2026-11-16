import React, { createContext, useContext, useEffect } from 'react';
import type { LanguageCode } from "../types/meeting";
import { TRANSLATIONS } from "./translations";
import type { TranslationDictionary } from "./translations";

interface I18nContextValue {
  uiLanguage: LanguageCode;
  setUiLanguage: (lang: LanguageCode) => void;
  t: TranslationDictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  uiLanguage: LanguageCode;
  onChangeUiLanguage: (lang: LanguageCode) => void;
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  uiLanguage,
  onChangeUiLanguage,
  children,
}) => {
  useEffect(() => {
    document.documentElement.lang = uiLanguage;
  }, [uiLanguage]);

  const value: I18nContextValue = {
    uiLanguage,
    setUiLanguage: onChangeUiLanguage,
    t: TRANSLATIONS[uiLanguage] ?? TRANSLATIONS.en,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

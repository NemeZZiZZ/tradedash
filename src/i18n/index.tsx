import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { detectLang, persistLang, isRtl, type Lang } from "./config";
import { translate } from "./translations";

export { LANGS, LANG_NAMES, chartLocale, isRtl, type Lang } from "./config";

type TFn = (key: string, params?: Record<string, string | number>) => string;

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFn;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((next: Lang) => {
    persistLang(next);
    setLangState(next);
  }, []);

  // Reflect language + direction on <html> for RTL languages (e.g. Arabic).
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl(lang) ? "rtl" : "ltr";
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: (key, params) => translate(lang, key, params) }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Shorthand when only the translate function is needed. */
export function useT(): TFn {
  return useI18n().t;
}

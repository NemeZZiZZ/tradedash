export const LANGS = [
  "en", "ru", "es", "fr", "de", "zh", "ja",
  "pt", "ko", "tr", "it", "pl", "id", "vi", "hi", "ar",
] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  ru: "Русский",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  zh: "中文",
  ja: "日本語",
  pt: "Português",
  ko: "한국어",
  tr: "Türkçe",
  it: "Italiano",
  pl: "Polski",
  id: "Bahasa Indonesia",
  vi: "Tiếng Việt",
  hi: "हिन्दी",
  ar: "العربية",
};

/** Right-to-left languages. */
export const RTL_LANGS: Lang[] = ["ar"];
export function isRtl(lang: Lang): boolean {
  return RTL_LANGS.includes(lang);
}

const STORAGE_KEY = "tradedash:lang";

function isLang(v: string | null): v is Lang {
  return !!v && (LANGS as readonly string[]).includes(v);
}

/** Map an app language to a klinecharts locale (only en-US / zh-CN are built in). */
export function chartLocale(lang: Lang): string {
  return lang === "zh" ? "zh-CN" : "en-US";
}

/**
 * Resolve the initial language: explicit user choice (localStorage) wins,
 * otherwise the first supported `navigator.languages` match, otherwise English.
 */
export function detectLang(): Lang {
  const saved = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (isLang(saved)) return saved;
  const prefs =
    typeof navigator !== "undefined"
      ? navigator.languages ?? [navigator.language]
      : [];
  for (const p of prefs) {
    const primary = p?.toLowerCase().split("-")[0];
    if (isLang(primary)) return primary;
  }
  return "en";
}

export function persistLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage unavailable */
  }
}

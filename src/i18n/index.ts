import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/i18n/locales/en.json";
import fa from "@/i18n/locales/fa.json";
import de from "@/i18n/locales/de.json";
import tr from "@/i18n/locales/tr.json";
import ar from "@/i18n/locales/ar.json";
import es from "@/i18n/locales/es.json";
import fr from "@/i18n/locales/fr.json";
import ru from "@/i18n/locales/ru.json";
import zh from "@/i18n/locales/zh.json";
import ko from "@/i18n/locales/ko.json";
import ja from "@/i18n/locales/ja.json";

const STORAGE_KEY = "relay_language";

function loadSavedLanguage(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "en";
  } catch {
    return "en";
  }
}

function saveLanguage(lng: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
}

const LANG_DIR_MAP: Record<string, "ltr" | "rtl"> = {
  en: "ltr", fa: "rtl", de: "ltr", tr: "ltr", ar: "rtl",
  es: "ltr", fr: "ltr", ru: "ltr", zh: "ltr", ko: "ltr", ja: "ltr",
};

function applyDir(lng: string): void {
  document.documentElement.dir = LANG_DIR_MAP[lng] ?? "ltr";
}

export interface SupportedLanguage {
  code: string;
  label: string;
  nativeLabel: string;
  dir: "ltr" | "rtl";
  isPlaceholder: boolean;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr", isPlaceholder: false },
  { code: "fa", label: "Persian", nativeLabel: "فارسی", dir: "rtl", isPlaceholder: false },
  { code: "de", label: "German", nativeLabel: "Deutsch", dir: "ltr", isPlaceholder: false },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe", dir: "ltr", isPlaceholder: false },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl", isPlaceholder: false },
  { code: "es", label: "Spanish", nativeLabel: "Español", dir: "ltr", isPlaceholder: false },
  { code: "fr", label: "French", nativeLabel: "Français", dir: "ltr", isPlaceholder: false },
  { code: "ru", label: "Russian", nativeLabel: "Русский", dir: "ltr", isPlaceholder: false },
  { code: "zh", label: "Chinese", nativeLabel: "中文", dir: "ltr", isPlaceholder: false },
  { code: "ko", label: "Korean", nativeLabel: "한국어", dir: "ltr", isPlaceholder: false },
  { code: "ja", label: "Japanese", nativeLabel: "日本語", dir: "ltr", isPlaceholder: false },
];

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fa: { translation: fa },
      de: { translation: de },
      tr: { translation: tr },
      ar: { translation: ar },
      es: { translation: es },
      fr: { translation: fr },
      ru: { translation: ru },
      zh: { translation: zh },
      ko: { translation: ko },
      ja: { translation: ja },
    },
    lng: loadSavedLanguage(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });

if (i18n.language) applyDir(i18n.language);

i18n.on("languageChanged", (lng) => {
  saveLanguage(lng);
  applyDir(lng);
});

export default i18n;

import { useEffect } from "react";
import type { Locale } from "./translations";
import { useI18n } from "./I18nProvider";

/** Keeps I18nProvider in sync when parent locale changes (e.g. loaded from user settings). */
export function LocaleSync({ locale }: { locale: Locale }) {
  const { setLocale } = useI18n();
  useEffect(() => {
    setLocale(locale);
  }, [locale, setLocale]);
  return null;
}

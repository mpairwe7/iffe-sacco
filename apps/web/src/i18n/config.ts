/**
 * i18n configuration.
 *
 * Two locales: English (default) and Luganda. Locale selection comes
 * from, in order:
 *   1. Cookie `iffe-locale` set by the LocaleSwitcher
 *   2. User's profile `locale` column (persisted across devices)
 *   3. Accept-Language header
 *   4. `defaultLocale`
 *
 * Translation files live in ./messages and are loaded lazily.
 */

export const locales = ["en", "lg"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  lg: "Luganda",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function resolveLocale(input: {
  cookie?: string;
  profile?: string;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(input.cookie)) return input.cookie;
  if (isLocale(input.profile)) return input.profile;

  if (input.acceptLanguage) {
    for (const part of input.acceptLanguage.split(",")) {
      const code = part.trim().split(";")[0].split("-")[0];
      if (isLocale(code)) return code;
    }
  }

  return defaultLocale;
}

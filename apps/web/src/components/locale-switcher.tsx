"use client";

/**
 * LocaleSwitcher — drops a cookie and reloads the page.
 *
 * A server-side route at /api/locale persists the choice to the user's
 * profile so the preference follows them across devices. Users who
 * never log in get cookie-only persistence, which is still sufficient
 * for the public-facing pages (login, register).
 */
import { useCallback, useTransition } from "react";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { useLocale, useTranslations } from "@/i18n/provider";

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const onChange = useCallback((next: Locale) => {
    startTransition(async () => {
      // 1-year cookie, SameSite=Lax, readable server-side.
      document.cookie = `iffe-locale=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      // Fire-and-forget persist to profile if authenticated.
      try {
        await fetch("/api/v1/auth/profile", {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": readCsrfToken() ?? "",
          },
          body: JSON.stringify({ locale: next }),
        });
      } catch {
        // non-fatal
      }
      window.location.reload();
    });
  }, []);

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t("common.language")}</span>
      <select
        aria-label={t("common.language")}
        value={currentLocale}
        onChange={(e) => onChange(e.target.value as Locale)}
        disabled={isPending}
        className="rounded-md border bg-background px-2 py-1"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeLabels[loc]}
          </option>
        ))}
      </select>
    </label>
  );
}

function readCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  for (const part of document.cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "csrf-token") return rest.join("=");
  }
  return undefined;
}

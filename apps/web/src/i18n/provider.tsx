"use client";

/**
 * I18nProvider — minimal client-side i18n context.
 *
 * This is a deliberately small shim: for a single RSC-heavy app we
 * don't need the full next-intl surface yet, and we want the bundle
 * footprint to stay small. When the translator count grows beyond a
 * few hundred strings, swap this for `next-intl` or `@lingui/core`
 * without changing consumer call sites (both expose a `t()` function).
 */
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./config";

interface I18nContextValue {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  locale: Locale;
  messages: Record<string, unknown>;
  children: ReactNode;
}

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const parts = key.split(".");
      let current: unknown = messages;
      for (const part of parts) {
        if (current == null || typeof current !== "object") break;
        current = (current as Record<string, unknown>)[part];
      }
      if (typeof current !== "string") return key;
      return format(current, params);
    },
    [messages],
  );

  const value = useMemo(() => ({ locale, t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslations(): (key: string, params?: Record<string, string | number>) => string {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback to returning the key — lets components render during SSR boot.
    return (key) => key;
  }
  return ctx.t;
}

export function useLocale(): Locale {
  const ctx = useContext(I18nContext);
  return (ctx?.locale as Locale) ?? "en";
}

/**
 * Tiny ICU-like formatter — supports {name} substitution and
 * `{count, plural, one {...} other {...}}` pluralization, which is
 * all we need for the current message set. If the format gets more
 * complex (gender, select, nested), upgrade to `@formatjs/icu-messageformat-parser`.
 */
function format(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;

  // Plural: {count, plural, =0 {...} one {...} other {...}}
  template = template.replace(/\{(\w+),\s*plural,([\s\S]*?)\}/g, (_match, key, branches: string) => {
    const value = Number(params[key] ?? 0);
    const cases = parsePluralCases(branches);
    let chosen = cases.other ?? "";
    if (value === 0 && cases["=0"]) chosen = cases["=0"];
    else if (value === 1 && cases.one) chosen = cases.one;
    else if (cases.other) chosen = cases.other;
    return chosen.replace(/#/g, String(value));
  });

  // Simple: {name}
  template = template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });

  return template;
}

function parsePluralCases(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  const regex = /(=?\w+)\s*\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source))) {
    out[match[1]] = match[2];
  }
  return out;
}

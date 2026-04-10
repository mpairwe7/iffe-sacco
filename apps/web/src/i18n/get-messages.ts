/**
 * Lazy message loader. Imports the JSON file for the active locale so
 * only one locale's messages ship per request/chunk.
 */
import type { Locale } from "./config";

const loaders: Record<Locale, () => Promise<Record<string, any>>> = {
  en: () => import("./messages/en.json").then((m) => m.default ?? m),
  lg: () => import("./messages/lg.json").then((m) => m.default ?? m),
};

export async function getMessages(locale: Locale): Promise<Record<string, any>> {
  const loader = loaders[locale] ?? loaders.en;
  return loader();
}

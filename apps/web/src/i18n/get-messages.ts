/**
 * Lazy message loader. Imports the JSON file for the active locale so
 * only one locale's messages ship per request/chunk.
 */
import type { Locale } from "./config";

type Messages = Record<string, unknown>;

const loaders: Record<Locale, () => Promise<Messages>> = {
  en: () => import("./messages/en.json").then((m) => (m.default ?? m) as Messages),
  lg: () => import("./messages/lg.json").then((m) => (m.default ?? m) as Messages),
};

export async function getMessages(locale: Locale): Promise<Messages> {
  const loader = loaders[locale] ?? loaders.en;
  return loader();
}

/**
 * Visually-hidden live region for announcing dynamic updates to screen
 * readers (toast content, form submission results, async state changes).
 *
 * Mount once at the root layout. Use `useAnnouncer()` to push messages.
 *
 *   const { announce } = useAnnouncer();
 *   onSuccess: () => announce("Deposit submitted");
 *
 * Messages use aria-live="polite" by default (they wait for the current
 * announcement to finish). Pass `{ assertive: true }` for urgent errors.
 */
"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

interface AnnouncerContextValue {
  announce: (message: string, options?: { assertive?: boolean }) => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");
  const timeoutRef = useRef<number | null>(null);

  const announce = useCallback((message: string, options?: { assertive?: boolean }) => {
    if (!message) return;
    if (options?.assertive) {
      setAssertiveMessage(message);
    } else {
      setPoliteMessage(message);
    }
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setPoliteMessage("");
      setAssertiveMessage("");
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="live-region-polite">
        {politeMessage}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
        className="sr-only"
        data-testid="live-region-assertive"
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnouncer(): AnnouncerContextValue {
  const ctx = useContext(AnnouncerContext);
  if (!ctx) {
    return {
      announce: () => undefined,
    };
  }
  return ctx;
}

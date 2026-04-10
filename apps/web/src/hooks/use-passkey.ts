"use client";

/**
 * Passkey (WebAuthn) browser hook.
 *
 * Wraps @simplewebauthn/browser so components call `enroll()` /
 * `login()` without importing raw WebAuthn APIs. Errors are normalized
 * to friendly messages you can show in a toast.
 */
import { useCallback, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";

type Status = "idle" | "working" | "done" | "error";

interface UsePasskeyOptions {
  onLoggedIn?: () => void;
}

export function usePasskey(options: UsePasskeyOptions = {}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const supported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return "credentials" in navigator && "PublicKeyCredential" in window;
  }, []);

  const enroll = useCallback(async (nickname?: string) => {
    setError(null);
    setStatus("working");
    try {
      const { startRegistration } = await import("@simplewebauthn/browser");
      const options = await apiClient.post<any>("/passkeys/register/options", {});
      const attResp = await startRegistration({ optionsJSON: options });
      await apiClient.post<any>("/passkeys/register/verify", { response: attResp, nickname });
      setStatus("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to enrol passkey";
      setError(friendly(message));
      setStatus("error");
    }
  }, []);

  const login = useCallback(
    async (email?: string) => {
      setError(null);
      setStatus("working");
      try {
        const { startAuthentication } = await import("@simplewebauthn/browser");
        const options = await apiClient.post<any>("/passkeys/login/options", { email });
        const assertion = await startAuthentication({ optionsJSON: options });
        await apiClient.post<any>("/passkeys/login/verify", { response: assertion });
        setStatus("done");
        options?.onLoggedIn?.();
        // Prefer a hard navigation so the server layout re-reads /auth/me.
        if (typeof window !== "undefined") {
          window.location.replace("/");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Passkey login failed";
        setError(friendly(message));
        setStatus("error");
      }
    },
    [options],
  );

  return { supported, status, error, enroll, login };
}

function friendly(message: string): string {
  if (/NotAllowedError/i.test(message)) return "Request cancelled or the authenticator refused.";
  if (/InvalidStateError/i.test(message)) return "This device is already enrolled.";
  if (/SecurityError/i.test(message)) return "Your browser blocked the request. Check the site origin.";
  if (/not installed/i.test(message)) return "Passkeys are not yet enabled on this deployment.";
  return message;
}

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { useState } from "react";
import { I18nProvider } from "@/i18n/provider";
import type { Locale } from "@/i18n/config";
import { AnnouncerProvider } from "@/components/ui/live-region";

interface ProvidersProps {
  children: React.ReactNode;
  locale: Locale;
  messages: Record<string, unknown>;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
        <I18nProvider locale={locale} messages={messages}>
          <AnnouncerProvider>
            <TooltipProvider delayDuration={300}>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  className: "glass-strong !rounded-lg !border-white/30 !shadow-xl",
                  duration: 4000,
                }}
                richColors
                closeButton
              />
            </TooltipProvider>
          </AnnouncerProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

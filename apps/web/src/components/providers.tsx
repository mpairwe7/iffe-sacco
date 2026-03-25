"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
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
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "glass-strong !rounded-xl !border-white/30 !shadow-xl",
              duration: 4000,
            }}
            richColors
            closeButton
          />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

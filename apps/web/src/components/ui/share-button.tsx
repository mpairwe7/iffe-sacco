"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
  variant?: "primary" | "secondary" | "glass" | "icon";
  label?: string;
}

// Crisp inline SVGs for social platforms
function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.19-.09-1.12-.55-1.3-.61-.17-.07-.3-.1-.43.1-.13.19-.51.61-.63.73-.11.12-.23.13-.42.04-.19-.09-.82-.3-1.56-.96-.58-.51-.97-1.15-1.08-1.34-.11-.19-.01-.3.08-.39.09-.08.19-.23.29-.34.09-.12.13-.2.19-.34.07-.13.03-.25-.02-.34-.05-.09-.43-1.04-.6-1.42-.16-.38-.33-.33-.45-.33h-.38c-.13 0-.34.05-.52.25-.17.19-.68.67-.68 1.63s.7 1.89.8 2.02c.09.13 1.37 2.1 3.32 2.94.46.2.83.32 1.11.41.47.15.89.13 1.23.08.38-.06 1.12-.46 1.28-.9.16-.45.16-.83.11-.9-.05-.07-.17-.12-.36-.21" />
    </svg>
  );
}

function TwitterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function TelegramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function ShareButton({
  title = "IFFE Bbenhe Development SACCO",
  text = "Empowering Financial Freedom — Secure savings, affordable loans, and community growth in Jinja City, Uganda. Obwegaisi Mu Kwisanhia.",
  url = typeof window !== "undefined" ? window.location.href : "https://iffe-sacco.vercel.app",
  className,
  variant = "glass",
  label = "Share",
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareData = {
    title,
    text,
    url,
  };

  async function handleShareClick() {
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setOpen(true);
        }
        return;
      }
    }
    setOpen(true);
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${title} — ${text}`);

  const shareChannels = [
    {
      name: "WhatsApp",
      icon: WhatsAppIcon,
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      color: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    {
      name: "Twitter / X",
      icon: TwitterIcon,
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      color: "bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 text-white",
    },
    {
      name: "Facebook",
      icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      name: "LinkedIn",
      icon: LinkedInIcon,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "bg-blue-700 hover:bg-blue-800 text-white",
    },
    {
      name: "Telegram",
      icon: TelegramIcon,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      color: "bg-sky-500 hover:bg-sky-600 text-white",
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={handleShareClick}
        aria-label={`Share ${title}`}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all min-h-[44px]",
          variant === "icon" && "p-2.5 min-w-[44px] text-text-muted hover:text-primary hover:bg-primary/10",
          variant === "glass" && "px-5 py-2.5 glass text-text hover:bg-white/80 dark:hover:bg-white/10 shadow-sm",
          variant === "primary" &&
            "px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5",
          variant === "secondary" && "px-5 py-2.5 border border-primary/30 text-primary hover:bg-primary/10",
          className,
        )}
      >
        <Share2 className="w-4 h-4" aria-hidden="true" />
        {variant !== "icon" && <span>{label}</span>}
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in" />
          <Dialog.Content
            aria-label="Share on social media"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md glass-card rounded-2xl p-6 z-50 shadow-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:outline-none"
          >
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                Share with Community
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  ✕
                </button>
              </Dialog.Close>
            </div>

            <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Share IFFE Bbenhe SACCO with friends, family, or colleagues across your favorite platforms.
            </Dialog.Description>

            {/* Social Share Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
              {shareChannels.map((channel) => (
                <a
                  key={channel.name}
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all min-h-[44px] justify-center",
                    channel.color,
                  )}
                >
                  <channel.icon className="w-4 h-4" />
                  <span>{channel.name}</span>
                </a>
              ))}
            </div>

            {/* Copy Link Input */}
            <div>
              <label
                htmlFor="share-link-input"
                className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2"
              >
                Page Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="share-link-input"
                  type="text"
                  readOnly
                  value={url}
                  aria-label="Share URL"
                  className="flex-1 px-3.5 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono text-gray-700 dark:text-gray-300 truncate focus:outline-none"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark transition-colors min-h-[44px]"
                  aria-label="Copy link to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

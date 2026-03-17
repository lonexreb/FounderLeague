"use client";

import { useState } from "react";
import { Share2, Twitter, Copy, Check } from "lucide-react";

interface Props {
  rank: number;
  score: number;
  category: string;
  leagueName: string;
  userName: string;
}

export function ShareButton({ rank, score, category, leagueName, userName }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const ogUrl = `/api/og?rank=${rank}&score=${score.toFixed(1)}&category=${encodeURIComponent(category)}&league=${encodeURIComponent(leagueName)}&name=${encodeURIComponent(userName)}`;

  const shareText = `I'm ranked #${rank} in my FounderLeague this week 🏆 ${category}: ${score.toFixed(1)}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-500 hover:text-white transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-slate-800 bg-slate-950 p-2 shadow-lg">
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              onClick={() => setOpen(false)}
            >
              <Twitter className="h-4 w-4" />
              Share on X
            </a>
            <button
              onClick={handleCopyLink}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy text"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

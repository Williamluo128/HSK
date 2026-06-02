import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Resolve a media asset (audio / image) against the configured media base URL. */
export function mediaUrl(path: string): string {
  const raw = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim();
  const base = raw && raw !== "/" ? raw.replace(/\/+$/, "") : "/media";
  const clean = path.replace(/^\.?\/+/, "");
  // Avoid audio/foo.mp3 when base is empty on Vercel (resolves under /lessons/…).
  if (!base || base === "") {
    return `/media/${clean}`;
  }
  return `${base}/${clean}`;
}

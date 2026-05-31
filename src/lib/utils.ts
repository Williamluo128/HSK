import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Resolve a media asset (audio / image) against the configured media base URL. */
export function mediaUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "/media";
  const clean = path.replace(/^\.?\/+/, "");
  return `${base.replace(/\/+$/, "")}/${clean}`;
}

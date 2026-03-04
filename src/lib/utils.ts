import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, utc = false): string {
  const d = new Date(date);
  // Use UTC for date-only fields (e.g. event.date stored as midnight UTC)
  // to prevent timezone shift showing the wrong day
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(utc ? { timeZone: "UTC" } : {}),
  };
  return d.toLocaleDateString("es-MX", opts);
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Convert Google Drive share/download URLs to a direct image URL.
 * Supports formats:
 *   - https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
 *   - https://drive.google.com/open?id=FILE_ID
 *   - https://drive.google.com/uc?id=FILE_ID&export=view
 *   - https://drive.usercontent.google.com/download?id=FILE_ID&...
 * Returns the original URL if it's not a recognised Google Drive format.
 */
export function getDirectImageUrl(url: string): string {
  if (!url) return url;

  // drive.google.com/file/d/FILE_ID/...
  let m = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;

  // drive.google.com/open?id=FILE_ID
  m = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;

  // drive.google.com/uc?...id=FILE_ID
  m = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;

  // drive.usercontent.google.com/download?id=FILE_ID
  m = url.match(/drive\.usercontent\.google\.com\/download\?.*id=([a-zA-Z0-9_-]+)/);
  if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;

  return url;
}

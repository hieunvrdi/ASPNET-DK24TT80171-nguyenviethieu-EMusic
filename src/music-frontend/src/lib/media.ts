/**
 * Resolve a stored media path (from API) to a displayable URL.
 *
 * Stored paths can be:
 *   - "images/artists/guid.jpg"   (legacy, no leading slash)
 *   - "/images/artists/guid.jpg"  (new, with leading slash)
 *
 * Both are served as static files from the API origin.
 * NEXT_PUBLIC_API_URL = "https://localhost:7xxx" in dev, "" if using Next.js proxy.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Normalize: ensure single leading slash
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

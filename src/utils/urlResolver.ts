/**
 * Resolves the appropriate production/public base URL for deep links.
 *
 * Prevents 403 (Forbidden) errors caused by internal Google Cloud Run
 * development preview URLs (ais-dev-*.run.app) by automatically converting them
 * to the publicly shareable preview URL (ais-pre-*.run.app) or using
 * explicitly configured production URLs (NEXT_PUBLIC_APP_URL / APP_URL / VERCEL_URL).
 */
export function resolvePublicAppUrl(customUrl?: string): string {
  // 1. If a custom URL is explicitly provided and non-empty, prioritize it
  if (customUrl && customUrl.trim()) {
    let url = customUrl.trim().replace(/\/$/, '');
    if (url.includes('ais-dev-') && url.includes('.run.app')) {
      url = url.replace('ais-dev-', 'ais-pre-');
    }
    return url;
  }

  // 2. Check Vite client-side environment variables
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const metaEnv = (import.meta as any).env;
    const vitePublicUrl =
      metaEnv.VITE_PUBLIC_APP_URL ||
      metaEnv.VITE_APP_URL ||
      metaEnv.NEXT_PUBLIC_APP_URL;
    if (vitePublicUrl && typeof vitePublicUrl === 'string' && vitePublicUrl.trim()) {
      let url = vitePublicUrl.trim().replace(/\/$/, '');
      if (url.includes('ais-dev-') && url.includes('.run.app')) {
        url = url.replace('ais-dev-', 'ais-pre-');
      }
      return url;
    }
  }

  // 3. Check process.env (available in Node.js / SSR / build config)
  if (typeof process !== 'undefined' && process.env) {
    const envUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      process.env.PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

    if (envUrl && envUrl.trim()) {
      let url = envUrl.trim().replace(/\/$/, '');
      if (url.includes('ais-dev-') && url.includes('.run.app')) {
        url = url.replace('ais-dev-', 'ais-pre-');
      }
      return url;
    }
  }

  // 4. Client-side browser window fallback
  if (typeof window !== 'undefined' && window.location) {
    let origin = window.location.origin;
    // Auto-convert Google Cloud Run ais-dev- URLs to shareable ais-pre- URLs
    if (origin.includes('ais-dev-') && origin.includes('.run.app')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    return origin.replace(/\/$/, '');
  }

  return 'http://localhost:3000';
}

/**
 * Builds standard deep link URL for floor execution page (/floor):
 * Format: ${baseUrl}/floor?orderId={id}&processId={pid}
 */
export function buildFloorDeepLink(
  orderId: string,
  processId: string = 'P0',
  customBaseUrl?: string
): string {
  const baseUrl = resolvePublicAppUrl(customBaseUrl);
  return `${baseUrl}/floor?orderId=${encodeURIComponent(orderId)}&processId=${encodeURIComponent(processId)}`;
}

// Alias for backward compatibility
export const buildFloorMesDeepLink = buildFloorDeepLink;

export const DEFAULT_PRODUCTION_APP_URL = 'https://jstech-mes.vercel.app';

/**
 * Resolves the appropriate production/public base URL for deep links.
 *
 * Prevents 403 (Forbidden) / 404 (Not Found) errors by prioritizing explicitly
 * configured production URLs (APP_URL / NEXT_PUBLIC_APP_URL / VITE_APP_URL / VERCEL_URL)
 * and providing a reliable production default (https://jstech-mes.vercel.app)
 * when running inside ephemeral dev sandboxes so SMS deep links work seamlessly on mobile.
 */
export function resolvePublicAppUrl(customUrl?: string): string {
  const normalize = (u?: string): string => {
    if (!u) return '';
    let url = u.trim().replace(/\/$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url;
  };

  // 1. If a custom URL is explicitly provided and non-empty, prioritize it
  if (customUrl && customUrl.trim()) {
    let url = normalize(customUrl);
    if (url.includes('ais-dev-') && url.includes('.run.app')) {
      url = url.replace('ais-dev-', 'ais-pre-');
    }
    return url;
  }

  // 2. Check configured production domain environment variables (Highest priority)
  let envUrl = '';
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const metaEnv = (import.meta as any).env;
    envUrl =
      metaEnv.VITE_APP_URL ||
      metaEnv.VITE_PUBLIC_APP_URL ||
      metaEnv.NEXT_PUBLIC_APP_URL ||
      metaEnv.APP_URL ||
      '';
  }
  if (!envUrl && typeof process !== 'undefined' && process.env) {
    envUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.PUBLIC_APP_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
      '';
  }

  if (envUrl && envUrl.trim()) {
    const normalizedEnv = normalize(envUrl);
    // If env is set to a real production domain, prioritize it!
    if (!normalizedEnv.includes('ais-dev-') && !normalizedEnv.includes('localhost')) {
      return normalizedEnv;
    }
  }

  // 3. Client-side browser window origin check
  if (typeof window !== 'undefined' && window.location) {
    let origin = window.location.origin;
    // If running on Vercel or custom production domain, use origin directly
    if (
      !origin.includes('ais-dev-') &&
      !origin.includes('ais-pre-') &&
      !origin.includes('localhost') &&
      !origin.includes('127.0.0.1')
    ) {
      return origin.replace(/\/$/, '');
    }
  }

  // 4. Default to Vercel production domain for external SMS/Email deep links
  return DEFAULT_PRODUCTION_APP_URL;
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


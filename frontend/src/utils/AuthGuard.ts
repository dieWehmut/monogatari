import { staticAuthDisabled, staticStoryMode } from '../lib/staticMode';

const PUBLIC_PATHS = ['/login', '/register'];

/**
 * Returns true if the given pathname is publicly accessible (no auth required).
 */
export function isPublicPath(pathname: string): boolean {
  if (staticAuthDisabled) return true;
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (staticStoryMode && (pathname === '/story' || pathname.startsWith('/story/'))) return true;
  if (pathname.startsWith('/invites/')) return true;
  if (pathname.startsWith('/auth/')) return true;
  return false;
}

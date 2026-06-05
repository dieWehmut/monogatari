const PUBLIC_PATHS = ['/login', '/register'];
const STATIC_STORY_MODE = import.meta.env.VITE_STATIC_STORY
  ? import.meta.env.VITE_STATIC_STORY === 'true'
  : import.meta.env.DEV;

/**
 * Returns true if the given pathname is publicly accessible (no auth required).
 */
export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (STATIC_STORY_MODE && (pathname === '/story' || pathname.startsWith('/story/'))) return true;
  if (pathname.startsWith('/invites/')) return true;
  if (pathname.startsWith('/auth/')) return true;
  return false;
}

import { type MouseEvent } from 'react';
import { LogOut, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AuthUser } from '../types/image';
import { useTranslation } from '../hooks/useTranslation';
import { staticAuthDisabled } from '../lib/staticMode';

interface AuthButtonProps {
  authenticated: boolean;
  loading: boolean;
  user: AuthUser | null;
  onLogout: () => Promise<void>;
}

const iconBtnCls =
  'inline-flex h-9 w-9 items-center justify-center text-[var(--text-main)] transition-all duration-300 hover:scale-110 hover:text-[var(--text-accent)] active:scale-95';

export function AuthButton({
  authenticated,
  loading,
  onLogout,
  user,
}: AuthButtonProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (staticAuthDisabled && !authenticated) return;
    if (!authenticated || !user) {
      navigate('/login');
      return;
    }
    void onLogout();
  };

  return (
    <button
      aria-busy={loading}
      aria-disabled={staticAuthDisabled && !authenticated}
      aria-label={authenticated ? `${t('nav.logout')} ${user?.login ?? ''}`.trim() : t('nav.login')}
      className={`${iconBtnCls} ${loading ? 'opacity-70' : ''} ${staticAuthDisabled && !authenticated ? 'pointer-events-none opacity-40' : ''}`}
      onClick={handleClick}
      type="button"
    >
      {authenticated && user ? <LogOut size={24} /> : <UserRound size={24} />}
    </button>
  );
}

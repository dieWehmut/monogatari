const DEV_BYPASS_AUTH_KEY = 'story_dev_bypass_auth';

const isEnabledValue = (value: string | null | undefined) =>
  value === '1' || value === 'true' || value === 'yes';

export const canUseDevAuthBypass = () => import.meta.env.DEV;

export const getDevAuthBypass = () => {
  if (!canUseDevAuthBypass()) return false;

  if (isEnabledValue(import.meta.env.VITE_DEV_BYPASS_AUTH)) {
    return true;
  }

  try {
    return isEnabledValue(window.localStorage.getItem(DEV_BYPASS_AUTH_KEY));
  } catch {
    return false;
  }
};

export const setDevAuthBypass = (enabled: boolean) => {
  if (!canUseDevAuthBypass()) return;

  try {
    if (enabled) {
      window.localStorage.setItem(DEV_BYPASS_AUTH_KEY, '1');
      return;
    }
    window.localStorage.removeItem(DEV_BYPASS_AUTH_KEY);
  } catch {
    // ignore storage errors
  }
};

export const shouldBypassAuthRequired = (authenticated: boolean) =>
  authenticated || getDevAuthBypass();

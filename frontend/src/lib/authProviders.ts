const isEnabled = (value: string | undefined, defaultValue = true) => {
  if (value === undefined || value === '') return defaultValue;
  return !['0', 'false', 'off', 'no'].includes(value.toLowerCase());
};

export const authProviderConfig = {
  github: isEnabled(import.meta.env.VITE_AUTH_ENABLE_GITHUB, true),
  google: isEnabled(import.meta.env.VITE_AUTH_ENABLE_GOOGLE, true),
  email: isEnabled(import.meta.env.VITE_AUTH_ENABLE_EMAIL, true),
  register: isEnabled(import.meta.env.VITE_AUTH_ENABLE_REGISTER, true),
};

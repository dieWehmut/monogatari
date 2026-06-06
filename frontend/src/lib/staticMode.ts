export const staticStoryMode = import.meta.env.VITE_STATIC_STORY
  ? import.meta.env.VITE_STATIC_STORY === 'true'
  : import.meta.env.DEV;

export const staticAuthDisabled = staticStoryMode && import.meta.env.VITE_STATIC_AUTH === 'false';

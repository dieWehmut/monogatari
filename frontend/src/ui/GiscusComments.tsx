import { useEffect, useRef } from 'react';

interface GiscusCommentsProps {
  term: string;
  theme: 'dark' | 'light';
}

const config = {
  repo: import.meta.env.VITE_CAPTURE_GISCUS_REPO || import.meta.env.VITE_GISCUS_REPO || '',
  repoId: import.meta.env.VITE_CAPTURE_GISCUS_REPO_ID || import.meta.env.VITE_GISCUS_REPO_ID || '',
  category: import.meta.env.VITE_CAPTURE_GISCUS_CATEGORY || import.meta.env.VITE_GISCUS_CATEGORY || '',
  categoryId: import.meta.env.VITE_CAPTURE_GISCUS_CATEGORY_ID || import.meta.env.VITE_GISCUS_CATEGORY_ID || '',
  mapping: import.meta.env.VITE_CAPTURE_GISCUS_MAPPING || import.meta.env.VITE_GISCUS_MAPPING || 'specific',
  strict: import.meta.env.VITE_CAPTURE_GISCUS_STRICT || import.meta.env.VITE_GISCUS_STRICT || '0',
  reactionsEnabled: import.meta.env.VITE_CAPTURE_GISCUS_REACTIONS_ENABLED || import.meta.env.VITE_GISCUS_REACTIONS_ENABLED || '1',
  inputPosition: import.meta.env.VITE_CAPTURE_GISCUS_INPUT_POSITION || import.meta.env.VITE_GISCUS_INPUT_POSITION || 'bottom',
  theme: import.meta.env.VITE_CAPTURE_GISCUS_THEME || import.meta.env.VITE_GISCUS_THEME || 'nexus',
  lang: import.meta.env.VITE_CAPTURE_GISCUS_LANG || import.meta.env.VITE_GISCUS_LANG || 'zh-CN',
};

const hasGiscusConfig = Boolean(config.repo && config.repoId && config.category && config.categoryId);

function resolveGiscusTheme(appTheme: 'dark' | 'light') {
  if (config.theme === 'nexus') {
    const themeFile = appTheme === 'light' ? 'giscus-nexus-light.css' : 'giscus-nexus.css';
    return new URL(`${import.meta.env.BASE_URL}${themeFile}`, window.location.origin).toString();
  }

  if (config.theme) return config.theme;
  return appTheme === 'light' ? 'light' : 'dark';
}

export function GiscusComments({ term, theme }: GiscusCommentsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasGiscusConfig) return undefined;

    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', config.repo);
    script.setAttribute('data-repo-id', config.repoId);
    script.setAttribute('data-category', config.category);
    script.setAttribute('data-category-id', config.categoryId);
    script.setAttribute('data-mapping', config.mapping);
    script.setAttribute('data-strict', config.strict);
    script.setAttribute('data-reactions-enabled', config.reactionsEnabled);
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', config.inputPosition);
    script.setAttribute('data-theme', resolveGiscusTheme(theme));
    script.setAttribute('data-lang', config.lang);
    script.setAttribute('data-loading', 'lazy');

    if (config.mapping === 'specific') {
      script.setAttribute('data-term', term);
    }

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [term, theme]);

  if (!hasGiscusConfig) {
    return import.meta.env.DEV ? (
      <section aria-label="Comments" className="giscus-comments giscus-comments--inline">
        <p className="giscus-comments__empty">Configure VITE_CAPTURE_GISCUS_* to enable GitHub comments.</p>
      </section>
    ) : null;
  }

  return (
    <section aria-label="Comments" className="giscus-comments giscus-comments--inline">
      <div className="giscus-comments__container" ref={containerRef} />
    </section>
  );
}

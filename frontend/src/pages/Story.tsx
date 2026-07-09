import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Calendar, Image as ImageIcon, LoaderCircle, MessageCircle, Tag } from 'lucide-react';
import { CardDetail } from '../ui/CardDetail';
import { AlbumHeader } from '../layouts/AlbumHeader';
import { Header } from '../layouts/Header';
import { ImageCard } from '../layouts/ImageCard';
import { FloatingActions } from '../layouts/FloatingActions';
import { TimeColumn } from '../layouts/TimeColumn';
import { UploadButton } from '../layouts/UploadButton';
import { ThemeButton } from '../layouts/ThemeButton';
import { useAuth } from '../hooks/useAuth';
import { useImages } from '../hooks/useImages';
import { useFollows } from '../hooks/useFollows';
import { useTranslation } from '../hooks/useTranslation';
import { getCaptureAssets } from '../data/capture';
import { ImageViewer } from '../ui/ImageViewer';
import { GiscusComments } from '../ui/GiscusComments';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { MediaItem } from '../lib/media';
import type { CaptureAsset, CaptureSourceRef } from '../types/capture';
import type { TimelineMonth } from '../types/image';

interface StoryProps {
  activeMonth: TimelineMonth | null;
  auth: ReturnType<typeof useAuth>;
  follows: ReturnType<typeof useFollows>;
  images: ReturnType<typeof useImages>;
  onActiveMonthChange: (month: TimelineMonth) => void;
  onThemeToggle: () => void;
  onTimelineClose: () => void;
  onTimelineToggle: () => void;
  theme: 'dark' | 'light';
  timelineOpen: boolean;
}

interface CaptureProps {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

type CaptureGroup = {
  id: string;
  date: string;
  timestamp: number;
  tags: string[];
  sources: CaptureSourceRef[];
  assets: CaptureAsset[];
};

type CaptureMonth = {
  key: string;
  label: string;
  timestamp: number;
  groups: CaptureGroup[];
};

type CaptureYear = {
  key: string;
  label: string;
  timestamp: number;
  months: CaptureMonth[];
};

type TimeSortOrder = 'desc' | 'asc';

const storyScrollStorageKey = 'monogatari:story-scroll-y';

const captureDateFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'UTC',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function saveStoryScrollPosition() {
  window.sessionStorage.setItem(storyScrollStorageKey, String(window.scrollY));
}

function getCaptureTimestamp(date?: string) {
  if (!date) return 0;
  const normalized = date.replace(/\//g, '-');
  const match = normalized.match(/^\s*(\d{4}-\d{2}-\d{2})/);
  return Date.parse(match?.[1] || normalized) || 0;
}

function getCaptureDateKey(date?: string) {
  const timestamp = getCaptureTimestamp(date);
  if (!timestamp) return 'Undated';
  return captureDateFormatter.format(new Date(timestamp));
}

function slugCaptureValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'undated';
}

function getStandaloneGroupKey(asset: CaptureAsset) {
  const match = asset.image.match(/(?:^|\/)capture-assets\/standalone\/([^/]+\/[^/]+)\//);
  return match ? `standalone/${match[1]}` : '';
}

function getDocsGroupKey(asset: CaptureAsset) {
  const match = asset.image.match(/(?:^|\/)capture-assets\/docs\/([^/]+)\//);
  return match ? `docs/${match[1]}` : '';
}

function getCaptureGroupKey(asset: CaptureAsset) {
  return (
    getStandaloneGroupKey(asset) ||
    getDocsGroupKey(asset) ||
    String(asset.date || '').trim() ||
    asset.id
  );
}

function formatCaptureDateOnly(date?: string) {
  if (!date || date === 'Undated') return '';
  const timestamp = getCaptureTimestamp(date);
  if (!timestamp) return date.replace(/[ T]\d{2}:\d{2}(?::\d{2})?(?:\s*(?:Z|[+-]\d{2}:?\d{2}))?$/, '');
  return captureDateFormatter.format(new Date(timestamp)).replace(/-/g, '/');
}

function getCaptureMonthLabel(key: string, language: string) {
  if (key === 'undated') return 'Undated';
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) return key;
  return new Intl.DateTimeFormat(language, { month: 'numeric' }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function mergeUnique(existing: string[], incoming: string[]) {
  return Array.from(new Set([...existing, ...incoming].filter(Boolean)));
}

function mergeCaptureSources(existing: CaptureSourceRef[], incoming: CaptureSourceRef[]) {
  const byKey = new Map(existing.map((source) => [`${source.type}:${source.id}`, source]));
  for (const source of incoming) {
    byKey.set(`${source.type}:${source.id}`, source);
  }
  return Array.from(byKey.values()).sort((a, b) => a.title.localeCompare(b.title));
}

function compareCaptureTimestamp(left: number, right: number, order: TimeSortOrder) {
  return order === 'asc' ? left - right : right - left;
}

function compareCaptureKey(left: string, right: string, order: TimeSortOrder) {
  return order === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
}

function groupCaptureAssets(assets: CaptureAsset[], order: TimeSortOrder): CaptureGroup[] {
  const groups = new Map<string, CaptureGroup>();

  for (const asset of assets) {
    const date = getCaptureDateKey(asset.date);
    const groupKey = getCaptureGroupKey(asset);
    const group = groups.get(groupKey) ?? {
      id: `capture-${slugCaptureValue(groupKey)}`,
      date,
      timestamp: getCaptureTimestamp(asset.date),
      tags: [],
      sources: [],
      assets: [],
    };

    group.tags = mergeUnique(group.tags, asset.tags || []);
    group.sources = mergeCaptureSources(group.sources, asset.sourceRefs || []);
    group.assets.push(asset);
    groups.set(groupKey, group);
  }

  return [...groups.values()].sort(
    (a, b) => compareCaptureTimestamp(a.timestamp, b.timestamp, order) || compareCaptureKey(a.id, b.id, order)
  );
}

function groupCaptureByYearAndMonth(groups: CaptureGroup[], order: TimeSortOrder, language: string): CaptureYear[] {
  const years = new Map<string, CaptureYear>();

  for (const group of groups) {
    const yearKey = group.date === 'Undated' ? 'undated' : group.date.slice(0, 4);
    const monthKey = group.date === 'Undated' ? 'undated' : group.date.slice(0, 7);
    const year = years.get(yearKey) ?? {
      key: yearKey,
      label: yearKey === 'undated' ? 'Undated' : yearKey,
      timestamp: group.timestamp,
      months: [],
    };

    let month = year.months.find((item) => item.key === monthKey);
    if (!month) {
      month = {
        key: monthKey,
        label: getCaptureMonthLabel(monthKey, language),
        timestamp: group.timestamp,
        groups: [],
      };
      year.months.push(month);
    }

    year.timestamp = Math.max(year.timestamp, group.timestamp);
    month.timestamp = Math.max(month.timestamp, group.timestamp);
    month.groups.push(group);
    years.set(yearKey, year);
  }

  return [...years.values()]
    .map((year) => ({
      ...year,
      months: year.months
        .map((month) => ({
          ...month,
          groups: month.groups.slice().sort((a, b) => compareCaptureTimestamp(a.timestamp, b.timestamp, order)),
        }))
        .sort((a, b) => compareCaptureTimestamp(a.timestamp, b.timestamp, order)),
    }))
    .sort((a, b) => compareCaptureTimestamp(a.timestamp, b.timestamp, order));
}

function buildCaptureTimelineMonths(groups: CaptureGroup[], order: TimeSortOrder): TimelineMonth[] {
  const months = new Map<string, TimelineMonth>();

  for (const group of groups) {
    if (group.date === 'Undated') continue;
    const key = group.date.slice(0, 7);
    const [yearText, monthText] = key.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const existing = months.get(key);

    if (existing) {
      existing.count += group.assets.length;
      continue;
    }

    months.set(key, {
      key,
      year,
      month,
      label: key,
      count: group.assets.length,
    });
  }

  return [...months.values()].sort((a, b) => compareCaptureKey(a.key, b.key, order));
}

function getCaptureAssetGridClass(count: number) {
  const baseClass = '-mx-4 grid gap-0 md:mx-0 md:grid-cols-3';
  if (count === 1) return `${baseClass} grid-cols-[minmax(0,66.666667%)]`;
  if (count === 2) return `${baseClass} grid-cols-2`;
  return `${baseClass} grid-cols-3`;
}

function CaptureCard({ asset, onPreview }: { asset: CaptureAsset; onPreview: (asset: CaptureAsset) => void }) {
  return (
    <article className="overflow-hidden bg-[var(--panel-bg)]">
      <div className="aspect-square overflow-hidden bg-slate-950/20">
        <button
          className="block h-full w-full cursor-zoom-in overflow-hidden"
          onClick={() => onPreview(asset)}
          type="button"
        >
          <img
            alt={asset.title || asset.id}
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
            decoding="async"
            loading="lazy"
            src={asset.image}
          />
        </button>
      </div>
    </article>
  );
}

function CaptureGroupBlock({ group, onPreview }: { group: CaptureGroup; onPreview: (asset: CaptureAsset) => void }) {
  return (
    <section className="space-y-3">
      <div className={getCaptureAssetGridClass(group.assets.length)}>
        {group.assets.map((asset) => (
          <CaptureCard asset={asset} key={asset.id} onPreview={onPreview} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-soft">
        {group.date !== 'Undated' ? (
          <time className="inline-flex items-center gap-1" dateTime={group.date}>
            <Calendar size={13} />
            {formatCaptureDateOnly(group.date)}
          </time>
        ) : null}
        {group.tags.map((tag) => (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-[var(--panel-border)] px-1.5 py-0.5"
            key={tag}
          >
            <Tag size={12} />
            {tag}
          </span>
        ))}
        <Link
          aria-label="Open comments"
          className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-main)] transition hover:text-[var(--text-accent)]"
          onClick={saveStoryScrollPosition}
          state={{ fromStory: true }}
          to={`/story/${encodeURIComponent(group.id)}`}
        >
          <MessageCircle size={17} />
        </Link>
      </div>
      {group.sources.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {group.sources.map((source) => (
            <Link
              className="text-sm font-medium text-[var(--text-main)] underline-offset-4 transition hover:text-[var(--text-accent)] hover:underline"
              key={`${source.type}:${source.id}`}
              to={source.url}
            >
              {source.title}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function CaptureIndex({ onThemeToggle, theme }: CaptureProps) {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [activeMonth, setActiveMonth] = useState<TimelineMonth | null>(null);
  const [timeOrder, setTimeOrder] = useState<TimeSortOrder>('desc');
  const [viewer, setViewer] = useState<{ items: MediaItem[]; index: number } | null>(null);
  const assets = useMemo(() => getCaptureAssets(), []);
  const captureGroups = useMemo(() => groupCaptureAssets(assets, timeOrder), [assets, timeOrder]);
  const yearGroups = useMemo(() => groupCaptureByYearAndMonth(captureGroups, timeOrder, language), [captureGroups, language, timeOrder]);
  const timelineMonths = useMemo(() => buildCaptureTimelineMonths(captureGroups, timeOrder), [captureGroups, timeOrder]);
  const viewerItems = useMemo(() => assets.map((asset) => ({ url: asset.image, type: 'image' as const })), [assets]);

  useEffect(() => {
    const savedScrollY = window.sessionStorage.getItem(storyScrollStorageKey);
    if (!savedScrollY) return;
    window.sessionStorage.removeItem(storyScrollStorageKey);

    const top = Number(savedScrollY);
    if (!Number.isFinite(top)) return;

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top, behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.key]);

  const handlePreview = (asset: CaptureAsset) => {
    const index = assets.findIndex((item) => item.id === asset.id);
    if (index === -1) return;
    setViewer({ items: viewerItems, index });
  };

  const jumpToMonth = (month: TimelineMonth) => {
    const target = document.getElementById(`capture-month-${month.key}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveMonth(month);
    setTimelineOpen(false);
  };

  return (
    <div className="min-h-screen pb-16">
      <AlbumHeader
        onBack={() => navigate(-1)}
        onThemeToggle={onThemeToggle}
        onTimelineToggle={() => setTimelineOpen((open) => !open)}
        showTimeline={timelineMonths.length > 0}
        subtitle={`${assets.length} items`}
        theme={theme}
        timelineOpen={timelineOpen}
        title="Story"
      />

      {timelineOpen ? <div className="fixed inset-0 z-30" onClick={() => setTimelineOpen(false)} /> : null}

      <TimeColumn
        activeMonth={activeMonth}
        months={timelineMonths}
        onJump={jumpToMonth}
        onToggleOrder={() => setTimeOrder((current) => (current === 'desc' ? 'asc' : 'desc'))}
        open={timelineOpen}
        order={timeOrder}
      />

      <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-24">
        {yearGroups.length === 0 ? (
          <p className="py-12 text-center text-sm text-soft">No capture assets found.</p>
        ) : (
          <div className="space-y-10">
            {yearGroups.map((year) => (
              <section className="space-y-6" key={year.key}>
                <h2 className="font-serif text-3xl font-semibold text-[var(--text-main)]">{year.label}</h2>
                {year.months.map((month) => (
                  <section className="space-y-4 scroll-mt-24" id={`capture-month-${month.key}`} key={month.key}>
                    <h3 className="text-lg font-semibold text-soft">{month.label}</h3>
                    <div className="space-y-5">
                      {month.groups.map((group) => (
                        <CaptureGroupBlock group={group} key={group.id} onPreview={handlePreview} />
                      ))}
                    </div>
                  </section>
                ))}
              </section>
            ))}
          </div>
        )}
      </main>

      {viewer ? (
        <ImageViewer
          initialIndex={viewer.index}
          items={viewer.items}
          onClose={() => setViewer(null)}
        />
      ) : null}
    </div>
  );
}

function CaptureDetail({ onThemeToggle, theme }: CaptureProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id = '' } = useParams();
  const assets = useMemo(() => getCaptureAssets(), []);
  const captureGroups = useMemo(() => groupCaptureAssets(assets, 'desc'), [assets]);
  const group = useMemo(() => {
    const decodedId = decodeURIComponent(id);
    return captureGroups.find(
      (item) => item.id === decodedId || item.assets.some((asset) => asset.id === decodedId)
    ) ?? null;
  }, [captureGroups, id]);

  if (!group) {
    return <Navigate replace to="/story" />;
  }

  const fromStory = Boolean((location.state as { fromStory?: boolean } | null)?.fromStory);
  const handleBack = () => {
    if (fromStory) {
      navigate(-1);
      return;
    }
    navigate('/story', { replace: true });
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="fixed left-0 right-0 top-0 z-40 bg-[var(--panel-bg)] px-3 pt-3 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <button
            aria-label="Back"
            className="inline-flex h-9 w-9 items-center justify-center text-[var(--text-main)] transition hover:text-[var(--text-accent)] active:scale-95"
            onClick={handleBack}
            type="button"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="min-w-0 flex-1 px-3 text-center">
            <p className="truncate text-base font-semibold text-[var(--text-main)]">Story</p>
            {group.date !== 'Undated' ? <p className="text-xs text-soft">{formatCaptureDateOnly(group.date)}</p> : null}
          </div>
          <ThemeButton onToggle={onThemeToggle} theme={theme} />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 pb-10 pt-24">
        <section className={getCaptureAssetGridClass(group.assets.length)}>
          {group.assets.map((asset) => (
            <figure
              className="aspect-square overflow-hidden bg-[var(--panel-bg)]"
              key={asset.id}
            >
              <img
                alt={asset.title || asset.id}
                className="h-full w-full object-cover"
                decoding="async"
                src={asset.image}
              />
            </figure>
          ))}
        </section>

        <section className="grid min-w-0 gap-4 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] p-4 shadow-[var(--panel-shadow)]">
          <div className="flex flex-wrap items-center gap-2 text-sm text-soft">
            {group.date !== 'Undated' ? (
              <time className="inline-flex items-center gap-1" dateTime={group.date}>
                <Calendar size={14} />
                {formatCaptureDateOnly(group.date)}
              </time>
            ) : null}
            {group.tags.map((tag) => (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-[var(--panel-border)] px-2 py-0.5"
                key={tag}
              >
                <Tag size={13} />
                {tag}
              </span>
            ))}
          </div>

          <GiscusComments term={`capture-group:${group.id}`} theme={theme} />
        </section>
      </main>
    </div>
  );
}

export function CaptureStory(props: CaptureProps) {
  const { id } = useParams();
  return id ? <CaptureDetail {...props} /> : <CaptureIndex {...props} />;
}

const getMonthKey = (startAt: string) => {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date(startAt));

  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '0');

  return `${year}-${String(month).padStart(2, '0')}`;
};

export default function Story({
  activeMonth,
  auth,
  follows,
  images,
  onActiveMonthChange,
  onThemeToggle,
  onTimelineClose,
  onTimelineToggle,
  theme,
  timelineOpen,
}: StoryProps) {
  const { t } = useTranslation();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const quickActionsRef = useRef<HTMLDivElement | null>(null);
  const [quickActionsVisible, setQuickActionsVisible] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeId } = useParams();
  const selectedItemId = routeId ?? null;
  const selectedUser = searchParams.get('user');
  const selectedTag = searchParams.get('tag');
  const activeUser = selectedUser && selectedUser !== 'all' ? selectedUser : null;
  const activeTag = selectedTag && selectedTag !== 'all' ? selectedTag : null;
  const isUserScoped = !!activeUser;

  const scopedAllItems = useMemo(() => {
    if (!activeUser) return images.allItems;
    const normalized = activeUser.toLowerCase();
    return images.allItems.filter((item) => item.authorLogin.toLowerCase() === normalized);
  }, [activeUser, images.allItems]);

  const recordCount = scopedAllItems.length;
  const albumCount = scopedAllItems.reduce((sum, item) => sum + (item.imageUrls?.length ?? 0), 0);

  const albumOwner = activeUser || auth.user?.login || images.stats.githubOwner || 'GitHub';
  const albumHref = `/album?user=${encodeURIComponent(albumOwner)}`;
  const recordDisabled = isUserScoped || !auth.canPost || images.submitting;
  const showQuickActions = selectedItemId === null;

  useEffect(() => {
    if (!showQuickActions) {
      setQuickActionsVisible(false);
      return;
    }

    const node = quickActionsRef.current;
    if (!node) {
      setQuickActionsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setQuickActionsVisible(entry.isIntersecting),
      { rootMargin: '-96px 0px 0px 0px', threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [showQuickActions]);

  const monthGroups = useMemo(
    () =>
      images.timeline.map((month) => ({
        month,
        items: images.items.filter((item) => getMonthKey(item.startAt) === month.key),
      })),
    [images.items, images.timeline]
  );

  const selectedItem = useMemo(
    () => (selectedItemId ? images.items.find((i) => i.id === selectedItemId) ?? null : null),
    [images.items, selectedItemId]
  );

  useEffect(() => {
    if (images.filterUser !== activeUser) {
      images.setFilterUser(activeUser);
    }
    if (images.tagFilter !== activeTag) {
      images.setTagFilter(activeTag);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUser, activeTag]);

  useEffect(() => {
    const nodes = images.timeline
      .map((month) => sectionRefs.current[month.key])
      .filter(Boolean) as HTMLElement[];

    if (!nodes.length) {
      return;
    }

    const syncActiveMonth = () => {
      const activationOffset = 140;
      const current =
        [...nodes]
          .reverse()
          .find((node) => node.getBoundingClientRect().top <= activationOffset) ??
        nodes[0];

      const monthKey = current?.getAttribute('data-month-key');
      const month = images.timeline.find((item) => item.key === monthKey);

      if (month && month.key !== activeMonth?.key) {
        onActiveMonthChange(month);
      }
    };

    syncActiveMonth();

    const handleScroll = () => {
      window.requestAnimationFrame(syncActiveMonth);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeMonth?.key, images.timeline, monthGroups, onActiveMonthChange]);

  const jumpToMonth = (month: TimelineMonth) => {
    const target = sectionRefs.current[month.key];
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    onActiveMonthChange(month);
    onTimelineClose();
  };

  const updateSearchParams = (nextUser: string | null, nextTag: string | null) => {
    const params = new URLSearchParams();
    if (nextUser) params.set('user', nextUser);
    if (nextTag) params.set('tag', nextTag);
    const search = params.toString();

    if (selectedItemId) {
      const target = `/story${search ? `?${search}` : ''}`;
      navigate(target, { replace: true });
      return;
    }

    if (!search) {
      setSearchParams({});
      return;
    }
    setSearchParams(params);
  };

  const handleUserSelect = (login: string | null) => {
    updateSearchParams(login, activeTag);
  };

  const handleTagSelect = (tag: string | null) => {
    updateSearchParams(activeUser, tag);
  };

  const handleFollowToggle = async (login: string, nextFollow: boolean, avatarUrl?: string) => {
    if (nextFollow) {
      await follows.follow(login, avatarUrl);
      return;
    }
    await follows.unfollow(login);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Header
        activeMonth={activeMonth}
        authAuthenticated={auth.authenticated}
        authLoading={auth.loading}
        authUser={auth.user}
        canPost={auth.canPost}
        feedUsers={images.feedUsers}
        filterUser={activeUser}
        isDetailView={selectedItemId !== null}
        onBack={() => navigate(`/story${location.search}`)}
        onFilterUser={handleUserSelect}
        onLogout={auth.logout}
        onTagSelect={handleTagSelect}
        onThemeToggle={onThemeToggle}
        onTimelineToggle={onTimelineToggle}
        tagFilter={activeTag}
        tagSummary={images.tagSummary}
        theme={theme}
        timelineOpen={timelineOpen}
        uploadBusy={images.submitting}
        showUploadButton={!quickActionsVisible}
      />

      {timelineOpen && (
        <div className="fixed inset-0 z-30" onClick={onTimelineClose} />
      )}

      <TimeColumn
        activeMonth={activeMonth}
        months={images.timeline}
        onJump={jumpToMonth}
        onToggleOrder={images.toggleTimeOrder}
        open={timelineOpen}
        order={images.timeOrder}
      />

      <main className="relative mx-auto flex w-full max-w-xl flex-col px-0 pb-36 pt-28 md:px-0 md:pt-36">
        {showQuickActions ? (
          <div
            className="quick-actions grid w-full grid-cols-2 border-y border-[var(--panel-border)]"
            ref={quickActionsRef}
          >
              <UploadButton
                busy={images.submitting}
                className="quick-actions-button border-r border-[var(--panel-border)]"
                disabled={recordDisabled}
                label={t('story.record')}
                showIcon={!isUserScoped}
                subLabel={isUserScoped ? t('story.totalPosts', { count: String(recordCount) }) : undefined}
                variant="card"
              />
              <button
                className={`quick-actions-button group flex w-full flex-col items-center justify-center gap-1 px-4 py-3 text-sm text-[var(--text-main)] transition ${
                  isUserScoped ? '' : 'hover:text-[var(--text-accent)]'
                }`}
                onClick={() => navigate(albumHref)}
                type="button"
              >
                {!isUserScoped ? (
                  <ImageIcon className="quick-actions-icon text-cyan-300 transition group-hover:text-[var(--text-accent)]" size={20} />
                ) : null}
                <span className="leading-none">{t('story.album')}</span>
                {isUserScoped ? (
                  <span className="quick-actions-sub text-xs text-soft">{t('story.totalItems', { count: String(albumCount) })}</span>
                ) : null}
              </button>
          </div>
        ) : null}
        {images.error ? (
          <div className="mb-6 border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {images.error}
          </div>
        ) : null}

        {images.loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <LoaderCircle className="animate-spin text-cyan-300" size={28} />
          </div>
        ) : (
          <div className="divide-y divide-[var(--panel-border)]">
            {monthGroups.map(({ month, items }) => (
              <section
                className="scroll-mt-28 md:scroll-mt-36"
                data-month-key={month.key}
                key={month.key}
                ref={(node) => {
                  sectionRefs.current[month.key] = node;
                }}
              >
                <div className="divide-y divide-[var(--panel-border)]">
                  {items.map((item) => (
                    <ImageCard
                      canInteract={auth.authenticated}
                      editable={auth.user?.login === item.authorLogin}
                      fallbackAuthorLogin={images.stats.githubOwner || auth.user?.login || undefined}
                      followed={follows.isFollowing(item.authorLogin)}
                      item={item}
                      key={item.id}
                      onAvatarClick={(login) => handleUserSelect(activeUser === login ? null : login)}
                      onCommentCountChange={images.incrementCommentCount}
                      onDelete={images.deleteImage}
                      onLikeChange={images.updateLike}
                      onFollowToggle={handleFollowToggle}
                      onOpenDetail={() => navigate(`/story/${item.id}${location.search}`)}
                      onTagClick={(tag) => handleTagSelect(activeTag === tag ? null : tag)}
                      roleLabel={item.authorLogin === images.stats.githubOwner ? t('roles.admin') : undefined}
                      tagCounts={images.tagCountMap}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {selectedItem ? (
        <CardDetail
          canInteract={auth.authenticated}
          currentUserLogin={auth.user?.login}
          editable={auth.user?.login === selectedItem.authorLogin}
          fallbackAuthorLogin={images.stats.githubOwner || auth.user?.login || undefined}
          followed={follows.isFollowing(selectedItem.authorLogin)}
          item={selectedItem}
          onCommentCountChange={images.incrementCommentCount}
          onDelete={images.deleteImage}
          onLikeChange={images.updateLike}
          onFollowToggle={handleFollowToggle}
          onTagClick={(tag) => handleTagSelect(activeTag === tag ? null : tag)}
          roleLabel={selectedItem.authorLogin === images.stats.githubOwner ? t('roles.admin') : undefined}
          tagCounts={images.tagCountMap}
        />
      ) : null}

      <FloatingActions hidden={timelineOpen || selectedItemId !== null} />
    </div>
  );
}

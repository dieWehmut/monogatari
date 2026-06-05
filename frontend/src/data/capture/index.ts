import type { CaptureAsset } from '../../types/capture';
import { generatedCaptureAssets } from './generated';

const baseUrl = import.meta.env.BASE_URL || '/';
const captureTitleDatePartPattern = String.raw`(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)(?:\s*(?:Z|[+-]\d{2}:?\d{2}))?`;
const captureTitleDatePattern = new RegExp(`^${captureTitleDatePartPattern}$`);
const captureTitleDateRangePattern = new RegExp(`^${captureTitleDatePartPattern}\\s*->\\s*${captureTitleDatePartPattern}$`);

function resolvePublicUrl(value: string): string {
  if (!value || /^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${value.replace(/^\/+/, '')}`;
}

function resolveCaptureDateFromTitle(title: string, date: string): string {
  const titleDate = title.match(captureTitleDatePattern);
  if (titleDate && (!date || date === titleDate[1])) {
    return `${titleDate[1]} ${titleDate[2]}`;
  }

  const titleRange = title.match(captureTitleDateRangePattern);
  if (!titleRange) return date;

  const [, startDate, startTime, endDate, endTime] = titleRange;
  const dateRange = `${startDate} - ${endDate}`;
  if (!date || date === dateRange) {
    return `${startDate} ${startTime} - ${endDate} ${endTime}`;
  }

  return date;
}

function getDateSortTimestamp(date?: string): number {
  if (!date) return 0;
  const normalized = date.replace(/\//g, '-');
  const rangeMatch = normalized.match(/^\s*(\d{4}-\d{2}-\d{2})(?:\s+-\s+(\d{4}-\d{2}-\d{2}))?/);
  if (rangeMatch) return Date.parse(rangeMatch[1]) || 0;
  return Date.parse(date) || 0;
}

export function normalizeCaptureAsset(asset: CaptureAsset): CaptureAsset {
  const title = String(asset.title || '').trim();
  const date = String(asset.date || '').trim();

  return {
    ...asset,
    image: resolvePublicUrl(String(asset.image || '').trim()),
    title,
    date: resolveCaptureDateFromTitle(title, date),
    tags: asset.tags || [],
    sourceRefs: asset.sourceRefs || [],
  };
}

export function normalizeCaptureAssets(assets: CaptureAsset[]): CaptureAsset[] {
  return assets.map(normalizeCaptureAsset);
}

export function getCaptureAssets(): CaptureAsset[] {
  return normalizeCaptureAssets(generatedCaptureAssets)
    .slice()
    .sort((a, b) => getDateSortTimestamp(b.date) - getDateSortTimestamp(a.date));
}

export function getCaptureAssetById(id: string): CaptureAsset | null {
  const normalizedId = id.trim();
  if (!normalizedId) return null;
  return getCaptureAssets().find((asset) => asset.id === normalizedId) ?? null;
}

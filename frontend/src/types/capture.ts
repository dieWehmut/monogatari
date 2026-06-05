export type CaptureSourceKind = 'post' | 'note';

export interface CaptureSourceRef {
  type: CaptureSourceKind;
  id: string;
  title: string;
  url: string;
}

export interface CaptureAsset {
  id: string;
  image: string;
  title?: string;
  date?: string;
  tags: string[];
  summary?: string;
  sourceRefs: CaptureSourceRef[];
  standalone: boolean;
}

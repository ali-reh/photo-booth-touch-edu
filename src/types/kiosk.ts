export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedFace {
  index: number;
  box: FaceBox;
  thumbnailUrl: string;
  descriptor: number[];
  matchedVisitor?: MatchedVisitorInfo | null;
  isIgnored: boolean;
}

export interface MatchedVisitorInfo {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  interests: string[];
  rating?: number | null;
  similarity: number;
}

export interface VisitorFormData {
  fullName: string;
  phone: string;
  email: string;
  company: string;
  interests: string[];
  rating: number;
}

export type KioskStep = 'idle' | 'capture' | 'tag' | 'success';

export interface KioskSession {
  step: KioskStep;
  photoBlob: Blob | null;
  photoUrl: string | null;
  photoId: string | null;
  faces: DetectedFace[];
  compositeCanvas: HTMLCanvasElement | null;
}

export const DEFAULT_INTERESTS = [
  'AI / ML',
  'Web Development',
  'Mobile Apps',
  'Cloud & DevOps',
  'Cybersecurity',
  'Data Science',
  'UI / UX Design',
  'Blockchain',
  'IoT',
  'Education',
] as const;

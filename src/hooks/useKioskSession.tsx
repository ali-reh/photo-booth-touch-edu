'use client';

import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { KioskSession, KioskStep, DetectedFace } from '@/types/kiosk';

export type KioskSessionAction =
  | { type: 'SET_STEP'; payload: KioskStep }
  | { type: 'SET_PHOTO'; payload: { photoBlob: Blob | null; photoUrl: string | null; photoId: string | null; compositeCanvas: HTMLCanvasElement | null } }
  | { type: 'SET_FACES'; payload: DetectedFace[] }
  | { type: 'UPDATE_FACE'; payload: { index: number; face: Partial<DetectedFace> } }
  | { type: 'RESET' };

export const initialSessionState: KioskSession = { step: 'idle', photoBlob: null, photoUrl: null, photoId: null, faces: [], compositeCanvas: null };

function kioskSessionReducer(state: KioskSession, action: KioskSessionAction): KioskSession {
  switch (action.type) {
    case 'SET_STEP': return { ...state, step: action.payload };
    case 'SET_PHOTO': return { ...state, ...action.payload };
    case 'SET_FACES': return { ...state, faces: action.payload };
    case 'UPDATE_FACE': return { ...state, faces: state.faces.map((face) => face.index === action.payload.index ? { ...face, ...action.payload.face } : face) };
    case 'RESET': return initialSessionState;
    default: return state;
  }
}

export interface KioskSessionContextValue { session: KioskSession; dispatch: React.Dispatch<KioskSessionAction>; }
export const KioskSessionContext = createContext<KioskSessionContextValue | undefined>(undefined);

export function KioskSessionProvider({ children, initialState = initialSessionState }: { children: ReactNode; initialState?: KioskSession }) {
  const [session, dispatch] = useReducer(kioskSessionReducer, initialState);
  return <KioskSessionContext.Provider value={{ session, dispatch }}>{children}</KioskSessionContext.Provider>;
}

export function useKioskSession(): KioskSessionContextValue {
  const context = useContext(KioskSessionContext);
  if (!context) throw new Error('useKioskSession must be used within a KioskSessionProvider');
  return context;
}
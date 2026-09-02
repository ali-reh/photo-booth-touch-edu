'use client';

import { useEffect, useState } from 'react';
import CameraFeed from '@/components/camera/CameraFeed';
import CountdownOverlay from '@/components/camera/CountdownOverlay';
import FrameOverlay from '@/components/camera/FrameOverlay';
import Button from '@/components/ui/Button';
import { useCamera } from '@/hooks/useCamera';
import { useKioskSession } from '@/hooks/useKioskSession';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import FaceSelectorRow from '@/components/face-tagging/FaceSelectorRow';
import VisitorFormModal from '@/components/face-tagging/VisitorFormModal';
import type { VisitorFormData } from '@/types/kiosk';
import { createPhoto, uploadPhoto } from '@/lib/supabase/services';

const EVENT_NAME = 'PHOTO BOOTH';

export default function Home() {
  const { videoRef, isReady, error, captureImage } = useCamera();
  const { session, dispatch } = useKioskSession();
  const { faces, isLoading: isDetecting, isModelsLoaded, error: detectionError, detect, setFaces } = useFaceDetection();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number | null>(null);
  const [isVisitorFormOpen, setIsVisitorFormOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function beginCapture() {
    if (!isReady || countdown !== null) return;
    setCountdown(3);
  }

  function finishCapture() {
    const canvas = captureImage();
    setCountdown(null);
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setIsUploading(true);
      setUploadError(null);
      const localPhotoUrl = canvas.toDataURL('image/jpeg', 0.92);

      try {
        const photoUrl = await uploadPhoto(blob);
        const photo = await createPhoto(photoUrl);
        dispatch({
          type: 'SET_PHOTO',
          payload: { photoBlob: blob, photoUrl: localPhotoUrl, photoId: photo.id, compositeCanvas: canvas },
        });
        dispatch({ type: 'SET_STEP', payload: 'tag' });
      } catch (uploadFailure) {
        setUploadError(uploadFailure instanceof Error ? uploadFailure.message : 'Photo upload failed.');
      } finally {
        setIsUploading(false);
      }
    }, 'image/jpeg', 0.92);
  }

  const hasCapturedPhoto = session.step === 'tag' && Boolean(session.photoUrl);

  useEffect(() => {
    if (hasCapturedPhoto && session.compositeCanvas && faces.length === 0 && !isDetecting && isModelsLoaded) {
      void detect(session.compositeCanvas);
    }
  }, [detect, faces.length, hasCapturedPhoto, isDetecting, isModelsLoaded, session.compositeCanvas]);

  function selectFace(index: number) {
    setSelectedFaceIndex(index);
    setIsVisitorFormOpen(true);
  }

  function ignoreFace(index: number) {
    setFaces((currentFaces) => currentFaces.map((face) => face.index === index ? { ...face, isIgnored: true } : face));
  }

  function saveVisitor(data: VisitorFormData) {
    if (selectedFaceIndex === null) return;
    dispatch({ type: 'UPDATE_FACE', payload: { index: selectedFaceIndex, face: { matchedVisitor: { id: '', fullName: data.fullName, phone: data.phone, email: data.email, company: data.company, interests: data.interests, rating: data.rating, similarity: 0 } } } });
    setIsVisitorFormOpen(false);
  }

  return (
    <main className="kiosk-container bg-[#102a2b] text-[#f8f4e8]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(236,182,91,0.18),transparent_32%),linear-gradient(145deg,#102a2b_0%,#163d3d_55%,#0b2022_100%)]" />
      <div className="relative mx-auto flex h-full w-full max-w-2xl flex-col items-center px-5 py-7 sm:px-10 sm:py-10">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-[#efc36f]">{EVENT_NAME}</p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.12em] text-[#fff9e9] sm:text-5xl">Make a memory</h1>
          <p className="mt-2 text-sm text-[#d7e1d7]">Step in, smile, and take your photo.</p>
        </header>
        <section className="relative mt-7 flex min-h-0 w-full max-h-[66vh] flex-1 items-center justify-center rounded-[2rem] border-8 border-[#efc36f] bg-[#08191b] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:mt-8">
          <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-[1.3rem] border border-white/20">
            {hasCapturedPhoto ? <img src={session.photoUrl ?? ''} alt="Captured photo" className="h-full w-full object-cover" /> : <CameraFeed videoRef={videoRef} isReady={isReady} />}
            <FrameOverlay eventName={EVENT_NAME} />
            <CountdownOverlay count={countdown} onComplete={finishCapture} />
          </div>
        </section>
        <div className="flex w-full flex-col items-center gap-3 pt-6">
          {error && <p className="text-center text-sm text-[#ffcfbf]">{error}</p>}
          {uploadError && <p className="max-w-md text-center text-sm text-[#ffcfbf]">{uploadError}</p>}
          {hasCapturedPhoto ? (
            <div className="w-full space-y-3">
              <p className="text-center text-base font-semibold text-[#f8e2a5]">Tag everyone in your photo</p>
              {isDetecting && <p className="text-center text-sm text-[#d7e1d7]">Looking for faces...</p>}
              {!isDetecting && !isModelsLoaded && !detectionError && <p className="text-center text-sm text-[#d7e1d7]">Loading face recognition...</p>}
              {detectionError && <p className="text-center text-sm text-[#ffcfbf]">Face recognition is unavailable: {detectionError}</p>}
              {!isDetecting && !detectionError && isModelsLoaded && faces.length === 0 && <p className="text-center text-sm text-[#d7e1d7]">No faces detected. You can continue without tagging.</p>}
              {faces.length > 0 && <FaceSelectorRow faces={faces} selectedIndex={selectedFaceIndex} onSelect={selectFace} onIgnore={ignoreFace} />}
              <VisitorFormModal isOpen={isVisitorFormOpen} face={faces.find((face) => face.index === selectedFaceIndex) ?? null} onSave={saveVisitor} onClose={() => setIsVisitorFormOpen(false)} />
            </div>
          ) : <Button type="button" size="lg" disabled={!isReady || countdown !== null || isUploading} onClick={beginCapture} className="min-w-56 border-2 border-[#fff1c5] bg-[#efc36f] text-[#173638] hover:bg-[#f7d48e]">{isUploading ? 'Uploading photo...' : isReady ? 'Capture photo' : 'Starting camera...'}</Button>}
          <p className="text-xs uppercase tracking-[0.25em] text-[#a9c3bb]">One tap. One memory.</p>
        </div>
      </div>
    </main>
  );
}

import { supabase } from './client';
import type {
  Photo,
  Visitor,
  VisitorInsert,
  MatchedVisitor,
} from './types';

// SFace cosine similarity is not a percentage. This conservative threshold
// is stricter than the published baseline for a small kiosk visitor database.
export const FACE_MATCH_THRESHOLD = 0.45;
export const FACE_MATCH_MARGIN = 0.08;

/**
 * Uploads a photo blob to the 'event-photos' Supabase storage bucket
 * with a UUID filename and returns its public URL.
 */
export async function uploadPhoto(blob: Blob): Promise<string> {
  const fileName = `${crypto.randomUUID()}.jpg`;
  const { data, error } = await supabase.storage
    .from('event-photos')
    .upload(fileName, blob, {
      contentType: blob.type || 'image/jpeg',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from('event-photos')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * Inserts a new photo record into the photos table and returns the row.
 */
export async function createPhoto(photoUrl: string): Promise<Photo> {
  const { data, error } = await supabase
    .from('photos')
    .insert({ photo_url: photoUrl })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Calls the match_visitor_face RPC to find a matching visitor by face embedding vector.
 */
export async function matchVisitorFace(
  embedding: number[]
): Promise<MatchedVisitor | null> {
  const embeddingString = `[${embedding.join(',')}]`;
  const { data, error } = await supabase.rpc('match_visitor_face', {
    query_embedding: embeddingString,
    match_threshold: FACE_MATCH_THRESHOLD,
    match_count: 2,
  });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const bestMatch = data[0];
  const secondBestSimilarity = data[1]?.similarity ?? 0;
  const isConfidentMatch =
    bestMatch.similarity >= FACE_MATCH_THRESHOLD &&
    bestMatch.similarity - secondBestSimilarity >= FACE_MATCH_MARGIN;

  return isConfidentMatch ? bestMatch : null;
}

/**
 * Upserts a visitor record into the visitors table using phone as the conflict target.
 */
export async function upsertVisitor(data: VisitorInsert): Promise<Visitor> {
  const visitorData = {
    ...data,
    face_embedding: Array.isArray(data.face_embedding)
      ? `[${data.face_embedding.join(',')}]`
      : data.face_embedding,
  };

  const { data: existingVisitor, error: lookupError } = await supabase
    .from('visitors')
    .select('id')
    .eq('phone', data.phone)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  const visitorQuery = existingVisitor
    ? supabase.from('visitors').update(visitorData).eq('id', existingVisitor.id)
    : supabase.from('visitors').insert(visitorData);

  const { data: visitor, error } = await visitorQuery.select().single();

  if (error) {
    throw error;
  }

  return visitor;
}

/**
 * Inserts a junction record linking a photo and a visitor with the detected face index.
 */
export async function linkPhotoVisitor(
  photoId: string,
  visitorId: string,
  faceIndex: number
): Promise<void> {
  const { error } = await supabase.from('photo_visitors').insert({
    photo_id: photoId,
    visitor_id: visitorId,
    face_index: faceIndex,
  });

  if (error) {
    throw error;
  }
}

/**
 * Fetches a single visitor by their phone number, or returns null if not found.
 */
export async function getVisitorByPhone(
  phone: string
): Promise<Visitor | null> {
  const { data, error } = await supabase
    .from('visitors')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

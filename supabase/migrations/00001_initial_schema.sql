-- ==============================================================================
-- 1. EXTENSIONS & PREREQUISITES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  interests TEXT[] DEFAULT '{}',
  rating INT CHECK (rating >= 1 AND rating <= 5),
  face_embedding vector(128),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photo_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  face_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_photo_visitor UNIQUE (photo_id, visitor_id)
);

-- ==============================================================================
-- 3. INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_phone ON visitors(phone);
CREATE INDEX IF NOT EXISTS idx_pv_photo_id ON photo_visitors(photo_id);
CREATE INDEX IF NOT EXISTS idx_pv_visitor_id ON photo_visitors(visitor_id);

CREATE INDEX IF NOT EXISTS idx_visitors_face_embedding 
ON visitors 
USING hnsw (face_embedding vector_cosine_ops);

-- ==============================================================================
-- 4. VECTOR MATCHING FUNCTION (RPC)
-- ==============================================================================
CREATE OR REPLACE FUNCTION match_visitor_face (
  query_embedding vector(128),
  match_threshold float DEFAULT 0.85,
  match_count int DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  company TEXT,
  interests TEXT[],
  rating INT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.full_name,
    v.phone,
    v.email,
    v.company,
    v.interests,
    v.rating,
    (1 - (v.face_embedding <=> query_embedding))::float AS similarity
  FROM visitors v
  WHERE v.face_embedding IS NOT NULL 
    AND (1 - (v.face_embedding <=> query_embedding)) > match_threshold
  ORDER BY v.face_embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- ==============================================================================
-- 5. REALTIME & STORAGE POLICIES
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE photos;
ALTER PUBLICATION supabase_realtime ADD TABLE visitors;
ALTER PUBLICATION supabase_realtime ADD TABLE photo_visitors;

CREATE POLICY "Allow Kiosk Public Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'event-photos');

CREATE POLICY "Allow Public Photo Viewing" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'event-photos');

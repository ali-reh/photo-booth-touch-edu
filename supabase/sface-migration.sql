-- SFace and the previous face-api model use different embedding spaces.
-- Run this once before re-enrolling visitors with the new SFace model.
-- Visitor contact details remain intact; only incompatible embeddings are removed.

update public.visitors
set face_embedding = null;

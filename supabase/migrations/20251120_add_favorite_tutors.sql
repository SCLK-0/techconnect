-- Add favorite/bookmark tutors feature for learners

CREATE TABLE public.favorite_tutors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate favorites
  UNIQUE(learner_id, tutor_id)
);

-- Enable RLS
ALTER TABLE public.favorite_tutors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Learners can view their own favorites"
ON public.favorite_tutors FOR SELECT
TO authenticated
USING (learner_id = auth.uid());

CREATE POLICY "Learners can add favorites"
ON public.favorite_tutors FOR INSERT
TO authenticated
WITH CHECK (learner_id = auth.uid());

CREATE POLICY "Learners can remove favorites"
ON public.favorite_tutors FOR DELETE
TO authenticated
USING (learner_id = auth.uid());

-- Create function to check if tutor is favorited
CREATE OR REPLACE FUNCTION public.is_tutor_favorited(
  p_learner_id uuid,
  p_tutor_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM favorite_tutors
    WHERE learner_id = p_learner_id
    AND tutor_id = p_tutor_id
  );
$$;

-- Create function to get learner's favorite tutors with details
CREATE OR REPLACE FUNCTION public.get_favorite_tutors(p_learner_id uuid)
RETURNS TABLE (
  tutor_user_id uuid,
  tutor_profile_id uuid,
  full_name text,
  avatar_url text,
  subject_expertise text[],
  bio text,
  is_online boolean,
  registered_year text,
  average_rating numeric,
  total_reviews bigint,
  favorited_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tp.user_id as tutor_user_id,
    tp.id as tutor_profile_id,
    p.full_name,
    p.avatar_url,
    tp.subject_expertise,
    tp.bio,
    tp.is_online,
    tp.registered_year,
    r.average_rating,
    r.total_reviews,
    ft.created_at as favorited_at
  FROM favorite_tutors ft
  INNER JOIN tutor_profiles tp ON tp.user_id = ft.tutor_id
  INNER JOIN profiles p ON p.user_id = ft.tutor_id
  LEFT JOIN LATERAL (
    SELECT 
      ROUND(AVG(f.rating)::numeric, 1) as average_rating,
      COUNT(f.id) as total_reviews
    FROM feedback f
    INNER JOIN sessions s ON s.id = f.session_id
    WHERE s.tutor_id = ft.tutor_id
      AND s.status = 'completed'
      AND f.rating IS NOT NULL
  ) r ON true
  WHERE ft.learner_id = p_learner_id
    AND tp.status = 'approved'
  ORDER BY ft.created_at DESC;
$$;

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.favorite_tutors TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tutor_favorited(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_favorite_tutors(uuid) TO authenticated;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorite_tutors;

-- Create indexes for better performance
CREATE INDEX idx_favorite_tutors_learner_id ON public.favorite_tutors(learner_id);
CREATE INDEX idx_favorite_tutors_tutor_id ON public.favorite_tutors(tutor_id);
CREATE INDEX idx_favorite_tutors_created_at ON public.favorite_tutors(created_at DESC);

COMMENT ON TABLE public.favorite_tutors IS 'Learners can bookmark/favorite tutors for quick access';
COMMENT ON FUNCTION public.is_tutor_favorited IS 'Check if a tutor is in learner''s favorites';
COMMENT ON FUNCTION public.get_favorite_tutors IS 'Get all favorite tutors for a learner with their details';

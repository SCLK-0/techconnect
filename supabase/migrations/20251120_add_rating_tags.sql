-- Add rating tags to feedback system
-- Similar to e-commerce "Great Service", "Fast Delivery" badges

-- Create enum for predefined rating tags
CREATE TYPE rating_tag_type AS ENUM (
  'clear_explanations',
  'great_communication',
  'always_on_time',
  'patient_friendly',
  'very_knowledgeable',
  'helped_improve',
  'well_prepared',
  'engaging_session',
  'good_examples',
  'responsive'
);

-- Create table to store rating tags for each feedback
CREATE TABLE public.feedback_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES public.feedback(id) ON DELETE CASCADE NOT NULL,
  tag rating_tag_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate tags for same feedback
  UNIQUE(feedback_id, tag)
);

-- Enable RLS
ALTER TABLE public.feedback_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view feedback tags"
ON public.feedback_tags FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can add tags to their own feedback"
ON public.feedback_tags FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.feedback
    WHERE id = feedback_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own feedback tags"
ON public.feedback_tags FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.feedback
    WHERE id = feedback_id AND user_id = auth.uid()
  )
);

-- Create function to get tutor's most common tags
CREATE OR REPLACE FUNCTION public.get_tutor_rating_tags(tutor_user_id uuid)
RETURNS TABLE (
  tag rating_tag_type,
  tag_count bigint,
  percentage numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH tutor_feedback AS (
    SELECT f.id
    FROM feedback f
    INNER JOIN sessions s ON s.id = f.session_id
    WHERE s.tutor_id = tutor_user_id
      AND s.status = 'completed'
      AND f.rating IS NOT NULL
  ),
  total_feedback AS (
    SELECT COUNT(*) as total FROM tutor_feedback
  )
  SELECT 
    ft.tag,
    COUNT(ft.id) as tag_count,
    ROUND((COUNT(ft.id)::numeric / NULLIF((SELECT total FROM total_feedback), 0) * 100), 1) as percentage
  FROM feedback_tags ft
  INNER JOIN tutor_feedback tf ON tf.id = ft.feedback_id
  GROUP BY ft.tag
  ORDER BY tag_count DESC;
$$;

-- Grant permissions
GRANT SELECT ON public.feedback_tags TO authenticated;
GRANT INSERT ON public.feedback_tags TO authenticated;
GRANT DELETE ON public.feedback_tags TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tutor_rating_tags(uuid) TO authenticated;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_tags;

-- Create index for better performance
CREATE INDEX idx_feedback_tags_feedback_id ON public.feedback_tags(feedback_id);
CREATE INDEX idx_feedback_tags_tag ON public.feedback_tags(tag);

COMMENT ON TABLE public.feedback_tags IS 'Rating tags/badges that learners can assign to tutors (like e-commerce reviews)';
COMMENT ON FUNCTION public.get_tutor_rating_tags IS 'Get the most common rating tags for a tutor with counts and percentages';

-- ============================================
-- APPLY THIS IN SUPABASE STUDIO SQL EDITOR
-- ============================================
-- This adds the rating distribution function
-- Copy and paste this entire file into Supabase Studio > SQL Editor > Run
-- ============================================

-- Create function to get star rating distribution for tutors
CREATE OR REPLACE FUNCTION public.get_tutor_rating_distribution(tutor_user_id uuid)
RETURNS TABLE (
  star_rating integer,
  rating_count bigint,
  percentage numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH tutor_ratings AS (
    SELECT f.rating
    FROM feedback f
    INNER JOIN sessions s ON s.id = f.session_id
    WHERE s.tutor_id = tutor_user_id
      AND s.status = 'completed'
      AND f.rating IS NOT NULL
  ),
  total_ratings AS (
    SELECT COUNT(*) as total FROM tutor_ratings
  ),
  rating_counts AS (
    SELECT 
      rating as star_rating,
      COUNT(*) as rating_count
    FROM tutor_ratings
    GROUP BY rating
  )
  SELECT 
    star_rating::integer,
    rating_count,
    ROUND((rating_count::numeric / NULLIF((SELECT total FROM total_ratings), 0) * 100), 1) as percentage
  FROM rating_counts
  ORDER BY star_rating DESC;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_tutor_rating_distribution(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_tutor_rating_distribution IS 'Get the distribution of star ratings (1-5) for a tutor with counts and percentages';

-- ============================================
-- VERIFICATION QUERY (run after the above)
-- ============================================
-- Test that the function was created successfully:
-- SELECT routine_name FROM information_schema.routines WHERE routine_name = 'get_tutor_rating_distribution';
-- 
-- Test with a real tutor (replace with actual tutor user_id):
-- SELECT * FROM get_tutor_rating_distribution('your-tutor-user-id-here');
-- ============================================

-- Add function to get star rating distribution for tutors
-- Shows percentage breakdown of 1-5 star ratings

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

COMMENT ON FUNCTION public.get_tutor_rating_distribution IS 'Get the distribution of star ratings (1-5) for a tutor with counts and percentages';

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TutorRatingDistributionProps {
  tutorUserId: string;
}

export function TutorRatingDistribution({ tutorUserId }: TutorRatingDistributionProps) {
  const { data: distribution } = useQuery({
    queryKey: ['tutor-rating-distribution', tutorUserId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_tutor_rating_distribution', { tutor_user_id: tutorUserId });
        if (error) {
          console.log('Rating distribution error:', error);
          return [];
        }
        return data || [];
      } catch (error) {
        console.log('Rating distribution query failed:', error);
        return [];
      }
    },
    enabled: !!tutorUserId,
  });

  if (!distribution || distribution.length === 0) {
    return null;
  }

  // Create a map for quick lookup
  const ratingMap = new Map(
    distribution.map((item: any) => [item.star_rating, item])
  );

  // Generate all 5 star levels (5 to 1)
  const allStars = [5, 4, 3, 2, 1].map(star => ({
    star_rating: star,
    rating_count: ratingMap.get(star)?.rating_count || 0,
    percentage: ratingMap.get(star)?.percentage || 0,
  }));

  return (
    <div>
      <h4 className="text-sm font-semibold mb-3">Rating Breakdown</h4>
      <div className="space-y-2">
        {allStars.map(({ star_rating, rating_count, percentage }) => (
          <div key={star_rating} className="flex items-center gap-2">
            <div className="flex items-center gap-1 w-12">
              <span className="text-sm font-medium">{star_rating}</span>
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            </div>
            <Progress 
              value={percentage} 
              className="h-2 flex-1"
            />
            <span className="text-xs text-muted-foreground w-12 text-right">
              {percentage}%
            </span>
            <span className="text-xs text-muted-foreground w-8 text-right">
              ({rating_count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

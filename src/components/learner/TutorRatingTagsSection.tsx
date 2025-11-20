import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TutorRatingTagsDisplay } from "@/components/feedback/RatingTags";

interface TutorRatingTagsSectionProps {
  tutorUserId: string;
}

export function TutorRatingTagsSection({ tutorUserId }: TutorRatingTagsSectionProps) {
  const { data: tutorTags } = useQuery({
    queryKey: ['tutor-tags', tutorUserId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_tutor_rating_tags', { tutor_user_id: tutorUserId });
        if (error) {
          console.log('Rating tags error:', error);
          return [];
        }
        return data || [];
      } catch (error) {
        console.log('Rating tags query failed:', error);
        return [];
      }
    },
    enabled: !!tutorUserId,
  });

  if (!tutorTags || tutorTags.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="text-sm font-semibold mb-2 sm:mb-3">Top Qualities</h4>
      <TutorRatingTagsDisplay tags={tutorTags} limit={5} />
    </div>
  );
}

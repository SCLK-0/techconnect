import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useFavoriteTutor(tutorId: string, learnerId: string | undefined) {
  const [isFavorited, setIsFavorited] = useState(false);
  const queryClient = useQueryClient();

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!learnerId) throw new Error('Not authenticated');

      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_tutors')
          .delete()
          .eq('learner_id', learnerId)
          .eq('tutor_id', tutorId);

        if (error) throw error;
        return false;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_tutors')
          .insert({
            learner_id: learnerId,
            tutor_id: tutorId,
          });

        if (error) throw error;
        return true;
      }
    },
    onSuccess: (newState) => {
      setIsFavorited(newState);
      toast.success(newState ? 'Added to favorites' : 'Removed from favorites');
      queryClient.invalidateQueries({ queryKey: ['favorite-tutors'] });
    },
    onError: (error: any) => {
      toast.error('Failed to update favorites: ' + error.message);
    },
  });

  return {
    isFavorited,
    setIsFavorited,
    toggleFavorite: toggleFavorite.mutate,
    isLoading: toggleFavorite.isPending,
  };
}

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to periodically check and mark missed sessions
 * Runs every 2 minutes when the app is active
 */
export function useMissedSessionsChecker() {
  useEffect(() => {
    const checkMissedSessions = async () => {
      try {
        // Call the database function to mark missed sessions
        const { error } = await supabase.rpc('mark_missed_sessions');
        
        if (error) {
          console.error('Error marking missed sessions:', error);
        }
      } catch (error) {
        console.error('Failed to check missed sessions:', error);
      }
    };

    // Run immediately on mount
    checkMissedSessions();

    // Then run every 2 minutes
    const interval = setInterval(checkMissedSessions, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}

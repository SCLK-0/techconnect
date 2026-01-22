import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export type UserRole = "admin" | "tutor" | "learner" | null;

const ROLE_CACHE_KEY = "techconnect_user_role";
const USER_ID_CACHE_KEY = "techconnect_user_id";

export const useUserRole = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  
  // Initialize role from localStorage cache for instant loading
  const [role, setRole] = useState<UserRole>(() => {
    try {
      const cachedRole = localStorage.getItem(ROLE_CACHE_KEY);
      return cachedRole as UserRole;
    } catch {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(true);

  // Helper to update role and cache it
  const updateRole = (newRole: UserRole, userId?: string) => {
    setRole(newRole);
    try {
      if (newRole && userId) {
        localStorage.setItem(ROLE_CACHE_KEY, newRole);
        localStorage.setItem(USER_ID_CACHE_KEY, userId);
      } else {
        localStorage.removeItem(ROLE_CACHE_KEY);
        localStorage.removeItem(USER_ID_CACHE_KEY);
      }
    } catch (error) {
      console.error("Error caching role:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change event:", event, "User ID:", session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Clear cache on sign out
        if (event === "SIGNED_OUT") {
          updateRole(null);
          setLoading(false);
          return;
        }
        
        // Defer role fetching with setTimeout to prevent deadlock
        if (session?.user) {
          // Check if cached role matches current user
          const cachedUserId = localStorage.getItem(USER_ID_CACHE_KEY);
          const cachedRole = localStorage.getItem(ROLE_CACHE_KEY) as UserRole;
          
          if (cachedUserId === session.user.id && cachedRole) {
            // Use cached role immediately
            setRole(cachedRole);
            setLoading(false);
            
            // Still fetch in background to ensure it's up to date
            setTimeout(() => {
              supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", session.user.id)
                .then(({ data, error }) => {
                  if (!error && data && data.length > 0) {
                    // Prioritize admin role if user has multiple roles
                    const roles = data.map(r => r.role);
                    const primaryRole = roles.includes('admin') ? 'admin' : 
                                     roles.includes('tutor') ? 'tutor' : 
                                     roles.includes('learner') ? 'learner' : null;
                    
                    if (primaryRole !== cachedRole) {
                      console.log("Role updated from cache:", cachedRole, "to:", primaryRole);
                      updateRole(primaryRole as UserRole, session.user.id);
                    }
                  }
                });
            }, 0);
          } else {
            // Fetch role from database
            setTimeout(() => {
              supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", session.user.id)
                .then(({ data, error }) => {
                  if (error) {
                    console.error("Error fetching role on auth change:", error);
                    setLoading(false);
                  } else if (data && data.length > 0) {
                    // Prioritize admin role if user has multiple roles
                    const roles = data.map(r => r.role);
                    const primaryRole = roles.includes('admin') ? 'admin' : 
                                     roles.includes('tutor') ? 'tutor' : 
                                     roles.includes('learner') ? 'learner' : null;
                    
                    console.log("User roles:", roles, "Primary role:", primaryRole);
                    updateRole(primaryRole as UserRole, session.user.id);
                    setLoading(false);
                  } else {
                    updateRole(null, session.user.id);
                    setLoading(false);
                  }
                });
            }, 0);
          }
        } else {
          updateRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }
      
      console.log("Current session user:", session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check if cached role matches current user
        const cachedUserId = localStorage.getItem(USER_ID_CACHE_KEY);
        const cachedRole = localStorage.getItem(ROLE_CACHE_KEY) as UserRole;
        
        if (cachedUserId === session.user.id && cachedRole) {
          // Use cached role immediately
          setRole(cachedRole);
          setLoading(false);
          
          // Still fetch in background to ensure it's up to date
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .then(({ data, error: roleError }) => {
              if (!roleError && data && data.length > 0) {
                // Prioritize admin role if user has multiple roles
                const roles = data.map(r => r.role);
                const primaryRole = roles.includes('admin') ? 'admin' : 
                                 roles.includes('tutor') ? 'tutor' : 
                                 roles.includes('learner') ? 'learner' : null;
                
                if (primaryRole !== cachedRole) {
                  console.log("Role updated from cache:", cachedRole, "to:", primaryRole);
                  updateRole(primaryRole as UserRole, session.user.id);
                }
              }
            });
        } else {
          // Fetch role from database
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .then(({ data, error: roleError }) => {
              if (roleError) {
                console.error("Error fetching role:", roleError);
                updateRole(null, session.user.id);
                setLoading(false);
              } else if (data && data.length > 0) {
                // Prioritize admin role if user has multiple roles
                const roles = data.map(r => r.role);
                const primaryRole = roles.includes('admin') ? 'admin' : 
                                 roles.includes('tutor') ? 'tutor' : 
                                 roles.includes('learner') ? 'learner' : null;
                
                console.log("User roles:", roles, "Primary role:", primaryRole);
                updateRole(primaryRole as UserRole, session.user.id);
                setLoading(false);
              } else {
                updateRole(null, session.user.id);
                setLoading(false);
              }
            });
        }
      } else {
        updateRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, role, loading };
};

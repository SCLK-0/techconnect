-- =============================================
-- FIX PROFILES <-> USER_ROLES RELATIONSHIP
-- This creates the relationship Supabase needs for joins
-- =============================================

-- The issue: Supabase can't join profiles and user_roles because
-- there's no direct foreign key relationship between them.
-- Both reference auth.users(id) but not each other.

-- Solution: We don't need a direct FK between them.
-- Instead, we need to ensure both have proper FKs to auth.users
-- and that Supabase's schema cache is refreshed.

-- First, let's make sure the foreign keys exist
-- (These might already exist, so we use IF NOT EXISTS logic)

DO $$ 
BEGIN
    -- Add FK from profiles to auth.users if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_user_id_fkey'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;

    -- Add FK from user_roles to auth.users if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_roles_user_id_fkey'
    ) THEN
        ALTER TABLE public.user_roles
        ADD CONSTRAINT user_roles_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Now, refresh Supabase's schema cache
-- This is done by calling the PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

-- Verify the foreign keys exist
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('profiles', 'user_roles')
ORDER BY tc.table_name;

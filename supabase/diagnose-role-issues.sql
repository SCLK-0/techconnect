-- Diagnostic script to find users with missing roles
-- Run this in Supabase SQL Editor to diagnose role assignment issues

-- 1. Find users without roles
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at,
  au.raw_user_meta_data,
  ur.role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.role IS NULL
  AND au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC
LIMIT 20;

-- 2. Check if users have proper metadata
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.raw_user_meta_data ? 'is_tutor' as has_is_tutor,
  au.raw_user_meta_data ? 'subject_expertise' as has_subject_expertise,
  au.raw_user_meta_data ? 'bio' as has_bio,
  au.raw_user_meta_data ? 'subjects_of_interest' as has_subjects_of_interest,
  au.raw_user_meta_data ? 'registered_year' as has_registered_year,
  au.raw_user_meta_data
FROM auth.users au
WHERE au.email_confirmed_at IS NOT NULL
  AND au.id NOT IN (SELECT user_id FROM public.user_roles)
ORDER BY au.created_at DESC
LIMIT 20;

-- 3. Check tutor profiles without roles
SELECT 
  tp.user_id,
  au.email,
  tp.status,
  ur.role
FROM public.tutor_profiles tp
JOIN auth.users au ON tp.user_id = au.id
LEFT JOIN public.user_roles ur ON tp.user_id = ur.user_id
WHERE ur.role IS NULL;

-- 4. Check learner profiles without roles
SELECT 
  lp.user_id,
  au.email,
  ur.role
FROM public.learner_profiles lp
JOIN auth.users au ON lp.user_id = au.id
LEFT JOIN public.user_roles ur ON lp.user_id = ur.user_id
WHERE ur.role IS NULL;

-- 5. Find users who confirmed email but triggers didn't fire
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.raw_user_meta_data->>'is_tutor' as is_tutor,
  au.raw_user_meta_data->>'full_name' as full_name,
  CASE 
    WHEN au.raw_user_meta_data ? 'is_tutor' THEN 'Should be tutor'
    WHEN au.raw_user_meta_data ? 'subjects_of_interest' THEN 'Should be learner'
    ELSE 'Unknown - no metadata'
  END as expected_role,
  ur.role as actual_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE au.email_confirmed_at IS NOT NULL
  AND ur.role IS NULL
  AND au.email NOT LIKE '%admin%'
ORDER BY au.created_at DESC;

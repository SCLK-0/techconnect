-- Script to manually fix users with missing roles
-- Run this AFTER running diagnose-role-issues.sql to identify affected users

-- IMPORTANT: Review the output of diagnose-role-issues.sql first!
-- This script will assign roles based on metadata

-- 1. Assign tutor role to users with tutor metadata but no role
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  'tutor'::app_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE au.email_confirmed_at IS NOT NULL
  AND ur.role IS NULL
  AND au.raw_user_meta_data ? 'is_tutor'
  AND au.raw_user_meta_data ? 'subject_expertise'
  AND au.raw_user_meta_data ? 'bio'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Create missing tutor profiles for users with tutor metadata
INSERT INTO public.tutor_profiles (user_id, subject_expertise, bio, registered_year, status)
SELECT 
  au.id,
  ARRAY(SELECT jsonb_array_elements_text(au.raw_user_meta_data->'subject_expertise')),
  au.raw_user_meta_data->>'bio',
  au.raw_user_meta_data->>'registered_year',
  'pending'
FROM auth.users au
LEFT JOIN public.tutor_profiles tp ON au.id = tp.user_id
WHERE au.email_confirmed_at IS NOT NULL
  AND tp.user_id IS NULL
  AND au.raw_user_meta_data ? 'is_tutor'
  AND au.raw_user_meta_data ? 'subject_expertise'
  AND au.raw_user_meta_data ? 'bio'
ON CONFLICT (user_id) DO NOTHING;

-- 3. Assign learner role to users with learner metadata but no role
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  'learner'::app_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE au.email_confirmed_at IS NOT NULL
  AND ur.role IS NULL
  AND au.raw_user_meta_data ? 'subjects_of_interest'
  AND au.raw_user_meta_data ? 'registered_year'
  AND NOT (au.raw_user_meta_data ? 'is_tutor')
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Create missing learner profiles for users with learner metadata
INSERT INTO public.learner_profiles (user_id, registered_year, subjects_of_interest)
SELECT 
  au.id,
  au.raw_user_meta_data->>'registered_year',
  ARRAY(SELECT jsonb_array_elements_text(au.raw_user_meta_data->'subjects_of_interest'))
FROM auth.users au
LEFT JOIN public.learner_profiles lp ON au.id = lp.user_id
WHERE au.email_confirmed_at IS NOT NULL
  AND lp.user_id IS NULL
  AND au.raw_user_meta_data ? 'subjects_of_interest'
  AND au.raw_user_meta_data ? 'registered_year'
  AND NOT (au.raw_user_meta_data ? 'is_tutor')
ON CONFLICT (user_id) DO NOTHING;

-- 5. Update profiles with bio for tutors
UPDATE public.profiles p
SET bio = au.raw_user_meta_data->>'bio'
FROM auth.users au
WHERE p.user_id = au.id
  AND au.raw_user_meta_data ? 'bio'
  AND (p.bio IS NULL OR p.bio = '');

-- Show results
SELECT 
  'Fixed users' as action,
  COUNT(*) as count
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email_confirmed_at IS NOT NULL;

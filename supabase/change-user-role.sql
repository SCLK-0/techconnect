-- ============================================
-- Change User Role Script
-- ============================================
-- Use this script to change a user's role in the system
-- Replace the email and role values below

-- Step 1: Find the user_id by email
-- SELECT user_id, email FROM auth.users WHERE email = 'user@example.com';

-- Step 2: Update the role (uncomment and modify)
-- UPDATE user_roles 
-- SET role = 'admin'  -- Options: 'admin', 'tutor', 'learner'
-- WHERE user_id = 'USER_ID_FROM_STEP_1';

-- Step 3: Verify the change
-- SELECT ur.user_id, p.email, p.full_name, ur.role
-- FROM user_roles ur
-- JOIN profiles p ON ur.user_id = p.user_id
-- WHERE p.email = 'user@example.com';

-- ============================================
-- Quick Examples:
-- ============================================

-- Make someone an admin:
-- UPDATE user_roles SET role = 'admin' WHERE user_id = 'xxx';

-- Make someone a tutor:
-- UPDATE user_roles SET role = 'tutor' WHERE user_id = 'xxx';

-- Make someone a learner:
-- UPDATE user_roles SET role = 'learner' WHERE user_id = 'xxx';

-- ============================================
-- View all users and their roles:
-- ============================================
SELECT 
  p.email,
  p.full_name,
  ur.role,
  ur.user_id
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.user_id
ORDER BY ur.role, p.full_name;

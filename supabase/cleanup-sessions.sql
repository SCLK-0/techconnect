-- ============================================
-- Session Cleanup Script
-- ============================================
-- This script helps clean up sessions in various states
-- Run the sections you need based on your cleanup requirements

-- ============================================
-- 1. Fix sessions stuck in "in_progress" status
-- ============================================
-- Updates sessions that are still marked as in_progress but should be completed
-- (sessions where scheduled end time has passed)

UPDATE sessions
SET 
  status = 'completed',
  updated_at = NOW()
WHERE 
  status = 'in_progress'
  AND (scheduled_date + scheduled_time + (duration || ' minutes')::INTERVAL) < NOW();

-- ============================================
-- 2. Mark missed sessions
-- ============================================
-- Updates sessions that were scheduled but never started
-- (scheduled time has passed and status is still 'scheduled')

UPDATE sessions
SET 
  status = 'missed',
  updated_at = NOW()
WHERE 
  status = 'scheduled'
  AND (scheduled_date + scheduled_time + INTERVAL '15 minutes') < NOW();

-- ============================================
-- 3. Delete old completed sessions (optional)
-- ============================================
-- WARNING: This permanently deletes session records
-- Uncomment only if you want to remove old completed sessions
-- Adjust the interval as needed (currently set to 6 months)

/*
DELETE FROM sessions
WHERE 
  status = 'completed'
  AND updated_at < NOW() - INTERVAL '6 months';
*/

-- ============================================
-- 4. Delete old cancelled sessions (optional)
-- ============================================
-- WARNING: This permanently deletes cancelled session records
-- Uncomment only if you want to remove old cancelled sessions

/*
DELETE FROM sessions
WHERE 
  status = 'cancelled'
  AND updated_at < NOW() - INTERVAL '3 months';
*/

-- ============================================
-- 5. View session statistics
-- ============================================
-- Run this to see the current state of sessions

SELECT 
  status,
  COUNT(*) as count,
  MIN(scheduled_date) as earliest_date,
  MAX(scheduled_date) as latest_date
FROM sessions
GROUP BY status
ORDER BY status;

-- ============================================
-- 6. Find problematic sessions
-- ============================================
-- Sessions that might need manual review

SELECT 
  id,
  learner_id,
  tutor_id,
  status,
  scheduled_date,
  scheduled_time,
  duration,
  created_at,
  updated_at
FROM sessions
WHERE 
  -- Sessions in progress for more than their duration
  (status = 'in_progress' AND (scheduled_date + scheduled_time + (duration || ' minutes')::INTERVAL) < NOW())
  OR
  -- Scheduled sessions that should have started
  (status = 'scheduled' AND (scheduled_date + scheduled_time) < NOW())
ORDER BY scheduled_date DESC;

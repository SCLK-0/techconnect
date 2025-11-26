# Testing Rating Percentages Feature

## Prerequisites

1. **Apply Database Migration**
   ```bash
   # Make sure Docker Desktop is running
   supabase db reset
   # or
   supabase migration up
   ```

2. **Verify Migration Applied**
   ```sql
   -- Check if function exists
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'get_tutor_rating_distribution';
   
   -- Should return: get_tutor_rating_distribution
   ```

## Test Data Setup

### Option 1: Use Existing Data
If you already have tutors with reviews, skip to "Testing Steps"

### Option 2: Create Test Data

#### Step 1: Create Test Tutor
```sql
-- Insert test tutor profile
INSERT INTO tutor_profiles (user_id, subject_expertise, bio)
VALUES (
  'test-tutor-user-id',
  ARRAY['Math', 'Physics', 'Chemistry'],
  'Test tutor for rating system'
);
```

#### Step 2: Create Test Sessions
```sql
-- Create 40 completed sessions
INSERT INTO sessions (id, tutor_id, learner_id, status)
SELECT 
  gen_random_uuid(),
  'test-tutor-user-id',
  'test-learner-' || generate_series,
  'completed'
FROM generate_series(1, 40);
```

#### Step 3: Add Ratings with Distribution
```sql
-- Add 18 five-star reviews (45%)
INSERT INTO feedback (session_id, user_id, rating, comment)
SELECT 
  s.id,
  s.learner_id,
  5,
  'Excellent tutor!'
FROM sessions s
WHERE s.tutor_id = 'test-tutor-user-id'
LIMIT 18;

-- Add 12 four-star reviews (30%)
INSERT INTO feedback (session_id, user_id, rating, comment)
SELECT 
  s.id,
  s.learner_id,
  4,
  'Very good!'
FROM sessions s
WHERE s.tutor_id = 'test-tutor-user-id'
  AND s.id NOT IN (SELECT session_id FROM feedback)
LIMIT 12;

-- Add 8 three-star reviews (20%)
INSERT INTO feedback (session_id, user_id, rating, comment)
SELECT 
  s.id,
  s.learner_id,
  3,
  'Good'
FROM sessions s
WHERE s.tutor_id = 'test-tutor-user-id'
  AND s.id NOT IN (SELECT session_id FROM feedback)
LIMIT 8;

-- Add 2 two-star reviews (5%)
INSERT INTO feedback (session_id, user_id, rating, comment)
SELECT 
  s.id,
  s.learner_id,
  2,
  'Could be better'
FROM sessions s
WHERE s.tutor_id = 'test-tutor-user-id'
  AND s.id NOT IN (SELECT session_id FROM feedback)
LIMIT 2;
```

#### Step 4: Add Rating Tags
```sql
-- Add tags to 5-star reviews (85% mention "clear_explanations")
INSERT INTO feedback_tags (feedback_id, tag)
SELECT 
  f.id,
  'clear_explanations'
FROM feedback f
INNER JOIN sessions s ON s.id = f.session_id
WHERE s.tutor_id = 'test-tutor-user-id'
  AND f.rating >= 4
LIMIT 34;

-- Add more tags for variety
INSERT INTO feedback_tags (feedback_id, tag)
SELECT 
  f.id,
  'great_communication'
FROM feedback f
INNER JOIN sessions s ON s.id = f.session_id
WHERE s.tutor_id = 'test-tutor-user-id'
  AND f.rating >= 4
LIMIT 28;

-- Continue for other tags...
```

## Testing Steps

### 1. Test Database Functions

#### Test Star Rating Distribution
```sql
SELECT * FROM get_tutor_rating_distribution('test-tutor-user-id');

-- Expected output:
-- star_rating | rating_count | percentage
-- ------------|--------------|------------
--      5      |      18      |    45.0
--      4      |      12      |    30.0
--      3      |       8      |    20.0
--      2      |       2      |     5.0
--      1      |       0      |     0.0
```

#### Test Rating Tags
```sql
SELECT * FROM get_tutor_rating_tags('test-tutor-user-id');

-- Expected output:
-- tag                  | tag_count | percentage
-- ---------------------|-----------|------------
-- clear_explanations   |    34     |    85.0
-- great_communication  |    28     |    70.0
-- always_on_time       |    26     |    65.0
-- patient_friendly     |    24     |    60.0
-- very_knowledgeable   |    22     |    55.0
```

### 2. Test UI Components

#### Test in Browser
1. **Navigate to Find Tutors Page**
   - Go to `/learner/find-tutors`
   - Find a tutor with reviews

2. **Open Tutor Detail Dialog**
   - Click on any tutor card
   - Dialog should open

3. **Verify Rating Breakdown Section**
   - Should see "Rating Breakdown" heading
   - Should see 5 progress bars (5 stars to 1 star)
   - Each bar should show:
     - Star rating number and icon
     - Progress bar (visual)
     - Percentage (e.g., "45%")
     - Count (e.g., "(18)")

4. **Verify Top Qualities Section**
   - Should see "Top Qualities" heading
   - Should see up to 5 badge tags
   - Each badge should show:
     - Emoji icon
     - Tag label
     - Percentage (e.g., "85%")
     - Count (e.g., "(34)")

### 3. Test Edge Cases

#### Test Tutor with No Reviews
```typescript
// Should not show rating sections
// Expected: Rating Breakdown and Top Qualities hidden
```

#### Test Tutor with Few Reviews (< 5)
```typescript
// Should show sections with actual data
// Percentages may be 0%, 20%, 40%, etc.
```

#### Test Tutor with Perfect Score
```sql
-- All reviews are 5-star
-- Expected:
-- 5 ⭐ 100% (all)
-- 4-1 ⭐ 0% (none)
```

#### Test Tutor with No Tags
```sql
-- Reviews exist but no tags selected
-- Expected: Top Qualities section hidden
```

### 4. Test Responsive Design

#### Desktop (> 1024px)
- Progress bars should be full width
- Badges should display in rows
- All text should be readable

#### Tablet (768px - 1024px)
- Layout should adapt
- Progress bars remain full width
- Badges may wrap to multiple lines

#### Mobile (< 768px)
- Dialog should be 95vw width
- Progress bars stack vertically
- Badges wrap appropriately
- Touch targets are adequate

### 5. Test Performance

#### Load Time
```typescript
// Open browser DevTools > Network tab
// Click tutor card
// Check API calls:
// - get_tutor_rating_distribution: < 100ms
// - get_tutor_rating_tags: < 100ms
```

#### Caching
```typescript
// 1. Open tutor dialog (fetches data)
// 2. Close dialog
// 3. Open same tutor dialog again
// Expected: Data loads instantly from cache
```

#### Real-time Updates
```typescript
// 1. Open tutor dialog
// 2. In another tab, add a new review
// 3. Return to first tab
// Expected: Data refetches on window focus
```

## Verification Checklist

- [ ] Database migration applied successfully
- [ ] `get_tutor_rating_distribution()` function exists
- [ ] Test data created (or using existing data)
- [ ] Star rating distribution displays correctly
- [ ] Progress bars show correct percentages
- [ ] Rating counts match database
- [ ] Rating tags display with percentages
- [ ] Tag counts match database
- [ ] Sections hidden when no data
- [ ] Responsive design works on all screen sizes
- [ ] Performance is acceptable (< 100ms queries)
- [ ] React Query caching works
- [ ] No console errors
- [ ] No TypeScript errors

## Common Issues & Solutions

### Issue 1: Function Not Found
```
Error: function get_tutor_rating_distribution does not exist
```
**Solution**: Run `supabase db reset` to apply migration

### Issue 2: No Data Showing
```
Rating Breakdown and Top Qualities sections are hidden
```
**Solution**: 
- Check if tutor has completed sessions with feedback
- Verify `session.status = 'completed'`
- Verify `feedback.rating IS NOT NULL`

### Issue 3: Percentages Don't Add to 100%
```
Star ratings: OK (should sum to 100%)
Rating tags: OK (can exceed 100% - multiple tags per review)
```
**Solution**: This is expected behavior for tags

### Issue 4: Progress Bars Not Showing
```
Progress component not rendering
```
**Solution**: 
- Check if `@radix-ui/react-progress` is installed
- Verify import path in TutorRatingDistribution.tsx

### Issue 5: Slow Query Performance
```
Queries taking > 500ms
```
**Solution**:
- Check database indexes exist
- Run `ANALYZE feedback;` and `ANALYZE feedback_tags;`
- Consider adding composite indexes if needed

## Manual Testing Script

```typescript
// Run in browser console on Find Tutors page

// 1. Get all tutors
const tutors = document.querySelectorAll('[data-tutor-card]');
console.log(`Found ${tutors.length} tutors`);

// 2. Click first tutor
tutors[0].click();

// 3. Wait for dialog to open
setTimeout(() => {
  // 4. Check if rating sections exist
  const ratingBreakdown = document.querySelector('h4:contains("Rating Breakdown")');
  const topQualities = document.querySelector('h4:contains("Top Qualities")');
  
  console.log('Rating Breakdown:', ratingBreakdown ? 'Found' : 'Not found');
  console.log('Top Qualities:', topQualities ? 'Found' : 'Not found');
  
  // 5. Count progress bars
  const progressBars = document.querySelectorAll('[role="progressbar"]');
  console.log(`Progress bars: ${progressBars.length} (expected: 5)`);
  
  // 6. Count rating tag badges
  const badges = document.querySelectorAll('[data-rating-tag]');
  console.log(`Rating tags: ${badges.length} (expected: up to 5)`);
}, 1000);
```

## Success Criteria

✅ **Feature is working correctly when:**
1. Star rating distribution shows for tutors with reviews
2. All 5 star levels (5-1) are displayed
3. Percentages sum to 100% for star ratings
4. Progress bars visually represent percentages
5. Rating tags show with percentages and counts
6. Sections are hidden when no data exists
7. UI is responsive on all screen sizes
8. No errors in console
9. Performance is acceptable (< 200ms total load time)
10. Data updates when new reviews are added

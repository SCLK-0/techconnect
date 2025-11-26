# Rating System Data Flow

## Complete Flow: From Review to Display

### Step 1: Learner Submits Review
```typescript
// After session completes, learner rates tutor
{
  session_id: "abc-123",
  rating: 5,  // 1-5 stars
  comment: "Great tutor!",
  tags: [
    'clear_explanations',
    'patient_friendly',
    'very_knowledgeable'
  ]
}
```

### Step 2: Data Stored in Database
```sql
-- feedback table
INSERT INTO feedback (session_id, user_id, rating, comment)
VALUES ('abc-123', 'learner-id', 5, 'Great tutor!');

-- feedback_tags table (one row per tag)
INSERT INTO feedback_tags (feedback_id, tag)
VALUES 
  ('feedback-id', 'clear_explanations'),
  ('feedback-id', 'patient_friendly'),
  ('feedback-id', 'very_knowledgeable');
```

### Step 3: Aggregation Functions Calculate Percentages

#### Star Rating Distribution
```sql
-- get_tutor_rating_distribution('tutor-id')
-- Returns:
[
  { star_rating: 5, rating_count: 18, percentage: 45.0 },
  { star_rating: 4, rating_count: 12, percentage: 30.0 },
  { star_rating: 3, rating_count: 8,  percentage: 20.0 },
  { star_rating: 2, rating_count: 2,  percentage: 5.0 },
  { star_rating: 1, rating_count: 0,  percentage: 0.0 }
]
```

#### Rating Tags Distribution
```sql
-- get_tutor_rating_tags('tutor-id')
-- Returns:
[
  { tag: 'clear_explanations',  tag_count: 34, percentage: 85.0 },
  { tag: 'great_communication', tag_count: 28, percentage: 70.0 },
  { tag: 'always_on_time',      tag_count: 26, percentage: 65.0 },
  { tag: 'patient_friendly',    tag_count: 24, percentage: 60.0 },
  { tag: 'very_knowledgeable',  tag_count: 22, percentage: 55.0 }
]
```

### Step 4: React Components Fetch and Display

#### TutorRatingDistribution Component
```typescript
// Fetches star distribution
const { data: distribution } = useQuery({
  queryKey: ['tutor-rating-distribution', tutorUserId],
  queryFn: async () => {
    const { data } = await supabase
      .rpc('get_tutor_rating_distribution', { 
        tutor_user_id: tutorUserId 
      });
    return data;
  }
});

// Renders progress bars
{distribution.map(({ star_rating, percentage, rating_count }) => (
  <div>
    <span>{star_rating} ⭐</span>
    <Progress value={percentage} />
    <span>{percentage}%</span>
    <span>({rating_count})</span>
  </div>
))}
```

#### TutorRatingTagsSection Component
```typescript
// Fetches rating tags
const { data: tutorTags } = useQuery({
  queryKey: ['tutor-tags', tutorUserId],
  queryFn: async () => {
    const { data } = await supabase
      .rpc('get_tutor_rating_tags', { 
        tutor_user_id: tutorUserId 
      });
    return data;
  }
});

// Renders badges
<TutorRatingTagsDisplay tags={tutorTags} limit={5} />
```

## Database Schema Overview

### Tables Involved

```sql
-- sessions table
sessions (
  id UUID,
  tutor_id UUID,
  learner_id UUID,
  status TEXT,  -- 'completed' for rated sessions
  ...
)

-- feedback table
feedback (
  id UUID,
  session_id UUID,
  user_id UUID,  -- learner who gave feedback
  rating INTEGER,  -- 1-5 stars
  comment TEXT,
  created_at TIMESTAMP
)

-- feedback_tags table
feedback_tags (
  id UUID,
  feedback_id UUID,
  tag rating_tag_type,  -- enum of predefined tags
  created_at TIMESTAMP
)
```

### Key Relationships

```
sessions (1) ──→ (1) feedback
                      │
                      │
                      ├──→ (many) feedback_tags
                      
sessions.tutor_id ──→ profiles.user_id (tutor)
feedback.user_id ──→ profiles.user_id (learner)
```

## Calculation Logic

### Star Rating Percentage
```javascript
// For each star level (1-5)
const totalReviews = 40;
const fiveStarCount = 18;

const percentage = (fiveStarCount / totalReviews) * 100;
// Result: 45%

// Verification: All percentages should sum to 100%
// 45% + 30% + 20% + 5% + 0% = 100% ✓
```

### Rating Tag Percentage
```javascript
// For each tag
const totalReviews = 40;
const clearExplanationsCount = 34;

const percentage = (clearExplanationsCount / totalReviews) * 100;
// Result: 85%

// Note: Tags can exceed 100% total because:
// - Each review can have multiple tags
// - If all 40 reviews select 3 tags each = 300% total
```

## Real-Time Updates

### When New Review is Added
1. Learner submits review → `feedback` table updated
2. Tags selected → `feedback_tags` table updated
3. React Query cache invalidated automatically
4. Components refetch data
5. UI updates with new percentages

### Caching Strategy
```typescript
// React Query automatically:
// - Caches results for 5 minutes (default)
// - Refetches on window focus
// - Refetches on network reconnect
// - Shares cache across components
```

## Performance Considerations

### Database Optimization
- Indexed columns: `feedback.session_id`, `feedback_tags.feedback_id`
- Materialized views: Not needed yet (fast enough with indexes)
- Query complexity: O(n) where n = number of reviews

### Frontend Optimization
- React Query caching reduces API calls
- Components only render when data changes
- Progress bars use CSS transforms (GPU accelerated)
- Lazy loading: Only fetch when dialog opens

## Edge Cases Handled

### No Reviews Yet
```typescript
if (!distribution || distribution.length === 0) {
  return null;  // Don't show section
}
```

### Missing Star Levels
```typescript
// If tutor has no 1-star reviews, still show 0%
const allStars = [5, 4, 3, 2, 1].map(star => ({
  star_rating: star,
  rating_count: ratingMap.get(star)?.rating_count || 0,
  percentage: ratingMap.get(star)?.percentage || 0,
}));
```

### Division by Zero
```sql
-- In SQL function
ROUND((rating_count::numeric / NULLIF(total_ratings, 0) * 100), 1)
-- NULLIF prevents division by zero
```

## Testing Scenarios

### Scenario 1: New Tutor (No Reviews)
- Rating Breakdown: Hidden
- Top Qualities: Hidden
- Overall Rating: Not shown

### Scenario 2: Few Reviews (1-5)
- Rating Breakdown: Shown with actual data
- Top Qualities: Shown (may have < 5 tags)
- Percentages may be 0%, 20%, 40%, etc. (larger increments)

### Scenario 3: Many Reviews (100+)
- Rating Breakdown: Smooth distribution
- Top Qualities: Top 5 most mentioned
- Percentages more granular (e.g., 47.3%)

### Scenario 4: Perfect Score
- 5 ⭐ 100% (all reviews)
- 4-1 ⭐ 0% (no reviews)
- Still shows all star levels for transparency

# Rating Tags Feature

## Overview
Like e-commerce reviews (Amazon, Shopee, etc.), learners can now tag tutors with specific qualities after completing a session.

## How It Works

### For Learners (Giving Feedback)
1. Complete a session
2. Click "Leave Feedback"
3. Rate 1-5 stars
4. **Select tags** that describe the tutor:
   - 🎯 Clear Explanations
   - 💬 Great Communication
   - ⏰ Always On Time
   - 😊 Patient & Friendly
   - 🧠 Very Knowledgeable
   - 🚀 Helped Me Improve
   - 📚 Well Prepared
   - ✨ Engaging Session
   - 💡 Good Examples
   - ⚡ Responsive
5. Add optional comment
6. Submit

### For Tutors (Displaying Tags)
Tags appear on tutor profiles showing:
- **Most common tags** (top 5)
- **Percentage** of reviews with that tag
- **Count** of how many times tagged

**Example Display:**
```
Hannah Montana ⭐ 4.8 (25 reviews)

Top Qualities:
🎯 Clear Explanations (85%)
💬 Great Communication (72%)
😊 Patient & Friendly (68%)
🧠 Very Knowledgeable (64%)
🚀 Helped Me Improve (60%)
```

## Database Structure

### Tables

**feedback_tags**
- `id` - UUID
- `feedback_id` - References feedback
- `tag` - Enum (rating_tag_type)
- `created_at` - Timestamp

**Enum: rating_tag_type**
```sql
CREATE TYPE rating_tag_type AS ENUM (
  'clear_explanations',
  'great_communication',
  'always_on_time',
  'patient_friendly',
  'very_knowledgeable',
  'helped_improve',
  'well_prepared',
  'engaging_session',
  'good_examples',
  'responsive'
);
```

### Functions

**get_tutor_rating_tags(tutor_user_id)**
Returns tutor's tags with counts and percentages:
```sql
SELECT * FROM get_tutor_rating_tags('tutor-uuid');

-- Returns:
-- tag                    | tag_count | percentage
-- ----------------------|-----------|------------
-- clear_explanations    | 17        | 85.0
-- great_communication   | 14        | 70.0
-- patient_friendly      | 13        | 65.0
```

## React Components

### RatingTags Component
**Location:** `src/components/feedback/RatingTags.tsx`

**Usage for selection (in feedback form):**
```tsx
import { RatingTags, type RatingTag } from "@/components/feedback/RatingTags";

const [selectedTags, setSelectedTags] = useState<RatingTag[]>([]);

<RatingTags 
  selectedTags={selectedTags}
  onTagToggle={(tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }}
/>
```

**Usage for display (on tutor profile):**
```tsx
import { TutorRatingTagsDisplay } from "@/components/feedback/RatingTags";

// Fetch tags
const { data: tags } = useQuery({
  queryKey: ['tutor-tags', tutorId],
  queryFn: async () => {
    const { data } = await supabase
      .rpc('get_tutor_rating_tags', { tutor_user_id: tutorId });
    return data;
  }
});

// Display
<TutorRatingTagsDisplay tags={tags || []} limit={5} />
```

## Integration Points

### 1. Feedback Dialog ✅
**File:** `src/components/learner/FeedbackDialog.tsx`
- Added tag selection UI
- Saves tags when submitting feedback

### 2. Tutor Profile/Card (TODO)
**Files to update:**
- `src/pages/learner/FindTutors.tsx` - Show tags on tutor cards
- `src/components/learner/TutorDetailDialog.tsx` - Show tags in detail view
- `src/pages/tutor/TutorDashboard.tsx` - Show tutor their own tags

**Example implementation:**
```tsx
// In FindTutors.tsx or TutorDetailDialog.tsx
const { data: tutorTags } = useQuery({
  queryKey: ['tutor-tags', tutor.user_id],
  queryFn: async () => {
    const { data } = await supabase
      .rpc('get_tutor_rating_tags', { tutor_user_id: tutor.user_id });
    return data || [];
  },
  enabled: !!tutor.user_id
});

// Display in UI
{tutorTags && tutorTags.length > 0 && (
  <div className="mt-4">
    <h4 className="text-sm font-medium mb-2">Top Qualities</h4>
    <TutorRatingTagsDisplay tags={tutorTags} limit={3} />
  </div>
)}
```

### 3. Tutor Feedback Page (TODO)
**File:** `src/pages/tutor/TutorFeedback.tsx`
- Show tags received in each review
- Display aggregate tag statistics

## Benefits

### For Learners
- Quick way to express what they liked
- More specific than just star rating
- Helps other learners choose tutors

### For Tutors
- Understand their strengths
- See what learners appreciate most
- Build reputation with specific qualities
- Stand out from other tutors

### For Platform
- Richer data for matching
- Better tutor recommendations
- Quality insights for improvement

## Future Enhancements

1. **Tag-based Search**
   - Filter tutors by specific tags
   - "Show me tutors who are 'Patient & Friendly'"

2. **Negative Tags** (Optional)
   - "Needs Improvement" tags
   - Only visible to tutor and admin
   - Helps tutors improve

3. **Custom Tags**
   - Allow learners to add custom tags
   - Admin can promote popular custom tags to official list

4. **Tag Trends**
   - Show how tags change over time
   - "Your 'Clear Explanations' rating improved by 15%"

5. **Gamification**
   - Badges for achieving high percentages
   - "Master Communicator" badge for 90%+ communication tags

## Migration

Run the migration:
```bash
supabase db push
```

Or apply manually in Supabase dashboard:
```sql
-- Copy content from:
supabase/migrations/20251120_add_rating_tags.sql
```

## Testing

1. Complete a session as a learner
2. Leave feedback with rating and tags
3. Check database:
```sql
SELECT * FROM feedback_tags;
SELECT * FROM get_tutor_rating_tags('tutor-uuid');
```
4. Verify tags appear in tutor profile

# Favorite Tutors Feature

## Overview
Learners can now bookmark/favorite tutors for quick access, similar to e-commerce wishlists or social media favorites.

## Where Favorites Appear

### 1. ❤️ Find Tutors Page
- **Heart icon** on top-right of each tutor card
- Click to favorite/unfavorite instantly
- Filled red heart = favorited
- Outline heart = not favorited

### 2. ❤️ Tutor Detail Modal
- Heart button appears when viewing tutor profile
- Same functionality as card

### 3. 📄 Favorites Page (New!)
- **Location:** Learner Sidebar → "Favorites"
- **URL:** `/learner/favorites`
- Shows all favorited tutors in a grid
- Quick actions: View Profile, Book Session
- Can unfavorite directly from this page

## User Flow

### Adding a Favorite
1. Browse tutors on "Find Tutors" page
2. Click heart icon on tutor card
3. Toast notification: "Added to favorites"
4. Heart turns red and fills

### Viewing Favorites
1. Click "Favorites" in sidebar
2. See all favorited tutors
3. Click "View Profile" to see details
4. Click "Book Session" to book directly

### Removing a Favorite
1. Click filled heart icon (on card or favorites page)
2. Toast notification: "Removed from favorites"
3. Heart becomes outline
4. Tutor removed from favorites page

## Database Structure

### Table: favorite_tutors
```sql
CREATE TABLE favorite_tutors (
  id UUID PRIMARY KEY,
  learner_id UUID REFERENCES auth.users(id),
  tutor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP,
  UNIQUE(learner_id, tutor_id)
);
```

### Functions

**is_tutor_favorited(learner_id, tutor_id)**
- Returns boolean
- Checks if tutor is in learner's favorites

**get_favorite_tutors(learner_id)**
- Returns all favorite tutors with details
- Includes: name, avatar, subjects, bio, rating, online status
- Ordered by most recently favorited

## Implementation Files

### Database
- `supabase/migrations/20251120_add_favorite_tutors.sql`

### React Hook
- `src/hooks/useFavoriteTutor.ts`
  - `toggleFavorite()` - Add/remove favorite
  - `isFavorited` - Current state
  - `isLoading` - Loading state

### Pages
- `src/pages/learner/FavoriteTutors.tsx` - Favorites page
- `src/pages/learner/FindTutors.tsx` - Added heart button

### Components
- `FavoriteButton` - Reusable heart button component
- `FavoriteTutorCard` - Card display on favorites page

### Routes
- Added `/learner/favorites` route in `src/App.tsx`

### Sidebar
- Added "Favorites" menu item in `src/components/learner/LearnerSidebar.tsx`

## Features

✅ **Instant Feedback**
- Heart fills immediately when clicked
- Toast notifications
- No page reload needed

✅ **Persistent Storage**
- Favorites saved to database
- Syncs across devices
- Survives logout/login

✅ **Smart Display**
- Shows tutor's current online status
- Displays rating and review count
- Shows subject expertise
- Quick book button

✅ **Empty State**
- Friendly message when no favorites
- "Find Tutors" button to start browsing

## Benefits

### For Learners
- Quick access to preferred tutors
- No need to search repeatedly
- Build relationships with favorite tutors
- Easy rebooking

### For Tutors
- Increased repeat bookings
- Build loyal student base
- Visibility metric (future: show "X learners favorited you")

### For Platform
- User engagement metric
- Retention indicator
- Recommendation data

## Future Enhancements

1. **Notifications**
   - "Your favorite tutor [Name] is now online!"
   - "Your favorite tutor has new availability"

2. **Analytics for Tutors**
   - Show tutors how many learners favorited them
   - "You're favorited by 15 learners"

3. **Smart Recommendations**
   - "Learners who favorited this tutor also liked..."
   - Based on favorite patterns

4. **Favorite Collections**
   - Group favorites by subject
   - "My Programming Tutors", "My Math Tutors"

5. **Priority Booking**
   - Favorite tutors appear first in search
   - Filter: "Show only my favorites"

## Testing

### Manual Test Flow
1. Login as learner
2. Go to "Find Tutors"
3. Click heart on a tutor card
4. Verify toast appears
5. Go to "Favorites" in sidebar
6. Verify tutor appears
7. Click heart again to unfavorite
8. Verify tutor disappears from favorites page

### Database Test
```sql
-- Check favorites
SELECT * FROM favorite_tutors WHERE learner_id = 'your-learner-id';

-- Get favorite tutors
SELECT * FROM get_favorite_tutors('your-learner-id');

-- Check if favorited
SELECT is_tutor_favorited('learner-id', 'tutor-id');
```

## Migration

Run the migration:
```bash
supabase db push
```

Or apply manually in Supabase dashboard SQL editor.

## UI/UX Notes

- Heart icon is universally recognized for favorites
- Red color indicates favorited state
- Smooth transitions for better feel
- Works on mobile and desktop
- Accessible with keyboard navigation

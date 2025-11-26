# How to Apply the Rating Distribution Migration

## Quick Steps (2 minutes)

### Step 1: Open Supabase Studio
1. Go to https://supabase.com/dashboard
2. Select your project: **ntuivtjkiwicmztzcsii**
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the SQL
1. Click **New Query** button
2. Open the file `APPLY-RATING-DISTRIBUTION.sql` in your project
3. Copy ALL the SQL code
4. Paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify It Worked
You should see: `Success. No rows returned`

That's it! The feature is now live.

## Alternative: Use Supabase CLI

If you prefer command line and have Supabase linked:

```bash
# Link to your project (if not already linked)
supabase link --project-ref ntuivtjkiwicmztzcsii

# Push just this one migration
supabase db execute --file APPLY-RATING-DISTRIBUTION.sql
```

## What This Does

Creates a database function called `get_tutor_rating_distribution()` that:
- Calculates percentage breakdown of 1-5 star ratings
- Returns count and percentage for each star level
- Used by the TutorRatingDistribution component

## Testing After Apply

1. Go to your app: Find Tutors page
2. Click on any tutor with reviews
3. You should now see:
   - **Rating Breakdown** section with progress bars
   - Each star level (5-1) with percentage and count
   - **Top Qualities** with enhanced display

## Troubleshooting

### "Function already exists"
If you see this error, the function is already there! You're good to go.

### "Permission denied"
Make sure you're logged into Supabase Studio with admin access.

### "Table does not exist"
This means your database schema is different. Contact me for help.

### Still not working?
Check browser console for errors when viewing tutor profile.

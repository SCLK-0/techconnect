# 🔧 Fix Admin Users Error

## The Problem
```
Could not find a relationship between 'profiles' and 'user_roles' in the schema cache
```

This error occurs because the database tables are missing **foreign key constraints**. Supabase needs these to understand how tables relate to each other for joins.

## ✅ Quick Fix (1 minute)

### Step 1: Go to Supabase SQL Editor
https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/sql/new

### Step 2: Run the Fix

Copy the entire contents of `fix-foreign-keys.sql` and paste it into the SQL Editor, then click **Run**.

This will add all missing foreign key constraints between:
- profiles ↔ auth.users
- user_roles ↔ auth.users
- tutor_profiles ↔ auth.users
- learner_profiles ↔ auth.users
- sessions ↔ users
- And all other related tables

### Step 3: Refresh Your App

1. Go back to http://localhost:8080
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Navigate to Admin Users page
4. ✅ Should load users now!

---

## What This Does

Foreign keys tell Supabase:
- How tables are related
- Enable automatic joins in queries
- Maintain referential integrity
- Allow cascade deletes

The query in your app:
```javascript
.select('*, user_roles(role)')
```

Requires a foreign key relationship to work. Without it, Supabase doesn't know how to join the tables.

---

## Verification

After running the SQL, you can verify foreign keys exist:

```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

You should see all the relationships listed.

---

**Quick Fix:** Just run `fix-foreign-keys.sql` in SQL Editor! 🚀

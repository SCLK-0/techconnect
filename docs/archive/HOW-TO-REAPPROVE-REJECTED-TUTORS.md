# How to Re-Approve Declined Tutors

## Current Limitation
The admin Approvals page only shows **pending** tutors. Once a tutor is declined, they disappear from the UI and cannot be re-approved through the interface.

---

## Solution 1: Manual Database Update (Current Method)

### Step 1: Find the Declined Tutor
Run this query in Supabase SQL Editor:

```sql
-- View all declined tutors
SELECT 
  tp.id,
  tp.user_id,
  p.full_name,
  tp.subject_expertise,
  tp.bio,
  tp.status,
  tp.created_at
FROM tutor_profiles tp
JOIN profiles p ON p.user_id = tp.user_id
WHERE tp.status = 'declined'
ORDER BY tp.created_at DESC;
```

### Step 2: Change Status Back to Pending
```sql
-- Replace 'TUTOR_PROFILE_ID' with the actual ID from step 1
UPDATE tutor_profiles
SET status = 'pending'
WHERE id = 'TUTOR_PROFILE_ID';
```

### Step 3: Admin Reviews Again
- The tutor will now appear in the Approvals page
- Admin can review and approve normally
- Tutor will receive approval notification

---

## Solution 2: Add Declined Tutors Tab (Recommended Enhancement)

### What to Add:
Create a new tab in the Approvals page to view declined tutors with the ability to:
1. View all declined tutors
2. See declination date
3. Re-approve with one click
4. Permanently delete if needed

### Implementation Steps:

#### 1. Update AdminApprovals.tsx
Add a tab system:
```typescript
const [activeTab, setActiveTab] = useState<'pending' | 'declined'>('pending');

// Add query for declined tutors
const { data: declinedTutors = [] } = useQuery({
  queryKey: ["declined-tutors"],
  queryFn: async () => {
    const { data: tutorProfiles } = await supabase
      .from("tutor_profiles")
      .select("*")
      .eq("status", "declined")
      .order("created_at", { ascending: false });
    
    // ... merge with profiles like pending tutors
    return tutorsWithProfiles;
  },
  enabled: activeTab === 'declined'
});
```

#### 2. Add Tab UI
```typescript
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="pending">
      Pending ({pendingTutors.length})
    </TabsTrigger>
    <TabsTrigger value="declined">
      Declined ({declinedTutors.length})
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="pending">
    {/* Existing pending tutors UI */}
  </TabsContent>
  
  <TabsContent value="declined">
    {/* Declined tutors with "Re-approve" button */}
  </TabsContent>
</Tabs>
```

#### 3. Add Re-approve Button
```typescript
<Button
  onClick={() => updateStatusMutation.mutate({ 
    id: tutor.id, 
    status: "approved"  // Directly approve
    // OR status: "pending" to send back for review
  })}
>
  <CheckCircle className="h-4 w-4 mr-2" />
  Re-approve
</Button>
```

---

## Solution 3: Quick SQL Script for Bulk Re-approval

If you need to re-approve multiple declined tutors:

```sql
-- Re-approve all declined tutors (use with caution!)
UPDATE tutor_profiles
SET status = 'pending'
WHERE status = 'declined';

-- Re-approve specific tutors by name
UPDATE tutor_profiles tp
SET status = 'pending'
FROM profiles p
WHERE tp.user_id = p.user_id
  AND tp.status = 'declined'
  AND p.full_name IN ('John Doe', 'Jane Smith');

-- Re-approve tutors declined after a certain date
UPDATE tutor_profiles
SET status = 'pending'
WHERE status = 'declined'
  AND created_at > '2025-11-01';
```

---

## Workflow Options

### Option A: Back to Pending (Safer)
```sql
UPDATE tutor_profiles SET status = 'pending' WHERE id = 'xxx';
```
- Tutor appears in Approvals page again
- Admin can review before approving
- More control

### Option B: Direct Approval (Faster)
```sql
UPDATE tutor_profiles SET status = 'approved' WHERE id = 'xxx';
```
- Tutor is immediately approved
- Skips review process
- Faster but less oversight

---

## Best Practices

### When to Re-approve:
1. **Tutor improved their profile** - They contacted support and updated their bio/qualifications
2. **Initial declination was a mistake** - Admin clicked wrong button
3. **Policy changed** - Requirements were relaxed
4. **Tutor reapplied** - After addressing concerns

### When NOT to Re-approve:
1. **Serious violations** - Inappropriate content, fraud
2. **No changes made** - Tutor didn't address declination reasons
3. **Duplicate accounts** - Should be merged, not re-approved

### Documentation:
Consider adding a notes field to track:
- Why tutor was declined
- Why they were re-approved
- Date of status changes
- Admin who made the decision

---

## Future Enhancement: Declination Reasons

Add these fields to tutor_profiles:
```sql
ALTER TABLE tutor_profiles
ADD COLUMN declination_reason TEXT,
ADD COLUMN declination_notes TEXT,
ADD COLUMN declined_at TIMESTAMP,
ADD COLUMN declined_by UUID REFERENCES auth.users(id);
```

This would help:
- Track why tutors were declined
- Provide feedback to tutors
- Make re-approval decisions easier
- Audit trail for admin actions

---

## Summary

**Current State:**
- ❌ No UI to view declined tutors
- ❌ No way to re-approve through interface
- ✅ Can manually update via SQL

**Recommended:**
- ✅ Add "Declined" tab to Approvals page
- ✅ Add "Re-approve" button
- ✅ Add declination reasons for better tracking

**Quick Fix (Now):**
Use SQL to change status from 'declined' to 'pending', then approve through UI.

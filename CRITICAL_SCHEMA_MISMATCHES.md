# Critical Schema Mismatches Found

## ❌ ISSUE 1: meetings.scheduled_date vs scheduled_at
**Location:** `pages/AdminBookings.tsx` line 142
**Problem:** Code checks `m.scheduled_date` but database column is `scheduled_at`
**Impact:** Meetings won't load properly
**Fix Required:** Change `scheduled_date` to `scheduled_at`

## ✅ VERIFIED CORRECT:
1. Delete function uses soft delete (`deleted_permanently: true`) ✓
2. Archive function sets `archived_at` timestamp ✓
3. Meeting insert uses `scheduled_at` ✓
4. Opportunities insert/update working correctly ✓
5. Projects insert/update working correctly ✓
6. Mark as Lead creates opportunity correctly ✓

## Action Items:
- [ ] Fix loadMeetings to use `scheduled_at` instead of `scheduled_date`
- [ ] Verify all other date column references
- [ ] Test full workflow after fix

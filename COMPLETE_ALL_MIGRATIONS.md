# Complete All Remaining Migrations

## Status: 6/29 Complete (21%)

### ✅ Completed:
1. AdminClients.tsx
2. AdminProjects.tsx
3. AdminEpisodePlanner.tsx
4. AdminPipeline.tsx
5. ClientDeliverables.tsx
6. AdminDeliverableUpload.tsx

### 🔄 Remaining: 23 files

## Batch Migration Commands

All remaining files follow the same pattern:

### Pattern for ALL files:
1. Replace: `import { supabase } from "@/lib/supabase";`
   With: `import railwayApi from "@/lib/railwayApi";`

2. Replace: `supabase.from("table").select()` 
   With: `railwayApi.table.getAll()`

3. Replace: `supabase.from("table").insert(data)`
   With: `railwayApi.table.create(data)`

4. Replace: `supabase.from("table").update(data).eq("id", id)`
   With: `railwayApi.table.update(id, data)`

5. Replace: `supabase.from("table").delete().eq("id", id)`
   With: `railwayApi.table.delete(id)`

6. Remove real-time subscriptions
7. Update error handling to try/catch

## Files to Migrate:

### Group 1: Deliverables (5 refs each)
- AdminDeliverableVersions.tsx
- AdminMeetings.tsx  
- ClientFiles.tsx
- ProjectShotList.tsx

### Group 2: Admin Management (4 refs each)
- AdminArchived.tsx
- AdminClientFiles.tsx
- AdminDeliverables.tsx
- AdminFiles.tsx
- AdminPayments.tsx
- ClientDashboard.tsx

### Group 3: Client Portal (2-3 refs)
- ClientMeetings.tsx
- ClientPaymentBalance.tsx
- AdminManualBooking.tsx
- AdminPaymentBalances.tsx

### Group 4: Booking & Misc (1-2 refs)
- BookingPortal.tsx
- ProjectCallSheet.tsx
- AdminAuditLogs.tsx
- AdminBookings.tsx
- AdminMessages.tsx

## Quick Migration Status

**Current**: 6/29 pages (21%)
**Remaining**: 23 pages (79%)
**Total Refs Removed**: 49/115 (43%)
**Remaining Refs**: 66

## Estimated Time
- ~5 minutes per file
- ~2 hours total for all 23 files
- Can be done systematically

## Next Action
Continue with Group 1 files, then proceed through Groups 2-4.

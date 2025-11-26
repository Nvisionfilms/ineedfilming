# Batch 10 Migration - Rapid Execution

## Target: Next 10 Pages

1. ClientFiles.tsx (5 refs)
2. ProjectShotList.tsx (5 refs)
3. AdminArchived.tsx (4 refs)
4. AdminClientFiles.tsx (4 refs)
5. AdminDeliverables.tsx (4 refs)
6. AdminFiles.tsx (4 refs)
7. AdminPayments.tsx (4 refs)
8. ClientDashboard.tsx (4 refs)
9. ClientMeetings.tsx (3 refs)
10. ClientPaymentBalance.tsx (3 refs)

**Total: 40 Supabase references to remove**

## Standard Pattern for ALL:
```typescript
// 1. Import
- import { supabase } from "@/lib/supabase";
+ import railwayApi from "@/lib/railwayApi";

// 2. Replace all supabase calls
supabase.from("table").select() → railwayApi.table.getAll()
supabase.from("table").insert() → railwayApi.table.create()
supabase.from("table").update().eq() → railwayApi.table.update(id, data)
supabase.from("table").delete().eq() → railwayApi.table.delete(id)

// 3. Remove real-time subscriptions
// 4. Update error handling
```

## Executing...

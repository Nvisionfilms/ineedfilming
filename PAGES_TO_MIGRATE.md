# Pages Migration Checklist

## Strategy
Replace all `supabase.from()` calls with `api.*()` calls from Railway API client.

## Pages (16 total)

### ✅ Completed (3)
- [x] AdminLogin.tsx
- [x] ClientLogin.tsx  
- [x] MFAChallenge.tsx

### 🔄 In Progress (16)

**Priority 1 - Core Admin Pages:**
1. [ ] AdminClients.tsx - Client management
2. [ ] AdminBookings.tsx - Booking management
3. [ ] AdminProjects.tsx - Project management
4. [ ] AdminMessages.tsx - Message management

**Priority 2 - Client Portal Pages:**
5. [ ] ClientFiles.tsx - File management
6. [ ] ClientMessages.tsx - Client messaging
7. [ ] ClientDeliverables.tsx - Deliverables view
8. [ ] ClientPaymentBalance.tsx - Payment tracking
9. [ ] ClientMeetings.tsx - Meeting scheduling

**Priority 3 - Project Management:**
10. [ ] ProjectCallSheet.tsx - Call sheets
11. [ ] ProjectShotList.tsx - Shot lists
12. [ ] ProjectLocations.tsx - Location management

**Priority 4 - Additional Admin:**
13. [ ] AdminClientFiles.tsx - File management
14. [ ] AdminDeliverables.tsx - Deliverables management
15. [ ] AdminManualBooking.tsx - Manual booking creation
16. [ ] AdminPipeline.tsx - Pipeline view

## Migration Pattern

### Before (Supabase):
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', id);
```

### After (Railway API):
```typescript
const { data, error } = await api.getTableName(id);
```

## Notes
- All API methods return `{ data, error }` format for compatibility
- Authentication handled automatically via JWT token in API client
- No need to import supabase client anymore

# Railway Migration TODO List

## 🎯 Current Status
- ✅ Railway API backend deployed and working
- ✅ Database schema migrated to Railway PostgreSQL
- ✅ Auth endpoints working
- ❌ **115 Supabase references still in frontend pages (29 files)**

---

## 📋 Migration Checklist

### Phase 1: High Priority Pages (Most Supabase References)

#### 1. AdminClients.tsx (15 Supabase references) ✅ COMPLETED
- [x] Replace `supabase.from('client_accounts')` with Railway API calls
- [x] Update fetch/create/update/delete client operations
- [x] Test CRUD operations
- [x] Verify RLS/permissions work correctly

#### 2. AdminProjects.tsx (12 Supabase references) ✅ COMPLETED
- [x] Replace `supabase.from('projects')` with Railway API calls
- [x] Update project CRUD operations
- [x] Test project status updates
- [x] Verify client relationships

#### 3. AdminEpisodePlanner.tsx (8 Supabase references) ✅ COMPLETED
- [x] Replace `supabase.from('episodes')` with Railway API calls
- [x] Update episode management
- [x] Test episode creation/editing
- [x] Verify project associations

#### 4. AdminPipeline.tsx (7 Supabase references) ✅ COMPLETED
- [x] Replace `supabase.from('opportunities')` with Railway API calls
- [x] Update pipeline/opportunity operations
- [x] Test drag-and-drop functionality
- [x] Verify status transitions

#### 5. ClientDeliverables.tsx (7 Supabase references)
- [ ] Replace `supabase.from('deliverables')` with Railway API calls
- [ ] Update deliverable viewing
- [ ] Test file downloads
- [ ] Verify client access permissions

---

### Phase 2: Medium Priority Pages (5-6 Supabase references)

#### 6. AdminDeliverableUpload.tsx (5 references)
- [ ] Replace Supabase storage with Railway file handling
- [ ] Update file upload logic
- [ ] Test file uploads
- [ ] Verify storage permissions

#### 7. AdminDeliverableVersions.tsx (5 references)
- [ ] Replace deliverable version queries
- [ ] Update version management
- [ ] Test version history
- [ ] Verify rollback functionality

#### 8. AdminMeetings.tsx (5 references)
- [ ] Replace `supabase.from('meetings')` with Railway API
- [ ] Update meeting CRUD operations
- [ ] Test calendar integration
- [ ] Verify client notifications

#### 9. ClientFiles.tsx (5 references)
- [ ] Replace file queries with Railway API
- [ ] Update file listing
- [ ] Test file access
- [ ] Verify permissions

#### 10. ProjectShotList.tsx (5 references)
- [ ] Replace shot list queries
- [ ] Update shot list management
- [ ] Test CRUD operations
- [ ] Verify project associations

---

### Phase 3: Standard Priority Pages (3-4 Supabase references)

#### 11-20. Files with 3-4 references:
- [ ] AdminArchived.tsx (4)
- [ ] AdminClientFiles.tsx (4)
- [ ] AdminDeliverables.tsx (4)
- [ ] AdminFiles.tsx (4)
- [ ] AdminPayments.tsx (4)
- [ ] ClientDashboard.tsx (4)
- [ ] ClientMeetings.tsx (3)
- [ ] ClientPaymentBalance.tsx (3)

---

### Phase 4: Low Priority Pages (1-2 Supabase references)

#### 21-29. Files with 1-2 references:
- [ ] AdminManualBooking.tsx (2)
- [ ] AdminPaymentBalances.tsx (2)
- [ ] BookingPortal.tsx (2)
- [ ] ProjectCallSheet.tsx (2)
- [ ] AdminAuditLogs.tsx (1)
- [ ] AdminBookings.tsx (1)
- [ ] AdminMessages.tsx (1)

---

## 🔧 Technical Tasks

### API Integration
- [ ] Create centralized Railway API client utility
- [ ] Add error handling wrapper
- [ ] Implement retry logic for failed requests
- [ ] Add loading states for all API calls
- [ ] Implement optimistic updates where appropriate

### Authentication
- [ ] Verify JWT token handling
- [ ] Update auth context to use Railway API
- [ ] Test session persistence
- [ ] Implement token refresh logic
- [ ] Add logout functionality

### File Storage
- [ ] Migrate file uploads from Supabase Storage to Railway
- [ ] Update file URL generation
- [ ] Implement signed URLs for secure access
- [ ] Test file upload/download
- [ ] Verify file permissions

### Real-time Features
- [ ] Replace Supabase realtime subscriptions
- [ ] Implement WebSocket or polling for live updates
- [ ] Test real-time notifications
- [ ] Verify multi-user updates

---

## 🧪 Testing Checklist

### Per Page Migration:
- [ ] Test all CRUD operations
- [ ] Verify error handling
- [ ] Check loading states
- [ ] Test permissions/access control
- [ ] Verify data consistency
- [ ] Test edge cases (empty states, errors, etc.)

### Integration Testing:
- [ ] Test cross-page workflows
- [ ] Verify data flows between pages
- [ ] Test user journeys (admin & client)
- [ ] Check performance/load times

---

## 🚀 Deployment Steps

1. [ ] Complete all page migrations
2. [ ] Run full test suite
3. [ ] Update environment variables
4. [ ] Deploy Railway API
5. [ ] Deploy frontend to Netlify
6. [ ] Verify production functionality
7. [ ] Monitor for errors
8. [ ] Remove Supabase dependencies from package.json
9. [ ] Archive Supabase project

---

## 📝 Notes

- Railway API Base URL: `https://your-railway-api.up.railway.app`
- All endpoints should use `/api/` prefix
- Use TypeScript types from Railway API
- Maintain consistent error handling across all pages
- Document any breaking changes

---

## ⚠️ Critical Items

1. **Backup Data**: Ensure all Supabase data is backed up before final cutover
2. **Environment Variables**: Update all `.env` files with Railway credentials
3. **API Keys**: Rotate any exposed API keys
4. **Testing**: Test each page thoroughly before moving to next
5. **Rollback Plan**: Keep Supabase connection available until 100% migrated

---

## 🎯 Success Criteria

- ✅ Zero Supabase references in codebase
- ✅ All pages functional with Railway API
- ✅ All tests passing
- ✅ Production deployment successful
- ✅ No performance degradation
- ✅ User workflows uninterrupted

---

**Last Updated**: Nov 26, 2025
**Status**: In Progress - 0/29 pages migrated

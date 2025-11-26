# Batch Migration Script

## Completed (4/29)
1. ✅ AdminClients.tsx (15 refs)
2. ✅ AdminProjects.tsx (12 refs)  
3. ✅ AdminEpisodePlanner.tsx (8 refs)
4. ✅ AdminPipeline.tsx (7 refs)

## Remaining Pages (25/29)

### Batch 1: High Priority (5 pages, 27 refs)
5. ClientDeliverables.tsx (7 refs)
6. AdminDeliverableUpload.tsx (5 refs)
7. AdminDeliverableVersions.tsx (5 refs)
8. AdminMeetings.tsx (5 refs)
9. ClientFiles.tsx (5 refs)

### Batch 2: Medium Priority Part 1 (5 pages, 20 refs)
10. ProjectShotList.tsx (5 refs)
11. AdminArchived.tsx (4 refs)
12. AdminClientFiles.tsx (4 refs)
13. AdminDeliverables.tsx (4 refs)
14. AdminFiles.tsx (4 refs)

### Batch 3: Medium Priority Part 2 (5 pages, 17 refs)
15. AdminPayments.tsx (4 refs)
16. ClientDashboard.tsx (4 refs)
17. ClientMeetings.tsx (3 refs)
18. ClientPaymentBalance.tsx (3 refs)
19. AdminManualBooking.tsx (2 refs)

### Batch 4: Low Priority (6 pages, 8 refs)
20. AdminPaymentBalances.tsx (2 refs)
21. BookingPortal.tsx (2 refs)
22. ProjectCallSheet.tsx (2 refs)
23. AdminAuditLogs.tsx (1 ref)
24. AdminBookings.tsx (1 ref)
25. AdminMessages.tsx (1 ref)

## Migration Pattern
For each file:
1. Import railwayApi
2. Replace supabase.from() calls
3. Update error handling
4. Remove real-time subscriptions (add TODO)
5. Test compilation

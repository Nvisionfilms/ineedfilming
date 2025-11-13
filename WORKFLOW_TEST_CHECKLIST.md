# 🎯 Complete Client Workflow Test Checklist

## Pre-Flight Checks
- [ ] Run `COMPLETE_SYSTEM_AUDIT.sql` to verify database structure
- [ ] Verify all storage buckets exist (project-deliverables, project-shared-files, project-private-files)
- [ ] Confirm admin user has proper role in `user_roles` table
- [ ] Check Netlify deployment is live and successful

---

## 📋 **WORKFLOW 1: Create New Client Account**

### Admin Side (https://nvisionfilms.netlify.app/admin/clients)
1. [ ] Click "Create Client Account" button
2. [ ] Fill in form:
   - Email: `testclient@example.com`
   - Password: `TestPass123!`
   - Full Name: `Test Client`
   - Company Name: `Test Company`
   - Link to Booking: Select an approved booking (optional)
3. [ ] Click "Create New Account"
4. [ ] Verify success message appears
5. [ ] Verify client appears in the client list
6. [ ] Verify client card shows:
   - Company name
   - Email
   - Storage info (0.00 / 0 GB)
   - Status badge

### Expected Results:
- ✅ Client account created in `client_accounts` table
- ✅ Auth user created in Supabase Auth
- ✅ Profile created in `profiles` table
- ✅ No errors in console

---

## 📁 **WORKFLOW 2: Create Project for Client**

### Admin Side (https://nvisionfilms.netlify.app/admin/clients)
1. [ ] Find the test client card
2. [ ] Click the three dots menu (⋮)
3. [ ] Click "Create Project"
4. [ ] Fill in project form:
   - Project Name: `Test Video Project`
   - Project Type: `Documentary`
   - Shoot Date: Select a future date
   - Delivery Date: Select a date after shoot date
   - Notes: `Test project notes`
5. [ ] Click "Create Project"
6. [ ] Verify success message
7. [ ] Go to Projects page (https://nvisionfilms.netlify.app/admin/projects)
8. [ ] Verify project appears in list
9. [ ] Verify project shows correct client name

### Expected Results:
- ✅ Project created in `projects` table with `title` field
- ✅ Project linked to client via `client_accounts.project_id`
- ✅ Project visible in admin projects list
- ✅ Client name and email populated correctly

---

## 📤 **WORKFLOW 3: Upload Files to Project**

### Admin Side (https://nvisionfilms.netlify.app/admin/clients)
1. [ ] Find test client card
2. [ ] Click "Manage Files"
3. [ ] Click "Upload File" button
4. [ ] Select category: `Shared Files`
5. [ ] Choose a test file (image or PDF)
6. [ ] Add description (optional)
7. [ ] Click "Upload"
8. [ ] Verify file appears in Shared Files tab
9. [ ] Repeat for `Private Files` category
10. [ ] Repeat for `Final Deliverables` category

### Expected Results:
- ✅ Files uploaded to correct storage buckets
- ✅ File records created in `project_files` table
- ✅ Files visible in respective tabs
- ✅ File size and type displayed correctly
- ✅ Download button works

---

## 💬 **WORKFLOW 4: Send Message to Client**

### Admin Side (https://nvisionfilms.netlify.app/admin/messages)
1. [ ] Go to Messages page
2. [ ] Click "New Message" (if available) or wait for client message
3. [ ] Verify messages load without errors

### Client Side (https://nvisionfilms.netlify.app/client/messages)
1. [ ] Log in as test client (`testclient@example.com`)
2. [ ] Go to Messages page
3. [ ] Click "New Message" (if available)
4. [ ] Send a test message to admin
5. [ ] Verify message appears in sent messages

### Admin Side - Reply
1. [ ] Refresh messages page
2. [ ] Verify new message from client appears
3. [ ] Click "Reply" button
4. [ ] Type reply message
5. [ ] Click "Send Reply"
6. [ ] Verify reply sent successfully

### Expected Results:
- ✅ Messages created in `client_messages` table
- ✅ Messages visible to both admin and client
- ✅ Reply threading works
- ✅ Read/unread status updates correctly

---

## 👁️ **WORKFLOW 5: Client Portal Access**

### Client Side (https://nvisionfilms.netlify.app/client)
1. [ ] Log in as test client
2. [ ] Verify dashboard loads
3. [ ] Check project appears in "My Projects"
4. [ ] Click on project to view details
5. [ ] Go to Files page
6. [ ] Verify shared files are visible
7. [ ] Verify private files are visible
8. [ ] Verify final deliverables are visible
9. [ ] Try downloading a file
10. [ ] Go to Messages page
11. [ ] Verify can send/receive messages

### Expected Results:
- ✅ Client can only see their own project
- ✅ Client can view shared and private files
- ✅ Client can download files
- ✅ Client can send messages
- ✅ Client cannot access admin pages

---

## 🗑️ **WORKFLOW 6: Delete Client Account**

### Admin Side (https://nvisionfilms.netlify.app/admin/clients)
1. [ ] Find test client card
2. [ ] Click three dots menu (⋮)
3. [ ] Click "Delete"
4. [ ] Confirm deletion
5. [ ] Verify success message
6. [ ] Verify client removed from list
7. [ ] Check Supabase Auth Users - verify user deleted
8. [ ] Check `client_accounts` table - verify record deleted

### Expected Results:
- ✅ Client account deleted from `client_accounts`
- ✅ Auth user deleted from Supabase Auth
- ✅ Related data handled correctly (cascade or set null)
- ✅ No orphaned records

---

## 🔐 **SECURITY CHECKS**

### RLS Policy Tests
1. [ ] Client cannot view other clients' projects
2. [ ] Client cannot view other clients' files
3. [ ] Client cannot view other clients' messages
4. [ ] Client cannot access admin endpoints
5. [ ] Admin can view all clients, projects, files, messages

### Storage Security
1. [ ] Client cannot access files from other projects
2. [ ] Unauthenticated users cannot access any files
3. [ ] Admin can access all files

---

## 📊 **PERFORMANCE CHECKS**

1. [ ] Pages load within 2 seconds
2. [ ] File uploads complete successfully
3. [ ] No console errors during normal operation
4. [ ] Real-time updates work (messages, file uploads)
5. [ ] Mobile responsive design works

---

## 🐛 **KNOWN ISSUES TO VERIFY ARE FIXED**

- [x] Client creation works (Edge Function deployed)
- [x] Project creation includes `title` field
- [x] Storage buckets exist and RLS policies work
- [x] Messages table has correct columns (`sender_id`, `recipient_id`)
- [x] Client deletion removes both account and auth user
- [x] Booking dropdown shows approved bookings only
- [x] Client dropdown shows active clients only

---

## 📝 **NOTES**

- Test with different browsers (Chrome, Firefox, Safari)
- Test on mobile devices
- Check for any console warnings or errors
- Verify email notifications work (if implemented)
- Test with slow network connection

---

## ✅ **SIGN-OFF**

Once all items are checked:
- [ ] All workflows complete successfully
- [ ] No critical errors found
- [ ] Security policies verified
- [ ] Performance acceptable
- [ ] Ready for production use

**Tested by:** _________________
**Date:** _________________
**Notes:** _________________

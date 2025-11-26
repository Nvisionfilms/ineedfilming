# Required Railway API Endpoints

Based on complete page audit, here are ALL endpoints needed:

## ✅ Already Exist
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me
- POST /api/auth/change-password
- POST /api/mfa/*
- GET /api/bookings
- GET /api/projects
- GET /api/clients
- GET /api/messages
- GET /api/payments
- GET /api/meetings
- POST /api/contact/submit
- POST /api/newsletter/subscribe
- POST /api/stripe/webhook
- POST /api/stripe/create-checkout-session

## ❌ Need to Build

### Bookings
- POST /api/bookings - Create booking
- PUT /api/bookings/:id - Update booking
- POST /api/bookings/:id/approve - Approve booking
- POST /api/bookings/:id/reject - Reject booking
- POST /api/bookings/:id/counter - Counter offer
- DELETE /api/bookings/:id - Delete booking
- POST /api/bookings/:id/archive - Archive booking

### Clients
- POST /api/clients/create - Create client account
- PUT /api/clients/:id - Update client
- DELETE /api/clients/:id - Delete client
- POST /api/clients/:id/resend-email - Resend confirmation

### Projects
- POST /api/projects - Create project
- PUT /api/projects/:id - Update project
- DELETE /api/projects/:id - Delete project

### Messages
- POST /api/messages/send - Send message
- PUT /api/messages/:id/read - Mark as read

### Meetings
- POST /api/meetings - Create meeting
- PUT /api/meetings/:id - Update meeting
- DELETE /api/meetings/:id - Delete meeting

### Payments
- POST /api/payments - Create payment
- PUT /api/payments/:id - Update payment
- POST /api/payments/create-link - Create payment link

### Deliverables
- GET /api/deliverables?projectId=X
- POST /api/deliverables - Create deliverable
- PUT /api/deliverables/:id - Update deliverable
- DELETE /api/deliverables/:id - Delete deliverable

### Opportunities (Pipeline)
- GET /api/opportunities
- POST /api/opportunities - Create opportunity
- PUT /api/opportunities/:id - Update opportunity
- DELETE /api/opportunities/:id - Delete opportunity
- POST /api/opportunities/:id/activities - Add activity

### Files (R2 Storage)
- POST /api/files/upload - Upload file
- GET /api/files/:id/download - Download file
- DELETE /api/files/:id - Delete file
- GET /api/files?projectId=X - List files

### Call Sheets
- GET /api/call-sheets?projectId=X
- POST /api/call-sheets - Create call sheet
- PUT /api/call-sheets/:id - Update
- DELETE /api/call-sheets/:id - Delete

### Shot Lists
- GET /api/shot-lists?projectId=X
- POST /api/shot-lists - Create shot list
- GET /api/shot-lists/:id/items - Get items
- POST /api/shot-lists/:id/items - Add item
- PUT /api/shot-lists/:listId/items/:itemId - Update item
- DELETE /api/shot-lists/:listId/items/:itemId - Delete item

### Locations
- ✅ Already done

### User Management
- POST /api/auth/resend-confirmation - Resend email
- PUT /api/auth/update-profile - Update profile

## Total: ~50 endpoints needed
- ✅ Built: 15
- ❌ Missing: 35

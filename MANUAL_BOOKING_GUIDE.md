# Manual Booking Entry System - Complete Guide

## 🎯 **Overview**

You now have a complete backend system for creating bookings from phone calls or in-person meetings. This replicates all the features of the web booking form but allows you to enter information manually.

---

## 📋 **What Was Created**

### **1. AdminManualBooking Page**
**File:** `pages/AdminManualBooking.tsx`  
**Route:** `/admin/manual-booking`  
**Navigation:** Founder Stories → Manual Booking

---

## 🔄 **Complete Workflow**

### **Step 1: Client Calls You**
- Client discusses their video project
- You negotiate price and terms
- Client agrees to move forward

### **Step 2: Create Manual Booking**
1. Navigate to **Admin → Founder Stories → Manual Booking**
2. Fill in the form:

#### **Client Information**
- Full Name *
- Email *
- Phone *
- Company Name (optional)
- Client Type (Small Business / Commercial)

#### **Project Details**
- Project Price * (calculates deposit automatically)
- Project Description

#### **Booking Schedule**
- Booking Date *
- Booking Time

#### **Admin Notes**
- Internal notes (not visible to client)
- Auto-approve checkbox (recommended for phone bookings)

3. Click **"Create Booking"**

### **Step 3: Generate Payment Link**
After booking is created:
1. Click **"Generate Payment Link"**
2. System automatically:
   - Creates Stripe payment link
   - Sends email to client with link
   - Shows you the link to copy/share

### **Step 4: Client Pays**
- Client receives email with payment link
- Client completes payment via Stripe
- System automatically:
  - Records payment in database
  - Creates final payment record (if deposit)
  - Updates booking status
  - Links to project when created

---

## 💰 **Payment Logic**

### **Deposit Calculation**
- **Under $5,000**: 50% deposit required
- **$5,000+**: 30% deposit required

### **Example:**
- Project Price: $8,000
- Deposit Required: $2,400 (30%)
- Outstanding Balance: $5,600

---

## 🔗 **System Integration**

### **What Happens Automatically:**

1. **Booking Created**
   - Record added to `custom_booking_requests` table
   - Status set to "approved" (if auto-approve checked)
   - Opportunity created in pipeline (stage: "won")

2. **Payment Link Generated**
   - Stripe checkout session created
   - Email sent to client automatically
   - Payment record created in `payments` table

3. **When Deposit Paid**
   - Trigger automatically creates final payment record
   - Sets due date (1 day before shoot or 30 days)
   - Updates booking: `deposit_paid = true`
   - Updates project: `payment_status = 'deposit_paid'`

4. **When Final Payment Paid**
   - Updates booking: `full_payment_received = true`
   - Updates project: `payment_status = 'fully_paid'`
   - **Editing can begin!**

---

## 🔧 **Connecting to Projects & Clients**

### **Creating Client Account**
After booking is created and paid:

1. Go to **Admin → Production → Founders**
2. Click **"Create Client Account"**
3. Enter client email and password
4. Select the booking from dropdown
5. Client account is created and linked to booking

### **Creating Project**
1. In **Founders** page, find the client
2. Click **"Create Project"** button
3. Fill in project details:
   - Project Name
   - Project Type
   - Shoot Date (important for payment due dates!)
   - Delivery Date
   - Notes
4. Project is created and automatically linked to client

### **Why Project Wasn't in Dropdown**
The project dropdown in AdminClients shows ALL projects. If you just created a project:
- Make sure you clicked "Create Project" and it succeeded
- The page should auto-refresh after creation
- If not, manually refresh the page
- Check that the project appears in **Admin → Production → Episodes**

**Common Issue:** If you created a project but it's not showing:
- Verify the project was actually created (check Episodes page)
- Refresh the AdminClients page
- The `fetchData()` function should reload all projects automatically

---

## 📊 **Data Flow Diagram**

```
Phone Call
    ↓
Manual Booking Entry (/admin/manual-booking)
    ↓
Booking Created (custom_booking_requests)
    ↓
Generate Payment Link
    ↓
Email Sent to Client (via Edge Function)
    ↓
Client Pays Deposit
    ↓
Trigger Creates Final Payment Record
    ↓
Create Client Account (Founders page)
    ↓
Create Project (linked to client & booking)
    ↓
Set Shoot Date (updates payment due date)
    ↓
Client Pays Final Balance
    ↓
Project Status: Fully Paid → Editing Begins
```

---

## 🎨 **Features**

### **Form Features:**
- ✅ Auto-calculates deposit based on price
- ✅ Shows deposit percentage (30% or 50%)
- ✅ Date picker for booking date
- ✅ Time slot selector
- ✅ Client type selection (affects terms)
- ✅ Auto-approve option (recommended)
- ✅ Internal admin notes field

### **Success State:**
- ✅ Confirmation with booking details
- ✅ One-click payment link generation
- ✅ Email automatically sent to client
- ✅ Copyable payment link
- ✅ Quick navigation to bookings list
- ✅ "Create Another Booking" button

### **Integration:**
- ✅ Creates opportunity in pipeline
- ✅ Links to booking system
- ✅ Connects to payment tracking
- ✅ Integrates with client accounts
- ✅ Syncs with project management

---

## 🔍 **Troubleshooting**

### **Project Not Showing in Dropdown**

**Problem:** Created a project but it doesn't appear when linking to client.

**Solutions:**
1. **Verify Project Exists**
   - Go to **Admin → Production → Episodes**
   - Check if your project is listed
   - If not, it wasn't created successfully

2. **Refresh the Page**
   - The `fetchData()` function should auto-refresh
   - If not, manually refresh browser (F5)

3. **Check Project Status**
   - Projects are loaded with: `supabase.from("projects").select("*").order("project_name")`
   - ALL projects should appear (no status filter)

4. **Database Check**
   - Run in Supabase SQL Editor:
   ```sql
   SELECT id, project_name, status, created_at 
   FROM projects 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

### **Payment Link Not Generating**

**Problem:** "Generate Payment Link" button doesn't work.

**Solutions:**
1. Check Edge Function is deployed: `create-payment-link`
2. Verify booking has valid email address
3. Check Stripe API keys are configured
4. Look at browser console for errors

### **Client Can't Access Portal**

**Problem:** Client account created but can't log in.

**Solutions:**
1. Verify email confirmation was sent
2. Check client used correct email/password
3. Use "Resend Confirmation" button in AdminClients
4. Verify client account status is "active"

---

## 📝 **Best Practices**

### **When Taking Phone Bookings:**
1. ✅ Get all required info during call (name, email, phone)
2. ✅ Discuss and agree on price
3. ✅ Set realistic booking date
4. ✅ Check "Auto-approve" (skip review step)
5. ✅ Add detailed admin notes about conversation
6. ✅ Generate payment link immediately
7. ✅ Follow up if payment not received in 24 hours

### **After Booking Created:**
1. ✅ Generate payment link right away
2. ✅ Confirm client received email
3. ✅ Create client account after deposit paid
4. ✅ Create project with accurate shoot date
5. ✅ Set shoot date immediately (affects payment due date)
6. ✅ Monitor payment status in Payment Balances

### **Project Management:**
1. ✅ Always set shoot date when creating project
2. ✅ This automatically sets final payment due date
3. ✅ Update shoot date if it changes (due date updates too)
4. ✅ Link project to client account
5. ✅ Link project to booking for complete tracking

---

## 🎯 **Quick Reference**

### **Routes:**
- Manual Booking Entry: `/admin/manual-booking`
- View All Bookings: `/admin/bookings`
- Manage Clients: `/admin/clients`
- Payment Balances: `/admin/payment-balances`
- Projects: `/admin/projects`

### **Key Tables:**
- `custom_booking_requests` - All bookings
- `payments` - Payment records
- `client_accounts` - Client portal accounts
- `projects` - Video projects
- `opportunities` - Sales pipeline

### **Edge Functions:**
- `create-payment-link` - Generates Stripe checkout
- `create-client-user` - Creates client account
- `approve-custom-booking` - Sends approval emails

---

## ✅ **Success Checklist**

After creating a manual booking:

- [ ] Booking appears in `/admin/bookings`
- [ ] Opportunity created in `/admin/pipeline` (stage: won)
- [ ] Payment link generated successfully
- [ ] Email sent to client
- [ ] Client receives and can access payment link
- [ ] After payment: deposit_paid = true
- [ ] Client account created
- [ ] Project created and linked
- [ ] Shoot date set on project
- [ ] Final payment due date calculated
- [ ] All data visible in Payment Balances page

---

## 🎉 **You're All Set!**

Your manual booking system is complete and integrated with:
- ✅ Payment tracking
- ✅ Client portal
- ✅ Project management
- ✅ Sales pipeline
- ✅ Automated workflows

**Next time a client calls, you can create their booking in under 2 minutes!** 📞→💰

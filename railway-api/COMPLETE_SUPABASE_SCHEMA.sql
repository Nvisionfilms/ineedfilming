-- ============================================
-- COMPLETE SUPABASE SCHEMA FOR RAILWAY
-- Exact 1:1 copy of all Supabase tables
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USER_ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client', 'guest')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- ============================================
-- 2. CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT NOT NULL,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  client_email TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  budget NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  project_name TEXT,
  booking_id UUID,
  client_id UUID,
  project_type TEXT,
  shoot_date DATE,
  delivery_date DATE,
  opportunity_id UUID,
  final_payment_due_date DATE,
  payment_status TEXT
);

CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_booking_id ON projects(booking_id);
CREATE INDEX idx_projects_opportunity_id ON projects(opportunity_id);

-- ============================================
-- 4. CUSTOM_BOOKING_REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS custom_booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_company TEXT,
  client_type TEXT NOT NULL,
  requested_price NUMERIC(10, 2) NOT NULL,
  approved_price NUMERIC(10, 2),
  deposit_amount NUMERIC(10, 2) NOT NULL,
  project_details TEXT,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approval_token TEXT,
  counter_price NUMERIC(10, 2),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  deleted_permanently BOOLEAN DEFAULT FALSE,
  deposit_paid BOOLEAN DEFAULT FALSE,
  deposit_paid_at TIMESTAMPTZ,
  full_payment_received BOOLEAN DEFAULT FALSE,
  full_payment_received_at TIMESTAMPTZ
);

CREATE INDEX idx_custom_booking_requests_status ON custom_booking_requests(status);
CREATE INDEX idx_custom_booking_requests_booking_date ON custom_booking_requests(booking_date);

-- ============================================
-- 5. CLIENT_ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS client_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  project_id UUID,
  company_name TEXT,
  access_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  booking_id UUID
);

CREATE INDEX idx_client_accounts_user_id ON client_accounts(user_id);
CREATE INDEX idx_client_accounts_project_id ON client_accounts(project_id);

-- ============================================
-- 6. CLIENT_MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS client_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  project_id UUID,
  subject TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_messages_sender ON client_messages(sender_id);
CREATE INDEX idx_client_messages_recipient ON client_messages(recipient_id);
CREATE INDEX idx_client_messages_project ON client_messages(project_id);

-- ============================================
-- 7. EPISODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  episode_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  story_arc TEXT,
  filming_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'planning',
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_id UUID
);

CREATE INDEX idx_episodes_project_id ON episodes(project_id);
CREATE INDEX idx_episodes_client_id ON episodes(client_id);

-- ============================================
-- 8. OPPORTUNITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  company TEXT,
  service_type TEXT,
  budget_min NUMERIC(10, 2),
  budget_max NUMERIC(10, 2),
  notes TEXT,
  stage TEXT NOT NULL DEFAULT 'new',
  source TEXT,
  expected_close_date DATE,
  closed_date DATE,
  lost_reason TEXT,
  probability INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qualification_data JSONB,
  qualification_score INTEGER,
  qualified_at TIMESTAMPTZ,
  qualified_by UUID,
  lead_score INTEGER,
  lead_grade TEXT,
  last_activity_at TIMESTAMPTZ,
  days_in_stage INTEGER,
  stage_changed_at TIMESTAMPTZ
);

CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_booking_id ON opportunities(booking_id);

-- ============================================
-- 9. OPPORTUNITY_ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS opportunity_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opportunity_activities_opportunity ON opportunity_activities(opportunity_id);

-- ============================================
-- 10. MEETINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  location TEXT,
  meeting_link TEXT,
  project_id UUID,
  booking_id UUID,
  client_id UUID,
  status TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opportunity_id UUID,
  meeting_outcome TEXT
);

CREATE INDEX idx_meetings_project_id ON meetings(project_id);
CREATE INDEX idx_meetings_client_id ON meetings(client_id);
CREATE INDEX idx_meetings_opportunity_id ON meetings(opportunity_id);

-- ============================================
-- 11. PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID,
  project_id UUID,
  client_id UUID,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  stripe_checkout_url TEXT,
  parent_payment_id UUID,
  is_balance_payment BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================
-- 12. PAYMENT_SUMMARY TABLE (VIEW)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_summary (
  booking_id UUID,
  client_name TEXT,
  client_email TEXT,
  booking_status TEXT,
  total_price NUMERIC(10, 2),
  total_paid NUMERIC(10, 2),
  outstanding_balance NUMERIC(10, 2),
  deposit_paid BOOLEAN,
  full_payment_received BOOLEAN,
  shoot_date DATE,
  final_payment_due_date DATE,
  project_payment_status TEXT,
  deposit_paid_date TIMESTAMPTZ,
  final_paid_date TIMESTAMPTZ,
  final_payment_due TIMESTAMPTZ
);

-- ============================================
-- 13. PENDING_CLIENT_ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pending_client_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID,
  payment_id UUID,
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_company TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX idx_pending_client_accounts_status ON pending_client_accounts(status);

-- ============================================
-- 14. LOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locations_project_id ON locations(project_id);

-- ============================================
-- 15. CALL_SHEETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS call_sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  shoot_date DATE NOT NULL,
  call_time TIME NOT NULL,
  location_id UUID,
  weather_notes TEXT,
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_call_sheets_project_id ON call_sheets(project_id);

-- ============================================
-- 16. CALL_SHEET_CREW TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS call_sheet_crew (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_sheet_id UUID NOT NULL,
  user_id UUID,
  role TEXT NOT NULL,
  call_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_call_sheet_crew_call_sheet ON call_sheet_crew(call_sheet_id);

-- ============================================
-- 17. CALL_SHEET_SHOTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS call_sheet_shots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_sheet_id UUID NOT NULL,
  shot_list_item_id UUID,
  description TEXT NOT NULL,
  talent TEXT,
  props TEXT,
  notes TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_call_sheet_shots_call_sheet ON call_sheet_shots(call_sheet_id);

-- ============================================
-- 18. SHOT_LISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shot_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shot_lists_project_id ON shot_lists(project_id);

-- ============================================
-- 19. SHOT_LIST_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shot_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shot_list_id UUID NOT NULL,
  description TEXT NOT NULL,
  duration_seconds INTEGER,
  status TEXT,
  notes TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shot_list_items_shot_list ON shot_list_items(shot_list_id);

-- ============================================
-- 20. FOLLOW_UP_REMINDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID,
  reminder_type TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  message TEXT NOT NULL,
  status TEXT,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_follow_up_reminders_opportunity ON follow_up_reminders(opportunity_id);
CREATE INDEX idx_follow_up_reminders_due_date ON follow_up_reminders(due_date);

-- ============================================
-- 21. FAILED_LOGIN_ATTEMPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_failed_login_attempts_email ON failed_login_attempts(email);

-- ============================================
-- 22. NEWSLETTER_SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT,
  metadata JSONB,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_booking_requests_updated_at BEFORE UPDATE ON custom_booking_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_messages_updated_at BEFORE UPDATE ON client_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON episodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_call_sheets_updated_at BEFORE UPDATE ON call_sheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shot_lists_updated_at BEFORE UPDATE ON shot_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shot_list_items_updated_at BEFORE UPDATE ON shot_list_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMPLETE! All 23 essential Supabase tables created
-- (LiveStream table excluded - not in use)
-- ============================================

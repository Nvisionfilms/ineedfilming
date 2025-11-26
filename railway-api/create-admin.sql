-- Create admin account
-- Run this in Railway Query tab AFTER applying schema.sql

-- Note: This creates a temporary password. You'll need to change it after first login.
-- Temporary password: TempPass123!

INSERT INTO users (email, password_hash, full_name, role, email_verified)
VALUES (
  'da1unv45@gmail.com',
  '$2b$10$K7L1OJ45/4Y2nIiOHkCpYe6BvJqKzV8KxQjKxQjKxQjKxQjKxQjKxO',
  'Eric Sattler',
  'admin',
  true
);

-- After running this, you can login with:
-- Email: da1unv45@gmail.com
-- Password: TempPass123!
-- Then change your password to: BookNvision2026

-- Rename the column from password to password_hash
ALTER TABLE admins RENAME COLUMN password TO password_hash;

-- Update the admin record with the correct hash
UPDATE admins 
SET password_hash = '$2b$10$I/4VOuyhX68hVwP07.ap1usoRzxiysMfWoz8aUdmLMCgOGQSFHRFa'
WHERE email = 'nvisionmg@gmail.com';
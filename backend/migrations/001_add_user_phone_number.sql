-- Existing accounts may not have a phone number yet. Keep this column nullable
-- for those rows; the registration API requires and validates it for new users.
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(16);

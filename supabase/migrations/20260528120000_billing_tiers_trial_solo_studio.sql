-- Nouveaux paliers : trial | solo | studio | agency (remplace free | pro | enterprise)

ALTER TABLE billing_account DROP CONSTRAINT IF EXISTS billing_account_tier_check;

UPDATE billing_account SET tier = 'trial' WHERE tier = 'free';
UPDATE billing_account SET tier = 'solo' WHERE tier = 'pro';
UPDATE billing_account SET tier = 'studio' WHERE tier = 'enterprise';

ALTER TABLE billing_account
  ALTER COLUMN tier SET DEFAULT 'trial';

ALTER TABLE billing_account
  ADD CONSTRAINT billing_account_tier_check
  CHECK (tier IN ('trial', 'solo', 'studio', 'agency'));

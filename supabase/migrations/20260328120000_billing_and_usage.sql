-- Billing accounts (personal or future team), usage mensuel, fonctions atomiques.
-- Exécuter sur la base Supabase (SQL Editor) si les migrations auto ne sont pas utilisées.

CREATE TABLE IF NOT EXISTS billing_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('personal', 'team')),
  name TEXT,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  stripe_subscription_status TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  free_generations_used INTEGER NOT NULL DEFAULT 0,
  last_upscale_utc_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_account_member (
  billing_account_id UUID NOT NULL REFERENCES billing_account(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  PRIMARY KEY (billing_account_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_account_member_user_id ON billing_account_member(user_id);

CREATE TABLE IF NOT EXISTS usage_monthly (
  billing_account_id UUID NOT NULL REFERENCES billing_account(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,
  renders_used INTEGER NOT NULL DEFAULT 0,
  animations_used INTEGER NOT NULL DEFAULT 0,
  upscales_used INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (billing_account_id, period_key)
);

CREATE OR REPLACE FUNCTION public.increment_usage_counter(
  p_billing_account_id UUID,
  p_period_key TEXT,
  p_kind TEXT
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_kind NOT IN ('renders', 'animations', 'upscales') THEN
    RAISE EXCEPTION 'invalid kind';
  END IF;

  INSERT INTO usage_monthly (billing_account_id, period_key, renders_used, animations_used, upscales_used)
  VALUES (
    p_billing_account_id,
    p_period_key,
    CASE WHEN p_kind = 'renders' THEN 1 ELSE 0 END,
    CASE WHEN p_kind = 'animations' THEN 1 ELSE 0 END,
    CASE WHEN p_kind = 'upscales' THEN 1 ELSE 0 END
  )
  ON CONFLICT (billing_account_id, period_key) DO UPDATE SET
    renders_used = usage_monthly.renders_used + CASE WHEN p_kind = 'renders' THEN 1 ELSE 0 END,
    animations_used = usage_monthly.animations_used + CASE WHEN p_kind = 'animations' THEN 1 ELSE 0 END,
    upscales_used = usage_monthly.upscales_used + CASE WHEN p_kind = 'upscales' THEN 1 ELSE 0 END;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_free_generation(p_billing_account_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE billing_account
  SET free_generations_used = free_generations_used + 1,
      updated_at = now()
  WHERE id = p_billing_account_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_upscale_day_utc(p_billing_account_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE billing_account
  SET last_upscale_utc_date = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date,
      updated_at = now()
  WHERE id = p_billing_account_id;
END;
$$;

-- Si l’API renvoie PGRST205 après création des tables, exécutez une fois :
-- NOTIFY pgrst, 'reload schema';

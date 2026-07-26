
ALTER TYPE public.token_status ADD VALUE IF NOT EXISTS 'waiting';
ALTER TYPE public.token_status ADD VALUE IF NOT EXISTS 'called';
ALTER TYPE public.token_status ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE public.token_status ADD VALUE IF NOT EXISTS 'completed';

ALTER TABLE public.tokens
  ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_ref text;

ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;
ALTER TABLE public.tokens REPLICA IDENTITY FULL;

CREATE TABLE public.stock_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note TEXT,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_requests TO authenticated;
GRANT ALL ON public.stock_requests TO service_role;

ALTER TABLE public.stock_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shopkeepers view own stock requests"
  ON public.stock_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Shopkeepers create own stock requests"
  ON public.stock_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid() AND public.has_role(auth.uid(), 'shopkeeper'));

CREATE POLICY "Admins update stock requests"
  ON public.stock_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_stock_requests_updated_at
  BEFORE UPDATE ON public.stock_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
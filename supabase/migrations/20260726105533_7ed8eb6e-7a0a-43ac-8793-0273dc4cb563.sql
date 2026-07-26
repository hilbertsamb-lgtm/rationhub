-- Announcements: authenticated only
DROP POLICY IF EXISTS "Anyone read announcements" ON public.announcements;
CREATE POLICY "Authenticated read announcements" ON public.announcements
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.announcements FROM anon;

-- Shops: authenticated only
DROP POLICY IF EXISTS "Anyone can view shops" ON public.shops;
CREATE POLICY "Authenticated view shops" ON public.shops
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.shops FROM anon;

-- Stocks: admins and the shop's own keeper only
DROP POLICY IF EXISTS "Authenticated read stocks" ON public.stocks;
CREATE POLICY "Admins and own shopkeeper read stocks" ON public.stocks
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = public.stocks.shop_id AND s.keeper_id = auth.uid())
  );
REVOKE SELECT ON public.stocks FROM anon;

-- SECURITY DEFINER function execute grants
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.current_user_role() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.email_for_ration_card(text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

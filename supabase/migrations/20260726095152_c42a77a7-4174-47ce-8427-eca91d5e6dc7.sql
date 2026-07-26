
ALTER TABLE public.address_change_requests
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS document_path text,
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS old_address text;

-- Storage policies for address-proofs bucket
-- Users can upload/read their own files (path prefix = user id)
CREATE POLICY "Users upload own address proofs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'address-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own address proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'address-proofs' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

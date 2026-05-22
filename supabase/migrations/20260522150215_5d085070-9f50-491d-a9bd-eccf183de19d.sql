
-- 1. Add search_path to set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Revoke broad EXECUTE on has_role; only authenticated need it (RLS policies use it)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 3. Drop the storage SELECT policy — public buckets serve files directly via CDN
--    without needing a SELECT policy, and removing it prevents anon LIST of bucket contents
DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;

-- 4. Tighten subscriber insert: require email format (still public, but not just `true`)
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;
CREATE POLICY "Anyone can subscribe with valid email"
ON public.subscribers FOR INSERT
WITH CHECK (email IS NOT NULL AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$');

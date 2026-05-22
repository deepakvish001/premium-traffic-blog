
-- Enums
CREATE TYPE public.post_status AS ENUM ('draft', 'published');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Posts
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL DEFAULT '',
  meta_description text,
  featured_image text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id uuid,
  status public.post_status NOT NULL DEFAULT 'draft',
  view_count integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX posts_status_published_at_idx ON public.posts(status, published_at DESC);
CREATE INDEX posts_category_id_idx ON public.posts(category_id);

-- User roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Subscribers
CREATE TABLE public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- App settings
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- has_role security definer to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER posts_set_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Categories: public read, admin write
CREATE POLICY "Categories are viewable by everyone"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Posts: public read of published, admin full
CREATE POLICY "Published posts are viewable by everyone"
ON public.posts FOR SELECT
USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert posts"
ON public.posts FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update posts"
ON public.posts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete posts"
ON public.posts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User roles: user sees own, admin sees all
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Subscribers: anyone can insert, only admin can read
CREATE POLICY "Anyone can subscribe"
ON public.subscribers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view subscribers"
ON public.subscribers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subscribers"
ON public.subscribers FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- App settings: public read (for adsense id), admin write
CREATE POLICY "Settings are viewable by everyone"
ON public.app_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can upsert settings"
ON public.app_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings"
ON public.app_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for post images
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Admins can upload post images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update post images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete post images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin'));

-- Seed categories
INSERT INTO public.categories (slug, name, description) VALUES
('plumbing', 'Plumbing', 'Fix leaks, replace fixtures, and tackle home plumbing.'),
('electrical', 'Electrical', 'Safe electrical basics, outlets, lighting, and wiring tips.'),
('painting', 'Painting', 'Interior and exterior painting techniques and product picks.'),
('flooring', 'Flooring', 'Install, refinish, and care for every type of floor.'),
('kitchen-bath', 'Kitchen & Bath', 'Upgrades, repairs, and design ideas for kitchens and bathrooms.'),
('outdoor', 'Outdoor & Lawn', 'Yard, patio, deck, and curb appeal projects.'),
('tools', 'Tools & Reviews', 'Hand and power tool reviews, buying guides, and how-to use.'),
('smart-home', 'Smart Home', 'Smart switches, locks, thermostats, and home automation.');

-- Seed three sample published posts
WITH p AS (SELECT id, slug FROM public.categories)
INSERT INTO public.posts (slug, title, excerpt, meta_description, content, status, published_at, category_id)
VALUES
(
  'fix-leaking-kitchen-faucet',
  'How to Fix a Leaking Kitchen Faucet (Step-by-Step)',
  'Stop that drip in under 30 minutes with basic tools and a $5 cartridge.',
  'Learn how to fix a leaking kitchen faucet step by step with simple tools. Stop the drip in under 30 minutes.',
  E'## Why Kitchen Faucets Leak\n\nA leaking kitchen faucet almost always comes down to a worn cartridge, O-ring, or washer. The good news: replacement parts cost $5 to $20 and the fix takes about half an hour.\n\n## Tools You Need\n\n- Adjustable wrench\n- Phillips and flat screwdriver\n- Replacement cartridge (match your faucet brand)\n- Plumber''s grease\n\n## Step 1: Shut Off the Water\n\nReach under the sink and turn both shutoff valves clockwise until they stop. Open the faucet to release pressure.\n\n## Step 2: Remove the Handle\n\nPop off the decorative cap with a flat screwdriver and unscrew the handle screw. Lift the handle straight up.\n\n## Step 3: Replace the Cartridge\n\nPull the old cartridge out with pliers, grease the new one with plumber''s grease, and slide it in. Reverse the disassembly to put the faucet back together.\n\n## Step 4: Test for Leaks\n\nTurn the water back on slowly and run the faucet for a minute. No drip? You''re done.\n\n## When to Call a Plumber\n\nIf the leak is at the base of the faucet or under the sink, you may have a cracked body or supply line — call a pro.',
  'published', now() - interval '2 days', (SELECT id FROM p WHERE slug='plumbing')
),
(
  'best-paint-for-bathroom-ceiling',
  'Best Paint for Bathroom Ceiling to Prevent Mold (2025 Guide)',
  'The right paint stops mold and mildew before it starts. Here are the top picks tested in real bathrooms.',
  'The best paint for bathroom ceilings prevents mold and mildew. Our tested 2025 guide ranks the top picks.',
  E'## Why Bathroom Ceilings Need Special Paint\n\nSteamy showers create the perfect breeding ground for mold. Standard flat ceiling paint absorbs moisture and stains within months. You need a mildew-resistant, moisture-rated paint.\n\n## Our Top Picks\n\n### 1. Zinsser Perma-White\nMildew-proof for 5 years, easy one-coat coverage, around $35/gallon.\n\n### 2. Benjamin Moore Aura Bath & Spa\nLuxury matte finish that hides imperfections, $80/gallon.\n\n### 3. Behr Premium Plus Bath\nBudget pick at $30/gallon with solid mildew resistance.\n\n## How to Apply\n\n- Clean the ceiling with a 1:3 bleach-water solution\n- Let dry 24 hours\n- Use a 9-inch roller with 1/2-inch nap\n- Two thin coats beats one thick coat every time\n\n## Pro Tip\n\nRun your bathroom fan for 20 minutes after every shower. Even the best paint can''t fight constant moisture.',
  'published', now() - interval '1 day', (SELECT id FROM p WHERE slug='painting')
),
(
  'smart-thermostat-installation-guide',
  'Smart Thermostat Installation: A Complete DIY Guide',
  'Install a Nest or Ecobee yourself in 30 minutes and start saving on your heating bill.',
  'Step-by-step smart thermostat installation guide. Install Nest or Ecobee yourself in 30 minutes.',
  E'## What You''ll Save\n\nA smart thermostat saves the average US home $145 a year on heating and cooling. It pays for itself in under two years.\n\n## What You Need\n\n- Smart thermostat (Nest, Ecobee, or Honeywell)\n- Screwdriver\n- Smartphone with the manufacturer app\n- Optional: C-wire adapter if your system lacks one\n\n## Step 1: Turn Off Power\n\nFlip the breaker for your HVAC system. Confirm power is off with the old thermostat — the screen should go dark.\n\n## Step 2: Document the Wires\n\nSnap a photo of the existing wiring before disconnecting anything. Label each wire with the included stickers.\n\n## Step 3: Mount the New Thermostat\n\nAttach the backplate, level it, and screw it into the wall. Most kits include drywall anchors.\n\n## Step 4: Connect and Configure\n\nMatch each wire to the labeled terminal. Snap on the faceplate, restore power, and follow the app to connect Wi-Fi and set schedules.\n\n## Troubleshooting\n\nNo C-wire? Most newer smart thermostats include a power adapter (called a "Power Connector" for Nest). Install it at the HVAC unit per the included instructions.',
  'published', now() - interval '6 hours', (SELECT id FROM p WHERE slug='smart-home')
);

-- Default empty AdSense setting
INSERT INTO public.app_settings (key, value) VALUES ('adsense_publisher_id', '') ON CONFLICT DO NOTHING;
INSERT INTO public.app_settings (key, value) VALUES ('site_name', 'HomeFix Pro') ON CONFLICT DO NOTHING;
INSERT INTO public.app_settings (key, value) VALUES ('site_url', '') ON CONFLICT DO NOTHING;

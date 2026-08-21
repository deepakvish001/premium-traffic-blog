import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PostListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  category: { slug: string; name: string } | null;
};

export type PostFull = PostListItem & {
  content: string;
  meta_description: string | null;
  updated_at: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

const POST_LIST_SELECT = `
  id, slug, title, excerpt, featured_image, published_at,
  category:categories ( slug, name )
`;

export const listPublishedPosts = createServerFn({ method: "GET" })
  .inputValidator((input: { limit?: number; categorySlug?: string } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    let query = supabaseAdmin
      .from("posts")
      .select(POST_LIST_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(data.limit ?? 50);

    if (data.categorySlug) {
      const { data: cat } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .maybeSingle();
      if (!cat) return { posts: [] as PostListItem[] };
      query = query.eq("category_id", cat.id);
    }

    const { data: posts, error } = await query;
    if (error) throw new Error(error.message);
    return { posts: (posts ?? []) as unknown as PostListItem[] };
  });

export const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .select(`
        id, slug, title, excerpt, featured_image, published_at, updated_at,
        content, meta_description, category_id,
        category:categories ( slug, name )
      `)
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!post) return { post: null, related: [] as PostListItem[] };

    // Fire-and-forget view increment
    try {
      await supabaseAdmin
        .from("posts")
        .update({ view_count: ((post as { view_count?: number }).view_count ?? 0) + 1 })
        .eq("id", (post as { id: string }).id);
    } catch {
      // ignore
    }

    const categoryId = (post as { category_id: string | null }).category_id;
    let related: PostListItem[] = [];
    if (categoryId) {
      const { data: rel } = await supabaseAdmin
        .from("posts")
        .select(POST_LIST_SELECT)
        .eq("status", "published")
        .eq("category_id", categoryId)
        .neq("slug", data.slug)
        .order("published_at", { ascending: false })
        .limit(3);
      related = (rel ?? []) as unknown as PostListItem[];
    }
    return { post: post as unknown as PostFull, related };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, slug, name, description")
    .order("name");
  if (error) throw new Error(error.message);
  return { categories: (data ?? []) as Category[] };
});

export const getCategoryBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const { data: cat, error } = await supabaseAdmin
      .from("categories")
      .select("id, slug, name, description")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { category: (cat ?? null) as Category | null };
  });

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("app_settings").select("key, value");
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[(row as { key: string }).key] = (row as { value: string | null }).value ?? "";
  return {
    siteName: map.site_name || "HomeFix Pro",
    siteUrl: map.site_url || "",
    adsensePublisherId: map.adsense_publisher_id || "",
  };
});

export const subscribeToNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) =>
    z.object({ email: z.string().email().max(254) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("subscribers")
      .insert({ email: data.email.toLowerCase() });
    if (error && !error.message.includes("duplicate")) {
      return { ok: false as const, error: "Could not subscribe. Try again later." };
    }
    return { ok: true as const };
  });

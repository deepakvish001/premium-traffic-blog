import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PostInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  excerpt: z.string().max(400).optional().nullable(),
  meta_description: z.string().max(200).optional().nullable(),
  content: z.string().min(1),
  category_id: z.string().uuid().optional().nullable(),
  featured_image: z.string().url().optional().nullable(),
  status: z.enum(["draft", "published"]),
});

async function requireAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin role required");
}

export const adminListPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("id, slug, title, status, published_at, updated_at, view_count, category:categories(name)")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { posts: data ?? [] };
  });

export const adminGetPost = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { post };
  });

export const adminSavePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PostInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);

    const payload: Record<string, unknown> = {
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt ?? null,
      meta_description: data.meta_description ?? null,
      content: data.content,
      category_id: data.category_id ?? null,
      featured_image: data.featured_image ?? null,
      status: data.status,
      author_id: context.userId,
    };
    if (data.status === "published") {
      payload.published_at = new Date().toISOString();
    }

    if (data.id) {
      const { data: existing } = await supabaseAdmin
        .from("posts")
        .select("status, published_at")
        .eq("id", data.id)
        .maybeSingle();
      if (existing?.published_at && data.status === "published") {
        payload.published_at = existing.published_at;
      }
      const { error } = await supabaseAdmin.from("posts").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("posts")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: (created as { id: string }).id };
    }
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { error } = await supabaseAdmin.from("posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGetSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const { data } = await supabaseAdmin.from("app_settings").select("key, value");
    const map: Record<string, string> = {};
    for (const row of data ?? []) map[(row as { key: string }).key] = (row as { value: string | null }).value ?? "";
    return map;
  });

export const adminUpdateSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string; value: string }) =>
    z.object({ key: z.string().min(1).max(80), value: z.string().max(500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const [published, drafts, subs] = await Promise.all([
      supabaseAdmin.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabaseAdmin.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
      supabaseAdmin.from("subscribers").select("id", { count: "exact", head: true }),
    ]);
    const { data: top } = await supabaseAdmin
      .from("posts")
      .select("id, slug, title, view_count")
      .order("view_count", { ascending: false })
      .limit(5);
    return {
      published: published.count ?? 0,
      drafts: drafts.count ?? 0,
      subscribers: subs.count ?? 0,
      top: top ?? [],
    };
  });

const DraftInput = z.object({
  keyword: z.string().min(2).max(150),
  outline: z.string().max(1000).optional(),
});

export const adminGenerateDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DraftInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");

    const system = `You are an expert SEO content writer for a Home & DIY blog targeting US readers.
Your goal: produce articles that rank on Google's first page for long-tail intent queries and that AdSense ad serving rewards.

Always return ONLY valid JSON matching the schema. Never include markdown fences or commentary outside the JSON.

Rules for the article:
- Title: under 60 characters, includes the target keyword early, click-worthy.
- Slug: lowercase, hyphenated, 3-7 words, includes the keyword.
- Meta description: 140-160 characters, includes keyword, has clear benefit.
- Excerpt: 1-2 sentences, hook the reader.
- Content: 1100-1600 words, Markdown only. Start with a short engaging intro (no H1). Use H2 (##) sections, H3 (###) sub-sections where useful. Include numbered steps when relevant, a "Tools / Materials Needed" section if relevant, bullet lists, one comparison table when useful, a short FAQ section with 3-4 Q&A pairs at the end, and a concluding pro-tip. Be practical, specific, and US-centric (US prices, US brands, imperial units). Never invent dangerous instructions. Add a one-line safety note when relevant.`;

    const userPrompt = `Target keyword: "${data.keyword}"
${data.outline ? `Optional outline / angle: ${data.outline}` : ""}
Niche: Home improvement, DIY, repairs, renovation.

Return JSON via the tool.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_article_draft",
              description: "Return a complete SEO-optimized article draft.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  slug: { type: "string" },
                  excerpt: { type: "string" },
                  meta_description: { type: "string" },
                  content: { type: "string", description: "Full markdown body" },
                },
                required: ["title", "slug", "excerpt", "meta_description", "content"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_article_draft" } },
      }),
    });

    if (resp.status === 429) {
      return { ok: false as const, error: "Rate limit hit. Please wait a moment and try again." };
    }
    if (resp.status === 402) {
      return { ok: false as const, error: "AI credits exhausted. Add credits in Workspace > Usage." };
    }
    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI gateway error:", resp.status, text);
      return { ok: false as const, error: "AI request failed." };
    }

    const json = (await resp.json()) as {
      choices?: Array<{
        message?: {
          tool_calls?: Array<{ function?: { arguments?: string } }>;
          content?: string | null;
        };
      }>;
    };

    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      console.error("No tool call in AI response", json);
      return { ok: false as const, error: "AI returned no draft. Try again." };
    }

    try {
      const parsed = JSON.parse(args) as {
        title: string;
        slug: string;
        excerpt: string;
        meta_description: string;
        content: string;
      };
      return { ok: true as const, draft: parsed };
    } catch (e) {
      console.error("Failed to parse AI draft", e);
      return { ok: false as const, error: "Could not parse AI draft." };
    }
  });

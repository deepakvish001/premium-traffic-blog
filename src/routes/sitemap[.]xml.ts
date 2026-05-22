import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [{ data: posts }, { data: cats }] = await Promise.all([
          supabaseAdmin.from("posts").select("slug, updated_at, published_at").eq("status", "published"),
          supabaseAdmin.from("categories").select("slug"),
        ]);

        const entries: Array<{ path: string; lastmod?: string; priority?: string }> = [
          { path: "/", priority: "1.0" },
          { path: "/blog", priority: "0.9" },
          { path: "/about", priority: "0.5" },
          { path: "/contact", priority: "0.4" },
          { path: "/privacy", priority: "0.3" },
        ];
        for (const c of cats ?? []) {
          entries.push({ path: `/category/${(c as { slug: string }).slug}`, priority: "0.7" });
        }
        for (const p of posts ?? []) {
          const post = p as { slug: string; updated_at: string; published_at: string };
          entries.push({
            path: `/blog/${post.slug}`,
            lastmod: post.updated_at || post.published_at,
            priority: "0.8",
          });
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries.map((e) =>
            [
              `  <url>`,
              `    <loc>${BASE_URL}${e.path}</loc>`,
              e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              `  </url>`,
            ].filter(Boolean).join("\n"),
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});

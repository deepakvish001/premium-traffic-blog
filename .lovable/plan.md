
# Home & DIY Blog — Build Plan

A clean SaaS-style blog targeting US Home & DIY readers, optimized for fast Google ranking and AdSense revenue. You log in, generate AI drafts, edit, publish. Visitors get fast, SEO-perfect article pages.

## Honest expectations (read once)

- 1M US visits/month is realistic in 12–24 months at 3–5 quality posts/week in Home & DIY.
- AdSense RPM in this niche: **$12–$25** in US. 1M views ≈ $12K–$25K/month.
- Ranking strategy: target **long-tail "how to / why / vs / best" queries** (low KD, high intent). Examples: *"how to fix a leaking kitchen faucet without removing handle"*, *"best paint for bathroom ceiling to prevent mold"*.
- AdSense approval needs ~15–25 original, helpful posts, an About + Contact + Privacy page, and a custom domain.

## Niche focus (sub-categories I'll seed the site with)

Plumbing fixes · Electrical basics · Painting · Flooring · Kitchen & Bath · Outdoor / Lawn · Tools & Reviews · Smart Home

## Pages & Routes

```text
/                       Home — featured + latest + categories
/blog                   All posts, paginated, filter by category
/blog/$slug             Article page (SEO-optimized, AdSense slots)
/category/$slug         Category archive
/about                  About (required for AdSense)
/contact                Contact form
/privacy                Privacy policy (required for AdSense)
/admin                  Admin dashboard (login-gated)
/admin/posts            List, edit, delete posts
/admin/posts/new        AI draft generator + rich editor
/admin/posts/$id        Edit post
/login                  Single-admin login
/sitemap.xml            Auto-generated from published posts
/robots.txt             Allow all + sitemap reference
```

Each route has unique `head()` metadata (title, description, og:*, canonical). Article pages emit **JSON-LD Article schema** for rich snippets.

## Features

**Public site**
- Fast SSR article pages, semantic HTML, single H1, alt text, lazy images
- Table of contents auto-generated from H2s (helps dwell time + ranking)
- Related posts at bottom (internal linking = ranking boost)
- Reading time, author byline, published/updated dates
- AdSense placeholders: header, in-article (after H2 #2), sidebar, end-of-article — you paste your AdSense publisher ID once and they activate
- Newsletter signup (collects email for repeat traffic)
- Search box across posts

**Admin (you only)**
- Email/password login (Lovable Cloud auth)
- Dashboard: post count, views per post (basic counter), draft vs published
- **AI draft generator**: enter a target keyword + optional outline → Lovable AI returns a full SEO-optimized draft (title, meta description, slug, H2/H3 structure, intro, body, FAQ section, conclusion). You edit in a rich editor, set category + featured image, publish.
- Image upload to Lovable Cloud Storage
- Schedule publish date

**SEO stack (built in from day one)**
- Per-route head() with title/description/og/canonical
- JSON-LD Article + BreadcrumbList + WebSite SearchAction
- Dynamic sitemap.xml regenerated from DB
- robots.txt
- Clean slugs, 301-safe URL structure
- Internal linking suggestions in editor

## Tech (for you, the technical bit)

- TanStack Start routes as above
- Lovable Cloud: Postgres tables `posts`, `categories`, `post_views`, `subscribers`; Storage bucket `post-images`; Auth (single admin user)
- RLS: public read on published posts only; admin-only write (checked via `user_roles` table with `admin` role)
- Server function `generateDraft` calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with an SEO-tuned system prompt
- Tailwind v4 design tokens: Clean SaaS palette (#fafbfc / #e8ecf1 / #94a3b8 / #3b82f6), Inter body + Space Grotesk headings

## What I'll build in this first pass

1. Database schema + auth + admin role
2. Public site shell (home, blog list, article, category, about, contact, privacy) with Clean SaaS design
3. Article page with full SEO + AdSense slot components (placeholder until you add publisher ID)
4. Admin login + post CRUD + rich editor + image upload
5. AI draft generator server function
6. Sitemap + robots + JSON-LD
7. Seed 3 sample published posts so the site isn't empty

## What you do after I build

1. Create your admin account on `/login`
2. Generate & publish 15–20 posts using the AI drafter (edit each — never publish raw AI)
3. Connect a custom domain
4. Apply to Google AdSense, paste publisher ID in admin settings
5. Submit sitemap to Google Search Console
6. Keep publishing 3–5 posts/week

Ready to build when you approve.

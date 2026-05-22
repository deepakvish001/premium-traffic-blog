import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getPostBySlug, getSiteSettings } from "@/lib/posts.functions";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { AdSlot } from "@/components/AdSlot";
import { PostCard } from "@/components/PostCard";
import { readingTimeMinutes } from "@/lib/slug";

const postQO = (slug: string) =>
  queryOptions({
    queryKey: ["post", slug],
    queryFn: () => getPostBySlug({ data: { slug } }),
  });
const settingsQO = queryOptions({
  queryKey: ["settings"],
  queryFn: () => getSiteSettings(),
});

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params, context }) => {
    const result = await context.queryClient.ensureQueryData(postQO(params.slug));
    if (!result.post) throw notFound();
    await context.queryClient.ensureQueryData(settingsQO);
  },
  head: ({ params, loaderData: _loaderData }) => {
    void _loaderData;
    return {
      meta: [
        { title: `${params.slug.replace(/-/g, " ")} — HomeFix Pro` },
        { property: "og:url", content: `/blog/${params.slug}` },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
    };
  },
  component: PostPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Article not found</h1>
      <Link to="/blog" className="mt-4 inline-block text-primary underline">Back to all guides</Link>
    </div>
  ),
});

function PostPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(postQO(slug));
  const { data: settings } = useSuspenseQuery(settingsQO);
  const post = data.post!;

  const ldJson = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.excerpt,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    image: post.featured_image ? [post.featured_image] : undefined,
    author: { "@type": "Organization", name: settings.siteName },
    publisher: { "@type": "Organization", name: settings.siteName },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
      />
      <article className="mx-auto max-w-3xl px-4 py-12">
        {post.category && (
          <Link
            to="/category/$slug"
            params={{ slug: post.category.slug }}
            className="text-sm font-semibold uppercase tracking-wider text-primary"
          >
            {post.category.name}
          </Link>
        )}
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 text-xl text-muted-foreground">{post.excerpt}</p>
        )}
        <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
          {post.published_at && (
            <time dateTime={post.published_at}>
              {new Date(post.published_at).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </time>
          )}
          <span>·</span>
          <span>{readingTimeMinutes(post.content)} min read</span>
        </div>

        <AdSlot publisherId={settings.adsensePublisherId} />

        <MarkdownRenderer content={post.content} />

        <AdSlot publisherId={settings.adsensePublisherId} label="Sponsored" />
      </article>

      {data.related.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="mb-6 font-display text-2xl font-bold">Related guides</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.related.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </section>
      )}
    </>
  );
}

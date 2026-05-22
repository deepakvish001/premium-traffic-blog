import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listPublishedPosts, listCategories } from "@/lib/posts.functions";
import { PostCard } from "@/components/PostCard";

const postsQO = queryOptions({
  queryKey: ["home", "posts"],
  queryFn: () => listPublishedPosts({ data: { limit: 9 } }),
});
const catsQO = queryOptions({
  queryKey: ["categories"],
  queryFn: () => listCategories(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HomeFix Pro — DIY Home Improvement Guides That Actually Work" },
      { name: "description", content: "Practical, tested home improvement guides for US homeowners. Plumbing, electrical, painting, smart home." },
      { property: "og:title", content: "HomeFix Pro — Practical DIY for US Homeowners" },
      { property: "og:description", content: "Tested home improvement guides for US homeowners." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(postsQO),
      context.queryClient.ensureQueryData(catsQO),
    ]);
  },
  component: Home,
});

function Home() {
  const { data: postsData } = useSuspenseQuery(postsQO);
  const { data: catsData } = useSuspenseQuery(catsQO);
  const [hero, ...rest] = postsData.posts;

  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Home & DIY</p>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Fix it. Build it. <span className="text-primary">Save thousands.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Step-by-step DIY guides written for US homeowners. Real tools, real prices, no fluff.
          </p>
          <Link to="/blog" className="mt-8 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Browse all guides
          </Link>
        </div>
      </section>

      {hero && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="mb-6 font-display text-2xl font-bold">Featured</h2>
          <Link to="/blog/$slug" params={{ slug: hero.slug }} className="group block rounded-lg border border-border bg-card p-8 transition-shadow hover:shadow-lg">
            {hero.category && <span className="text-xs font-semibold uppercase tracking-wider text-primary">{hero.category.name}</span>}
            <h3 className="mt-2 font-display text-3xl font-bold leading-tight group-hover:text-primary">{hero.title}</h3>
            {hero.excerpt && <p className="mt-3 max-w-3xl text-muted-foreground">{hero.excerpt}</p>}
          </Link>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 font-display text-2xl font-bold">Latest Guides</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 font-display text-2xl font-bold">Browse by Category</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {catsData.categories.map((c) => (
            <Link key={c.id} to="/category/$slug" params={{ slug: c.slug }} className="rounded-md border border-border bg-card p-4 text-sm font-medium hover:border-primary hover:text-primary">
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

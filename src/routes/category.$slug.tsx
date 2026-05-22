import { createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCategoryBySlug, listPublishedPosts } from "@/lib/posts.functions";
import { PostCard } from "@/components/PostCard";

const catQO = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: () => getCategoryBySlug({ data: { slug } }),
  });
const postsQO = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug, "posts"],
    queryFn: () => listPublishedPosts({ data: { categorySlug: slug, limit: 100 } }),
  });

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params, context }) => {
    const c = await context.queryClient.ensureQueryData(catQO(params.slug));
    if (!c.category) throw notFound();
    await context.queryClient.ensureQueryData(postsQO(params.slug));
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} guides — HomeFix Pro` },
      { property: "og:url", content: `/category/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/category/${params.slug}` }],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: c } = useSuspenseQuery(catQO(slug));
  const { data: p } = useSuspenseQuery(postsQO(slug));
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">{c.category!.name}</h1>
      {c.category!.description && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{c.category!.description}</p>
      )}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {p.posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
}

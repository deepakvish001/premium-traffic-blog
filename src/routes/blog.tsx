import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listPublishedPosts } from "@/lib/posts.functions";
import { PostCard } from "@/components/PostCard";

const qo = queryOptions({
  queryKey: ["posts", "all"],
  queryFn: () => listPublishedPosts({ data: { limit: 100 } }),
});

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "All DIY Guides — HomeFix Pro" },
      { name: "description", content: "Every home improvement guide on HomeFix Pro, sorted by newest first." },
      { property: "og:title", content: "All DIY Guides — HomeFix Pro" },
      { property: "og:description", content: "Every home improvement guide on HomeFix Pro." },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: BlogList,
});

function BlogList() {
  const { data } = useSuspenseQuery(qo);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">All DIY Guides</h1>
      <p className="mt-2 text-muted-foreground">{data.posts.length} articles published</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}

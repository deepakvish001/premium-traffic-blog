import { Link } from "@tanstack/react-router";
import type { PostListItem } from "@/lib/posts.functions";

export function PostCard({ post }: { post: PostListItem }) {
  return (
    <article className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md">
      {post.category && (
        <Link
          to="/category/$slug"
          params={{ slug: post.category.slug }}
          className="mb-2 inline-block text-xs font-semibold uppercase tracking-wider text-primary"
        >
          {post.category.name}
        </Link>
      )}
      <h3 className="font-display text-lg font-semibold leading-snug">
        <Link
          to="/blog/$slug"
          params={{ slug: post.slug }}
          className="transition-colors group-hover:text-primary"
        >
          {post.title}
        </Link>
      </h3>
      {post.excerpt && (
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
      )}
      {post.published_at && (
        <p className="mt-4 text-xs text-muted-foreground">
          {new Date(post.published_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
    </article>
  );
}

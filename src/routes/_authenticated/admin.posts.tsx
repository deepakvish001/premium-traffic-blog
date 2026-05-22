import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListPosts, adminDeletePost } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/posts")({
  component: PostsList,
});

function PostsList() {
  const list = useServerFn(adminListPosts);
  const del = useServerFn(adminDeletePost);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: () => list(),
  });

  async function onDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    try {
      await del({ data: { id } });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "posts"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">{(error as Error).message}</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">All Posts</h1>
        <Link to="/admin/new" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          + New post
        </Link>
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Views</th>
              <th className="px-4 py-2 text-left">Updated</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {data?.posts.map((p) => {
              const post = p as { id: string; title: string; slug: string; status: string; updated_at: string; view_count: number };
              return (
                <tr key={post.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="hover:text-primary">
                      {post.title}
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    <span className={post.status === "published" ? "text-primary" : "text-muted-foreground"}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{post.view_count}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(post.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => onDelete(post.id)} className="text-sm text-destructive hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {(!data?.posts.length) && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No posts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Admin — HomeFix Pro" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminShell,
});

function AdminShell() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <nav className="flex gap-6 text-sm font-medium">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Dashboard
          </Link>
          <Link to="/admin/posts" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Posts
          </Link>
          <Link to="/admin/new" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            New Post
          </Link>
        </nav>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      </div>
      <Outlet />
    </div>
  );
}

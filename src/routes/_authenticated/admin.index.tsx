import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminDashboardStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(adminDashboardStats);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fn(),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">{(error as Error).message}</p>;
  if (!data) return null;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Published" value={data.published} />
        <Stat label="Drafts" value={data.drafts} />
        <Stat label="Subscribers" value={data.subscribers} />
      </div>
      <h2 className="mt-10 font-display text-xl font-bold">Top posts by views</h2>
      <ul className="mt-4 divide-y divide-border rounded-md border border-border">
        {data.top.map((p: { id: string; title: string; view_count: number; slug: string }) => (
          <li key={p.id} className="flex items-center justify-between p-3 text-sm">
            <span>{p.title}</span>
            <span className="text-muted-foreground">{p.view_count} views</span>
          </li>
        ))}
        {data.top.length === 0 && <li className="p-3 text-sm text-muted-foreground">No posts yet.</li>}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

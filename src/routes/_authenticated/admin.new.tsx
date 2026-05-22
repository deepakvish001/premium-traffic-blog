import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminGenerateDraft, adminSavePost } from "@/lib/admin.functions";
import { listCategories } from "@/lib/posts.functions";
import { slugify } from "@/lib/slug";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/new")({
  component: NewPost,
});

function NewPost() {
  const nav = useNavigate();
  const generate = useServerFn(adminGenerateDraft);
  const save = useServerFn(adminSavePost);
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  const [keyword, setKeyword] = useState("");
  const [outline, setOutline] = useState("");
  const [generating, setGenerating] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function onGenerate() {
    if (!keyword.trim()) return;
    setGenerating(true);
    try {
      const res = await generate({ data: { keyword, outline: outline || undefined } });
      if (!res.ok) { toast.error(res.error); return; }
      setTitle(res.draft.title);
      setSlug(res.draft.slug || slugify(res.draft.title));
      setExcerpt(res.draft.excerpt);
      setMetaDesc(res.draft.meta_description);
      setContent(res.draft.content);
      toast.success("Draft generated. Review and publish.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally {
      setGenerating(false);
    }
  }

  async function onSave(status: "draft" | "published") {
    if (!title || !slug || !content) { toast.error("Title, slug, and content required"); return; }
    setSaving(true);
    try {
      const res = await save({
        data: {
          slug: slugify(slug),
          title,
          excerpt: excerpt || null,
          meta_description: metaDesc || null,
          content,
          category_id: categoryId || null,
          status,
        },
      });
      toast.success(status === "published" ? "Published!" : "Saved as draft");
      void res;
      nav({ to: "/admin/posts" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">New Post</h1>

      <section className="mt-6 rounded-md border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">AI Draft Generator</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the target keyword (a long-tail intent query works best).
        </p>
        <input
          value={keyword} onChange={(e) => setKeyword(e.target.value)}
          placeholder='e.g. "how to fix a leaking kitchen faucet"'
          className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <textarea
          value={outline} onChange={(e) => setOutline(e.target.value)}
          placeholder="Optional outline or angle"
          rows={2}
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          onClick={onGenerate} disabled={generating || !keyword}
          className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate draft"}
        </button>
      </section>

      <section className="mt-8 space-y-4">
        <Field label="Title">
          <input value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </Field>
        <Field label="Slug (URL)">
          <input value={slug} onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" />
        </Field>
        <Field label="Category">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">— None —</option>
            {cats.data?.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Excerpt">
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </Field>
        <Field label="Meta description (SEO)">
          <textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={2} maxLength={200}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <p className="mt-1 text-xs text-muted-foreground">{metaDesc.length}/160 recommended</p>
        </Field>
        <Field label="Content (Markdown)">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={24}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm" />
        </Field>

        <div className="flex gap-2">
          <button onClick={() => onSave("draft")} disabled={saving}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-50">
            Save draft
          </button>
          <button onClick={() => onSave("published")} disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            Publish
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

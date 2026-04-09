import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useListBlogPosts, useCreateBlogPost, useDeleteBlogPost } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, CalendarDays } from "lucide-react";

const blankForm = { title: "", slug: "", excerpt: "", content: "", category: "", tags: "", imageUrl: "", authorName: "", isPublished: false, publishedAt: "" };

export function BlogAdminPage() {
  const { data: posts, queryKey } = useListBlogPosts();
  const createPost = useCreateBlogPost();
  const deletePost = useDeleteBlogPost();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPost.mutateAsync({
      data: { ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), publishedAt: form.publishedAt || undefined }
    });
    await qc.invalidateQueries({ queryKey });
    setOpen(false);
    setForm(blankForm);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this post?")) return;
    await deletePost.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Blog Posts</h1>
          <p className="text-muted-foreground text-sm">Manage blog content and insights</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />New Post</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Blog Post</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><Label>Title *</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Slug *</Label><Input required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="my-post" /></div>
                <div className="flex flex-col gap-1.5"><Label>Category *</Label><Input required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Author *</Label><Input required value={form.authorName} onChange={e => setForm({ ...form, authorName: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Image URL *</Label><Input required value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Excerpt *</Label><Textarea required value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} className="resize-none h-16" /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Content *</Label><Textarea required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="resize-none h-32" /></div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.isPublished} onCheckedChange={v => setForm({ ...form, isPublished: v })} />
                  <Label>Published</Label>
                </div>
                {form.isPublished && (
                  <div className="flex flex-col gap-1.5"><Label>Publish Date</Label><Input type="datetime-local" value={form.publishedAt} onChange={e => setForm({ ...form, publishedAt: e.target.value })} /></div>
                )}
              </div>
              <Button type="submit" disabled={createPost.isPending}>{createPost.isPending ? "Creating..." : "Create Post"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3">
          {posts?.map((post) => (
            <div key={post.id} className="gradient-border rounded-xl p-5 group flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-foreground">{post.title}</span>
                  <Badge variant="outline" className={post.isPublished ? "text-green-400 border-green-400/20 text-xs" : "text-xs text-muted-foreground"}>{post.isPublished ? "Published" : "Draft"}</Badge>
                  <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{post.authorName}</span>
                  {post.publishedAt && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(post.publishedAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(post.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          {(!posts || posts.length === 0) && (
            <div className="text-center py-20 text-muted-foreground">No blog posts yet.</div>
          )}
        </div>
    </AdminLayout>
  );
}

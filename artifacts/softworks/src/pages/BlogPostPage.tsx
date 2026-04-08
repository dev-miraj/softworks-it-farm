import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CalendarDays, User } from "lucide-react";
import { useGetBlogPost } from "@workspace/api-client-react";

export function BlogPostPage({ id }: { id: number }) {
  const { data: post, isLoading } = useGetBlogPost(id, { query: { staleTime: 60000 } });

  if (isLoading) {
    return (
      <div className="pt-24 max-w-3xl mx-auto px-4 py-16">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-12 mb-4" />
        <Skeleton className="h-4 mb-2 w-64" />
        <Skeleton className="h-64 mt-8 mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-4" />)}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-24 max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
        <Link href="/blog">
          <Button>Back to Blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 max-w-3xl mx-auto px-4 py-16">
      <Link href="/blog">
        <Button variant="ghost" size="sm" className="mb-8 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Button>
      </Link>

      <Badge variant="outline" className="mb-4 capitalize text-xs border-secondary/20 text-secondary">{post.category}</Badge>
      <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">{post.title}</h1>
      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8">
        <span className="flex items-center gap-2"><User className="w-4 h-4" />{post.authorName}</span>
        {post.publishedAt && (
          <span className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </span>
        )}
      </div>

      <div className="rounded-xl overflow-hidden mb-10">
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full h-64 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/900x400/1a1f3a/6366f1?text=${encodeURIComponent(post.title)}`;
          }}
        />
      </div>

      <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
        {post.content.split("\n").map((para, i) => (
          <p key={i} className="mb-4">{para}</p>
        ))}
      </div>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-border">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

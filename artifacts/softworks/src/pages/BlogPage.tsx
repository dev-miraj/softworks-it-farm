import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, User, ChevronRight } from "lucide-react";
import { useListBlogPosts } from "@workspace/api-client-react";

export function BlogPage() {
  const { data: posts, isLoading } = useListBlogPosts({ query: { staleTime: 60000 } });
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const publishedPosts = posts?.filter((p) => p.isPublished) ?? [];
  const categories = ["all", ...Array.from(new Set(publishedPosts.map((p) => p.category)))];
  const filtered = activeCategory === "all" ? publishedPosts : publishedPosts.filter((p) => p.category === activeCategory);

  return (
    <div>
      <section className="pt-24 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <Badge variant="outline" className="mb-4 border-secondary/30 text-secondary bg-secondary/10">Insights</Badge>
          <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
            Thoughts on <span className="gradient-text">Technology</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Articles, case studies, and deep dives from the SOFTWORKS team.
          </p>
        </div>
      </section>

      <section className="pb-24 max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                activeCategory === cat
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <div className="group rounded-xl overflow-hidden border border-border hover:border-primary/30 bg-card hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer h-full flex flex-col">
                  <div className="h-48 overflow-hidden bg-muted">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/600x400/1a1f3a/6366f1?text=${encodeURIComponent(post.title)}`;
                      }}
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <Badge variant="outline" className="mb-3 text-xs border-secondary/20 text-secondary self-start capitalize">{post.category}</Badge>
                    <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 flex-1">{post.title}</h3>
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.authorName}</span>
                      {post.publishedAt && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-20">No blog posts found.</p>
        )}
      </section>
    </div>
  );
}

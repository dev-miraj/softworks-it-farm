import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, User, Clock, Tag } from "lucide-react";
import { useListBlogPosts } from "@workspace/api-client-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";

export function BlogPage() {
  const ref = useGsapReveal();
  const { data: posts, isLoading } = useListBlogPosts({ query: { staleTime: 60000 } });
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const publishedPosts = posts?.filter((p) => p.isPublished) ?? [];
  const categories = ["all", ...Array.from(new Set(publishedPosts.map((p) => p.category)))];
  const filtered = activeCategory === "all" ? publishedPosts : publishedPosts.filter((p) => p.category === activeCategory);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div ref={ref}>
      <section className="pt-24 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-32 sm:h-48 bg-secondary/15 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center px-4 hero-enter">
          <div className="badge-pill mb-4">
            <Tag className="w-3 h-3" />
            Insights & Articles
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-5">
            Thoughts on <span className="gradient-text">Technology</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Deep dives, case studies, and perspectives from the SOFTWORKS engineering team.
          </p>
        </div>
      </section>

      <section className="pb-24 max-w-7xl mx-auto px-4">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10 reveal">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 capitalize ${
                activeCategory === cat
                  ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20"
                  : "bg-card border border-border text-muted-foreground hover:border-secondary/30 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-72 rounded-2xl w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No posts in this category yet.</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featured && (
              <Link href={`/blog/${featured.id}`}>
                <div className="group rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer mb-8 reveal grid grid-cols-1 lg:grid-cols-2">
                  <div className="h-56 sm:h-72 lg:h-full overflow-hidden bg-muted">
                    <img
                      src={featured.imageUrl}
                      alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/800x500/1a1f3a/6366f1?text=${encodeURIComponent(featured.title)}`;
                      }}
                    />
                  </div>
                  <div className="p-6 sm:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className="border-secondary/20 text-secondary text-xs capitalize">{featured.category}</Badge>
                      <Badge variant="secondary" className="text-xs">Featured</Badge>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-foreground mb-3 group-hover:text-primary transition-colors leading-snug">{featured.title}</h2>
                    <p className="text-sm text-muted-foreground mb-5 line-clamp-3 leading-relaxed">{featured.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><User className="w-3 h-3" />{featured.authorName}</span>
                      {featured.publishedAt && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(featured.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />5 min read</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Rest of Posts */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 reveal-stagger">
                {rest.map((post) => (
                  <Link key={post.id} href={`/blog/${post.id}`}>
                    <div className="group rounded-xl overflow-hidden border border-border hover:border-primary/30 bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer h-full flex flex-col card-hover">
                      <div className="h-44 overflow-hidden bg-muted relative">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://placehold.co/600x400/1a1f3a/6366f1?text=${encodeURIComponent(post.title)}`;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <Badge variant="outline" className="mb-3 text-xs border-secondary/20 text-secondary self-start capitalize">{post.category}</Badge>
                        <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 flex-1 leading-snug">{post.title}</h3>
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto border-t border-border pt-3">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.authorName}</span>
                          {post.publishedAt && (
                            <span className="flex items-center gap-1 ml-auto">
                              <CalendarDays className="w-3 h-3" />
                              {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

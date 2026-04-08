import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import { useListPortfolio } from "@workspace/api-client-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";

export function PortfolioPage() {
  const ref = useGsapReveal();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { data: portfolio, isLoading } = useListPortfolio({
    params: activeCategory !== "all" ? { category: activeCategory } : {},
    query: { staleTime: 60000 },
  });

  const { data: allPortfolio } = useListPortfolio({ params: {}, query: { staleTime: 60000 } });
  const categories = allPortfolio
    ? ["all", ...Array.from(new Set(allPortfolio.map((p) => p.category)))]
    : ["all"];

  return (
    <div ref={ref}>
      <section className="pt-24 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center px-4 hero-enter">
          <Badge variant="outline" className="mb-4 border-secondary/30 text-secondary bg-secondary/10">Portfolio</Badge>
          <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
            Work We're <span className="gradient-text">Proud Of</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore our case studies across industries and technology stacks.
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
                  ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/25"
                  : "bg-card border border-border text-muted-foreground hover:border-secondary/30 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 reveal-stagger">
            {portfolio?.map((item) => (
              <div
                key={item.id}
                className="group rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 bg-card"
              >
                <div className="relative h-48 overflow-hidden bg-muted">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/600x400/1a1f3a/6366f1?text=${encodeURIComponent(item.title)}`;
                    }}
                  />
                  {item.isFeatured && (
                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs">Featured</Badge>
                  )}
                  {item.projectUrl && (
                    <a
                      href={item.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-3 right-3 w-8 h-8 bg-background/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <div className="p-5">
                  <Badge variant="outline" className="mb-2 text-xs border-secondary/20 text-secondary">{item.category}</Badge>
                  <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{item.clientName}</span>
                    <div className="flex flex-wrap gap-1">
                      {item.technologies.slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs py-0">{tech}</Badge>
                      ))}
                      {item.technologies.length > 3 && (
                        <Badge variant="secondary" className="text-xs py-0">+{item.technologies.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && (!portfolio || portfolio.length === 0) && (
          <p className="text-center text-muted-foreground py-20">No portfolio items found.</p>
        )}
      </section>
    </div>
  );
}

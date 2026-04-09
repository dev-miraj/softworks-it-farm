import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Code, Cloud, Brain, Shield, Palette, Lightbulb, Cpu, Database, Globe, Smartphone, Lock, Zap, BarChart, type LucideIcon } from "lucide-react";
import { useListServices } from "@workspace/api-client-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";

const iconMap: Record<string, LucideIcon> = {
  Code, Cloud, Brain, Shield, Palette, Lightbulb, Cpu, Database, Globe, Smartphone, Lock, Zap, BarChart,
};

export function ServicesPage() {
  const ref = useGsapReveal();
  const { data: services, isLoading } = useListServices({ query: { staleTime: 60000 } });
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = services
    ? ["all", ...Array.from(new Set(services.map((s) => s.category)))]
    : ["all"];

  const filtered = services?.filter(
    (s) => activeCategory === "all" || s.category === activeCategory
  );

  return (
    <div ref={ref}>
      <section className="pt-24 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-32 sm:h-48 bg-primary/15 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center px-4 hero-stagger">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10">Our Services</Badge>
          <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
            Solutions That <span className="gradient-text">Drive Results</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From concept to deployment, we deliver comprehensive digital services tailored to your business needs.
          </p>
        </div>
      </section>

      <section className="pb-24 max-w-7xl mx-auto px-4">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-12 reveal-pop-stagger">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 reveal-cards">
            {filtered?.map((service) => (
              <div
                key={service.id}
                className="gradient-border rounded-xl p-6 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group"
              >
                <div className="mb-4 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  {(() => { const I = iconMap[service.icon] || Code; return <I className="w-6 h-6 text-primary" />; })()}
                </div>
                <Badge variant="outline" className="mb-3 text-xs border-primary/20 text-primary">{service.category}</Badge>
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{service.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{service.description}</p>
                {service.features.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {service.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!filtered || filtered.length === 0) && (
          <div className="text-center py-20 text-muted-foreground">
            No services found in this category.
          </div>
        )}
      </section>
    </div>
  );
}

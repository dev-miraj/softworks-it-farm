import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, ArrowRight, Zap, Package } from "lucide-react";
import { useListSaasProducts } from "@workspace/api-client-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { StatCounter } from "@/components/ui/StatCounter";

const statusStyles: Record<string, { dot: string; pill: string }> = {
  active: { dot: "bg-emerald-400", pill: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  beta: { dot: "bg-yellow-400", pill: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  coming_soon: { dot: "bg-muted-foreground", pill: "text-muted-foreground bg-muted border-border" },
};

export function SaasPage() {
  const ref = useGsapReveal();
  const { data: products, isLoading } = useListSaasProducts({ query: { staleTime: 60000 } });
  const activeProducts = products?.filter((p) => p.isActive);

  return (
    <div ref={ref}>
      <section className="pt-24 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 sm:w-[400px] h-32 sm:h-48 bg-primary/15 blur-[80px] rounded-full pointer-events-none animate-float" />
        <div className="relative max-w-4xl mx-auto text-center px-4 hero-enter">
          <div className="badge-pill mb-4">
            <Zap className="w-3 h-3 fill-current" />
            SaaS Products
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-5">
            Products Built for <span className="gradient-text">Scale</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Our SaaS suite covers the tools modern businesses need — from automation to analytics, built with enterprise reliability.
          </p>

          {/* Mini stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            <StatCounter value="3+" label="Products Live" className="text-2xl sm:text-3xl" labelClassName="text-xs" />
            <div className="w-px h-8 bg-border hidden sm:block" />
            <StatCounter value="500+" label="Active Users" className="text-2xl sm:text-3xl" labelClassName="text-xs" />
            <div className="w-px h-8 bg-border hidden sm:block" />
            <StatCounter value="99.9%" label="Uptime SLA" className="text-2xl sm:text-3xl" labelClassName="text-xs" />
          </div>
        </div>
      </section>

      <section className="pb-24 max-w-7xl mx-auto px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 reveal-stagger">
            {activeProducts?.map((product) => {
              const status = statusStyles[product.status] ?? statusStyles.active;
              return (
                <div
                  key={product.id}
                  className="gradient-border rounded-2xl p-6 sm:p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group card-hover"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl sm:text-5xl leading-none">{product.iconUrl || "📦"}</div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors">{product.name}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">{product.category}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`capitalize text-xs flex items-center gap-1.5 ${status.pill}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
                      {product.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground mb-5 leading-relaxed text-sm sm:text-base">{product.description}</p>

                  {/* Features */}
                  <div className="flex flex-col gap-2 mb-6">
                    {product.features.slice(0, 5).map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  {(product.pricingMonthly || product.pricingYearly) && (
                    <div className="flex items-baseline gap-4 mb-6 p-4 rounded-xl bg-primary/5 border border-primary/15">
                      {product.pricingMonthly && (
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-black text-primary">${Number(product.pricingMonthly).toFixed(0)}</span>
                          <span className="text-xs text-muted-foreground">/month</span>
                        </div>
                      )}
                      {product.pricingYearly && (
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg sm:text-xl font-bold text-secondary">${Number(product.pricingYearly).toFixed(0)}</span>
                          <span className="text-xs text-muted-foreground">/year</span>
                          <Badge variant="secondary" className="ml-2 text-xs">Save 17%</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {product.demoUrl && (
                      <a href={product.demoUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button variant="outline" className="w-full hover:border-primary/30 group/btn">
                          Live Demo <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </a>
                    )}
                    <Button className="flex-1 bg-primary hover:bg-primary/90 animate-pulse-glow">Get Access</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && (!activeProducts || activeProducts.length === 0) && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Coming Soon</h3>
            <p className="text-muted-foreground text-sm">Our SaaS products are in development. Check back soon!</p>
          </div>
        )}
      </section>
    </div>
  );
}

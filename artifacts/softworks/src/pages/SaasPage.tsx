import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useListSaasProducts } from "@workspace/api-client-react";

const statusColors: Record<string, string> = {
  active: "text-green-400 bg-green-400/10 border-green-400/20",
  beta: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  coming_soon: "text-muted-foreground bg-muted border-border",
};

export function SaasPage() {
  const { data: products, isLoading } = useListSaasProducts({ query: { staleTime: 60000 } });
  const activeProducts = products?.filter((p) => p.isActive);

  return (
    <div>
      <section className="pt-24 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10">SaaS Products</Badge>
          <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
            Products Built for <span className="gradient-text">Scale</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our SaaS suite covers the tools modern businesses need — from automation to analytics, built with enterprise reliability.
          </p>
        </div>
      </section>

      <section className="pb-24 max-w-7xl mx-auto px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {activeProducts?.map((product) => (
              <div key={product.id} className="gradient-border rounded-xl p-8 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-4xl mb-3">{product.iconUrl || "📦"}</div>
                    <h2 className="text-2xl font-black text-foreground">{product.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize text-xs ${statusColors[product.status] ?? statusColors.active}`}
                  >
                    {product.status.replace("_", " ")}
                  </Badge>
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

                <div className="flex flex-col gap-2 mb-6">
                  {product.features.slice(0, 5).map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                {(product.pricingMonthly || product.pricingYearly) && (
                  <div className="flex items-baseline gap-4 mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    {product.pricingMonthly && (
                      <div>
                        <span className="text-2xl font-black text-primary">${Number(product.pricingMonthly).toFixed(0)}</span>
                        <span className="text-xs text-muted-foreground">/mo</span>
                      </div>
                    )}
                    {product.pricingYearly && (
                      <div>
                        <span className="text-xl font-bold text-secondary">${Number(product.pricingYearly).toFixed(0)}</span>
                        <span className="text-xs text-muted-foreground">/yr</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  {product.demoUrl && (
                    <a href={product.demoUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" className="w-full">
                        Live Demo <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                  )}
                  <Button className="flex-1 bg-primary hover:bg-primary/90">Get Access</Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && (!activeProducts || activeProducts.length === 0) && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">SaaS products coming soon. Check back later.</p>
          </div>
        )}
      </section>
    </div>
  );
}

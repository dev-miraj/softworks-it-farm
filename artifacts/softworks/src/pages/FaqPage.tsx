import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useListFaqs } from "@workspace/api-client-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

const categoryLabels: Record<string, string> = {
  general: "General",
  services: "Services",
  pricing: "Pricing",
  technical: "Technical",
  hr: "HR",
  license: "License",
  other: "Other",
};

export function FaqPage() {
  const ref = useGsapReveal();
  const { data: faqs } = useListFaqs();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const activeFaqs = (faqs ?? []).filter(f => f.isActive);
  const categories = [...new Set(activeFaqs.map(f => f.category))];

  const filtered = activeFaqs.filter(f => {
    const q = search.toLowerCase();
    const ms = !search || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    const mc = filterCat === "all" || f.category === filterCat;
    return ms && mc;
  });

  return (
    <div ref={ref}>
      {/* Hero */}
      <section className="pt-24 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/15 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center px-4 hero-stagger">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10">FAQ</Badge>
          <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find answers to common questions about our services, pricing, and processes.
          </p>
        </div>
      </section>

      <section className="pb-24 max-w-3xl mx-auto px-4">
        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search questions..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setExpanded(null); }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={`cursor-pointer ${filterCat === "all" ? "bg-primary/10 text-primary border-primary/30" : ""}`} onClick={() => setFilterCat("all")}>All</Badge>
            {categories.map(c => (
              <Badge key={c} variant="outline" className={`cursor-pointer capitalize ${filterCat === c ? "bg-primary/10 text-primary border-primary/30" : ""}`} onClick={() => setFilterCat(c)}>
                {categoryLabels[c] ?? c}
              </Badge>
            ))}
          </div>
        </div>

        {/* FAQ accordion */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {search ? "No FAQs match your search." : "No FAQs available yet."}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((faq, i) => (
              <div key={faq.id} className={`gradient-border rounded-xl overflow-hidden transition-all duration-200 reveal-up`} style={{ animationDelay: `${i * 50}ms` }}>
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-white/3 transition-colors"
                  onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
                >
                  <span className={`font-semibold transition-colors ${expanded === faq.id ? "text-primary" : "text-foreground"}`}>
                    {faq.question}
                  </span>
                  <span className="shrink-0 w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center transition-colors">
                    {expanded === faq.id
                      ? <ChevronUp className="w-3.5 h-3.5 text-primary" />
                      : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </span>
                </button>
                {expanded === faq.id && (
                  <div className="px-6 pb-5 border-t border-border/30">
                    <p className="text-muted-foreground leading-relaxed pt-4 text-sm">{faq.answer}</p>
                    <Badge variant="outline" className="mt-3 text-xs capitalize">{categoryLabels[faq.category] ?? faq.category}</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center gradient-border rounded-2xl p-8">
          <h3 className="text-xl font-bold text-foreground mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-6 text-sm">Can't find the answer you're looking for? Our team is happy to help.</p>
          <a href="/contact">
            <button className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              Contact Us
            </button>
          </a>
        </div>
      </section>
    </div>
  );
}

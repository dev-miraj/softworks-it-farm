import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Code2, Palette, BarChart3, Brain, Rocket, Shield,
  CheckCircle, ChevronRight, Zap, Globe, Cpu,
  Code, Cloud, Lightbulb, Lock, type LucideIcon,
} from "lucide-react";
import { useListServices, useListTestimonials } from "@workspace/api-client-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";

const iconMap: Record<string, LucideIcon> = {
  Code, Cloud, Brain, Shield, Palette, Lightbulb, Cpu, Code2, Lock, Rocket, Globe, BarChart3,
};

const stats = [
  { value: "3+", label: "Years of Experience" },
  { value: "150+", label: "Projects Delivered" },
  { value: "80+", label: "Happy Clients" },
  { value: "15+", label: "Team Members" },
];

const capabilities = [
  { icon: Code2, title: "Web & Software Dev", desc: "Full-stack applications built with modern technologies" },
  { icon: Palette, title: "UI/UX & Design", desc: "Beautiful, user-centered design experiences" },
  { icon: BarChart3, title: "Digital Marketing", desc: "Data-driven campaigns that convert" },
  { icon: Brain, title: "AI & Automation", desc: "Intelligent systems that scale your business" },
  { icon: Rocket, title: "SaaS Development", desc: "Multi-tenant platforms built to grow" },
  { icon: Shield, title: "Enterprise Security", desc: "Secure, compliant infrastructure by default" },
];

const metrics = [
  {
    value: "98%",
    label: "On-time Delivery",
    gradient: "from-indigo-400 via-violet-400 to-purple-500",
  },
  {
    value: "4.9/5",
    label: "Client Satisfaction",
    gradient: "from-fuchsia-400 via-pink-400 to-rose-400",
  },
  {
    value: "A+",
    label: "Code Quality Score",
    gradient: "from-cyan-400 via-sky-400 to-blue-400",
  },
  {
    value: "24/7",
    label: "Support Available",
    gradient: "from-emerald-400 via-teal-400 to-green-400",
  },
];

export function HomePage() {
  const ref = useGsapReveal();
  const { data: services } = useListServices({ query: { staleTime: 60000 } });
  const { data: testimonials } = useListTestimonials({ query: { staleTime: 60000 } });
  const activeTestimonials = testimonials?.filter(t => t.isActive) ?? [];

  return (
    <div className="dark" ref={ref}>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
          <Badge variant="outline" className="mb-6 border-primary/40 text-primary bg-primary/10 px-4 py-1.5">
            <Zap className="w-3 h-3 mr-2" />
            Now serving 80+ global clients
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tighter mb-6 leading-none">
            <span className="text-foreground">Build What</span>
            <br />
            <span className="gradient-text">Matters.</span>
            <br />
            <span className="text-foreground">Scale Fast.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            SOFTWORKS IT FARM is a premium tech studio delivering modern web applications, AI systems, SaaS platforms, and digital transformation — built to last and engineered to scale.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="text-base px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 glow-primary">
                Start Your Project
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button size="lg" variant="outline" className="text-base px-8 py-6 border-border hover:border-primary/50 hover:bg-primary/5">
                View Our Work
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground text-sm animate-bounce">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-primary/60" />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 border-y border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 reveal-stagger">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-black gradient-text mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-accent/40 text-accent bg-accent/10">
            <Cpu className="w-3 h-3 mr-2" />
            Our Expertise
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-4">
            Everything You Need to
            <span className="gradient-text"> Dominate</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From concept to deployment, we handle the complete digital stack so you can focus on growing your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 reveal-stagger">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="gradient-border rounded-xl p-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group cursor-pointer"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">{cap.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{cap.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Services Preview */}
      {services && services.length > 0 && (
        <section className="py-20 bg-card/30 border-y border-border">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
                Our <span className="gradient-text">Services</span>
              </h2>
              <p className="text-muted-foreground">What we offer to help your business grow</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {services.slice(0, 6).map((service) => {
                const IconComp = iconMap[service.icon] ?? Code2;
                return (
                  <div key={service.id} className="glass rounded-xl p-5 hover:border-primary/30 transition-colors border border-border/50 group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <IconComp className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">{service.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                    <Badge variant="secondary" className="text-xs">{service.category}</Badge>
                  </div>
                );
              })}
            </div>
            <div className="text-center">
              <Link href="/services">
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                  View All Services <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Why Us */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="reveal-left">
            <Badge variant="outline" className="mb-4 border-secondary/40 text-secondary bg-secondary/10">
              <Globe className="w-3 h-3 mr-2" />
              Why SOFTWORKS
            </Badge>
            <h2 className="text-4xl font-black tracking-tight text-foreground mb-6">
              We Don't Just Build Software.
              <span className="gradient-text"> We Build Advantage.</span>
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Over 3 years we've developed a track record of delivering complex, enterprise-grade systems on time, at scale, with zero compromise on quality. Every project is a partnership.
            </p>
            <div className="flex flex-col gap-4">
              {[
                "Contract-first development with clear milestones",
                "Dedicated senior engineers on every project",
                "Full source code ownership — no vendor lock-in",
                "Post-launch support and scalability planning",
              ].map((point) => (
                <div key={point} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  {point}
                </div>
              ))}
            </div>
            <Link href="/contact" className="inline-block mt-8">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Let's Talk <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Metrics Grid — matches screenshot exactly */}
          <div className="grid grid-cols-2 gap-4 reveal-right">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="relative rounded-2xl p-6 text-center overflow-hidden"
                style={{
                  background: "rgba(10, 10, 20, 0.85)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
                }}
              >
                {/* subtle inner glow */}
                <div className="absolute inset-0 rounded-2xl opacity-5 bg-gradient-to-br from-white to-transparent pointer-events-none" />
                <div
                  className={`text-5xl font-black mb-3 bg-gradient-to-r ${metric.gradient} bg-clip-text text-transparent`}
                >
                  {metric.value}
                </div>
                <div className="text-xs text-zinc-400 font-medium tracking-wide uppercase">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {activeTestimonials.length > 0 && (
        <section className="py-20 bg-card/30 border-y border-border">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
                What Clients <span className="gradient-text">Say</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal-stagger">
              {activeTestimonials.slice(0, 3).map((t) => (
                <div key={t.id} className="glass rounded-xl p-6 border border-border/50">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <span key={i} className="text-yellow-400 text-sm">&#9733;</span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.content}"</p>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{t.clientName}</div>
                    <div className="text-xs text-muted-foreground">{t.role} — {t.company}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-6">
            Ready to Build Something
            <span className="gradient-text"> Extraordinary?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Join 80+ companies that chose SOFTWORKS to build their competitive advantage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="px-10 py-6 text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 glow-primary">
                Start a Project <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button size="lg" variant="outline" className="px-10 py-6 text-base border-border hover:border-primary/50">
                See Our Work
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

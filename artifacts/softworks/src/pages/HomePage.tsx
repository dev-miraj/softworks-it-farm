import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Code2, Palette, BarChart3, Brain, Rocket, Shield,
  CheckCircle, ChevronRight, Zap, Globe, Cpu,
  Code, Cloud, Lightbulb, Lock, Star, type LucideIcon,
} from "lucide-react";
import { useListServices, useListTestimonials } from "@workspace/api-client-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { TechStackMarquee } from "@/components/ui/TechStackMarquee";
import { useEffect, useState } from "react";

const iconMap: Record<string, LucideIcon> = {
  Code, Cloud, Brain, Shield, Palette, Lightbulb, Cpu, Code2, Lock, Rocket, Globe, BarChart3,
};

const TYPED_WORDS = ["Software.", "Products.", "Futures.", "Impact."];

const stats = [
  { value: "3+", label: "Years of Experience" },
  { value: "150+", label: "Projects Delivered" },
  { value: "80+", label: "Happy Clients" },
  { value: "15+", label: "Team Members" },
];

const capabilities = [
  { icon: Code2, title: "Web & Software Dev", desc: "Full-stack applications built with modern technologies", gradient: "from-blue-500 to-indigo-600" },
  { icon: Palette, title: "UI/UX & Design", desc: "Beautiful, user-centered design experiences", gradient: "from-pink-500 to-rose-600" },
  { icon: BarChart3, title: "Digital Marketing", desc: "Data-driven campaigns that convert", gradient: "from-orange-500 to-amber-600" },
  { icon: Brain, title: "AI & Automation", desc: "Intelligent systems that scale your business", gradient: "from-violet-500 to-purple-600" },
  { icon: Rocket, title: "SaaS Development", desc: "Multi-tenant platforms built to grow", gradient: "from-cyan-500 to-teal-600" },
  { icon: Shield, title: "Enterprise Security", desc: "Secure, compliant infrastructure by default", gradient: "from-emerald-500 to-green-600" },
];

const metrics = [
  { value: "98%", label: "On-time Delivery", gradient: "from-indigo-400 via-violet-400 to-purple-500" },
  { value: "4.9/5", label: "Client Satisfaction", gradient: "from-fuchsia-400 via-pink-400 to-rose-400" },
  { value: "A+", label: "Code Quality Score", gradient: "from-cyan-400 via-sky-400 to-blue-400" },
  { value: "24/7", label: "Support Available", gradient: "from-emerald-400 via-teal-400 to-green-400" },
];

function TypewriterText() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = TYPED_WORDS[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 80);
    } else if (!deleting && displayed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length - 1)), 45);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setWordIndex((i) => (i + 1) % TYPED_WORDS.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, deleting, wordIndex]);

  return (
    <span className="gradient-text">
      {displayed}
      <span className="typewriter-cursor text-primary">|</span>
    </span>
  );
}

export function HomePage() {
  const ref = useGsapReveal();
  const { data: services } = useListServices({ query: { staleTime: 60000 } });
  const { data: testimonials } = useListTestimonials({ query: { staleTime: 60000 } });
  const activeTestimonials = testimonials?.filter(t => t.isActive) ?? [];

  return (
    <div className="dark" ref={ref}>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-background to-violet-950/40" />

        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] rounded-full blur-[120px] bg-indigo-600/20 animate-float" />
        <div className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] rounded-full blur-[100px] bg-violet-600/20 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[150px] bg-cyan-600/10" />

        {/* Floating tech badges */}
        <div className="absolute top-24 left-8 sm:left-16 hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-mono animate-float" style={{ animationDelay: "0.5s" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> React · Next.js
        </div>
        <div className="absolute top-40 right-8 sm:right-16 hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs font-mono animate-float" style={{ animationDelay: "1s" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" /> Node.js · Python
        </div>
        <div className="absolute bottom-40 left-8 sm:left-16 hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-mono animate-float" style={{ animationDelay: "1.5s" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AWS · Docker
        </div>
        <div className="absolute bottom-32 right-8 sm:right-16 hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-pink-500/20 bg-pink-500/5 text-pink-400 text-xs font-mono animate-float" style={{ animationDelay: "2.5s" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" /> Flutter · Mobile
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5 fill-current" />
            Now serving 80+ global clients
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tighter mb-6 leading-none">
            <span className="text-foreground">We Build</span>
            <br />
            <TypewriterText />
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            SOFTWORKS IT FARM is a premium tech studio delivering modern web applications, AI systems, SaaS platforms, and digital transformation — built to last and engineered to scale.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/contact">
              <Button size="lg" className="text-base px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 glow-primary relative overflow-hidden group">
                <span className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                Start Your Project
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button size="lg" variant="outline" className="text-base px-8 py-6 border-border hover:border-primary/50 hover:bg-primary/5 backdrop-blur-sm group">
                View Our Work
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Mini stats row in hero */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black gradient-text">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground">
          <span className="text-xs font-mono tracking-widest text-muted-foreground/50 uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-primary/40 to-primary/60 animate-pulse" />
        </div>
      </section>

      {/* ── TECH STACK MARQUEE ── */}
      <TechStackMarquee />

      {/* ── CAPABILITIES ── */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-sm font-medium mb-4">
            <Cpu className="w-3.5 h-3.5" />
            Our Expertise
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-4">
            Everything You Need to
            <span className="gradient-text"> Dominate</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From concept to deployment, we handle the complete digital stack so you can focus on growing your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 reveal-stagger">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="relative group cursor-pointer rounded-2xl p-6 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 overflow-hidden"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${cap.gradient} blur-2xl`} style={{ opacity: 0, filter: "blur(40px)", transform: "scale(1.5)" }} />
                <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${cap.gradient} p-0.5 mb-5 shadow-lg`}>
                  <div className="w-full h-full rounded-[10px] bg-background flex items-center justify-center">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg group-hover:text-white transition-colors">{cap.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{cap.desc}</p>
                <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r ${cap.gradient} opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SERVICES ── */}
      {services && services.length > 0 && (
        <section className="py-20 border-y border-white/5" style={{ background: "rgba(255,255,255,0.015)" }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
                Our <span className="gradient-text">Services</span>
              </h2>
              <p className="text-muted-foreground">What we offer to help your business grow</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {services.slice(0, 6).map((service) => {
                const IconComp = iconMap[service.icon] ?? Code2;
                return (
                  <div key={service.id} className="group rounded-xl p-5 border border-white/5 bg-white/[0.02] hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
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
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 group">
                  View All Services <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── WHY US ── */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="reveal-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/30 bg-secondary/5 text-secondary text-sm font-medium mb-6">
              <Globe className="w-3.5 h-3.5" />
              Why SOFTWORKS
            </div>
            <h2 className="text-4xl font-black tracking-tight text-foreground mb-6">
              We Don't Just Build Software.
              <span className="gradient-text"> We Build Advantage.</span>
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Over 3 years we've developed a track record of delivering complex, enterprise-grade systems on time, at scale, with zero compromise on quality. Every project is a partnership.
            </p>
            <div className="flex flex-col gap-3">
              {[
                "Contract-first development with clear milestones",
                "Dedicated senior engineers on every project",
                "Full source code ownership — no vendor lock-in",
                "Post-launch support and scalability planning",
              ].map((point) => (
                <div key={point} className="flex items-center gap-3 text-sm text-muted-foreground group hover:text-foreground transition-colors">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <CheckCircle className="w-3 h-3 text-primary" />
                  </div>
                  {point}
                </div>
              ))}
            </div>
            <Link href="/contact" className="inline-block mt-8">
              <Button size="lg" className="bg-primary hover:bg-primary/90 group">
                Let's Talk <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 reveal-right">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="relative rounded-2xl p-6 text-center overflow-hidden group hover:scale-105 transition-transform duration-300"
                style={{
                  background: "rgba(10, 10, 20, 0.85)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
                }}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${metric.gradient}`} />
                <div className={`text-5xl font-black mb-3 bg-gradient-to-r ${metric.gradient} bg-clip-text text-transparent`}>
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

      {/* ── TESTIMONIALS ── */}
      {activeTestimonials.length > 0 && (
        <section className="py-20 border-y border-white/5" style={{ background: "rgba(255,255,255,0.015)" }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
                What Clients <span className="gradient-text">Say</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 reveal-stagger">
              {activeTestimonials.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className="relative rounded-2xl p-6 border border-white/5 bg-white/[0.02] hover:border-primary/20 hover:bg-primary/5 transition-all duration-300 group"
                >
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 group-hover:text-foreground/80 transition-colors">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {t.clientName[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{t.clientName}</div>
                      <div className="text-xs text-muted-foreground">{t.role} · {t.company}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-background to-violet-950/60" />
        <div className="absolute inset-0 grid-pattern opacity-15" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[100px] rounded-full" />

        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5 fill-current" />
            Ready to get started?
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-6">
            Ready to Build Something
            <span className="gradient-text"> Extraordinary?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Join 80+ companies that chose SOFTWORKS to build their competitive advantage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="px-10 py-6 text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 glow-primary group relative overflow-hidden">
                <span className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                Start a Project <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button size="lg" variant="outline" className="px-10 py-6 text-base border-border/50 hover:border-primary/50 backdrop-blur-sm group">
                See Our Work <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

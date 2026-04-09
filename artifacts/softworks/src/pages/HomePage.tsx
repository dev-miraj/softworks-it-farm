import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Code2, Palette, BarChart3, Brain, Rocket, Shield,
  CheckCircle, ChevronRight, Zap, Globe, Cpu,
  Code, Cloud, Lightbulb, Lock, Star, type LucideIcon,
} from "lucide-react";
import { useListServices, useListTestimonials } from "@workspace/api-client-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { TechStackMarquee } from "@/components/ui/TechStackMarquee";
import { StatCounter } from "@/components/ui/StatCounter";
import { useEffect, useState } from "react";

const iconMap: Record<string, LucideIcon> = {
  Code, Cloud, Brain, Shield, Palette, Lightbulb, Cpu, Code2, Lock, Rocket, Globe, BarChart3,
};

const TYPED_WORDS = ["Software.", "Products.", "Futures.", "Impact."];

const stats = [
  { value: "3+", label: "Years Experience" },
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

const whyPoints = [
  "Contract-first development with clear milestones",
  "Dedicated senior engineers on every project",
  "Full source code ownership — no vendor lock-in",
  "Post-launch support and scalability planning",
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
    <div ref={ref}>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-20">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 lg:w-[500px] h-64 sm:h-96 lg:h-[500px] rounded-full blur-[80px] sm:blur-[120px] bg-indigo-600/20 animate-float pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-80 lg:w-[400px] h-64 sm:h-80 lg:h-[400px] rounded-full blur-[60px] sm:blur-[100px] bg-violet-600/20 animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

        {/* Floating tech badges */}
        <div className="absolute top-24 left-6 xl:left-16 hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-500 dark:text-cyan-400 text-xs font-mono animate-float" style={{ animationDelay: "0.5s" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> React · Next.js
        </div>
        <div className="absolute top-36 right-6 xl:right-16 hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-500 dark:text-violet-400 text-xs font-mono animate-float" style={{ animationDelay: "1s" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" /> Node.js · Python
        </div>
        <div className="absolute bottom-44 left-6 xl:left-16 hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-mono animate-float" style={{ animationDelay: "1.5s" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AWS · Docker
        </div>
        <div className="absolute bottom-36 right-6 xl:right-16 hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border border-pink-500/20 bg-pink-500/5 text-pink-600 dark:text-pink-400 text-xs font-mono animate-float" style={{ animationDelay: "2.5s" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" /> Flutter · Mobile
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto w-full hero-stagger">
          <div className="inline-flex items-center gap-2 mb-6 sm:mb-8 px-4 sm:px-5 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs sm:text-sm font-medium backdrop-blur-sm">
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
            Now serving 80+ global clients
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tighter mb-5 sm:mb-6 leading-[1.05]">
            <span className="text-foreground">We Build</span>
            <br />
            <TypewriterText />
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            A premium tech studio delivering modern web applications, AI systems, SaaS platforms, and digital transformation — built to last and engineered to scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16">
            <Link href="/contact">
              <Button size="lg" className="btn-shimmer btn-ripple w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 group">
                Start Your Project <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button size="lg" variant="outline" className="btn-outline-glow w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 backdrop-blur-sm group">
                View Our Work <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-lg sm:max-w-none mx-auto reveal-zoom-stagger">
            {stats.map((s) => (
              <StatCounter key={s.label} value={s.value} label={s.label} className="text-2xl sm:text-3xl" labelClassName="text-xs" />
            ))}
          </div>
        </div>

        <div className="relative mt-12 flex flex-col items-center gap-2 text-muted-foreground">
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground/50 uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-primary/40 to-primary/60 animate-pulse" />
        </div>
      </section>

      {/* ── TECH STACK MARQUEE ── */}
      <TechStackMarquee />

      {/* ── CAPABILITIES ── */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-10 sm:mb-16 reveal-drift-stagger">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-4">
            <Cpu className="w-3.5 h-3.5" />
            Our Expertise
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground mb-4">
            Everything You Need to <span className="gradient-text">Dominate</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            From concept to deployment, we handle the complete digital stack.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 reveal-cards">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div key={cap.title} className="relative group cursor-pointer rounded-2xl p-5 sm:p-6 border border-border/50 bg-card/50 hover:bg-card hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${cap.gradient} p-0.5 mb-4 sm:mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <div className="w-full h-full rounded-[10px] bg-card flex items-center justify-center">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                  </div>
                </div>
                <h3 className="font-bold text-foreground mb-2 text-base sm:text-lg group-hover:text-primary transition-colors">{cap.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{cap.desc}</p>
                <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r ${cap.gradient} opacity-0 group-hover:opacity-60 transition-opacity duration-500 rounded-b-2xl`} />
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SERVICES PREVIEW ── */}
      {services && services.length > 0 && (
        <section className="py-16 sm:py-20 border-y border-border bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12 reveal-drift-stagger">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-3">
                Our <span className="gradient-text">Services</span>
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">What we offer to help your business grow</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8 sm:mb-10 reveal-cards">
              {services.slice(0, 6).map((service) => {
                const IconComp = iconMap[service.icon] ?? Code2;
                return (
                  <div key={service.id} className="group rounded-xl p-5 border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                      <IconComp className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-1 text-sm sm:text-base">{service.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/50 text-secondary-foreground border border-border">
                      {service.category}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-center reveal">
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
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div className="reveal-left flex flex-col gap-0">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-sm font-medium mb-5 sm:mb-6 w-fit">
              <Globe className="w-3.5 h-3.5" />
              Why SOFTWORKS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-5 sm:mb-6">
              We Don't Just Build Software.
              <span className="gradient-text"> We Build Advantage.</span>
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
              Over 3 years we've developed a track record of delivering complex, enterprise-grade systems on time, at scale, with zero compromise on quality.
            </p>
            <div className="flex flex-col gap-3 reveal-stagger">
              {whyPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm text-muted-foreground group">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                    <CheckCircle className="w-3 h-3 text-primary" />
                  </div>
                  {point}
                </div>
              ))}
            </div>
            <Link href="/contact" className="inline-block mt-6 sm:mt-8">
              <Button size="lg" className="bg-primary hover:bg-primary/90 group w-full sm:w-auto">
                Let's Talk <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 reveal-zoom-stagger">
            {metrics.map((metric) => (
              <div key={metric.label} className="relative rounded-2xl p-5 sm:p-6 text-center overflow-hidden group hover:scale-105 transition-transform duration-300 border border-border bg-card">
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br ${metric.gradient}`} />
                <div className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-2 sm:mb-3 bg-gradient-to-r ${metric.gradient} bg-clip-text text-transparent`}>
                  {metric.value}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground font-medium tracking-wide uppercase">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      {activeTestimonials.length > 0 && (
        <section className="py-16 sm:py-20 border-y border-border bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12 reveal-drift-stagger">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-3">
                What Clients <span className="gradient-text">Say</span>
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">Real feedback from real partners</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 reveal-cards">
              {activeTestimonials.slice(0, 3).map((t) => (
                <div key={t.id} className="rounded-2xl p-5 sm:p-6 border border-border bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
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

      {/* ── PROCESS STEPS ── */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-12 reveal-drift-stagger">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4">
            <Zap className="w-3.5 h-3.5 fill-current" />
            How We Work
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
            From Idea to <span className="gradient-text">Launch</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            A transparent, milestone-driven process that keeps you in control at every step.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 reveal-cards">
          {[
            { step: "01", title: "Discovery", desc: "We map your goals, constraints, and vision in a focused kick-off session.", icon: Lightbulb, color: "from-blue-500 to-indigo-600" },
            { step: "02", title: "Architecture", desc: "Our engineers design a scalable tech blueprint tailored to your needs.", icon: Cpu, color: "from-violet-500 to-purple-600" },
            { step: "03", title: "Build & Iterate", desc: "Agile sprints with weekly demos — you see progress in real time.", icon: Code2, color: "from-cyan-500 to-teal-600" },
            { step: "04", title: "Launch & Scale", desc: "Zero-downtime deployment, monitoring, and 90-day post-launch support.", icon: Rocket, color: "from-emerald-500 to-green-600" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative group rounded-2xl p-6 border border-border/50 bg-card/50 hover:bg-card hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
                <div className="text-5xl font-black text-border/30 mb-4 leading-none group-hover:text-primary/10 transition-colors">{item.step}</div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} p-0.5 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="w-full h-full rounded-[9px] bg-card flex items-center justify-center">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                </div>
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-60 transition-opacity duration-500 rounded-b-2xl`} />
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute inset-0 grid-pattern opacity-15" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-[500px] h-32 sm:h-[250px] bg-primary/20 blur-[60px] sm:blur-[100px] rounded-full" />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4 reveal-drift-stagger">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-5 sm:mb-6">
            <Zap className="w-3.5 h-3.5 fill-current" />
            Ready to get started?
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground mb-5 sm:mb-6">
            Ready to Build Something <span className="gradient-text">Extraordinary?</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-10">
            Join 80+ companies that chose SOFTWORKS to build their competitive advantage.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="btn-shimmer btn-ripple w-full sm:w-auto px-8 sm:px-10 py-5 sm:py-6 text-sm sm:text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 group">
                Start a Project <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button size="lg" variant="outline" className="btn-outline-glow w-full sm:w-auto px-8 sm:px-10 py-5 sm:py-6 text-sm sm:text-base group">
                See Our Work <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

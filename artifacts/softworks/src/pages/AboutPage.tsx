import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useListTeamMembers } from "@workspace/api-client-react";
import { Target, Eye, Heart, Linkedin } from "lucide-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";

const values = [
  { icon: Target, title: "Precision", desc: "Every line of code, every pixel — built with intent and craftsmanship." },
  { icon: Eye, title: "Transparency", desc: "Open communication and clear timelines at every stage of your project." },
  { icon: Heart, title: "Partnership", desc: "We invest in your success as if it were our own business on the line." },
];

export function AboutPage() {
  const ref = useGsapReveal();
  const { data: team, isLoading } = useListTeamMembers({ query: { staleTime: 60000 } });
  const activeTeam = team?.filter((t) => t.isActive);

  return (
    <div ref={ref}>
      <section className="pt-24 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center px-4 hero-enter">
          <Badge variant="outline" className="mb-4 border-accent/30 text-accent bg-accent/10">About Us</Badge>
          <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
            The Studio Behind <span className="gradient-text">The Build</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            SOFTWORKS IT FARM was built on the belief that great software requires great people — focused, principled, and genuinely passionate about the craft.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="reveal-left">
            <h2 className="text-3xl font-black text-foreground mb-6">3+ Years of Shipping What Matters</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              SOFTWORKS IT FARM started with a simple premise: technology should move business forward, not hold it back. We set out to build a studio that combines deep engineering expertise with sharp business understanding.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Today, we're a team of 15+ engineers, designers, and strategists who have collectively shipped 150+ projects across web development, mobile apps, AI automation, SaaS platforms, and digital marketing campaigns.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We work with startups looking to move fast and enterprises looking to modernize — with the same level of dedication and quality on every engagement.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 reveal-right">
            {[
              { val: "3+", label: "Years Operating" },
              { val: "150+", label: "Projects Delivered" },
              { val: "80+", label: "Clients Served" },
              { val: "15+", label: "Expert Team" },
            ].map((s) => (
              <div key={s.label} className="glass border border-border/50 rounded-xl p-6 text-center">
                <div className="text-3xl font-black gradient-text mb-1">{s.val}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-card/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-foreground mb-4">What We Stand For</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 reveal-stagger">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-lg">{v.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">
            Meet the <span className="gradient-text">Team</span>
          </h2>
          <p className="text-muted-foreground">The people who make it happen</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 reveal-stagger">
            {activeTeam?.map((member) => (
              <div key={member.id} className="group gradient-border rounded-xl p-6 text-center hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 ring-2 ring-primary/20">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-foreground mb-1">{member.name}</h3>
                <p className="text-sm text-primary mb-1">{member.role}</p>
                <p className="text-xs text-muted-foreground mb-3">{member.department}</p>
                <div className="flex flex-wrap gap-1 justify-center mb-3">
                  {member.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs py-0">{skill}</Badge>
                  ))}
                </div>
                {member.linkedinUrl && (
                  <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors inline-block">
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        {!isLoading && (!activeTeam || activeTeam.length === 0) && (
          <p className="text-center text-muted-foreground py-20">Team information coming soon.</p>
        )}
      </section>
    </div>
  );
}

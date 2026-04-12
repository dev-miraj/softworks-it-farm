import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListJobs } from "@workspace/api-client-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { MapPin, Clock, Briefcase, Search, ArrowRight, Users, Zap, Heart, Globe } from "lucide-react";

const typeColors: Record<string, string> = {
  "full-time": "bg-green-500/10 text-green-400 border-green-400/20",
  "part-time": "bg-blue-500/10 text-blue-400 border-blue-400/20",
  "contract": "bg-yellow-500/10 text-yellow-400 border-yellow-400/20",
  "internship": "bg-purple-500/10 text-purple-400 border-purple-400/20",
  "remote": "bg-cyan-500/10 text-cyan-400 border-cyan-400/20",
};

const perks = [
  { icon: Globe, label: "Remote First", desc: "Work from anywhere in the world" },
  { icon: Heart, label: "Health Benefits", desc: "Full medical, dental & vision coverage" },
  { icon: Zap, label: "Fast Growth", desc: "Accelerated career progression" },
  { icon: Users, label: "Great Team", desc: "Work with world-class engineers" },
];

export function CareersPage() {
  const ref = useGsapReveal();
  const { data: jobs } = useListJobs();
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");

  const activeJobs = (jobs ?? []).filter(j => j.isActive);
  const departments = ["all", ...new Set(activeJobs.map(j => j.department))];

  const filtered = activeJobs.filter(j => {
    const q = search.toLowerCase();
    const ms = !search || j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q);
    const md = filterDept === "all" || j.department === filterDept;
    return ms && md;
  });

  return (
    <div ref={ref}>
      {/* Hero */}
      <section className="pt-24 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-32 sm:h-48 bg-primary/15 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center px-4 hero-stagger">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10">We're Hiring</Badge>
          <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
            Build the Future <span className="gradient-text">With Us</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join our team of passionate engineers, designers, and innovators building world-class software.
          </p>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" />{activeJobs.length} open positions</span>
            <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />Remote-friendly</span>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="pb-16 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {perks.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="gradient-border rounded-xl p-5 text-center group hover:border-primary/30 transition-colors reveal-up">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground text-sm mb-1">{label}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search positions..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {departments.map(d => (
              <Badge key={d} variant="outline" className={`cursor-pointer transition-colors ${filterDept === d ? "bg-primary/10 text-primary border-primary/30" : "hover:border-primary/20"}`} onClick={() => setFilterDept(d)}>
                {d === "all" ? "All Departments" : d}
              </Badge>
            ))}
          </div>
        </div>

        {/* Job listings */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {activeJobs.length === 0 ? "No open positions at the moment. Check back soon!" : "No positions match your search."}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(job => (
              <div key={job.id} className="gradient-border rounded-xl p-6 group hover:border-primary/30 transition-all duration-200 reveal-up">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-bold text-foreground text-lg">{job.title}</h3>
                      <Badge variant="outline" className={`text-xs capitalize ${typeColors[job.type] ?? ""}`}>{job.type}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{job.department}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.experience}</span>
                      {job.salary && <span className="text-green-400 font-medium">{job.salary}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.requirements.slice(0, 4).map(req => (
                          <Badge key={req} variant="secondary" className="text-xs">{req}</Badge>
                        ))}
                        {job.requirements.length > 4 && <Badge variant="secondary" className="text-xs">+{job.requirements.length - 4} more</Badge>}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col gap-2 items-end">
                    {job.deadline && (
                      <span className="text-xs text-muted-foreground">Deadline: {job.deadline}</span>
                    )}
                    <a href={`mailto:careers@softworks.dev?subject=Application: ${job.title}`}>
                      <Button className="gap-2 group-hover:gap-3 transition-all">
                        Apply Now <ArrowRight className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

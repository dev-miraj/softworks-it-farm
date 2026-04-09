import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Mail, Phone, MapPin, Send } from "lucide-react";
import { useSubmitContact, useListServices } from "@workspace/api-client-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";

export function ContactPage() {
  const ref = useGsapReveal();
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", service: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const { data: services } = useListServices({ query: { staleTime: 60000 } });
  const submitContact = useSubmitContact();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitContact.mutateAsync({ data: form });
    setSubmitted(true);
  };

  return (
    <div ref={ref}>
      <section className="pt-24 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-32 sm:h-48 bg-primary/15 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center px-4 hero-stagger">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10">Contact Us</Badge>
          <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
            Let's Build Something <span className="gradient-text">Together</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tell us about your project and we'll get back to you within 4 hours.
          </p>
        </div>
      </section>

      <section className="pb-24 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="flex flex-col gap-8 reveal-left">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-6">Get In Touch</h2>
              <div className="flex flex-col gap-5">
                {[
                  { icon: Mail, color: "primary", label: "Email", value: "hello@softworks.dev" },
                  { icon: Phone, color: "secondary", label: "Phone", value: "+1 (555) 123-4567" },
                  { icon: MapPin, color: "accent", label: "Location", value: "Remote-first, Global Team" },
                ].map(({ icon: Icon, color, label, value }) => (
                  <div key={label} className="flex items-center gap-4 group">
                    <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center flex-shrink-0 group-hover:bg-${color}/20 group-hover:scale-110 transition-all duration-300`}>
                      <Icon className={`w-5 h-5 text-${color}`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{label}</div>
                      <div className="text-sm text-muted-foreground">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-xl p-6 border border-border/50 reveal-glow">
              <h3 className="font-bold text-foreground mb-4">Why Partner With Us?</h3>
              <div className="flex flex-col gap-3">
                {[
                  "4-hour response guarantee",
                  "Senior engineers on every project",
                  "Full ownership of source code",
                  "90-day post-launch support",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 reveal-right">
            {submitted ? (
              <div className="gradient-border rounded-xl p-12 text-center reveal-zoom">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-foreground mb-3">Message Received!</h2>
                <p className="text-muted-foreground">
                  Thank you for reaching out. Our team will get back to you within 4 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="gradient-border rounded-xl p-8 flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="john@company.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="service">Service of Interest</Label>
                  <Select onValueChange={(val) => setForm({ ...form, service: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services?.map((s) => (
                        <SelectItem key={s.id} value={s.title}>{s.title}</SelectItem>
                      ))}
                      <SelectItem value="other">Other / Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="message">Your Message *</Label>
                  <Textarea
                    id="message"
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your project, timeline, and goals..."
                    className="min-h-32 resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitContact.isPending}
                  className="bg-primary hover:bg-primary/90 self-end px-8 shadow-lg shadow-primary/25"
                >
                  {submitContact.isPending ? "Sending..." : (
                    <>Send Message <Send className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

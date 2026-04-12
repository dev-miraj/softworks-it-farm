import { useState } from "react";
import { useLocation } from "wouter";
import { Terminal, Github, Twitter, Linkedin, Mail, MapPin, Send } from "lucide-react";
import { scrollToTopNow } from "./ScrollToTop";
import { useSubscribeNewsletter } from "@workspace/api-client-react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

function FooterLink({ href, label, children }: { href: string; label?: string; children?: React.ReactNode }) {
  const [, setLocation] = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToTopNow();
    setLocation(href);
  };

  if (href === "#") {
    return (
      <span className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-0.5 inline-block cursor-pointer">
        {children || label}
      </span>
    );
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={children ? "" : "text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-0.5 inline-block"}
    >
      {children || label}
    </a>
  );
}

function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const subscribe = useSubscribeNewsletter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await subscribe.mutateAsync({ data: { email, source: "footer" } });
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="mb-6">
      <h3 className="font-bold text-foreground mb-1 text-sm">Stay Updated</h3>
      <p className="text-xs text-muted-foreground mb-3">Get the latest updates and insights from our team.</p>
      {status === "success" ? (
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <span className="w-4 h-4 rounded-full bg-green-400/20 flex items-center justify-center text-xs">✓</span>
          Subscribed! Thank you.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={e => { setEmail(e.target.value); setStatus("idle"); }}
            placeholder="your@email.com"
            className="flex-1 h-9 px-3 rounded-lg bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors min-w-0"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-60"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
      {status === "error" && <p className="text-xs text-red-400 mt-1">Already subscribed or error occurred.</p>}
    </div>
  );
}

export function Footer() {
  const { logoUrl, siteName } = useSiteSettings();

  return (
    <footer className="bg-background border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-2">
            <FooterLink href="/" label="">
              <div className="inline-flex items-center gap-2.5 text-xl font-black tracking-tighter text-primary mb-4">
                <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center overflow-hidden">
                  {logoUrl
                    ? <img src={logoUrl} alt={siteName} className="w-full h-full object-contain p-0.5" />
                    : <Terminal className="w-4 h-4" />}
                </div>
                <span>{siteName}</span>
              </div>
            </FooterLink>
            <p className="text-muted-foreground text-sm max-w-xs mb-5 leading-relaxed">
              A premium tech studio that moves fast and thinks big. We build digital platforms that signal capability and communicate precision.
            </p>

            {/* Newsletter */}
            <NewsletterBox />

            {/* Contact Info */}
            <div className="flex flex-col gap-2 mb-5">
              <a href="mailto:hello@softworks.dev" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                hello@softworks.dev
              </a>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                Remote-first · Global Team
              </span>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-110">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" aria-label="GitHub" className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-110">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-110">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Company</h3>
            <ul className="flex flex-col gap-2.5">
              {[
                { href: "/about", label: "About Us" },
                { href: "/services", label: "Services" },
                { href: "/portfolio", label: "Portfolio" },
                { href: "/saas", label: "SaaS Products" },
                { href: "/careers", label: "Careers" },
                { href: "/verify-license", label: "License System" },
              ].map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href} label={item.label} />
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Resources</h3>
            <ul className="flex flex-col gap-2.5">
              {[
                { href: "/blog", label: "Blog & Insights" },
                { href: "/faq", label: "FAQ" },
                { href: "/contact", label: "Contact Us" },
                { href: "#", label: "Privacy Policy" },
                { href: "#", label: "Terms of Service" },
              ].map((item) => (
                <li key={item.label}>
                  <FooterLink href={item.href} label={item.label} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-muted-foreground/50">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

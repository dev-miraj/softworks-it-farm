import { Link } from "wouter";
import { Terminal, Github, Twitter, Linkedin, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 text-xl font-black tracking-tighter text-primary mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                <Terminal className="w-4 h-4" />
              </div>
              <span>SOFTWORKS</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs mb-5 leading-relaxed">
              A premium tech studio that moves fast and thinks big. We build digital platforms that signal capability and communicate precision.
            </p>

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
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-0.5 inline-block">
                    {item.label}
                  </Link>
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
                { href: "/contact", label: "Contact Us" },
                { href: "#", label: "Privacy Policy" },
                { href: "#", label: "Terms of Service" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-0.5 inline-block">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} SOFTWORKS IT FARM. All rights reserved.
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

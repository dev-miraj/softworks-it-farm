import { Link, useLocation } from "wouter";
import { Menu, X, Moon, Sun, Terminal, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const { logoUrl, siteName } = useSiteSettings();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location]);

  const links = [
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/saas", label: "SaaS" },
    { href: "/careers", label: "Careers" },
    { href: "/faq", label: "FAQ" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
    { href: "/verify-license", label: "License" },
  ];

  const LogoMark = ({ size = "md" }: { size?: "sm" | "md" }) => {
    const dim = size === "sm" ? "w-7 h-7" : "w-8 h-8";
    const icon = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt={siteName}
          className={`${dim} rounded-xl object-cover border border-primary/25`}
        />
      );
    }
    return (
      <div className={`${dim} rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/25 group-hover:scale-105`}>
        <Terminal className={`${icon} text-primary`} />
      </div>
    );
  };

  return (
    <>
      {/* ── NAV BAR ── */}
      <nav
        className={`nav-bar fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-2xl border-b border-border/60 shadow-lg shadow-black/10"
            : "bg-background/60 backdrop-blur-xl border-b border-white/5"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-black tracking-tighter text-primary shrink-0 group">
            <LogoMark size="md" />
            <span className="text-base sm:text-lg leading-none">{siteName}</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                }`}
              >
                {link.label}
                {location === link.href && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/contact">
              <button className="btn-shimmer relative overflow-hidden flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary/90 active:scale-95">
                Get Started
              </button>
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen((v) => !v)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                isOpen ? "bg-primary/15 text-primary" : "text-foreground hover:bg-muted/60"
              }`}
              aria-label="Open menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE BACKDROP ── */}
      <div
        aria-hidden
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 bg-black/60 backdrop-blur-sm" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ── MOBILE DRAWER ── */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-[280px] flex flex-col md:hidden
          bg-background/98 backdrop-blur-2xl border-l border-border shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent" />

        <div className="flex items-center justify-between px-5 h-16 shrink-0 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <LogoMark size="sm" />
            <span className="font-black tracking-tighter text-primary text-base">{siteName}</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                location === link.href
                  ? "text-primary bg-primary/10 border border-primary/15"
                  : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <span>{link.label}</span>
              {location === link.href && <ChevronRight className="w-4 h-4 text-primary" />}
            </Link>
          ))}
        </nav>

        <div className="shrink-0 p-4 border-t border-border/50 space-y-2">
          <Link href="/contact" onClick={() => setIsOpen(false)}>
            <button className="btn-shimmer relative overflow-hidden w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 active:scale-95">
              Start a Project
            </button>
          </Link>
          <p className="text-center text-[11px] text-muted-foreground/40">Response within 4 hours</p>
        </div>
      </aside>
    </>
  );
}

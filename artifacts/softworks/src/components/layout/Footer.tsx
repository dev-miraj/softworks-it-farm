import { Link } from "wouter";
import { Terminal, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter text-primary mb-4">
              <Terminal className="w-6 h-6" />
              <span>SOFTWORKS</span>
            </Link>
            <p className="text-muted-foreground max-w-sm mb-6">
              A premium tech studio that moves fast and thinks big. We build digital platforms that signal capability and communicate precision.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="flex flex-col gap-3">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/services" className="text-muted-foreground hover:text-primary transition-colors">Services</Link></li>
              <li><Link href="/portfolio" className="text-muted-foreground hover:text-primary transition-colors">Portfolio</Link></li>
              <li><Link href="/saas" className="text-muted-foreground hover:text-primary transition-colors">SaaS Products</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="flex flex-col gap-3">
              <li><Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors">Admin Portal</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SOFTWORKS IT FARM. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Terminal, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import gsap from "gsap";

export function LoginPage() {
  const { isAuthenticated, login } = useAdminAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".login-card",
        { opacity: 0, y: 40, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out" }
      );
      gsap.fromTo(
        ".login-field",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.3, ease: "power2.out" }
      );
      gsap.fromTo(
        ".orb",
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: 1.5, stagger: 0.2, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const ok = await login(username, password);
    if (ok) {
      navigate("/admin");
    } else {
      setError("Invalid credentials. Please check your username and password.");
      gsap.to(cardRef.current, {
        x: [-8, 8, -6, 6, -3, 3, 0],
        duration: 0.4,
        ease: "power1.inOut",
      });
    }
    setLoading(false);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050510] flex items-center justify-center relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="orb absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
      <div className="orb absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl" />
      <div className="orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-3xl" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Login Card */}
      <div
        ref={cardRef}
        className="login-card relative z-10 w-full max-w-md mx-4"
        style={{
          background: "rgba(10, 10, 25, 0.9)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "20px",
          boxShadow: "0 0 60px rgba(99,102,241,0.12), 0 24px 64px rgba(0,0,0,0.6)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />

        <div className="p-8">
          {/* Logo */}
          <div className="login-field flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4"
              style={{ boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}>
              <Terminal className="w-7 h-7 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">SOFTWORKS</h1>
            <p className="text-sm text-zinc-500 mt-1">Admin Panel — Secure Access</p>
          </div>

          {/* Lock icon header */}
          <div className="login-field flex items-center gap-2 mb-6">
            <div className="flex-1 h-px bg-border/30" />
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium uppercase tracking-wider">
              <Lock className="w-3 h-3" />
              Restricted Area
            </div>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="login-field flex flex-col gap-1.5">
              <Label htmlFor="username" className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500/60 h-11"
                required
              />
            </div>

            <div className="login-field flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500/60 h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-field flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="login-field h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm mt-1"
              style={{ boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : (
                "Sign In to Admin Panel"
              )}
            </Button>
          </form>

          <p className="login-field text-center text-xs text-zinc-600 mt-6">
            Protected by SOFTWORKS Security · Unauthorized access is prohibited
          </p>
        </div>

        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
      </div>
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  Shield,
  Wallet,
  Smartphone,
  ArrowRight,
  Users,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Lock,
  Sparkles,
} from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";
import { LoginDropdown } from "@/components/login-dropdown";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Floating Blobs - Global Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="blob blob-1 w-[600px] h-[600px] bg-primary/15 -top-40 -left-40" />
        <div className="blob blob-2 w-[500px] h-[500px] bg-info/10 top-1/3 -right-40" />
        <div className="blob blob-3 w-[400px] h-[400px] bg-secondary/10 -bottom-20 left-1/3" />
      </div>

      {/* Header - Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 dark:bg-gray-950/85 backdrop-blur-xl shadow-sm border-b border-black/5 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-20 lg:h-24">
            {/* Logo — larger image + bigger text + tagline */}
            <Link href="/" className="flex items-center gap-3.5 sm:gap-4 shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-white dark:bg-white/10 shadow-md ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="IFFE SACCO Logo"
                  className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 object-contain"
                />
              </div>
              <div className="leading-tight">
                <span className="text-xl sm:text-2xl lg:text-[1.7rem] font-extrabold tracking-tight text-text">
                  IFFE <span className="text-primary">SACCO</span>
                </span>
                <p className="hidden sm:block text-[10px] sm:text-[11px] lg:text-xs font-medium text-text-muted tracking-widest uppercase mt-0.5">
                  Empowering Financial Freedom
                </p>
              </div>
            </Link>

            {/* Nav links — larger text + more spacing */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {["Home", "About Us", "Services", "Contact"].map((item) => (
                <a
                  key={item}
                  href={`#${item === "About Us" ? "about" : item === "Services" ? "services" : item.toLowerCase()}`}
                  className="px-5 py-2.5 text-[15px] font-medium text-text-muted hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* CTA — larger button */}
            <div className="hidden lg:flex items-center gap-4">
              <LoginDropdown />
            </div>

            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-36 lg:pt-48 pb-20 lg:pb-36 relative overflow-hidden mesh-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="glass-subtle inline-flex items-center gap-2 px-5 py-2.5 text-primary text-sm font-semibold rounded-full mb-8">
                <Sparkles className="w-4 h-4" />
                Trusted by 1,000+ members
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-text leading-[1.1] tracking-tight">
                Financial Freedom{" "}
                <span className="text-primary relative inline-block">
                  Within Your Reach
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 10C50 4 100 2 150 4C200 6 250 3 298 8" stroke="#F1C40F" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="mt-8 text-lg text-text-muted leading-relaxed max-w-lg">
                Experience the power of a modern SACCO. Secure savings, affordable loans, and a community dedicated to your growth.
              </p>
              <div className="flex flex-wrap gap-4 mt-10">
                <Link href="/register" className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-2xl shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1">
                  Open Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#about" className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-text glass rounded-2xl hover:bg-white/80 hover:-translate-y-0.5">
                  Learn More
                </a>
              </div>

              {/* Stats Row - Glass */}
              <div className="glass-card flex items-center gap-6 sm:gap-8 mt-14 p-6 rounded-2xl max-w-lg">
                {[
                  { value: "USh 2.5B+", label: "Total Savings" },
                  { value: "1,000+", label: "Members" },
                  { value: "98%", label: "Satisfaction" },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-6 sm:gap-8">
                    {i > 0 && <div className="w-px h-10 bg-border/50" />}
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-text">{stat.value}</div>
                      <div className="text-xs text-text-muted">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Card - Glass Dashboard Preview */}
            <div className="hidden lg:block relative">
              <div className="glass-card rounded-3xl p-6 relative">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-danger/80" />
                  <div className="w-3 h-3 rounded-full bg-warning/80" />
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                  <span className="ml-3 text-xs text-text-muted font-medium">IFFE Dashboard</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-text-muted">Total Balance</div>
                      <div className="text-xl font-bold text-text">USh 4,250,000</div>
                    </div>
                    <div className="text-sm font-semibold text-success bg-success/10 px-3 py-1 rounded-full">+12.5%</div>
                  </div>
                  <div className="h-px bg-white/40" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-subtle rounded-2xl p-4">
                      <div className="text-xs text-text-muted mb-1">Savings</div>
                      <div className="text-lg font-bold text-primary">USh 2.8M</div>
                      <div className="mt-3 h-2 bg-primary/15 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-primary to-primary-light rounded-full" />
                      </div>
                    </div>
                    <div className="glass-subtle rounded-2xl p-4">
                      <div className="text-xs text-text-muted mb-1">Loan Balance</div>
                      <div className="text-lg font-bold text-secondary">USh 1.4M</div>
                      <div className="mt-3 h-2 bg-secondary/15 rounded-full overflow-hidden">
                        <div className="h-full w-1/2 bg-gradient-to-r from-secondary to-secondary-light rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="glass-subtle flex items-center gap-3 rounded-2xl p-4">
                    <Lock className="w-5 h-5 text-success" />
                    <span className="text-sm text-success font-medium">Your account is secured with 2FA</span>
                  </div>
                </div>
              </div>
              <div className="absolute -top-5 -right-5 w-20 h-20 bg-gradient-to-br from-secondary to-yellow-500 rounded-2xl flex items-center justify-center shadow-xl shadow-secondary/30 rotate-12">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 glass rounded-2xl flex items-center justify-center -rotate-6 shadow-lg">
                <Shield className="w-7 h-7 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features / About Section */}
      <section id="about" className="py-20 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="glass-subtle inline-flex items-center gap-2 px-5 py-2.5 text-primary text-sm font-semibold rounded-full mb-4">Why Choose Us</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text">Why Choose IFFE?</h2>
            <p className="mt-4 text-text-muted text-lg">We combine traditional cooperative values with modern technology.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Wallet, title: "Secure Savings", desc: "Your future is safe with us. Flexible savings plans designed to help you reach your goals faster.", gradient: "from-primary/20 to-primary/5", text: "text-primary" },
              { icon: TrendingUp, title: "Affordable Loans", desc: "Low interest rates and easy repayment terms. We fuel your business and personal growth.", gradient: "from-secondary/20 to-secondary/5", text: "text-secondary" },
              { icon: Smartphone, title: "Digital Banking", desc: "Access your money 24/7. Our online portals ensure you are always in control, wherever you are.", gradient: "from-info/20 to-info/5", text: "text-info" },
            ].map((feature) => (
              <div key={feature.title} className="group glass-card rounded-3xl p-8 hover:-translate-y-2 cursor-default">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-7 h-7 ${feature.text}`} />
                </div>
                <h3 className="text-xl font-bold text-text mb-3">{feature.title}</h3>
                <p className="text-text-muted leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals / Services Section */}
      <section id="services" className="py-20 lg:py-32 mesh-gradient relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="glass-subtle inline-flex items-center gap-2 px-5 py-2.5 text-primary text-sm font-semibold rounded-full mb-4">Access Portals</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text">Our Portals</h2>
            <p className="mt-4 text-text-muted text-lg">Seamless access for every stakeholder.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Admin Portal", desc: "Manage system operations, users, and reports.", gradient: "from-primary to-primary-dark", portal: "admin" },
              { icon: Users, title: "Member Portal", desc: "Check balances, request loans, and track savings.", gradient: "from-info to-blue-700", portal: "member" },
              { icon: Briefcase, title: "Staff Portal", desc: "Process requests and manage member services.", gradient: "from-accent to-gray-800", portal: "staff" },
            ].map((portal) => (
              <Link key={portal.title} href={`/login?portal=${portal.portal}`} className="group glass-card rounded-3xl overflow-hidden hover:-translate-y-2">
                <div className={`h-1.5 bg-gradient-to-r ${portal.gradient}`} />
                <div className="p-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${portal.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <portal.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-text mb-2">{portal.title}</h3>
                  <p className="text-text-muted mb-6">{portal.desc}</p>
                  <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                    Login <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner - Glass over gradient */}
      <section className="py-20 bg-gradient-to-r from-primary via-primary-dark to-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: "1,000+", label: "Active Members" },
              { value: "USh 2.5B", label: "Total Savings" },
              { value: "500+", label: "Loans Disbursed" },
              { value: "12+", label: "Years of Service" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="text-3xl lg:text-4xl font-extrabold text-white">{stat.value}</div>
                <div className="text-sm text-white/70 mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-12 lg:p-16 relative overflow-hidden shadow-2xl shadow-primary/20">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
            <div className="absolute inset-0 backdrop-blur-[1px]" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Join?</h2>
              <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">Become part of a growing community dedicated to financial success.</p>
              <Link href="/register" className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-primary bg-white rounded-2xl hover:bg-white/90 shadow-xl hover:-translate-y-1">
                Create an Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Glass Dark */}
      <footer id="contact" className="glass-dark text-white pt-16 pb-8 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-3 gap-12 lg:gap-20 pb-12 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                  <img src="/logo.png" alt="IFFE SACCO" className="w-9 h-9 object-contain" />
                </div>
                <span className="text-xl font-bold">IFFE SACCO</span>
              </div>
              <p className="text-white/60 leading-relaxed">Empowering financial freedom through community and innovation. Building a better future, one member at a time.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {["Home", "About", "Services", "Login"].map((link) => (
                  <li key={link}>
                    <a href={link === "Login" ? "/login" : `#${link.toLowerCase()}`} className="text-white/60 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-6">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><MapPin className="w-4 h-4 text-primary" /></div>
                  <span className="text-white/60">Jinja City, Uganda</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Phone className="w-4 h-4 text-primary" /></div>
                  <a href="tel:+256782894875" className="text-white/60 hover:text-white">+256 782 894 875</a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Mail className="w-4 h-4 text-primary" /></div>
                  <a href="mailto:bdfsocial.selfhelp@gmail.com" className="text-white/60 hover:text-white">bdfsocial.selfhelp@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 text-center">
            <p className="text-sm text-white/30">&copy; 2026 IFFE SACCO. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

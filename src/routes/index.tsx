import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ShieldCheck,
  Users,
  Store,
  Package,
  ClipboardList,
  Sparkles,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  ScrollText,
  Wallet,
  TicketCheck,
  BellRing,
} from "lucide-react";
import { ensureDefaultAdmin } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Ration Management System — Digital Public Distribution" },
      { name: "description", content: "A modern Smart Ration Management System that digitizes the Public Distribution System — manage ration shops, users, products, tokens and monthly distribution transparently." },
      { property: "og:title", content: "Smart Ration Management System" },
      { property: "og:description", content: "Digital PDS platform for admins, citizens and shop keepers." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    // Bootstrap default admin (idempotent)
    ensureDefaultAdmin().catch(() => {});
  }, []);

  useEffect(() => {
    if (user && role) {
      if (role === "admin") navigate({ to: "/admin" });
      else if (role === "shopkeeper") navigate({ to: "/shop" });
      else navigate({ to: "/user" });
    }
  }, [user, role, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <a href="#top" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-hero text-primary-foreground">
              <ScrollText className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight">SmartRation</span>
          </a>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#services" className="hover:text-foreground">Services</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
          <Link to="/login/user">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden bg-gradient-hero">
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-primary-foreground md:py-28">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Digital Public Distribution System
            </div>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Ration made simple.<br />Transparent. Paperless.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-primary-foreground/85">
              A unified platform for citizens, shop keepers and administrators to manage
              ration cards, monthly distribution, stock and complaints — securely and in real time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#login">
                <Button size="lg" variant="secondary">
                  Sign in <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </a>
              <a href="#features">
                <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10">
                  Learn more
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* LOGIN CARDS */}
      <section id="login" className="mx-auto -mt-14 max-w-7xl px-4">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: "Admin Login", desc: "Manage the entire system — users, shops, products, approvals.", icon: ShieldCheck, to: "/login/admin", tone: "from-indigo-600 to-indigo-800" },
            { title: "User Login", desc: "Citizens sign in with email or ration card number.", icon: Users, to: "/login/user", tone: "from-amber-500 to-orange-600" },
            { title: "Shop Keeper Login", desc: "Issue monthly products, verify users, update stock.", icon: Store, to: "/login/shopkeeper", tone: "from-emerald-600 to-teal-700" },
          ].map((c) => (
            <Card key={c.title} className="group relative overflow-hidden p-6 shadow-elegant transition-transform hover:-translate-y-1">
              <div className={`mb-4 inline-grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br ${c.tone} text-white`}>
                <c.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              <Link to={c.to} className="mt-4 inline-block">
                <Button className="w-full">Continue</Button>
              </Link>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          New citizen?{" "}
          <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Register here
          </Link>
        </p>
      </section>

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">About the platform</h2>
            <p className="mt-4 text-muted-foreground">
              SmartRation digitizes every step of the Public Distribution System.
              We replace queues, paperwork and manual registers with clear digital
              workflows — so citizens receive their entitlements on time and
              administrators have complete visibility into the supply chain.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { k: "10×", v: "Faster distribution" },
                { k: "100%", v: "Paperless workflow" },
                { k: "24/7", v: "Citizen access" },
                { k: "Real-time", v: "Stock visibility" },
              ].map((s) => (
                <div key={s.v} className="rounded-lg border bg-card p-4">
                  <div className="text-2xl font-bold text-primary">{s.k}</div>
                  <div className="text-sm text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-card p-8 shadow-soft">
            <ScrollText className="mb-4 h-10 w-10 text-primary" />
            <h3 className="text-xl font-semibold">Digital Ration Card</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Every registered citizen receives a downloadable digital ration card,
              linked to a unique card number. Book tokens, track distribution and
              view purchase history from a single dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-y bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Everything you need</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            A complete toolkit for every role in the distribution chain.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { i: Package, t: "Product management", d: "Photograph, categorize and track every commodity with monthly quotas." },
              { i: ClipboardList, t: "Card & address requests", d: "Citizens apply online, admins approve in one click." },
              { i: TicketCheck, t: "Token system", d: "Book monthly tokens, avoid queues, track collection status live." },
              { i: Wallet, t: "Digital receipts", d: "Instant receipts for every purchase — no more paper trails." },
              { i: BellRing, t: "Announcements", d: "Broadcast schemes, holidays and stock alerts to all citizens." },
              { i: ShieldCheck, t: "Secure & audited", d: "Role-based access, row-level security, complete audit trail." },
            ].map((f) => (
              <Card key={f.t} className="p-6">
                <f.i className="mb-3 h-8 w-8 text-primary" />
                <h3 className="text-base font-semibold">{f.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-3xl font-bold md:text-4xl">Benefits</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { t: "For citizens", d: "No queues, no paperwork. View entitlements and history any time." },
            { t: "For shop keepers", d: "One-tap verification, automatic stock updates, printable receipts." },
            { t: "For administrators", d: "Live dashboards, complaint resolution, monthly reports." },
          ].map((b) => (
            <Card key={b.t} className="bg-gradient-card p-6">
              <h3 className="text-lg font-semibold">{b.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="border-y bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold md:text-4xl">Services offered</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              "New ration card application & approval",
              "Address change requests",
              "Monthly product distribution tracking",
              "Digital ration card download",
              "Token booking & tracking",
              "Complaints & grievance redressal",
              "Real-time stock updates across shops",
              "Public announcements & scheme notifications",
            ].map((s) => (
              <div key={s} className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">✓</div>
                <span className="text-sm">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-4xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="mt-8">
          {[
            { q: "Who can register on this platform?", a: "Only citizens can register. Admin accounts are pre-configured and shop keeper accounts are created by the administrator." },
            { q: "How do I log in as a user?", a: "Use your registered email or your ration card number, along with your password, at the User Login page." },
            { q: "How are ration cards approved?", a: "Submit an application from your dashboard. Administrators review and approve requests, then a card number is issued." },
            { q: "Can I download my digital ration card?", a: "Yes — signed-in users can view and download their digital ration card any time from the User Dashboard." },
            { q: "How is my data protected?", a: "The platform uses role-based access, row-level security in the database and encrypted transport for every request." },
          ].map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CONTACT */}
      <section id="contact" className="border-t bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold md:text-4xl">Contact</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <MapPin className="mb-3 h-6 w-6 text-primary" />
              <div className="font-semibold">Head Office</div>
              <p className="mt-1 text-sm text-muted-foreground">Ministry of Consumer Affairs, Food & Public Distribution, New Delhi</p>
            </Card>
            <Card className="p-6">
              <Mail className="mb-3 h-6 w-6 text-primary" />
              <div className="font-semibold">Email</div>
              <p className="mt-1 text-sm text-muted-foreground">support@smartration.gov.in</p>
            </Card>
            <Card className="p-6">
              <Phone className="mb-3 h-6 w-6 text-primary" />
              <div className="font-semibold">Helpline</div>
              <p className="mt-1 text-sm text-muted-foreground">1800-11-0841 (Toll-free, 24×7)</p>
            </Card>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-background py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} Smart Ration Management System. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ScrollText, LogOut } from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function DashboardLayout({
  role,
  title,
  nav,
  tone,
}: {
  role: AppRole;
  title: string;
  nav: NavItem[];
  tone: string;
}) {
  const { user, role: currentRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: role === "admin" ? "/login/admin" : role === "shopkeeper" ? "/login/shopkeeper" : "/login/user" });
      return;
    }
    if (currentRole !== role) {
      toast.error("You don't have access to this area");
      navigate({ to: "/" });
    }
  }, [user, currentRole, role, loading, navigate]);

  if (loading || !user || currentRole !== role) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  const onLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
      <aside className={`hidden bg-sidebar text-sidebar-foreground md:flex md:flex-col`}>
        <div className={`flex items-center gap-2 border-b border-sidebar-border p-5`}>
          <div className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${tone} text-white`}>
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">SmartRation</div>
            <div className="text-xs opacity-70">{title}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => {
            const active = path === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Button variant="ghost" onClick={onLogout} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/" className="text-sm font-semibold">SmartRation</Link>
          </div>
          <div className="hidden text-sm text-muted-foreground md:block">{user.email}</div>
          <Button variant="ghost" size="sm" onClick={onLogout} className="md:hidden">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

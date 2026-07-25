import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { TicketCheck, PackageCheck, Boxes, Receipt } from "lucide-react";

export const Route = createFileRoute("/shop/")({ component: ShopHome });

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ShopHome() {
  const { profile } = useAuth();
  const shopId = profile?.shop_id;
  const month = currentMonth();

  const { data } = useQuery({
    queryKey: ["shop-home", shopId, month],
    enabled: !!shopId,
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [tokens, issued, purchases] = await Promise.all([
        supabase.from("tokens").select("*", { count: "exact", head: true }).eq("shop_id", shopId!).gte("booked_at", today.toISOString()),
        supabase.from("tokens").select("*", { count: "exact", head: true }).eq("shop_id", shopId!).eq("status", "collected").gte("collected_at", today.toISOString()),
        supabase.from("purchases").select("total").eq("shop_id", shopId!).eq("month", month),
      ]);
      const total = (purchases.data ?? []).reduce((s, r: any) => s + Number(r.total), 0);
      return { today: tokens.count ?? 0, issued: issued.count ?? 0, monthTotal: total, monthCount: purchases.data?.length ?? 0 };
    },
  });

  const tiles = [
    { to: "/shop/tokens", label: `Today's tokens (${data?.today ?? 0})`, icon: TicketCheck, tone: "from-indigo-500 to-indigo-700" },
    { to: "/shop/issue", label: "Issue products", icon: PackageCheck, tone: "from-emerald-500 to-teal-700" },
    { to: "/shop/stock", label: "Update stock", icon: Boxes, tone: "from-amber-500 to-orange-600" },
    { to: "/shop/receipts", label: `This month: ${data?.monthCount ?? 0} receipts`, icon: Receipt, tone: "from-rose-500 to-red-600" },
  ] as const;

  if (!shopId) {
    return (
      <>
        <PageHeader title="Shop Portal" />
        <Card className="p-6"><p className="text-sm text-muted-foreground">Your account is not linked to a shop yet. Contact admin.</p></Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Shop Overview" subtitle={`Month: ${month} • Distribution total: ₹${(data?.monthTotal ?? 0).toFixed(2)}`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to as any}>
            <Card className="p-5 transition hover:shadow-md">
              <div className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br ${t.tone} text-white`}>
                <t.icon className="h-5 w-5" />
              </div>
              <div className="font-semibold">{t.label}</div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

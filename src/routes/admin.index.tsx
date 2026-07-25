import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard-layout";
import { Users, Store, MapPin, Boxes, ClipboardCheck, Package } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number | string; tone: string }) {
  return (
    <Card className="p-5">
      <div className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br ${tone} text-white`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </Card>
  );
}

async function fetchStats() {
  const [users, keepers, shops, stock, tokens, requests] = await Promise.all([
    supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "user"),
    supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "shopkeeper"),
    supabase.from("shops").select("*", { count: "exact", head: true }),
    supabase.from("products").select("stock").eq("status", "available"),
    supabase.from("tokens").select("*", { count: "exact", head: true }),
    supabase.from("ration_card_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const availableStock = (stock.data ?? []).reduce((s, r: any) => s + Number(r.stock ?? 0), 0);
  return {
    users: users.count ?? 0,
    keepers: keepers.count ?? 0,
    shops: shops.count ?? 0,
    availableStock,
    tokens: tokens.count ?? 0,
    pending: requests.count ?? 0,
  };
}

function AdminDashboard() {
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: fetchStats });
  return (
    <>
      <PageHeader title="Overview" subtitle="Live snapshot of the ration distribution system." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Total Users" value={data?.users ?? "—"} tone="from-indigo-500 to-indigo-700" />
        <StatCard icon={Store} label="Shop Keepers" value={data?.keepers ?? "—"} tone="from-emerald-500 to-teal-700" />
        <StatCard icon={MapPin} label="Ration Shops" value={data?.shops ?? "—"} tone="from-amber-500 to-orange-600" />
        <StatCard icon={Boxes} label="Available Stock" value={data?.availableStock ?? "—"} tone="from-sky-500 to-blue-700" />
        <StatCard icon={Package} label="Monthly Distribution" value={data?.tokens ?? "—"} tone="from-fuchsia-500 to-purple-700" />
        <StatCard icon={ClipboardCheck} label="Pending Requests" value={data?.pending ?? "—"} tone="from-rose-500 to-red-700" />
      </div>
    </>
  );
}

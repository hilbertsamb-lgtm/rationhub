import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/shop/report")({ component: ShopReport });

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ShopReport() {
  const { profile } = useAuth();
  const shopId = profile?.shop_id;
  const month = currentMonth();

  const { data } = useQuery({
    queryKey: ["shop-report", shopId, month],
    enabled: !!shopId,
    queryFn: async () => {
      const { data } = await supabase.from("purchases").select("total, items").eq("shop_id", shopId!).eq("month", month);
      const receipts = data?.length ?? 0;
      const total = (data ?? []).reduce((s, r: any) => s + Number(r.total), 0);
      const items: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        (r.items ?? []).forEach((it: any) => {
          items[it.name] = (items[it.name] ?? 0) + Number(it.quantity);
        });
      });
      return { receipts, total, items };
    },
  });

  return (
    <>
      <PageHeader title={`Monthly Report • ${month}`} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Receipts</div>
          <div className="text-3xl font-bold">{data?.receipts ?? 0}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Total sales</div>
          <div className="text-3xl font-bold">₹{(data?.total ?? 0).toFixed(2)}</div>
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <h3 className="mb-3 font-semibold">Products distributed</h3>
        <div className="space-y-2">
          {Object.entries(data?.items ?? {}).map(([name, qty]) => (
            <div key={name} className="flex items-center justify-between border-b pb-1 text-sm last:border-0">
              <span>{name}</span>
              <span className="font-mono">{qty}</span>
            </div>
          ))}
          {!Object.keys(data?.items ?? {}).length && <p className="text-sm text-muted-foreground">No distribution this month.</p>}
        </div>
      </Card>
    </>
  );
}

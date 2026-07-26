import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/user/tokens")({ component: UserTokens });

const STATUS_LABEL: Record<string, string> = {
  waiting: "Waiting",
  called: "Called",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
  booked: "Waiting",
  collected: "Completed",
  expired: "Cancelled",
};

const ACTIVE_STATUSES = ["waiting", "called", "processing", "booked"] as const;

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "completed" || s === "collected") return "default";
  if (s === "cancelled" || s === "expired") return "destructive";
  if (s === "called" || s === "processing") return "outline";
  return "secondary";
}

function UserTokens() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["my-tokens", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase
        .from("tokens")
        .select("*, shops:shop_id(name, code)")
        .eq("user_id", user!.id)
        .order("booked_at", { ascending: false })).data ?? [],
  });

  // queue-position: fetch same-day active tokens per shop, ordered by booked_at
  const { data: queues } = useQuery({
    queryKey: ["queue-positions", user?.id, (data ?? []).map((t: any) => t.id).join(",")],
    enabled: !!data?.length,
    queryFn: async () => {
      const active = (data ?? []).filter((t: any) => ACTIVE_STATUSES.includes(t.status));
      const map: Record<string, number> = {};
      for (const t of active) {
        const day = new Date(t.booked_at);
        const start = new Date(day); start.setHours(0, 0, 0, 0);
        const end = new Date(day); end.setHours(23, 59, 59, 999);
        const { data: ahead } = await supabase
          .from("tokens")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", t.shop_id)
          .in("status", [...ACTIVE_STATUSES])
          .lt("booked_at", t.booked_at)
          .gte("booked_at", start.toISOString())
          .lte("booked_at", end.toISOString());
        map[t.id] = ahead === null ? 0 : (ahead as any) ?? 0;
        // Supabase head+count returns count in response
      }
      return map;
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("user-tokens")
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["my-tokens"] });
        qc.invalidateQueries({ queryKey: ["queue-positions"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  return (
    <>
      <PageHeader title="Track Tokens" subtitle="Live status of your ration tokens." />
      <div className="space-y-3">
        {(data ?? []).map((t: any) => {
          const active = ACTIVE_STATUSES.includes(t.status);
          const pos = queues?.[t.id];
          const items = Array.isArray(t.items) ? t.items : [];
          return (
            <Card key={t.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-xl font-semibold">{t.token_number}</div>
                  <div className="text-sm text-muted-foreground">
                    {t.shops?.name} {t.shops?.code ? `• ${t.shops.code}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Booked: {t.booked_at ? new Date(t.booked_at).toLocaleString() : "—"}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={statusVariant(t.status)}>{STATUS_LABEL[t.status] ?? t.status}</Badge>
                  {active && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {pos === undefined ? "Calculating queue…" : pos === 0 ? "You're next" : `${pos} people ahead of you`}
                    </div>
                  )}
                  {t.payment_status && (
                    <div className="mt-1 text-xs">
                      Payment: <span className="font-medium">{t.payment_status}</span>
                      {t.total ? ` • ₹${Number(t.total).toFixed(2)}` : ""}
                    </div>
                  )}
                </div>
              </div>
              {items.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Items</div>
                  <div className="grid gap-1 text-sm sm:grid-cols-2">
                    {items.map((it: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span>{it.name} × {it.quantity} {it.unit}</span>
                        <span>₹{(Number(it.price) * Number(it.quantity)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {!data?.length && <div className="py-10 text-center text-sm text-muted-foreground">No tokens booked yet.</div>}
      </div>
    </>
  );
}

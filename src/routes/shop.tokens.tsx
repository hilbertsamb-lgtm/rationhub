import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/tokens")({ component: ShopTokens });

type Status = "waiting" | "called" | "processing" | "completed" | "cancelled";

const LABEL: Record<string, string> = {
  waiting: "Waiting", called: "Called", processing: "Processing",
  completed: "Completed", cancelled: "Cancelled",
  booked: "Waiting", collected: "Completed", expired: "Cancelled",
};

const NEXT: Record<string, Status | null> = {
  waiting: "called",
  booked: "called",
  called: "processing",
  processing: "completed",
  completed: null,
  cancelled: null,
};

function variant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "completed" || s === "collected") return "default";
  if (s === "cancelled" || s === "expired") return "destructive";
  if (s === "called" || s === "processing") return "outline";
  return "secondary";
}

function ShopTokens() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const shopId = profile?.shop_id;

  const { data } = useQuery({
    queryKey: ["shop-tokens", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data: tokens } = await supabase
        .from("tokens")
        .select("*")
        .eq("shop_id", shopId!)
        .gte("booked_at", today.toISOString())
        .order("booked_at");
      const ids = (tokens ?? []).map((t) => t.user_id);
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name, ration_card_number, mobile").in("id", ids)
        : { data: [] as any[] };
      const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      return (tokens ?? []).map((t: any) => ({ ...t, profile: map.get(t.user_id) }));
    },
  });

  useEffect(() => {
    if (!shopId) return;
    const ch = supabase
      .channel("shop-tokens-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens", filter: `shop_id=eq.${shopId}` }, () => {
        qc.invalidateQueries({ queryKey: ["shop-tokens"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [shopId, qc]);

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("tokens").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(`Token marked ${LABEL[v.status]}`);
      qc.invalidateQueries({ queryKey: ["shop-tokens"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const active = (data ?? []).filter((t: any) => !["completed", "cancelled", "collected", "expired"].includes(t.status));
  const done = (data ?? []).filter((t: any) => ["completed", "cancelled", "collected", "expired"].includes(t.status));

  const renderCard = (t: any, index?: number) => {
    const items = Array.isArray(t.items) ? t.items : [];
    const next = NEXT[t.status];
    return (
      <Card key={t.id} className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {typeof index === "number" && (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {index + 1}
                </span>
              )}
              <div className="font-mono text-lg font-semibold">{t.token_number}</div>
              <Badge variant={variant(t.status)}>{LABEL[t.status] ?? t.status}</Badge>
              <Badge variant={t.payment_status === "paid" ? "default" : "secondary"}>
                {t.payment_status === "paid" ? "Paid" : t.payment_status ?? "—"}
              </Badge>
            </div>
            <div className="mt-1 text-sm">{t.profile?.full_name} • {t.profile?.ration_card_number}</div>
            <div className="text-xs text-muted-foreground">
              Mobile: {t.profile?.mobile ?? "—"} • Booked: {new Date(t.booked_at).toLocaleString()}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {next && (
              <Button size="sm" onClick={() => update.mutate({ id: t.id, status: next })} disabled={update.isPending}>
                Mark {LABEL[next]}
              </Button>
            )}
            {!["completed", "cancelled", "collected", "expired"].includes(t.status) && (
              <Button size="sm" variant="outline" onClick={() => update.mutate({ id: t.id, status: "cancelled" })}>
                Cancel
              </Button>
            )}
          </div>
        </div>
        {items.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Products</div>
            <div className="grid gap-1 text-sm sm:grid-cols-2">
              {items.map((it: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span>{it.name} × {it.quantity} {it.unit}</span>
                  <span>₹{(Number(it.price) * Number(it.quantity)).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold">
              <span>Total</span>
              <span>₹{Number(t.total ?? 0).toFixed(2)}</span>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <>
      <PageHeader title="Today's Tokens" subtitle="Live queue of booked users for today." />
      <div className="mb-3 text-sm font-medium">Queue ({active.length})</div>
      <div className="space-y-3">
        {active.map((t: any, i: number) => renderCard(t, i))}
        {!active.length && <div className="py-6 text-center text-sm text-muted-foreground">No active tokens in queue.</div>}
      </div>
      {done.length > 0 && (
        <>
          <div className="mt-6 mb-3 text-sm font-medium">Completed / Cancelled</div>
          <div className="space-y-3">{done.map((t: any) => renderCard(t))}</div>
        </>
      )}
    </>
  );
}

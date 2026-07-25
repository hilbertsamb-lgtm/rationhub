import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/tokens")({ component: ShopTokens });

function ShopTokens() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const shopId = profile?.shop_id;

  const { data } = useQuery({
    queryKey: ["shop-tokens", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data: tokens } = await supabase.from("tokens").select("*").eq("shop_id", shopId!).gte("booked_at", today.toISOString()).order("booked_at");
      const ids = (tokens ?? []).map((t) => t.user_id);
      const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, full_name, ration_card_number, mobile").in("id", ids) : { data: [] as any[] };
      const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      return (tokens ?? []).map((t: any) => ({ ...t, profile: map.get(t.user_id) }));
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("tokens").update({ status: "cancelled" }).eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Cancelled"); qc.invalidateQueries({ queryKey: ["shop-tokens"] }); },
  });

  return (
    <>
      <PageHeader title="Today's Tokens" />
      <div className="space-y-3">
        {(data ?? []).map((t: any) => (
          <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="font-mono text-lg font-semibold">{t.token_number}</div>
              <div className="text-sm">{t.profile?.full_name} • {t.profile?.ration_card_number}</div>
              <div className="text-xs text-muted-foreground">Mobile: {t.profile?.mobile ?? "—"} • Booked: {new Date(t.booked_at).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{t.status}</Badge>
              {t.status === "booked" && <Button size="sm" variant="outline" onClick={() => cancel.mutate(t.id)}>Cancel</Button>}
            </div>
          </Card>
        ))}
        {!data?.length && <div className="py-10 text-center text-sm text-muted-foreground">No tokens today.</div>}
      </div>
    </>
  );
}

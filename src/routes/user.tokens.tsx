import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/user/tokens")({ component: UserTokens });

function UserTokens() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["my-tokens", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("tokens").select("*, shops:shop_id(name, code)").eq("user_id", user!.id).order("booked_at", { ascending: false })).data ?? [],
  });

  return (
    <>
      <PageHeader title="Track Tokens" />
      <div className="space-y-3">
        {(data ?? []).map((t: any) => (
          <Card key={t.id} className="flex items-center justify-between p-4">
            <div>
              <div className="font-mono text-lg font-semibold">{t.token_number}</div>
              <div className="text-sm text-muted-foreground">{t.shops?.name} • {t.month}{t.booked_at ? ` • ${new Date(t.booked_at).toLocaleString()}` : ""}</div>
            </div>
            <Badge variant={t.status === "issued" ? "default" : t.status === "cancelled" ? "destructive" : "secondary"}>{t.status}</Badge>
          </Card>
        ))}
        {!data?.length && <div className="py-10 text-center text-sm text-muted-foreground">No tokens booked yet.</div>}
      </div>
    </>
  );
}

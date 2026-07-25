import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/user/notifications")({ component: UserNotifications });

function UserNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const markRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user!.id).eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <>
      <PageHeader title="Notifications" actions={<Button variant="outline" onClick={() => markRead.mutate()}>Mark all read</Button>} />
      <div className="space-y-2">
        {(data ?? []).map((n: any) => (
          <Card key={n.id} className={`p-4 ${!n.read ? "border-primary/40" : ""}`}>
            <div className="text-sm">{n.message}</div>
            <div className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
          </Card>
        ))}
        {!data?.length && <div className="py-10 text-center text-sm text-muted-foreground">No notifications.</div>}
      </div>
    </>
  );
}

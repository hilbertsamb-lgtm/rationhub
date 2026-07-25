import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/card-requests")({ component: AdminCardRequests });

function AdminCardRequests() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["card-requests"],
    queryFn: async () =>
      (await supabase.from("ration_card_requests").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const decide = useMutation({
    mutationFn: async ({ id, status, user_id, card }: any) => {
      const { error } = await supabase.from("ration_card_requests").update({ status }).eq("id", id);
      if (error) throw error;
      if (status === "approved") {
        await supabase.from("profiles").update({ ration_card_number: card }).eq("id", user_id);
        await supabase.from("notifications").insert({ user_id, message: `Your ration card ${card} has been approved.` });
      } else if (status === "rejected") {
        await supabase.from("notifications").insert({ user_id, message: "Your ration card request was rejected." });
      }
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["card-requests"] }); },
  });

  return (
    <>
      <PageHeader title="New Ration Card Requests" />
      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((r: any) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{r.full_name}</div>
                <div className="text-xs text-muted-foreground">Requested: {r.proposed_card_number}</div>
                <div className="mt-1 text-sm">Mobile: {r.mobile}</div>
                <div className="text-sm text-muted-foreground">{r.address}</div>
              </div>
              <Badge variant={r.status === "pending" ? "secondary" : r.status === "approved" ? "default" : "destructive"}>{r.status}</Badge>
            </div>
            {r.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => decide.mutate({ id: r.id, status: "approved", user_id: r.user_id, card: r.proposed_card_number })}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: r.id, status: "rejected", user_id: r.user_id })}>Reject</Button>
              </div>
            )}
          </Card>
        ))}
        {!data?.length && <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No requests yet.</div>}
      </div>
    </>
  );
}

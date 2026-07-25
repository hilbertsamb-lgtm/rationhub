import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/address-requests")({ component: AdminAddressRequests });

function AdminAddressRequests() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["address-requests"],
    queryFn: async () =>
      (await supabase.from("address_change_requests").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const decide = useMutation({
    mutationFn: async ({ id, status, user_id, new_address }: any) => {
      const { error } = await supabase.from("address_change_requests").update({ status }).eq("id", id);
      if (error) throw error;
      if (status === "approved") {
        await supabase.from("profiles").update({ address: new_address }).eq("id", user_id);
        await supabase.from("notifications").insert({ user_id, message: "Your address change was approved." });
      } else if (status === "rejected") {
        await supabase.from("notifications").insert({ user_id, message: "Your address change was rejected." });
      }
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["address-requests"] }); },
  });

  return (
    <>
      <PageHeader title="Address Change Requests" />
      <div className="space-y-3">
        {(data ?? []).map((r: any) => (
          <Card key={r.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div>
              <div className="text-sm text-muted-foreground">New address</div>
              <div className="font-medium">{r.new_address}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{r.status}</Badge>
              {r.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => decide.mutate({ ...r, status: "approved" })}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => decide.mutate({ ...r, status: "rejected" })}>Reject</Button>
                </>
              )}
            </div>
          </Card>
        ))}
        {!data?.length && <div className="py-10 text-center text-sm text-muted-foreground">No requests.</div>}
      </div>
    </>
  );
}

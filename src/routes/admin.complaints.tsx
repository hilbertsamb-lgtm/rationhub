import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/complaints")({ component: AdminComplaints });

function AdminComplaints() {
  const qc = useQueryClient();
  const [responses, setResponses] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["complaints"],
    queryFn: async () => (await supabase.from("complaints").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const respond = useMutation({
    mutationFn: async ({ id, response, user_id }: any) => {
      const { error } = await supabase.from("complaints").update({ response, status: "resolved" }).eq("id", id);
      if (error) throw error;
      await supabase.from("notifications").insert({ user_id, message: `Response to your complaint: ${response}` });
    },
    onSuccess: () => { toast.success("Responded"); qc.invalidateQueries({ queryKey: ["complaints"] }); },
  });

  return (
    <>
      <PageHeader title="Complaints" />
      <div className="space-y-3">
        {(data ?? []).map((c: any) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{c.subject}</div>
                <p className="mt-1 text-sm text-muted-foreground">{c.message}</p>
              </div>
              <Badge>{c.status}</Badge>
            </div>
            {c.response ? (
              <div className="mt-3 rounded-md bg-muted p-3 text-sm"><b>Response:</b> {c.response}</div>
            ) : (
              <div className="mt-3 space-y-2">
                <Textarea placeholder="Write a response…" value={responses[c.id] ?? ""} onChange={(e) => setResponses({ ...responses, [c.id]: e.target.value })} />
                <Button size="sm" onClick={() => respond.mutate({ id: c.id, response: responses[c.id], user_id: c.user_id })}>Resolve</Button>
              </div>
            )}
          </Card>
        ))}
        {!data?.length && <div className="py-10 text-center text-sm text-muted-foreground">No complaints.</div>}
      </div>
    </>
  );
}

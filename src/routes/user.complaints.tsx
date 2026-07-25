import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/user/complaints")({ component: UserComplaints });

function UserComplaints() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ subject: "", message: "" });

  const { data } = useQuery({
    queryKey: ["my-complaints", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("complaints").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const raise = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("complaints").insert({ user_id: user!.id, ...f });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Complaint submitted"); setF({ subject: "", message: "" }); qc.invalidateQueries({ queryKey: ["my-complaints"] }); },
  });

  return (
    <>
      <PageHeader title="Complaints" />
      <Card className="mb-4 max-w-lg p-4 space-y-2">
        <Input placeholder="Subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
        <Textarea placeholder="Describe your issue" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
        <Button onClick={() => raise.mutate()} disabled={!f.subject || !f.message}>Submit</Button>
      </Card>
      <div className="space-y-3">
        {(data ?? []).map((c: any) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-center justify-between"><div className="font-semibold">{c.subject}</div><Badge>{c.status}</Badge></div>
            <p className="mt-1 text-sm text-muted-foreground">{c.message}</p>
            {c.response && <div className="mt-2 rounded bg-muted p-2 text-sm"><b>Admin:</b> {c.response}</div>}
          </Card>
        ))}
      </div>
    </>
  );
}

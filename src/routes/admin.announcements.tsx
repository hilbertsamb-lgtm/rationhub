import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/announcements")({ component: AdminAnnouncements });

function AdminAnnouncements() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", body: "" });

  const { data } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("announcements").insert({ ...f, created_by: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Published"); setF({ title: "", body: "" }); qc.invalidateQueries({ queryKey: ["announcements"] }); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("announcements").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  return (
    <>
      <PageHeader title="Announcements" />
      <Card className="mb-4 p-4">
        <div className="space-y-2">
          <Input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <Textarea placeholder="Message" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          <Button onClick={() => create.mutate()} disabled={!f.title || !f.body}>Publish</Button>
        </div>
      </Card>
      <div className="space-y-3">
        {(data ?? []).map((a: any) => (
          <Card key={a.id} className="flex items-start justify-between gap-3 p-4">
            <div>
              <div className="font-semibold">{a.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
              <div className="mt-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => del.mutate(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </Card>
        ))}
      </div>
    </>
  );
}

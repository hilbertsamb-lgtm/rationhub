import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/user/profile")({ component: UserProfile });

function UserProfile() {
  const { user, profile, refresh } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ full_name: "", mobile: "", address: "" });
  const [newAddr, setNewAddr] = useState("");

  useEffect(() => {
    if (profile) setF({ full_name: profile.full_name ?? "", mobile: profile.mobile ?? "", address: profile.address ?? "" });
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ full_name: f.full_name, mobile: f.mobile }).eq("id", user!.id);
      if (error) throw error;
      await refresh();
    },
    onSuccess: () => toast.success("Profile updated"),
  });

  const requestAddr = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("address_change_requests").insert({ user_id: user!.id, new_address: newAddr });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Address change requested"); setNewAddr(""); qc.invalidateQueries(); },
  });

  return (
    <>
      <PageHeader title="My Profile" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold">Personal details</h3>
          <div><Label>Full name</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div><Label>Mobile</Label><Input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></div>
          <div><Label>Current address</Label><Textarea value={f.address} disabled rows={3} /></div>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save changes</Button>
        </Card>
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold">Request address change</h3>
          <p className="text-xs text-muted-foreground">Address changes require admin approval.</p>
          <Textarea rows={4} placeholder="Enter new address" value={newAddr} onChange={(e) => setNewAddr(e.target.value)} />
          <Button onClick={() => requestAddr.mutate()} disabled={!newAddr || requestAddr.isPending}>Submit request</Button>
        </Card>
      </div>
    </>
  );
}

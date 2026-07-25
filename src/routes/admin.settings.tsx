import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  const { user } = useAuth();
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const update = async () => {
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    setPw("");
    toast.success("Password updated");
  };

  return (
    <>
      <PageHeader title="Settings" />
      <Card className="max-w-md p-6">
        <div className="mb-4">
          <div className="text-sm text-muted-foreground">Signed in as</div>
          <div className="font-semibold">{user?.email}</div>
        </div>
        <div className="space-y-2">
          <Label>New password</Label>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <Button onClick={update} disabled={loading}>{loading ? "Updating…" : "Update password"}</Button>
        </div>
      </Card>
    </>
  );
}

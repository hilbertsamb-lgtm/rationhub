import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login/admin")({
  head: () => ({
    meta: [
      { title: "Admin Login — SmartRation" },
      { name: "description", content: "Administrator sign in for the Smart Ration Management System." },
      { property: "og:title", content: "Admin Login — SmartRation" },
      { property: "og:description", content: "Administrator sign in." },
    ],
  }),
  component: AdminLogin,
});

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function AdminLogin() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const showInvalid = () => {
    toast.error("Invalid Admin Credentials", {
      description:
        "Please use the default Admin credentials provided in the project's README file. Open the GitHub repository and check the Default Admin Credentials section.",
      duration: 8000,
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return showInvalid();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error || !data.user) return showInvalid();

      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!role) {
        await supabase.auth.signOut();
        return showInvalid();
      }
      toast.success("Welcome, Administrator");
      nav({ to: "/admin" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Administrator sign in"
      subtitle="Access the control panel for citizens, shop keepers, products and monthly distribution."
      tone="from-indigo-700 to-indigo-950"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Restricted access</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in as Admin"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Administrators cannot register. Use the default credentials from the project README.
        </p>
      </form>
    </AuthShell>
  );
}

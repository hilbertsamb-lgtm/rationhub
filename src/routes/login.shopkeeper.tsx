import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Store } from "lucide-react";

export const Route = createFileRoute("/login/shopkeeper")({
  head: () => ({
    meta: [
      { title: "Shop Keeper Login — SmartRation" },
      { name: "description", content: "Shop keeper sign in for the ration distribution portal." },
      { property: "og:title", content: "Shop Keeper Login — SmartRation" },
      { property: "og:description", content: "Shop keeper sign in." },
    ],
  }),
  component: ShopLogin,
});

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

function ShopLogin() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const invalid = () => toast.error("Invalid Shop Keeper Credentials");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return invalid();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error || !data.user) return invalid();

      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "shopkeeper")
        .maybeSingle();

      if (!role) {
        await supabase.auth.signOut();
        return invalid();
      }
      toast.success("Welcome");
      nav({ to: "/shop" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Shop Keeper sign in"
      subtitle="Issue monthly products, verify users, generate receipts and update stock in real time."
      tone="from-emerald-600 to-teal-800"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Shop Keeper Login</h1>
          <p className="text-sm text-muted-foreground">Accounts created by admin</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Shop keepers do not have public registration. Contact your administrator for access.
        </p>
      </form>
    </AuthShell>
  );
}

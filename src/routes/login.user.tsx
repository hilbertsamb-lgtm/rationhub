import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { emailForRationCard } from "@/lib/admin.functions";

export const Route = createFileRoute("/login/user")({
  head: () => ({
    meta: [
      { title: "User Login — SmartRation" },
      { name: "description", content: "Citizen sign in with email or ration card number." },
      { property: "og:title", content: "User Login — SmartRation" },
      { property: "og:description", content: "Citizen sign in." },
    ],
  }),
  component: UserLogin,
});

const schema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(6),
});

function UserLogin() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ identifier, password });
    if (!parsed.success) return toast.error("Please provide valid credentials");
    setLoading(true);
    try {
      let email = parsed.data.identifier;
      if (!email.includes("@")) {
        const { email: found } = await emailForRationCard({ data: { card: email } });
        if (!found) {
          toast.error("No user found with that ration card number");
          return;
        }
        email = found;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
      if (error || !data.user) return toast.error("Invalid credentials");

      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "user")
        .maybeSingle();

      if (!role) {
        await supabase.auth.signOut();
        return toast.error("This account is not a citizen account. Use the correct login page.");
      }
      toast.success("Welcome back");
      nav({ to: "/user" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Citizen sign in"
      subtitle="Log in with your registered email or ration card number to access your digital ration card and monthly entitlements."
      tone="from-amber-500 to-orange-700"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">User Login</h1>
          <p className="text-sm text-muted-foreground">Citizens & cardholders</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="identifier">Email or Ration Card Number</Label>
          <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          New citizen?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

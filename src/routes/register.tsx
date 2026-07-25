import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — SmartRation" },
      { name: "description", content: "Register as a citizen on the Smart Ration Management System." },
      { property: "og:title", content: "Register — SmartRation" },
      { property: "og:description", content: "Citizen registration." },
    ],
  }),
  component: Register,
});

const schema = z
  .object({
    full_name: z.string().trim().min(2).max(100),
    ration_card_number: z.string().trim().min(4).max(30),
    mobile: z.string().trim().regex(/^\d{10}$/, "Enter a 10-digit mobile number"),
    email: z.string().email(),
    address: z.string().trim().min(4).max(500),
    password: z.string().min(6),
    confirm: z.string().min(6),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

function Register() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ full_name: "", ration_card_number: "", mobile: "", email: "", address: "", password: "", confirm: "" });

  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return toast.error(first?.message ?? "Invalid form");
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: parsed.data.full_name,
            ration_card_number: parsed.data.ration_card_number,
            mobile: parsed.data.mobile,
            address: parsed.data.address,
          },
        },
      });
      if (error) {
        if (error.message.toLowerCase().includes("duplicate") || error.message.toLowerCase().includes("unique")) {
          return toast.error("Ration card number or email already registered");
        }
        return toast.error(error.message);
      }
      if (!data.user) return toast.error("Registration failed");
      toast.success("Account created. Welcome!");
      nav({ to: "/user" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Register as a citizen"
      subtitle="Create your account with a unique ration card number to access monthly distribution and your digital ration card."
      tone="from-amber-500 to-orange-700"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
          <UserPlus className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Create account</h1>
          <p className="text-sm text-muted-foreground">Citizens only</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label>Full name</Label>
          <Input value={f.full_name} onChange={upd("full_name")} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Ration card no.</Label>
            <Input value={f.ration_card_number} onChange={upd("ration_card_number")} required />
          </div>
          <div>
            <Label>Mobile</Label>
            <Input value={f.mobile} onChange={upd("mobile")} required inputMode="numeric" />
          </div>
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={f.email} onChange={upd("email")} required />
        </div>
        <div>
          <Label>Address</Label>
          <Textarea value={f.address} onChange={upd("address")} required rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Password</Label>
            <Input type="password" value={f.password} onChange={upd("password")} required />
          </div>
          <div>
            <Label>Confirm</Label>
            <Input type="password" value={f.confirm} onChange={upd("confirm")} required />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link to="/login/user" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

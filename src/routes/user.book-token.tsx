import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/user/book-token")({ component: BookToken });

function BookToken() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [shopId, setShopId] = useState("");
  const [slot, setSlot] = useState("");

  const { data: shops } = useQuery({
    queryKey: ["shops-list"],
    queryFn: async () => (await supabase.from("shops").select("*").order("name")).data ?? [],
  });

  const book = useMutation({
    mutationFn: async () => {
      if (!profile?.ration_card_number) throw new Error("Ration card number not set on your profile");
      if (!shopId || !slot) throw new Error("Please choose shop and slot");
      const d = new Date(slot);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const token_number = `T-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from("tokens").insert({
        user_id: user!.id,
        shop_id: shopId,
        token_number,
        month,
        status: "booked",
        booked_at: d.toISOString(),
      });
      if (error) throw error;
      return token_number;
    },
    onSuccess: (t) => {
      toast.success(`Token booked: ${t}`);
      qc.invalidateQueries({ queryKey: ["my-tokens"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="Book Token" subtitle="Reserve a time slot at your ration shop." />
      <Card className="max-w-lg p-6 space-y-4">
        <div>
          <Label>Ration Shop</Label>
          <Select value={shopId} onValueChange={setShopId}>
            <SelectTrigger><SelectValue placeholder="Select shop" /></SelectTrigger>
            <SelectContent>{(shops ?? []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.code}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Preferred slot</Label>
          <input type="datetime-local" value={slot} onChange={(e) => setSlot(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <Button onClick={() => book.mutate()} disabled={book.isPending} className="w-full">
          {book.isPending ? "Booking…" : "Book token"}
        </Button>
      </Card>
    </>
  );
}

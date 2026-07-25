import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { productImageUrl } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/issue")({
  component: IssueProducts,
  validateSearch: (s: Record<string, unknown>) => ({ user: (s.user as string) ?? "" }),
});

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function IssueProducts() {
  const search = Route.useSearch();
  const { user: keeper, profile } = useAuth();
  const qc = useQueryClient();
  const shopId = profile?.shop_id;
  const month = currentMonth();

  const [rationCard, setRationCard] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const { data: profileData, refetch } = useQuery({
    queryKey: ["issue-profile", search.user, rationCard],
    queryFn: async () => {
      let q = supabase.from("profiles").select("*").limit(1);
      if (search.user) q = q.eq("id", search.user);
      else if (rationCard) q = q.eq("ration_card_number", rationCard);
      else return null;
      const { data } = await q.maybeSingle();
      return data;
    },
    enabled: !!search.user || !!rationCard,
  });

  const { data: products } = useQuery({
    queryKey: ["products-issue"],
    queryFn: async () => (await supabase.from("products").select("*").eq("status", "available").order("name")).data ?? [],
  });

  const total = useMemo(() => {
    return (products ?? []).reduce((sum, p: any) => {
      const q = Number(quantities[p.id] || 0);
      return sum + q * Number(p.price);
    }, 0);
  }, [quantities, products]);

  const issue = useMutation({
    mutationFn: async () => {
      if (!profileData) throw new Error("Select a user first");
      if (!shopId) throw new Error("Your account is not linked to a shop");
      const items = (products ?? [])
        .map((p: any) => ({ product_id: p.id, name: p.name, unit: p.unit, price: Number(p.price), quantity: Number(quantities[p.id] || 0) }))
        .filter((i) => i.quantity > 0);
      if (!items.length) throw new Error("Enter at least one quantity");
      const receipt_no = `R-${Date.now().toString().slice(-8)}`;

      const { error } = await supabase.from("purchases").insert({
        user_id: profileData.id,
        shop_id: shopId,
        month,
        receipt_no,
        total,
        items,
        issued_by: keeper!.id,
      });
      if (error) throw error;

      // reduce stock
      for (const it of items) {
        const p = (products ?? []).find((x: any) => x.id === it.product_id);
        if (!p) continue;
        const newStock = Math.max(0, Number(p.stock) - it.quantity);
        await supabase.from("products").update({ stock: newStock, status: newStock > 0 ? "available" : "out_of_stock" }).eq("id", p.id);
      }

      await supabase.from("notifications").insert({
        user_id: profileData.id,
        message: `Ration issued • Receipt ${receipt_no} • Total ₹${total.toFixed(2)}`,
      });

      return receipt_no;
    },
    onSuccess: (r) => {
      toast.success(`Receipt ${r} generated`);
      setQuantities({});
      qc.invalidateQueries();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="Issue Monthly Products" subtitle={`Month: ${month}`} />
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <Label>Look up by ration card</Label>
            <Input placeholder="Ration Card Number" value={rationCard} onChange={(e) => setRationCard(e.target.value)} />
          </div>
          <Button onClick={() => refetch()}>Find</Button>
        </div>
        {profileData && (
          <div className="mt-3 rounded-md bg-muted p-3 text-sm">
            <b>{profileData.full_name}</b> • {profileData.ration_card_number} • {profileData.mobile ?? "—"}
          </div>
        )}
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {(products ?? []).map((p: any) => (
          <Card key={p.id} className="flex items-center gap-3 p-3">
            <img src={productImageUrl(p.image_path)} alt={p.name} className="h-16 w-16 rounded object-cover" />
            <div className="flex-1">
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">Quota: {p.monthly_quota} {p.unit} • ₹{p.price}/{p.unit} • In stock: {p.stock}</div>
            </div>
            <div className="w-24">
              <Input type="number" min={0} placeholder="Qty" value={quantities[p.id] ?? ""} onChange={(e) => setQuantities({ ...quantities, [p.id]: e.target.value })} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-4 flex items-center justify-between p-4">
        <div className="text-lg">Total: <span className="font-bold">₹{total.toFixed(2)}</span></div>
        <Button onClick={() => issue.mutate()} disabled={!profileData || issue.isPending}>
          {issue.isPending ? "Issuing…" : "Issue & Generate Receipt"}
        </Button>
      </Card>
    </>
  );
}

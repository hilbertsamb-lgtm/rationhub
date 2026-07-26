import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductImage } from "@/components/product-image";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/stock-requests")({ component: ShopStockRequests });

function ShopStockRequests() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const { data: products } = useQuery({
    queryKey: ["products-for-request"],
    queryFn: async () => (await supabase.from("products").select("id,name,unit,stock,image_path").order("name")).data ?? [],
  });

  const { data: requests } = useQuery({
    queryKey: ["my-stock-requests"],
    queryFn: async () =>
      (await supabase
        .from("stock_requests")
        .select("*, products(name, unit, image_path)")
        .order("created_at", { ascending: false })).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!productId) throw new Error("Select a product");
      const q = Number(quantity);
      if (!q || q <= 0) throw new Error("Enter a valid quantity");
      if (!reason.trim()) throw new Error("Enter a reason");
      const { error } = await supabase.from("stock_requests").insert({
        product_id: productId,
        quantity: q,
        reason: reason.trim(),
        requested_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stock request submitted");
      setProductId(""); setQuantity(""); setReason("");
      qc.invalidateQueries({ queryKey: ["my-stock-requests"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to submit"),
  });

  return (
    <>
      <PageHeader title="Stock Requests" subtitle="Request additional stock from the admin" />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card className="p-4">
          <div className="mb-3 font-semibold">New Request</div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                <SelectContent>
                  {(products ?? []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.stock} {p.unit} left
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 100" />
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why do you need more stock?" rows={4} />
            </div>
            <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? "Submitting…" : "Submit Request"}
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 font-semibold">My Requests</div>
          <div className="space-y-3">
            {(requests ?? []).map((r: any) => (
              <div key={r.id} className="flex items-start gap-3 rounded-md border p-3">
                <ProductImage path={r.products?.image_path} alt={r.products?.name} className="h-12 w-12 rounded object-cover" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{r.products?.name}</div>
                    <Badge variant={r.status === "pending" ? "secondary" : r.status === "approved" ? "default" : "destructive"}>
                      {r.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">Qty: {r.quantity} {r.products?.unit}</div>
                  <div className="text-sm">{r.reason}</div>
                  {r.admin_note && <div className="mt-1 text-xs text-muted-foreground">Admin note: {r.admin_note}</div>}
                  <div className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {!requests?.length && <div className="py-8 text-center text-sm text-muted-foreground">No requests yet.</div>}
          </div>
        </Card>
      </div>
    </>
  );
}

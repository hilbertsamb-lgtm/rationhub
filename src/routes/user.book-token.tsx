import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { ProductImage } from "@/components/product-image";
import { toast } from "sonner";
import { CreditCard, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/user/book-token")({ component: BookToken });

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function BookToken() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [shopId, setShopId] = useState("");
  const [slot, setSlot] = useState("");
  const [qty, setQty] = useState<Record<string, string>>({});
  const [payOpen, setPayOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);

  const { data: shops } = useQuery({
    queryKey: ["shops-list"],
    queryFn: async () => (await supabase.from("shops").select("*").order("name")).data ?? [],
  });

  const { data: products } = useQuery({
    queryKey: ["products-book"],
    queryFn: async () => (await supabase.from("products").select("*").eq("status", "available").order("name")).data ?? [],
  });

  const cart = useMemo(() => {
    return (products ?? [])
      .map((p: any) => ({
        product_id: p.id,
        name: p.name,
        unit: p.unit,
        price: Number(p.price),
        image_path: p.image_path,
        quantity: Number(qty[p.id] || 0),
      }))
      .filter((i) => i.quantity > 0);
  }, [qty, products]);

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const startCheckout = () => {
    if (!profile?.ration_card_number) return toast.error("Ration card number not set on your profile");
    if (!shopId) return toast.error("Please choose a ration shop");
    if (!slot) return toast.error("Please choose a slot");
    if (!cart.length) return toast.error("Select at least one product");
    setPayOpen(true);
  };

  const book = useMutation({
    mutationFn: async () => {
      setProcessing(true);
      // simulate payment gateway
      await new Promise((r) => setTimeout(r, 1200));
      const payment_ref = `PAY-${payMethod.toUpperCase()}-${Date.now().toString().slice(-8)}`;
      const d = new Date(slot);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const token_number = `T-${Date.now().toString().slice(-6)}`;
      const { data, error } = await supabase.from("tokens").insert({
        user_id: user!.id,
        shop_id: shopId,
        token_number,
        month,
        status: "waiting",
        booked_at: d.toISOString(),
        items: cart,
        total,
        payment_status: "paid",
        payment_ref,
      }).select("id").single();
      if (error) throw error;
      return { token_number, id: data.id };
    },
    onSuccess: ({ token_number }) => {
      setProcessing(false);
      setPayOpen(false);
      toast.success(`Payment successful. Token ${token_number} generated.`);
      setQty({});
      qc.invalidateQueries({ queryKey: ["my-tokens"] });
      navigate({ to: "/user/tokens" });
    },
    onError: (e: any) => { setProcessing(false); toast.error(e.message); },
  });

  return (
    <>
      <PageHeader title="Book Token" subtitle="Select products, pay, and get your token for the month." />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-2">
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
        </div>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">Available products for {currentMonth()}</div>
        <Badge variant="secondary"><ShoppingCart className="mr-1 h-3 w-3" />{cart.length} selected</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(products ?? []).map((p: any) => (
          <Card key={p.id} className="flex items-center gap-3 p-3">
            <ProductImage path={p.image_path} alt={p.name} className="h-20 w-20 rounded object-cover" />
            <div className="flex-1">
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">
                In stock: {p.stock} {p.unit} • ₹{p.price}/{p.unit} • Quota: {p.monthly_quota} {p.unit}
              </div>
              <div className="mt-1 text-xs">{p.category}</div>
            </div>
            <div className="w-24">
              <Input
                type="number"
                min={0}
                max={p.stock}
                placeholder="Qty"
                value={qty[p.id] ?? ""}
                onChange={(e) => setQty({ ...qty, [p.id]: e.target.value })}
              />
            </div>
          </Card>
        ))}
        {!products?.length && <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No products available.</div>}
      </div>

      <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="text-xs text-muted-foreground">Order total</div>
          <div className="text-2xl font-bold">₹{total.toFixed(2)}</div>
        </div>
        <Button size="lg" onClick={startCheckout} disabled={!cart.length}>
          <CreditCard className="mr-2 h-4 w-4" /> Pay & Book Token
        </Button>
      </Card>

      <Dialog open={payOpen} onOpenChange={(o) => !processing && setPayOpen(o)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Complete Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border p-3 text-sm">
              <div className="flex justify-between"><span>Items</span><span>{cart.length}</span></div>
              <div className="flex justify-between"><span>Shop</span><span>{(shops ?? []).find((s: any) => s.id === shopId)?.name ?? "—"}</span></div>
              <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
            </div>
            <div>
              <Label>Payment method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Credit / Debit Card</SelectItem>
                  <SelectItem value="netbanking">Net Banking</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)} disabled={processing}>Cancel</Button>
            <Button onClick={() => book.mutate()} disabled={processing}>
              {processing ? "Processing payment…" : `Pay ₹${total.toFixed(2)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

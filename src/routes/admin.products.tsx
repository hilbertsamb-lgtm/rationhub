import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { productImageUrl, uploadProductImage } from "@/lib/storage";
import { Plus, Trash2, ImagePlus } from "lucide-react";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

const CATEGORIES = ["Grains", "Pulses", "Oil", "Sugar", "Salt", "Kerosene", "Other"];

function AdminProducts() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [f, setF] = useState({
    name: "",
    category: "Grains",
    description: "",
    stock: "0",
    unit: "kg",
    price: "0",
    monthly_quota: "0",
  });

  const { data } = useQuery({
    queryKey: ["products-admin"],
    queryFn: async () => (await supabase.from("products").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Product image is mandatory (JPG, JPEG, PNG or WEBP)");
      if (!f.name.trim()) throw new Error("Product name is required");
      const image_path = await uploadProductImage(file);
      const stock = Number(f.stock);
      const { error } = await supabase.from("products").insert({
        name: f.name.trim(),
        category: f.category,
        description: f.description,
        image_path,
        stock,
        unit: f.unit,
        price: Number(f.price),
        monthly_quota: Number(f.monthly_quota),
        status: stock > 0 ? "available" : "out_of_stock",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product added");
      setOpen(false);
      setFile(null);
      setF({ name: "", category: "Grains", description: "", stock: "0", unit: "kg", price: "0", monthly_quota: "0" });
      qc.invalidateQueries({ queryKey: ["products-admin"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("products").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["products-admin"] }); },
  });

  return (
    <>
      <PageHeader title="Products" subtitle="Manage the ration product catalogue." actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add Product</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Product</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Product image (JPG, JPEG, PNG, WEBP) *</Label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted">
                    {file ? (
                      <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    )}
                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  </label>
                  <p className="text-xs text-muted-foreground">Upload is mandatory.</p>
                </div>
              </div>
              <div><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
              <div>
                <Label>Category</Label>
                <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Stock</Label><Input type="number" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /></div>
                <div><Label>Unit</Label><Input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></div>
                <div><Label>₹ Price</Label><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
              </div>
              <div><Label>Monthly quota (per card)</Label><Input type="number" value={f.monthly_quota} onChange={(e) => setF({ ...f, monthly_quota: e.target.value })} /></div>
              <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? "Saving…" : "Create product"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      } />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((p: any) => (
          <Card key={p.id} className="overflow-hidden">
            <div className="aspect-video w-full overflow-hidden bg-muted">
              <img src={productImageUrl(p.image_path)} alt={p.name} className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.category}</div>
                </div>
                <Badge variant={p.status === "available" ? "default" : "destructive"}>
                  {p.status === "available" ? "Available" : "Out of stock"}
                </Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div><div className="text-muted-foreground">Stock</div><div className="font-semibold">{p.stock} {p.unit}</div></div>
                <div><div className="text-muted-foreground">Price</div><div className="font-semibold">₹{p.price}</div></div>
                <div><div className="text-muted-foreground">Quota</div><div className="font-semibold">{p.monthly_quota} {p.unit}</div></div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => del.mutate(p.id)} className="mt-3 text-destructive">
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            </div>
          </Card>
        ))}
        {!data?.length && <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No products yet.</div>}
      </div>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { productImageUrl } from "@/lib/storage";

export const Route = createFileRoute("/admin/stocks")({ component: AdminStocks });

function AdminStocks() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["products-stock"],
    queryFn: async () => (await supabase.from("products").select("*").order("name")).data ?? [],
  });

  const update = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { error } = await supabase
        .from("products")
        .update({ stock, status: stock > 0 ? "available" : "out_of_stock" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Stock updated"); qc.invalidateQueries({ queryKey: ["products-stock"] }); },
  });

  return (
    <>
      <PageHeader title="Stocks" subtitle="Update central stock levels; status flips automatically." />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead>Unit</TableHead><TableHead className="w-40">Stock</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {(data ?? []).map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="flex items-center gap-3">
                  <img src={productImageUrl(p.image_path)} alt={p.name} className="h-10 w-10 rounded object-cover" />
                  <span className="font-medium">{p.name}</span>
                </TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{p.unit}</TableCell>
                <TableCell>
                  <Input type="number" defaultValue={p.stock} onBlur={(e) => update.mutate({ id: p.id, stock: Number(e.target.value) })} />
                </TableCell>
                <TableCell>{p.status === "available" ? "Available" : "Out of stock"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

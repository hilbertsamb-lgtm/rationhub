import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ProductImage } from "@/components/product-image";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/stock-requests")({ component: AdminStockRequests });

function AdminStockRequests() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["admin-stock-requests"],
    queryFn: async () => {
      const rows = (await supabase
        .from("stock_requests")
        .select("*, products(id, name, unit, stock, image_path)")
        .order("created_at", { ascending: false })).data ?? [];
      const ids = Array.from(new Set(rows.map((r: any) => r.requested_by)));
      const profiles = ids.length
        ? (await supabase.from("profiles").select("id, full_name, email").in("id", ids)).data ?? []
        : [];
      const pMap = new Map(profiles.map((p: any) => [p.id, p]));
      return rows.map((r: any) => ({ ...r, profile: pMap.get(r.requested_by) }));
    },
  });

  const decide = useMutation({
    mutationFn: async ({ req, status }: { req: any; status: "approved" | "rejected" }) => {
      if (!user) throw new Error("Not signed in");
      if (status === "approved") {
        const newStock = Number(req.products?.stock ?? 0) + Number(req.quantity);
        const { error: pErr } = await supabase
          .from("products")
          .update({ stock: newStock, status: newStock > 0 ? "available" : "out_of_stock" })
          .eq("id", req.product_id);
        if (pErr) throw pErr;
      }
      const { error } = await supabase
        .from("stock_requests")
        .update({
          status,
          admin_note: notes[req.id] || null,
          decided_by: user.id,
          decided_at: new Date().toISOString(),
        })
        .eq("id", req.id);
      if (error) throw error;
      await supabase.from("notifications").insert({
        user_id: req.requested_by,
        message:
          status === "approved"
            ? `Stock request for ${req.products?.name} (${req.quantity} ${req.products?.unit}) approved.`
            : `Stock request for ${req.products?.name} was rejected.`,
      });
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-stock-requests"] });
      qc.invalidateQueries({ queryKey: ["shop-products"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <>
      <PageHeader title="Stock Requests" subtitle="Approve or reject shop keeper stock requests" />
      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((r: any) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start gap-3">
              <ProductImage path={r.products?.image_path} alt={r.products?.name} className="h-14 w-14 rounded object-cover" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{r.products?.name}</div>
                  <Badge variant={r.status === "pending" ? "secondary" : r.status === "approved" ? "default" : "destructive"}>
                    {r.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Requested: {r.quantity} {r.products?.unit} · Current stock: {r.products?.stock} {r.products?.unit}
                </div>
                <div className="text-xs text-muted-foreground">
                  By {r.profile?.full_name ?? "Shop keeper"} ({r.profile?.email})
                </div>
                <div className="mt-2 text-sm">{r.reason}</div>
                {r.admin_note && <div className="mt-1 text-xs text-muted-foreground">Note: {r.admin_note}</div>}
                <div className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
              </div>
            </div>
            {r.status === "pending" && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Optional note to the shop keeper"
                  rows={2}
                  value={notes[r.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => decide.mutate({ req: r, status: "approved" })} disabled={decide.isPending}>
                    Approve & Add Stock
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decide.mutate({ req: r, status: "rejected" })} disabled={decide.isPending}>
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
        {!data?.length && <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No stock requests yet.</div>}
      </div>
    </>
  );
}

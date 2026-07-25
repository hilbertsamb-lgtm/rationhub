import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createShopkeeper, deleteShopkeeper } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/shopkeepers")({ component: AdminShopkeepers });

function AdminShopkeepers() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ full_name: "", email: "", password: "", mobile: "", shop_id: "" });
  const create = useServerFn(createShopkeeper);
  const del = useServerFn(deleteShopkeeper);

  const { data: shops } = useQuery({
    queryKey: ["shops"],
    queryFn: async () => (await supabase.from("shops").select("*").order("created_at")).data ?? [],
  });

  const { data } = useQuery({
    queryKey: ["admin-shopkeepers"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "shopkeeper");
      const ids = (roles ?? []).map((r) => r.user_id);
      if (!ids.length) return [];
      const { data: profiles } = await supabase.from("profiles").select("*, shops:shop_id(name, code)").in("id", ids);
      return profiles ?? [];
    },
  });

  const createM = useMutation({
    mutationFn: async () => create({ data: { ...f, shop_id: f.shop_id || undefined } }),
    onSuccess: () => {
      toast.success("Shop keeper created");
      setOpen(false);
      setF({ full_name: "", email: "", password: "", mobile: "", shop_id: "" });
      qc.invalidateQueries({ queryKey: ["admin-shopkeepers"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create"),
  });

  const delM = useMutation({
    mutationFn: async (id: string) => del({ data: { user_id: id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-shopkeepers"] });
    },
  });

  return (
    <>
      <PageHeader
        title="Manage Shop Keepers"
        subtitle="Only admins can create shop keeper accounts."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" /> Add Shop Keeper</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Shop Keeper</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Full name</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
                <div><Label>Password (min 6)</Label><Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
                <div><Label>Mobile</Label><Input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></div>
                <div>
                  <Label>Assign shop</Label>
                  <Select value={f.shop_id} onValueChange={(v) => setF({ ...f, shop_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select shop" /></SelectTrigger>
                    <SelectContent>
                      {(shops ?? []).map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => createM.mutate()} disabled={createM.isPending}>
                  {createM.isPending ? "Creating…" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((u: any) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.mobile ?? "—"}</TableCell>
                <TableCell>{u.shops?.name ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => delM.mutate(u.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!data?.length && (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No shop keepers yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

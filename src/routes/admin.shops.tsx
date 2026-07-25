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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/shops")({ component: AdminShops });

function AdminShops() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", code: "", address: "" });

  const { data } = useQuery({
    queryKey: ["shops-admin"],
    queryFn: async () => (await supabase.from("shops").select("*").order("created_at")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("shops").insert(f);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Shop added"); setOpen(false); setF({ name: "", code: "", address: "" }); qc.invalidateQueries({ queryKey: ["shops-admin"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("shops").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["shops-admin"] }); },
  });

  return (
    <>
      <PageHeader title="Ration Shops" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add Shop</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Shop</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
              <div><Label>Code</Label><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></div>
              <div><Label>Address</Label><Textarea value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
              <Button onClick={() => create.mutate()} disabled={create.isPending} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      } />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Address</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {(data ?? []).map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.code}</TableCell>
                <TableCell className="max-w-md truncate">{s.address}</TableCell>
                <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => del.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
            {!data?.length && <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">No shops yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

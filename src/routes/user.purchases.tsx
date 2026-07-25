import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/user/purchases")({ component: UserPurchases });

function UserPurchases() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["my-purchases", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("purchases").select("*, shops:shop_id(name)").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <>
      <PageHeader title="Purchase History" />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Month</TableHead><TableHead>Shop</TableHead><TableHead>Total</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {(data ?? []).map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono">{p.receipt_no}</TableCell>
                <TableCell>{p.month}</TableCell>
                <TableCell>{p.shops?.name}</TableCell>
                <TableCell>₹{Number(p.total).toFixed(2)}</TableCell>
                <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {!data?.length && <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No purchases yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

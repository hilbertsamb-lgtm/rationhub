import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/shop/receipts")({ component: ShopReceipts });

function ShopReceipts() {
  const { profile } = useAuth();
  const shopId = profile?.shop_id;
  const { data } = useQuery({
    queryKey: ["shop-receipts", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data: purchases } = await supabase.from("purchases").select("*").eq("shop_id", shopId!).order("created_at", { ascending: false }).limit(200);
      const ids = (purchases ?? []).map((p) => p.user_id);
      const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, full_name, ration_card_number").in("id", ids) : { data: [] as any[] };
      const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      return (purchases ?? []).map((p: any) => ({ ...p, profile: map.get(p.user_id) }));
    },
  });

  return (
    <>
      <PageHeader title="Today's Distribution & Receipts" />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Customer</TableHead><TableHead>Card</TableHead><TableHead>Month</TableHead><TableHead>Total</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {(data ?? []).map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono">{p.receipt_no}</TableCell>
                <TableCell>{p.profile?.full_name}</TableCell>
                <TableCell>{p.profile?.ration_card_number}</TableCell>
                <TableCell>{p.month}</TableCell>
                <TableCell>₹{Number(p.total).toFixed(2)}</TableCell>
                <TableCell>{new Date(p.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {!data?.length && <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No receipts yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/reports")({ component: AdminReports });

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function AdminReports() {
  const month = currentMonth();
  const { data } = useQuery({
    queryKey: ["reports", month],
    queryFn: async () => {
      const { data: purchases } = await supabase.from("purchases").select("shop_id, total").eq("month", month);
      const { data: shops } = await supabase.from("shops").select("id, name, code");
      const agg = new Map<string, { total: number; count: number }>();
      (purchases ?? []).forEach((p: any) => {
        const cur = agg.get(p.shop_id) ?? { total: 0, count: 0 };
        cur.total += Number(p.total);
        cur.count += 1;
        agg.set(p.shop_id, cur);
      });
      return (shops ?? []).map((s: any) => ({
        ...s,
        total: agg.get(s.id)?.total ?? 0,
        count: agg.get(s.id)?.count ?? 0,
      }));
    },
  });

  return (
    <>
      <PageHeader title="Monthly Reports" subtitle={`Distribution summary for ${month}`} />
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Shop</TableHead><TableHead>Code</TableHead><TableHead>Transactions</TableHead><TableHead>Total (₹)</TableHead></TableRow></TableHeader>
          <TableBody>
            {(data ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.code}</TableCell>
                <TableCell>{r.count}</TableCell>
                <TableCell>₹{r.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {!data?.length && <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">No shops.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

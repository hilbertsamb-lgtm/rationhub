import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/shop/verify")({ component: ShopVerify });

function ShopVerify() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");

  const { data } = useQuery({
    queryKey: ["verify", term],
    enabled: term.length > 1,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, ration_card_number, mobile, address, email")
        .or(`ration_card_number.ilike.%${term}%,full_name.ilike.%${term}%,mobile.ilike.%${term}%`)
        .limit(20);
      return data ?? [];
    },
  });

  return (
    <>
      <PageHeader title="Search & Verify Users" />
      <div className="mb-4 flex gap-2">
        <Input placeholder="Search by name, ration card or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={() => setTerm(q.trim())}>Search</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(data ?? []).map((u: any) => (
          <Card key={u.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{u.full_name}</div>
                <div className="text-xs text-muted-foreground">Card: {u.ration_card_number ?? "—"}</div>
                <div className="text-sm">Mobile: {u.mobile ?? "—"}</div>
                <div className="text-sm text-muted-foreground">{u.address}</div>
              </div>
              <Link to="/shop/issue" search={{ user: u.id } as any}><Button size="sm">Issue</Button></Link>
            </div>
          </Card>
        ))}
        {term && !data?.length && <p className="text-sm text-muted-foreground">No matches.</p>}
      </div>
    </>
  );
}

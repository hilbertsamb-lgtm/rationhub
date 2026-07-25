import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { productImageUrl } from "@/lib/storage";

export const Route = createFileRoute("/user/products")({ component: UserProducts });

function UserProducts() {
  const { data } = useQuery({
    queryKey: ["products-public"],
    queryFn: async () => (await supabase.from("products").select("*").order("name")).data ?? [],
  });

  return (
    <>
      <PageHeader title="Monthly Products" subtitle="Products available at your ration shop this month." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((p: any) => (
          <Card key={p.id} className="overflow-hidden">
            <div className="aspect-video bg-muted"><img src={productImageUrl(p.image_path)} alt={p.name} className="h-full w-full object-cover" /></div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{p.name}</div>
                <Badge variant={p.status === "available" ? "default" : "destructive"}>{p.status === "available" ? "Available" : "Out"}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">{p.category}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Quota:</span> {p.monthly_quota} {p.unit}</div>
                <div><span className="text-muted-foreground">Price:</span> ₹{p.price}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

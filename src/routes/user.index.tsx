import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { ScrollText, Package, TicketCheck, Bell } from "lucide-react";

export const Route = createFileRoute("/user/")({ component: UserHome });

function UserHome() {
  const { user, profile } = useAuth();
  const { data: announcements } = useQuery({
    queryKey: ["ann-user"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3)).data ?? [],
  });
  const { data: notifCount } = useQuery({
    queryKey: ["notif-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("read", false);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const tiles = [
    { to: "/user/card", label: "Digital Ration Card", icon: ScrollText, tone: "from-amber-500 to-orange-600" },
    { to: "/user/products", label: "Monthly Products", icon: Package, tone: "from-emerald-500 to-teal-600" },
    { to: "/user/book-token", label: "Book Token", icon: TicketCheck, tone: "from-indigo-500 to-indigo-700" },
    { to: "/user/notifications", label: `Notifications (${notifCount ?? 0})`, icon: Bell, tone: "from-rose-500 to-red-600" },
  ] as const;

  return (
    <>
      <PageHeader title={`Namaste, ${profile?.full_name ?? "Citizen"}`} subtitle={profile?.ration_card_number ? `Ration Card: ${profile.ration_card_number}` : "Complete your ration card details in profile."} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to as any}>
            <Card className="p-5 transition hover:shadow-md">
              <div className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br ${t.tone} text-white`}>
                <t.icon className="h-5 w-5" />
              </div>
              <div className="font-semibold">{t.label}</div>
            </Card>
          </Link>
        ))}
      </div>
      <h2 className="mt-8 mb-3 text-lg font-semibold">Announcements</h2>
      <div className="space-y-3">
        {(announcements ?? []).map((a: any) => (
          <Card key={a.id} className="p-4">
            <div className="font-semibold">{a.title}</div>
            <p className="text-sm text-muted-foreground">{a.body}</p>
          </Card>
        ))}
        {!announcements?.length && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
      </div>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useRef } from "react";
import { Download, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/user/card")({ component: UserCard });

function UserCard() {
  const { profile } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  const download = async () => {
    // Use html2canvas via CDN dynamically to avoid extra dependencies
    const { default: html2canvas } = await import("html2canvas");
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2 });
    const link = document.createElement("a");
    link.download = `ration-card-${profile?.ration_card_number ?? "card"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!profile?.ration_card_number) {
    return (
      <>
        <PageHeader title="Digital Ration Card" />
        <Card className="p-6"><p className="text-sm text-muted-foreground">Your ration card number is not yet set. Please contact admin or wait for approval.</p></Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Digital Ration Card" actions={<Button onClick={download}><Download className="mr-1 h-4 w-4" /> Download</Button>} />
      <div ref={ref} className="mx-auto max-w-xl overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-6 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80">Government of India</div>
            <div className="text-lg font-bold">Public Distribution System</div>
            <div className="text-xs opacity-80">Digital Ration Card</div>
          </div>
          <ShieldCheck className="h-10 w-10 opacity-80" />
        </div>
        <div className="mt-6 rounded-lg bg-white/10 p-4 backdrop-blur">
          <div className="text-xs uppercase opacity-70">Card Number</div>
          <div className="font-mono text-2xl tracking-widest">{profile.ration_card_number}</div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div><div className="opacity-70 text-xs">Holder</div><div className="font-semibold">{profile.full_name}</div></div>
          <div><div className="opacity-70 text-xs">Mobile</div><div className="font-semibold">{profile.mobile ?? "—"}</div></div>
          <div className="col-span-2"><div className="opacity-70 text-xs">Address</div><div className="font-medium">{profile.address ?? "—"}</div></div>
        </div>
        <div className="mt-6 flex items-end justify-between text-xs opacity-80">
          <div>Issued via SmartRation</div>
          <div>Valid • {new Date().getFullYear()}</div>
        </div>
      </div>
    </>
  );
}

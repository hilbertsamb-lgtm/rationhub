import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/admin/address-requests")({ component: AdminAddressRequests });

function AdminAddressRequests() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["address-requests"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("address_change_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (!rows?.length) return [];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email, mobile, ration_card_number, address")
        .in("id", userIds);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));

      // Generate signed URLs for documents
      const enriched = await Promise.all(
        rows.map(async (r: any) => {
          let doc_url: string | null = null;
          if (r.document_path) {
            const { data: signed } = await supabase.storage
              .from("address-proofs")
              .createSignedUrl(r.document_path, 60 * 60);
            doc_url = signed?.signedUrl ?? null;
          }
          return { ...r, profile: map.get(r.user_id) ?? null, doc_url };
        }),
      );
      return enriched;
    },
  });

  const decide = useMutation({
    mutationFn: async ({ row, status }: { row: any; status: "approved" | "rejected" }) => {
      const admin_note = status === "rejected" ? (notes[row.id] ?? "").trim() : null;
      if (status === "rejected" && !admin_note) throw new Error("Please enter a rejection reason");

      const { error } = await supabase
        .from("address_change_requests")
        .update({ status, admin_note })
        .eq("id", row.id);
      if (error) throw error;

      if (status === "approved") {
        await supabase.from("profiles").update({ address: row.new_address }).eq("id", row.user_id);
        await supabase.from("notifications").insert({
          user_id: row.user_id,
          message: "Your address change request was approved and your profile has been updated.",
        });
      } else {
        await supabase.from("notifications").insert({
          user_id: row.user_id,
          message: `Your address change request was rejected. Reason: ${admin_note}`,
        });
      }
    },
    onSuccess: () => {
      toast.success("Request updated");
      qc.invalidateQueries({ queryKey: ["address-requests"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <>
      <PageHeader title="Address Change Requests" />
      <div className="space-y-3">
        {(data ?? []).map((r: any) => {
          const isImage = r.document_path && /\.(jpe?g|png)$/i.test(r.document_path);
          return (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{r.profile?.full_name ?? "—"}</div>
                    <Badge
                      variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}
                    >
                      {r.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.profile?.email} · {r.profile?.mobile ?? "—"} · Card: {r.profile?.ration_card_number ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Submitted {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-md border p-3">
                  <div className="text-xs uppercase text-muted-foreground">Old address</div>
                  <div className="text-sm">{r.old_address ?? r.profile?.address ?? "—"}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs uppercase text-muted-foreground">New address</div>
                  <div className="text-sm">{r.new_address}</div>
                </div>
              </div>

              {r.reason && (
                <div className="mt-3 rounded-md border p-3">
                  <div className="text-xs uppercase text-muted-foreground">Reason</div>
                  <div className="text-sm">{r.reason}</div>
                </div>
              )}

              {r.document_path && (
                <div className="mt-3 rounded-md border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs uppercase text-muted-foreground">
                      Proof · {r.document_type ?? "Document"}
                    </div>
                    {r.doc_url && (
                      <a href={r.doc_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <Download className="h-3 w-3" /> Download
                      </a>
                    )}
                  </div>
                  {r.doc_url ? (
                    isImage ? (
                      <a href={r.doc_url} target="_blank" rel="noreferrer">
                        <img src={r.doc_url} alt="Address proof" className="max-h-64 rounded border object-contain" />
                      </a>
                    ) : (
                      <a href={r.doc_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                        <FileText className="h-4 w-4" /> View document
                      </a>
                    )
                  ) : (
                    <div className="text-xs text-muted-foreground">Unable to load document</div>
                  )}
                </div>
              )}

              {r.status === "rejected" && r.admin_note && (
                <div className="mt-3 rounded bg-destructive/10 p-3 text-sm text-destructive">
                  <strong>Rejection reason:</strong> {r.admin_note}
                </div>
              )}

              {r.status === "pending" && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="Rejection reason (required if rejecting)"
                    rows={2}
                    value={notes[r.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => decide.mutate({ row: r, status: "approved" })}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => decide.mutate({ row: r, status: "rejected" })}>Reject</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {!data?.length && <div className="py-10 text-center text-sm text-muted-foreground">No requests.</div>}
      </div>
    </>
  );
}

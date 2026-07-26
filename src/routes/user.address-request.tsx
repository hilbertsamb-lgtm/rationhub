import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/user/address-request")({ component: AddressRequestPage });

const DOC_TYPES = [
  "Aadhaar Card",
  "Voter ID",
  "PAN Card",
  "Driving License",
  "Passport",
  "Electricity Bill",
  "Gas Bill",
];

const ALLOWED = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

function AddressRequestPage() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [newAddress, setNewAddress] = useState("");
  const [reason, setReason] = useState("");
  const [docType, setDocType] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: requests } = useQuery({
    queryKey: ["my-address-requests", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("address_change_requests")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!newAddress.trim()) throw new Error("New address is required");
      if (!reason.trim()) throw new Error("Reason is required");
      if (!docType) throw new Error("Select a document type");
      if (!file) throw new Error("Address proof document is required");
      if (!ALLOWED.includes(file.type)) throw new Error("Only PDF, JPG, JPEG, PNG allowed");
      if (file.size > 5 * 1024 * 1024) throw new Error("File must be under 5MB");

      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("address-proofs").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (up.error) throw up.error;

      const { error } = await supabase.from("address_change_requests").insert({
        user_id: user.id,
        new_address: newAddress,
        reason,
        document_type: docType,
        document_path: path,
        old_address: profile?.address ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Address change request submitted");
      setNewAddress("");
      setReason("");
      setDocType("");
      setFile(null);
      qc.invalidateQueries({ queryKey: ["my-address-requests", user?.id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to submit"),
  });

  return (
    <>
      <PageHeader
        title="Address Change Request"
        subtitle="Submit a new address with supporting proof for admin approval."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4 p-5">
          <div>
            <Label>Current address</Label>
            <Textarea value={profile?.address ?? ""} disabled rows={3} />
          </div>
          <div>
            <Label>New address *</Label>
            <Textarea rows={3} value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Full new address" />
          </div>
          <div>
            <Label>Reason for address change *</Label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why do you need to change your address?" />
          </div>
          <div>
            <Label>Address proof document type *</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><SelectValue placeholder="Select document" /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Upload proof (PDF, JPG, JPEG, PNG) *</Label>
            <Input
              type="file"
              accept="application/pdf,image/jpeg,image/jpg,image/png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && <p className="mt-1 text-xs text-muted-foreground">{file.name} ({Math.round(file.size / 1024)} KB)</p>}
          </div>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? "Submitting…" : "Submit request"}
          </Button>
        </Card>

        <Card className="space-y-3 p-5">
          <h3 className="font-semibold">My requests</h3>
          {!requests?.length && <p className="text-sm text-muted-foreground">No previous requests.</p>}
          {requests?.map((r: any) => (
            <div key={r.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </div>
                <Badge
                  variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}
                >
                  {r.status}
                </Badge>
              </div>
              <div className="mt-2 text-sm"><span className="text-muted-foreground">New:</span> {r.new_address}</div>
              {r.reason && <div className="text-sm"><span className="text-muted-foreground">Reason:</span> {r.reason}</div>}
              {r.status === "rejected" && r.admin_note && (
                <div className="mt-2 rounded bg-destructive/10 p-2 text-sm text-destructive">
                  <strong>Rejection reason:</strong> {r.admin_note}
                </div>
              )}
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

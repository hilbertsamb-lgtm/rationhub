import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const DEFAULT_ADMIN_EMAIL = "admin@ration.gov.in";
const DEFAULT_ADMIN_PASSWORD = "Admin@123";

/** Idempotently ensures the default admin account exists. Public — safe to call from landing page. */
export const ensureDefaultAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Try to find existing user by email
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let existing = list?.users.find((u) => u.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL);

  if (!existing) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "System Administrator" },
    });
    if (error) throw new Error(error.message);
    existing = data.user ?? undefined;
  }

  if (!existing) return { ok: false };

  // Ensure profile
  await supabaseAdmin
    .from("profiles")
    .upsert({ id: existing.id, full_name: "System Administrator", email: DEFAULT_ADMIN_EMAIL });

  // Ensure admin role (remove any 'user' role autosetup)
  await supabaseAdmin.from("user_roles").delete().eq("user_id", existing.id);
  await supabaseAdmin.from("user_roles").insert({ user_id: existing.id, role: "admin" });

  return { ok: true };
});

/** Create a shopkeeper account. Admin only. */
export const createShopkeeper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string; full_name: string; mobile?: string; shop_id?: string }) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        full_name: z.string().min(1),
        mobile: z.string().optional(),
        shop_id: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, mobile: data.mobile },
    });
    if (error) throw new Error(error.message);
    const uid = created.user!.id;

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: uid, full_name: data.full_name, email: data.email, mobile: data.mobile, shop_id: data.shop_id });
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: "shopkeeper" });

    if (data.shop_id) {
      await supabaseAdmin.from("shops").update({ keeper_id: uid }).eq("id", data.shop_id);
    }
    return { id: uid };
  });

/** Delete a shopkeeper account. Admin only. */
export const deleteShopkeeper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Lookup email by ration card number for user login. */
export const emailForRationCard = createServerFn({ method: "POST" })
  .inputValidator((d: { card: string }) => z.object({ card: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const client = createClient(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: email } = await client.rpc("email_for_ration_card", { _card: data.card });
    return { email: (email as string | null) ?? null };
  });

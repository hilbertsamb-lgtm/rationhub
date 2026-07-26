import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

/**
 * Project-specific bearer attacher.
 *
 * Replaces the generated `attachSupabaseAuth`: it proactively refreshes the
 * session when the access token is expired/near expiry (or was signed with a
 * rotated JWT key), which otherwise surfaces as "Unauthorized: Invalid token"
 * from server functions using `requireSupabaseAuth`.
 */
export const attachSupabaseAuthFresh = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | undefined;

    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      token = session?.access_token;

      const expiresAt = session?.expires_at ?? 0;
      const nearExpiry = expiresAt > 0 && expiresAt - Math.floor(Date.now() / 1000) < 60;

      if (session && nearExpiry) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        token = refreshed.session?.access_token ?? token;
      }

      // Validate against the auth server; a token signed with a rotated key
      // will fail here and can be recovered by a refresh.
      if (token) {
        const { error } = await supabase.auth.getUser();
        if (error) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          token = refreshed.session?.access_token ?? undefined;
        }
      }
    } catch {
      token = undefined;
    }

    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);

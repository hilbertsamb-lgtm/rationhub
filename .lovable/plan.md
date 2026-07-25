## Smart Ration Management System — Build Plan

Fully implemented in Lovable (React + TanStack Start + Lovable Cloud). Postgres replaces MySQL, server functions replace Django REST, RLS enforces role permissions.

### Phase 1 — Foundation
- Enable Lovable Cloud (auth, Postgres, storage).
- Design system in `src/styles.css`: government/civic palette (deep indigo + saffron accent, clean typography), no purple gradients, responsive.
- Landing page (`/`) with sections: Hero, About, Features, Benefits, Services, FAQ, Contact, Footer.
- Three login cards on landing → routes to `/login/admin`, `/login/user`, `/login/shopkeeper`.

### Phase 2 — Auth & Roles
- `app_role` enum: `admin`, `user`, `shopkeeper`.
- `user_roles` table + `has_role()` security-definer function (per platform rules).
- `profiles` table: full_name, ration_card_number (unique), mobile, email, address.
- Seed default admin: `admin@ration.gov.in` (password set via Auth Admin API in a migration seed).
- `/login/admin` — rejects non-admin roles with the exact "check README" message. No registration.
- `/login/user` — supports email OR ration card number + password (server fn resolves ration number → email). Includes `/register` for users only.
- `/login/shopkeeper` — no registration; rejects non-shopkeeper with "Invalid Shop Keeper Credentials".
- `/reset-password` page.
- Update `README.md` with default admin credentials section.

### Phase 3 — Schema
Tables (all with RLS + grants):
- `profiles`, `user_roles`
- `shops` (name, code, address, keeper_id → auth user)
- `products` (name, category, image_path, description, stock, unit, status)
- `stocks` (shop_id, product_id, quantity)
- `ration_card_requests` (user_id, status: pending/approved/rejected)
- `address_change_requests`
- `tokens` (user_id, shop_id, month, status, booked_at)
- `purchases` (user_id, shop_id, product_id, qty, month, receipt_no)
- `complaints` (user_id, subject, message, status, response)
- `announcements` (title, body, created_by)
- `notifications` (user_id, message, read)

Storage bucket `products` (public read) for images at `products/<uuid>.<ext>`.

### Phase 4 — Admin Dashboard `/admin/*`
Sidebar layout with: Dashboard, Manage Users, Manage Shop Keepers (create/delete), Manage Ration Shops, Manage Products (with image upload — JPG/JPEG/PNG/WEBP mandatory), Manage Stocks, Approve Card Requests, Approve Address Changes, Monthly Reports, Complaints, Announcements, Settings, Logout. Dashboard cards: totals + pending counts.

### Phase 5 — User Dashboard `/user/*`
Profile, Digital Ration Card (view + PDF/PNG download), Monthly Products, Book Token, Track Token, Purchase History, Raise Complaint, Notifications, Update Profile, Logout.

### Phase 6 — Shop Keeper Dashboard `/shop/*`
Today's Tokens, Search Users, Verify User (by ration card), Issue Monthly Products (creates purchase + decrements stock), Generate Receipt, Update Product Stock, Today's Distribution, Monthly Report, Logout.

### Phase 7 — Polish
- Product images displayed everywhere from the storage bucket.
- Zod validation on all forms.
- SEO head() per route; sitemap.xml + robots.txt.
- Session-aware nav; sign-out hygiene.
- Verify build; smoke-test each login flow.

### Technical notes
- Server functions in `src/lib/*.functions.ts`; privileged ops (creating shopkeepers, approving requests) use `requireSupabaseAuth` + role check + `supabaseAdmin` loaded inside handler.
- Route gating: `_authenticated/route.tsx` (integration-managed) + nested `_authenticated/_admin`, `_user`, `_shopkeeper` layouts with `hasRole` checks.
- Ration-card-number login: public server fn looks up email by ration number (narrow anon SELECT on a view exposing only that mapping), then client calls `signInWithPassword`.

### Scope note
This is a large system. I'll build it in one comprehensive pass but some flows (PDF export styling, monthly report visualizations) will be functional-first and can be refined after you try them.

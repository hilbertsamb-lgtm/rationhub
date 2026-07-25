# Smart Ration Management System

A modern web application to digitize the Public Distribution System — manage ration shops, users, products, monthly distribution, tokens and complaints in one place.

## Roles

- **Admin** — manages the entire system (users, shopkeepers, shops, products, approvals, reports).
- **User (citizen)** — registers with a ration card number, views the digital ration card, books monthly tokens, tracks purchases, raises complaints.
- **Shop Keeper** — verifies users, issues monthly products, generates receipts, updates stock.

## Default Admin Credentials

The default admin account is created automatically the first time the app loads.

```
Email    : admin@ration.gov.in
Password : Admin@123
```

Use these credentials at the **Admin Login** page. Change the password after your first sign-in from the Admin → Settings screen.

## Registration

- **Only Users can register** through the Registration page.
- **Admins and Shop Keepers do not have public registration.** Shop Keeper accounts are created by the Admin from the Admin Dashboard.

## Built with

- React 19 + TanStack Start (file-based routing, SSR)
- Tailwind CSS v4
- Lovable Cloud (Postgres, Auth, Storage) — production-grade backend

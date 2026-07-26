import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { LayoutDashboard, TicketCheck, Search, PackageCheck, Boxes, FileText, Receipt, PackagePlus } from "lucide-react";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "Shop Keeper — SmartRation" }, { name: "description", content: "Shop Keeper dashboard." }] }),
  component: ShopLayout,
});

const nav = [
  { to: "/shop", label: "Dashboard", icon: LayoutDashboard },
  { to: "/shop/tokens", label: "Today's Tokens", icon: TicketCheck },
  { to: "/shop/verify", label: "Search & Verify", icon: Search },
  { to: "/shop/issue", label: "Issue Products", icon: PackageCheck },
  { to: "/shop/receipts", label: "Receipts", icon: Receipt },
  { to: "/shop/stock", label: "Update Stock", icon: Boxes },
  { to: "/shop/stock-requests", label: "Stock Requests", icon: PackagePlus },
  { to: "/shop/report", label: "Monthly Report", icon: FileText },
];

function ShopLayout() {
  return <DashboardLayout role="shopkeeper" title="Shop Portal" nav={nav} tone="from-emerald-600 to-teal-800" />;
}

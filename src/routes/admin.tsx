import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Boxes,
  ClipboardCheck,
  MapPin,
  FileText,
  MessageSquareWarning,
  Megaphone,
  Settings,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — SmartRation" }, { name: "description", content: "Administrator dashboard." }] }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Manage Users", icon: Users },
  { to: "/admin/shopkeepers", label: "Manage Shop Keepers", icon: Store },
  { to: "/admin/shops", label: "Ration Shops", icon: MapPin },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/stocks", label: "Stocks", icon: Boxes },
  { to: "/admin/card-requests", label: "Card Requests", icon: ClipboardCheck },
  { to: "/admin/address-requests", label: "Address Changes", icon: ClipboardCheck },
  { to: "/admin/reports", label: "Monthly Reports", icon: FileText },
  { to: "/admin/complaints", label: "Complaints", icon: MessageSquareWarning },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminLayout() {
  return <DashboardLayout role="admin" title="Admin Panel" nav={nav} tone="from-indigo-600 to-indigo-900" />;
}

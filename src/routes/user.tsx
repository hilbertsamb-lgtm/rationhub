import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  LayoutDashboard,
  ScrollText,
  Package,
  TicketCheck,
  Route as RouteIcon,
  Receipt,
  MessageSquareWarning,
  Bell,
  UserCog,
} from "lucide-react";

export const Route = createFileRoute("/user")({
  head: () => ({ meta: [{ title: "My Dashboard — SmartRation" }, { name: "description", content: "Citizen dashboard." }] }),
  component: UserLayout,
});

const nav = [
  { to: "/user", label: "Dashboard", icon: LayoutDashboard },
  { to: "/user/card", label: "Digital Ration Card", icon: ScrollText },
  { to: "/user/products", label: "Monthly Products", icon: Package },
  { to: "/user/book-token", label: "Book Token", icon: TicketCheck },
  { to: "/user/tokens", label: "Track Tokens", icon: RouteIcon },
  { to: "/user/purchases", label: "Purchase History", icon: Receipt },
  { to: "/user/complaints", label: "Complaints", icon: MessageSquareWarning },
  { to: "/user/notifications", label: "Notifications", icon: Bell },
  { to: "/user/profile", label: "My Profile", icon: UserCog },
];

function UserLayout() {
  return <DashboardLayout role="user" title="Citizen Portal" nav={nav} tone="from-amber-500 to-orange-700" />;
}

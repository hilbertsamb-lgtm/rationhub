import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AuthShell({
  title,
  subtitle,
  tone,
  children,
}: {
  title: string;
  subtitle?: string;
  tone: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className={`relative hidden bg-gradient-to-br ${tone} p-10 text-white md:flex md:flex-col md:justify-between`}>
        <Link to="/" className="inline-flex items-center gap-2 text-sm opacity-90 hover:opacity-100">
          <ScrollText className="h-5 w-5" /> SmartRation
        </Link>
        <div>
          <h2 className="text-4xl font-bold leading-tight">{title}</h2>
          {subtitle && <p className="mt-3 max-w-md text-white/85">{subtitle}</p>}
        </div>
        <div className="text-xs opacity-70">Smart Ration Management System</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <Card className="p-6 shadow-soft">{children}</Card>
        </div>
      </div>
    </div>
  );
}

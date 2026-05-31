import { Outlet, NavLink, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, GraduationCap, Scale, Users, Briefcase, Heart,
  BarChart3, Handshake, Settings, Menu, Shield, LogOut, ChevronRight, Play, Home,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LayoutActionBar from "@/components/layouts/LayoutActionBar";
import { useT } from "@/hooks/useT";

const GovernmentLayout = () => {
  const t = useT();
  const { signOut, user, session, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: "/", icon: Home, label: t("practLayout.home") },
    { to: "/gov/dashboard", icon: LayoutDashboard, label: t("practLayout.dashboard") },
    { to: "/gov/citizenship", icon: GraduationCap, label: t("gov.citizenshipPrograms") },
    { to: "/gov/legal-orientation", icon: Scale, label: t("gov.legalOrientation") },
    { to: "/gov/integration", icon: Heart, label: t("gov.integrationPrograms") },
    { to: "/gov/entrepreneurship", icon: Briefcase, label: t("gov.entrepreneurPrograms") },
    { to: "/gov/participants", icon: Users, label: t("gov.participants2") },
    { to: "/gov/reporting", icon: BarChart3, label: t("gov.reporting") },
    { to: "/gov/demo-walkthrough", icon: Play, label: t("gov.demoWalkthrough") },
    { to: "/gov/settings", icon: Settings, label: t("gov.settings") },
  ];

  const { data: institutionMembership, isLoading: membershipLoading } = useQuery({
    queryKey: ["institution-membership", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("institution_users")
        .select("id, institution_id, role, institutions(name)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1);
      return data?.[0] ?? null;
    },
    enabled: !!user?.id,
  });

  if (authLoading || membershipLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!session) return <Navigate to="/login" replace />;

  if (!institutionMembership && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-bold">{t("gov.accessRestricted")}</h2>
          <p className="mb-4 text-muted-foreground">{t("gov.accessRestrictedDesc")}</p>
          <Button onClick={() => navigate("/signup")} className="mr-2">{t("common.signUp")}</Button>
          <Button variant="outline" onClick={() => navigate("/")}>{t("common.goHome")}</Button>
        </div>
      </div>
    );
  }

  const institutionName = (institutionMembership as any)?.institutions?.name || "Institution";

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}>
        <div className="border-b border-sidebar-border p-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
              <Shield className="h-4 w-4 text-[hsl(var(--gold))]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-bold leading-tight tracking-wide text-sidebar-foreground">{t("gov.govInstitutions")}</h2>
              <p className="truncate text-[10px] uppercase tracking-wider text-sidebar-foreground/60" title={institutionName}>{institutionName}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-2">
          <button
            onClick={() => { navigate("/gov/partnerships"); setSidebarOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground/80"
          >
            <Handshake className="h-3.5 w-3.5" />
            {t("gov.partnershipPage")}
            <ChevronRight className="ml-auto h-3 w-3" />
          </button>
        </div>

        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 text-[9px] leading-relaxed text-sidebar-foreground/40">{t("gov.disclaimerLong")}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("common.signOut")}
          </Button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="ml-0 flex min-h-screen flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur lg:px-6">
          <button className="mr-3 lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
          <h1 className="text-sm font-semibold text-foreground">{t("gov.portalTitle")}</h1>
          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <span className="hidden text-xs text-muted-foreground sm:block">{user?.email}</span>
          </div>
        </header>
        <LayoutActionBar showSaveContinue />
        <main className="flex-1 p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
};

export default GovernmentLayout;

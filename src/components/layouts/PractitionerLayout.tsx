import { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Briefcase, FileText, Calendar, CheckSquare, Users, LogOut, Menu, X, CreditCard, Gift, DollarSign, ShieldCheck, Home, GraduationCap, Scale, Rocket } from "lucide-react";
import AffiliateNotificationBell from "@/components/referrals/AffiliateNotificationBell";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import domeLogo from "@/assets/dome-logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LayoutActionBar from "@/components/layouts/LayoutActionBar";
import { useT } from "@/hooks/useT";

const PractitionerLayout = () => {
  const t = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, roles, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const getRoleBadge = () => {
    if (roles.includes("attorney")) return t("nav.roleLawyer");
    if (roles.includes("practitioner") || roles.includes("admin")) return t("nav.roleArDoj");
    return t("nav.roleClient");
  };
  const roleBadge = getRoleBadge();

  const navItems = [
    { to: "/", icon: Home, label: t("practLayout.home") },
    { to: "/firm", icon: Scale, label: "Law Firm Portal" },
    { to: "/dashboard", icon: LayoutDashboard, label: t("practLayout.dashboard") },
    { to: "/agents", icon: Rocket, label: t("practLayout.agents") },
    { to: "/cases", icon: Briefcase, label: t("practLayout.cases") },
    { to: "/documents", icon: FileText, label: t("practLayout.documents") },
    { to: "/calendar", icon: Calendar, label: t("practLayout.calendar") },
    { to: "/tasks", icon: CheckSquare, label: t("practLayout.tasks") },
    { to: "/clients", icon: Users, label: t("practLayout.clients") },
    { to: "/pricing", icon: CreditCard, label: t("practLayout.pricing") },
    { to: "/affiliate", icon: Rocket, label: "Earn with D.O.M.E." },
    { to: "/english/teach", icon: GraduationCap, label: t("practLayout.englishCenter") },
    { to: "/admin/referrals", icon: Gift, label: t("practLayout.referrals"), adminOnly: true },
    { to: "/admin/revenue", icon: DollarSign, label: t("practLayout.revenue"), adminOnly: true },
    { to: "/worldfoundationdigitalease", icon: ShieldCheck, label: t("practLayout.ccgvAdmin"), adminOnly: true },
  ];

  const handleSignOut = async () => { await signOut(); navigate("/login"); };
  const handleNavClick = () => { if (isMobile) setSidebarOpen(false); };

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 p-5">
        <img src={domeLogo} alt="D.O.M.E." className="h-10 w-10 rounded-lg bg-white/10 object-contain p-0.5" />
        <div>
          <h1 className="font-display text-lg font-bold leading-tight">D.O.M.E.</h1>
          <p className="text-xs text-sidebar-foreground/60">{t("practLayout.immigrationPractice")}</p>
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems
          .filter(item => !("adminOnly" in item && item.adminOnly) || isAdmin)
          .map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-secondary">{roleBadge}</p>
          </div>
          <button onClick={handleSignOut} className="text-sidebar-foreground/50 hover:text-sidebar-foreground"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {isMobile && (
          <div className="fixed left-0 right-0 top-0 z-30 flex items-center gap-3 border-b bg-card px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></Button>
            <img src={domeLogo} alt="D.O.M.E." className="h-7 w-7 object-contain" />
            <span className="font-display text-sm font-bold">D.O.M.E.</span>
            <div className="ml-auto flex items-center gap-2">
              <AffiliateNotificationBell />
              <LanguageSwitcher variant="compact" />
              <span className="rounded border border-secondary/30 bg-secondary/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-secondary">{roleBadge}</span>
            </div>
          </div>
        )}

        {isMobile && sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />}

        <aside className={cn(
          "bg-sidebar text-sidebar-foreground flex shrink-0 flex-col transition-transform duration-200",
          isMobile ? "fixed inset-y-0 left-0 z-50 w-64 " + (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "w-64",
        )}>
          {sidebarContent}
        </aside>

        <div className={cn("flex flex-1 flex-col bg-background", isMobile && "pt-14")}>
          <LayoutActionBar showSaveContinue />
          <main className="flex-1 overflow-auto"><Outlet /></main>
        </div>
      </div>
    </div>
  );
};

export default PractitionerLayout;

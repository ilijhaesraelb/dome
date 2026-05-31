import { Link, useLocation, Outlet } from "react-router-dom";
import {
  Home, FileText, Shield, Download, HelpCircle, Clock,
  MessageSquare, Settings, Bell, BellOff, FolderOpen,
  Menu, ChevronLeft, LogOut, Calculator, Rocket,
} from "lucide-react";
import AffiliateNotificationBell from "@/components/referrals/AffiliateNotificationBell";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import domeLogo from "@/assets/dome-logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/hooks/useT";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/portal", icon: Home, label: "Dashboard", end: true },
  { to: "/portal/forms", icon: FileText, label: "My Forms" },
  { to: "/portal/passport", icon: Shield, label: "My Profile" },
  { to: "/portal/documents", icon: FolderOpen, label: "Documents" },
  { to: "/portal/messages", icon: MessageSquare, label: "Messages" },
  { to: "/tax", icon: Calculator, label: "Tax Services" },
  { to: "/portal/timeline", icon: Clock, label: "Timeline" },
  { to: "/portal/packet", icon: Download, label: "Export" },
  { to: "/portal/attorney", icon: HelpCircle, label: "Help" },
  { to: "/affiliate", icon: Rocket, label: "Earn with D.O.M.E." },
];

const MOBILE_NAV = [
  { to: "/portal", icon: Home, label: "Home", end: true },
  { to: "/portal/forms", icon: FileText, label: "Forms" },
  { to: "/portal/documents", icon: FolderOpen, label: "Docs" },
  { to: "/portal/packet", icon: Download, label: "Export" },
  { to: "/portal/attorney", icon: HelpCircle, label: "Help" },
];

const ClientLayout = () => {
  const t = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isSubscribed, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  // Check if we're in the form workspace (full-screen mode)
  const isFormWorkspace = /^\/portal\/forms\/[^/]+$/.test(location.pathname);
  if (isFormWorkspace) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ═══ Desktop Sidebar ═══ */}
      {!isMobile && (
        <aside className={cn(
          "fixed left-0 top-0 z-30 h-screen border-r bg-sidebar flex flex-col transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-56"
        )}>
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 rounded-full object-contain shrink-0" />
            {!sidebarCollapsed && (
              <span className="font-display font-bold text-sm text-sidebar-foreground">D.O.M.E.</span>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="ml-auto text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            >
              {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Links */}
          <ScrollArea className="flex-1 py-2">
            <nav className="space-y-0.5 px-2">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.to, item.end);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className={cn("w-4.5 h-4.5 shrink-0", active && "text-sidebar-primary")} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Bottom section */}
          <div className="border-t border-sidebar-border p-3 space-y-2">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 px-1 mb-2">
                <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-foreground">
                  {displayName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-1">
              <LanguageSwitcher variant="compact" />
              <AffiliateNotificationBell />
              <button
                onClick={isSubscribed ? unsubscribe : subscribe}
                disabled={pushLoading}
                className="rounded-lg p-2 transition-colors text-sidebar-foreground/60 hover:bg-sidebar-accent/50"
                title={isSubscribed ? "Disable notifications" : "Enable notifications"}
              >
                {isSubscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className={cn(
                "w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <LogOut className="w-4 h-4" />
              {!sidebarCollapsed && <span className="text-xs">Sign Out</span>}
            </Button>
          </div>
        </aside>
      )}

      {/* ═══ Main Content ═══ */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen",
        !isMobile && (sidebarCollapsed ? "ml-16" : "ml-56")
      )}>
        {/* Desktop top bar */}
        {!isMobile && (
          <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 h-12 flex items-center px-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/portal" className="hover:text-foreground transition-colors">Dashboard</Link>
              {location.pathname !== "/portal" && (
                <>
                  <span>/</span>
                  <span className="text-foreground font-medium capitalize">
                    {location.pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ")}
                  </span>
                </>
              )}
            </div>
          </header>
        )}

        {/* Mobile top bar */}
        {isMobile && (
          <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <img src={domeLogo} alt="D.O.M.E." className="w-7 h-7 rounded-full object-contain" />
              <span className="font-display font-bold text-sm">D.O.M.E.</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={isSubscribed ? unsubscribe : subscribe}
                disabled={pushLoading}
                className="rounded-full p-2 transition-colors hover:bg-muted"
              >
                {isSubscribed ? <Bell className="h-4 w-4 text-secondary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
              </button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
        )}

        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ═══ Mobile Bottom Nav ═══ */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.05)] safe-bottom">
          <div className="mx-auto flex max-w-lg items-center justify-around">
            {MOBILE_NAV.map((item) => {
              const active = isActive(item.to, item.end);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex min-w-[50px] flex-col items-center gap-0.5 px-3 py-2.5 text-[11px] font-medium transition-all duration-200 tap-target",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
                  <span className={cn(active && "font-semibold")}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default ClientLayout;

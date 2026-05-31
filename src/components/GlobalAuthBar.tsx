import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Rocket } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useT } from "@/hooks/useT";

const HIDDEN_ROUTES = ["/login", "/signup", "/reset-password"];

const GlobalAuthBar = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();

  if (HIDDEN_ROUTES.includes(location.pathname)) return null;
  if (loading) return null;
  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-1.5">
        <Link
          to="/affiliate"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-warning to-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground transition-all hover:scale-105 shadow-[0_0_8px_hsl(var(--warning)/0.5),0_0_16px_hsl(var(--secondary)/0.3)] animate-pulse"
        >
          <Rocket className="h-3.5 w-3.5" />
          {t("earnWithDome.label")}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default GlobalAuthBar;

/**
 * TaxStaffRoute — Protects routes that require tax_staff membership.
 * Only users in the tax_staff table with is_active=true can access.
 */
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert } from "lucide-react";

interface TaxStaffRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // e.g. ["owner_admin", "cpa_reviewer", "accountant"]
}

const TaxStaffRoute = ({ children, allowedRoles }: TaxStaffRouteProps) => {
  const { session, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!session?.user) { setChecking(false); return; }

    const check = async () => {
      const { data } = await supabase
        .from("tax_staff")
        .select("role, is_active")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (data) {
        if (allowedRoles && allowedRoles.length > 0) {
          setAuthorized(allowedRoles.includes(data.role));
        } else {
          setAuthorized(true);
        }
      } else {
        setAuthorized(false);
      }
      setChecking(false);
    };

    check();
  }, [session?.user?.id, authLoading, allowedRoles]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <ShieldAlert className="w-16 h-16 text-destructive/60" />
        <h1 className="text-2xl font-display font-bold">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">
          You do not have permission to access this area. This section is restricted to authorized tax staff only.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default TaxStaffRoute;

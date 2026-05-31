import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "practitioner" | "client" | "admin";
}

const PRACTITIONER_TIER_ROLES = ["practitioner", "admin", "attorney", "paralegal", "translator"];

const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
  const { session, loading, roles } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const isPractitionerTier = roles.some((r) => PRACTITIONER_TIER_ROLES.includes(r));
  const isAdmin = roles.includes("admin");
  const isClient = roles.includes("client");

  if (requireRole === "admin" && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireRole === "practitioner" && !isPractitionerTier) {
    return <Navigate to="/portal" replace />;
  }

  if (requireRole === "client" && !isClient && isPractitionerTier) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

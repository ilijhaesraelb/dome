import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getPlanByProductId, type StripePlan } from "@/lib/stripe-plans";
import { logAuditEvent } from "@/lib/audit-logger";

type AppRole = "admin" | "practitioner" | "attorney" | "paralegal" | "translator" | "client";

interface SubscriptionState {
  subscribed: boolean;
  plan: StripePlan | null;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  isPractitioner: boolean;
  isClient: boolean;
  isAdmin: boolean;
  subscription: SubscriptionState;
  refreshSubscription: () => Promise<void>;
}

const defaultSubscription: SubscriptionState = {
  subscribed: false,
  plan: null,
  productId: null,
  subscriptionEnd: null,
  loading: true,
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  roles: [],
  loading: true,
  signOut: async () => {},
  isPractitioner: false,
  isClient: false,
  isAdmin: false,
  subscription: defaultSubscription,
  refreshSubscription: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (data) {
      setRoles(data.map((r) => r.role as AppRole));
    }
  };

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        setSubscription({ ...defaultSubscription, loading: false });
        return;
      }
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });
      if (error) {
        // 401/session errors are expected when session expires — don't log as error
        setSubscription({ ...defaultSubscription, loading: false });
        return;
      }
      const plan = data?.product_id ? getPlanByProductId(data.product_id) : null;
      setSubscription({
        subscribed: data?.subscribed ?? false,
        plan: plan ?? null,
        productId: data?.product_id ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
        loading: false,
      });
    } catch {
      setSubscription({ ...defaultSubscription, loading: false });
    }
  }, []);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchRoles(session.user.id), 0);
          setTimeout(() => checkSubscription(), 100);

          // Audit auth events
          if (event === "SIGNED_IN") {
            logAuditEvent(session.user.id, {
              module: "auth",
              action_type: "login",
              human_label: "User signed in",
            }).catch(() => {});
          } else if (event === "USER_UPDATED") {
            logAuditEvent(session.user.id, {
              module: "auth",
              action_type: "password_reset",
              human_label: "User account updated",
            }).catch(() => {});
          }
        } else {
          setRoles([]);
          setSubscription({ ...defaultSubscription, loading: false });
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
        checkSubscription();
      } else {
        setSubscription({ ...defaultSubscription, loading: false });
      }
      setLoading(false);
    });

    // Refresh subscription every 60 seconds
    const interval = setInterval(checkSubscription, 60_000);

    return () => {
      authSub.unsubscribe();
      clearInterval(interval);
    };
  }, [checkSubscription]);

  const signOut = async () => {
    if (user?.id) {
      await logAuditEvent(user.id, {
        module: "auth",
        action_type: "logout",
        human_label: "User signed out",
      }).catch(() => {});
    }
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRoles([]);
    setSubscription({ ...defaultSubscription, loading: false });
  };

  const isPractitioner = roles.includes("practitioner") || roles.includes("admin") || roles.includes("attorney") || roles.includes("paralegal");
  const isClient = roles.includes("client");
  const isAdmin = roles.includes("admin");

  return (
    <AuthContext.Provider value={{ session, user, roles, loading, signOut, isPractitioner, isClient, isAdmin, subscription, refreshSubscription: checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Bell, DollarSign, Users, Wallet, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const iconMap: Record<string, React.ElementType> = {
  new_referral: Users,
  new_commission: DollarSign,
  payout_approved: Wallet,
  payout_paid: Wallet,
  payout_held: Wallet,
};

const AffiliateNotificationBell = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: affiliate } = useQuery({
    queryKey: ["my-affiliate-id", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliates")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: notifications } = useQuery({
    queryKey: ["affiliate-notifications", affiliate?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_notifications")
        .select("*")
        .eq("affiliate_id", affiliate!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!affiliate,
    refetchInterval: 30000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications?.filter(n => !n.read).map(n => n.id) || [];
      if (!unread.length) return;
      for (const id of unread) {
        await supabase
          .from("affiliate_notifications")
          .update({ read: true })
          .eq("id", id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["affiliate-notifications"] }),
  });

  if (!affiliate) return null;

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="w-3 h-3" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto">
          {!notifications?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
          ) : (
            notifications.map(n => {
              const Icon = iconMap[n.type] || Bell;
              return (
                <div key={n.id} className={`flex items-start gap-3 p-3 border-b last:border-0 ${!n.read ? "bg-accent/50" : ""}`}>
                  <Icon className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-secondary shrink-0 mt-1.5" />}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AffiliateNotificationBell;

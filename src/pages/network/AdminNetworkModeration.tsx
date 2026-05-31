import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackButton from "@/components/BackButton";
import { toast } from "sonner";
import { Check, X, Globe, Heart, MapPin } from "lucide-react";
import { useT } from "@/hooks/useT";

const AdminNetworkModeration = () => {
  const t = useT();
  const queryClient = useQueryClient();

  const { data: pendingListings = [] } = useQuery({
    queryKey: ["admin-pending-network-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("network_listings")
        .select("*")
        .eq("status", "pending_review")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: pendingStories = [] } = useQuery({
    queryKey: ["admin-pending-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_stories")
        .select("*")
        .eq("is_approved", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: pendingMapEntries = [] } = useQuery({
    queryKey: ["admin-pending-map-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("success_map_entries")
        .select("*")
        .eq("is_approved", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const approveListing = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase
        .from("network_listings")
        .update({
          status: approve ? "published" as any : "rejected" as any,
          reviewed_at: new Date().toISOString(),
          published_at: approve ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-network-listings"] });
      toast.success("Listing updated");
    },
  });

  const approveStory = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      if (approve) {
        const { error } = await supabase.from("community_stories").update({ is_approved: true }).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("community_stories").delete().eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-stories"] });
      toast.success("Story updated");
    },
  });

  const approveMapEntry = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      if (approve) {
        const { error } = await supabase.from("success_map_entries").update({ is_approved: true }).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("success_map_entries").delete().eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-map-entries"] });
      toast.success("Map entry updated");
    },
  });

  return (
    <div className="space-y-6">
      <BackButton />
      <h1 className="font-display text-2xl font-bold">{t("netModeration.title")}</h1>

      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings" className="gap-1.5">
            <Globe className="w-4 h-4" /> {t("netModeration.listings")} ({pendingListings.length})
          </TabsTrigger>
          <TabsTrigger value="stories" className="gap-1.5">
            <Heart className="w-4 h-4" /> {t("netModeration.stories")} ({pendingStories.length})
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-1.5">
            <MapPin className="w-4 h-4" /> {t("netModeration.map")} ({pendingMapEntries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-4 mt-4">
          {pendingListings.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">{t("netModeration.noPendingListings")}</CardContent></Card>
          ) : pendingListings.map((l: any) => (
            <Card key={l.id}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">{(l.category as string).replace(/_/g, " ")}</Badge>
                    <h3 className="font-display font-semibold">{l.title}</h3>
                    <p className="text-sm text-muted-foreground">{l.organization_name}</p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{l.summary}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground gap-1" onClick={() => approveListing.mutate({ id: l.id, approve: true })}>
                      <Check className="w-3 h-3" /> {t("netModeration.approve")}
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => approveListing.mutate({ id: l.id, approve: false })}>
                      <X className="w-3 h-3" /> {t("netModeration.reject")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="stories" className="space-y-4 mt-4">
          {pendingStories.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">{t("netModeration.noPendingStories")}</CardContent></Card>
          ) : pendingStories.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold">{s.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{s.story}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground gap-1" onClick={() => approveStory.mutate({ id: s.id, approve: true })}>
                      <Check className="w-3 h-3" /> {t("netModeration.approve")}
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => approveStory.mutate({ id: s.id, approve: false })}>
                      <X className="w-3 h-3" /> {t("netModeration.reject")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="map" className="space-y-4 mt-4">
          {pendingMapEntries.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">{t("netModeration.noPendingMap")}</CardContent></Card>
          ) : pendingMapEntries.map((m: any) => (
            <Card key={m.id}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold">{m.milestone}</h3>
                    <p className="text-sm text-muted-foreground">{m.case_type} · {m.location_label}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground gap-1" onClick={() => approveMapEntry.mutate({ id: m.id, approve: true })}>
                      <Check className="w-3 h-3" /> {t("netModeration.approve")}
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => approveMapEntry.mutate({ id: m.id, approve: false })}>
                      <X className="w-3 h-3" /> {t("netModeration.reject")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNetworkModeration;

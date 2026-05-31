import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import { toast } from "sonner";
import { Heart, Star, Award, Share2, MessageCircle, Plus, Send } from "lucide-react";
import { useT } from "@/hooks/useT";

const MILESTONE_ICONS: Record<string, any> = {
  visa_approved: Star, green_card: Award, citizenship: Award, business_launched: Star, default: Heart,
};

const CommunityHub = () => {
  const t = useT();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", story: "", milestone_type: "success_story", is_anonymous: true, display_name: "", location_approx: "" });

  const { data: stories = [], refetch } = useQuery({
    queryKey: ["community-stories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("community_stories").select("*").eq("is_approved", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async () => {
    if (!user) { toast.error(t("community.signInRequired")); return; }
    if (!form.title || !form.story) { toast.error(t("community.titleRequired")); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("community_stories").insert({
        user_id: user.id, title: form.title, story: form.story, category: form.milestone_type,
        milestone_type: form.milestone_type, is_anonymous: form.is_anonymous,
        display_name: form.is_anonymous ? "Anonymous" : form.display_name || "D.O.M.E. User",
        location_approx: form.location_approx || null,
      });
      if (error) throw error;
      toast.success(t("community.submitted"));
      setShowForm(false);
      setForm({ title: "", story: "", milestone_type: "success_story", is_anonymous: true, display_name: "", location_approx: "" });
      refetch();
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/network" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">{t("netHome.communityStories")}</span>
          </Link>
          <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-1" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" /> {t("community.shareStory")}
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <BackButton />
        <div className="text-center mt-4 mb-10">
          <h1 className="font-display text-2xl sm:text-3xl font-bold">{t("community.title")}</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">{t("community.subtitle")}</p>
        </div>

        {showForm && (
          <Card className="mb-8 border-secondary/30">
            <CardHeader><CardTitle>{t("community.shareYourStory")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>{t("community.storyTitle")} *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>{t("community.yourStory")} *</Label><Textarea value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} rows={5} /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>{t("community.milestoneType")}</Label><Input value={form.milestone_type} onChange={(e) => setForm({ ...form, milestone_type: e.target.value })} /></div>
                <div><Label>{t("community.approxLocation")}</Label><Input value={form.location_approx} onChange={(e) => setForm({ ...form, location_approx: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="anonymous" checked={form.is_anonymous} onCheckedChange={(v) => setForm({ ...form, is_anonymous: !!v })} />
                <label htmlFor="anonymous" className="text-sm">{t("community.postAnonymously")}</label>
              </div>
              {!form.is_anonymous && (<div><Label>{t("community.displayName")}</Label><Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>)}
              <Button onClick={handleSubmit} disabled={loading} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2">
                <Send className="w-4 h-4" /> {loading ? t("community.submitting") : t("community.submitStory")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("community.reviewNotice")}</p>
            </CardContent>
          </Card>
        )}

        {stories.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg mb-2">{t("community.noStories")}</h3>
              <p className="text-muted-foreground mb-4">{t("community.beFirst")}</p>
              <Button onClick={() => setShowForm(true)} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">{t("community.shareYourStory")}</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {stories.map((story: any) => {
              const Icon = MILESTONE_ICONS[story.milestone_type] || MILESTONE_ICONS.default;
              return (
                <Card key={story.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center"><Icon className="w-5 h-5 text-secondary" /></div>
                      {story.milestone_type && <Badge variant="outline" className="text-xs">{story.milestone_type.replace(/_/g, " ")}</Badge>}
                    </div>
                    <h3 className="font-display font-semibold text-lg">{story.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{story.is_anonymous ? "Anonymous" : story.display_name}{story.location_approx && ` · ${story.location_approx}`}</p>
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-4">{story.story}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityHub;

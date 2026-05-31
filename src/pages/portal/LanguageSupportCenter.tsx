import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Languages, Headphones, FileText, Calendar, Clock, Star, Users, ArrowRight, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { getLangFlag, getLangLabel } from "@/hooks/useTranslation";
import BackButton from "@/components/BackButton";
import SessionRatingDialog from "@/components/communication/SessionRatingDialog";

const LanguageSupportCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [docRequests, setDocRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    const [r, b, d] = await Promise.all([
      supabase.from("language_support_requests" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("interpreter_bookings" as any).select("*").eq("user_id", user.id).order("scheduled_at", { ascending: true }).limit(10),
      supabase.from("document_translation_requests" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);
    setRequests((r.data as any[]) || []);
    setBookings((b.data as any[]) || []);
    setDocRequests((d.data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "bg-green-100 text-green-800";
      case "confirmed": case "assigned": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <BackButton />

      <div className="bg-primary rounded-xl p-6 text-primary-foreground">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Languages className="w-7 h-7" /> Language Support Center
        </h1>
        <p className="text-primary-foreground/70 text-sm mt-1">
          Live interpreter booking and multilingual communication support
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button onClick={() => navigate("/portal/language-support/request")} className="h-auto p-4 flex flex-col items-center gap-2" variant="outline">
          <Headphones className="w-6 h-6 text-secondary" />
          <span className="font-semibold text-sm">Request Interpreter</span>
          <span className="text-[10px] text-muted-foreground">Live meeting support</span>
        </Button>
        <Button onClick={() => navigate("/portal/language-support/translate")} className="h-auto p-4 flex flex-col items-center gap-2" variant="outline">
          <FileText className="w-6 h-6 text-secondary" />
          <span className="font-semibold text-sm">Request Translator</span>
          <span className="text-[10px] text-muted-foreground">Document translation</span>
        </Button>
        <Button onClick={() => navigate("/portal/language-support/book")} className="h-auto p-4 flex flex-col items-center gap-2" variant="outline">
          <Calendar className="w-6 h-6 text-secondary" />
          <span className="font-semibold text-sm">Book Language Support</span>
          <span className="text-[10px] text-muted-foreground">Schedule a session</span>
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50 border">
        <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground">
          Interpreter and translation support are provided to improve communication access. D.O.M.E. does not provide legal advice.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <Tabs defaultValue="requests">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests">My Requests</TabsTrigger>
            <TabsTrigger value="bookings">Sessions</TabsTrigger>
            <TabsTrigger value="translations">Translations</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-3 mt-4">
            {requests.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No requests yet. Use the buttons above to get started.</CardContent></Card>
            ) : requests.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm capitalize">{r.support_type?.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{getLangFlag(r.preferred_language)} {getLangLabel(r.preferred_language)} · {r.urgency?.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge className={statusColor(r.status)}>{r.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-3 mt-4">
            {bookings.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No sessions. Book one from the directory.</CardContent></Card>
            ) : bookings.map((b: any) => (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{b.language_pair}</p>
                      <p className="text-xs text-muted-foreground capitalize">{b.support_type?.replace(/_/g, " ")} · {b.duration_minutes} min</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(b.scheduled_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={statusColor(b.status)}>{b.status}</Badge>
                      {b.meeting_link && b.status !== "completed" && (
                        <Button size="sm" variant="secondary" onClick={() => window.open(b.meeting_link, "_blank")}>Join</Button>
                      )}
                      {b.status === "completed" && (
                        <Button size="sm" variant="outline" onClick={() => setRatingBookingId(b.id)}>
                          <Star className="w-3.5 h-3.5 mr-1" /> Rate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="translations" className="space-y-3 mt-4">
            {docRequests.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No translation requests yet.</CardContent></Card>
            ) : docRequests.map((d: any) => (
              <Card key={d.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{d.document_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {getLangFlag(d.source_language)} → {getLangFlag(d.target_language)} · {d.request_type?.replace(/_/g, " ")}
                    </p>
                    {d.deadline && <p className="text-[10px] text-muted-foreground mt-1">Due: {new Date(d.deadline).toLocaleDateString()}</p>}
                  </div>
                  <Badge className={statusColor(d.status)}>{d.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      {/* Directory link */}
      <Card className="border-secondary/30 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/portal/language-support/directory")}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-secondary" />
            <div>
              <p className="font-semibold text-sm">Interpreter & Translator Directory</p>
              <p className="text-xs text-muted-foreground">Browse available language support professionals</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </CardContent>
      </Card>

      {ratingBookingId && (
        <SessionRatingDialog
          open={!!ratingBookingId}
          onOpenChange={(open) => !open && setRatingBookingId(null)}
          bookingId={ratingBookingId}
          onRated={loadData}
        />
      )}
    </div>
  );
};

export default LanguageSupportCenter;

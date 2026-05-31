import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import { Video, Clock, Users } from "lucide-react";
import { useT } from "@/hooks/useT";

const EnglishLiveClass = () => {
  const { classId } = useParams<{ classId: string }>();
  const { session } = useAuth();
  const t = useT();
  const [classData, setClassData] = useState<any>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    supabase.from("english_classes")
      .select("*, english_courses(title, category), english_teachers(display_name)")
      .eq("id", classId)
      .single()
      .then(({ data }) => {
        setClassData(data);
        setLoading(false);
      });
  }, [classId]);

  if (loading) return <div className="p-6 text-center text-muted-foreground">{t("common.loading")}</div>;
  if (!classData) return <div className="p-6 text-center text-muted-foreground">Class not found.</div>;

  const displayName = session?.user?.user_metadata?.display_name || session?.user?.email?.split("@")[0] || "Student";
  const jitsiDomain = "meet.jit.si";
  const roomName = `dome-english-${classData.jitsi_room_name}`;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <BackButton />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-bold">{classData.title}</h1>
          <p className="text-sm text-muted-foreground">
            {classData.english_courses?.title} · Teacher: {classData.english_teachers?.display_name}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{classData.duration_minutes} min</span>
            <span className="flex items-center gap-1"><Video className="w-3 h-3" />{new Date(classData.scheduled_at).toLocaleString()}</span>
          </div>
        </div>
        {!joined && (
          <Button onClick={() => setJoined(true)} size="lg">
            <Video className="w-5 h-5 mr-2" /> Join Live Class
          </Button>
        )}
      </div>

      {joined ? (
        <div className="rounded-xl overflow-hidden border border-border bg-black aspect-video">
          <iframe
            src={`https://${jitsiDomain}/${roomName}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false`}
            className="w-full h-full"
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
            style={{ border: 0 }}
          />
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="w-16 h-16 mx-auto text-secondary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ready to join?</h2>
            <p className="text-muted-foreground mb-4">Click "Join Live Class" to enter the virtual classroom.</p>
            <p className="text-xs text-muted-foreground">You'll need a microphone and camera for the best experience.</p>
          </CardContent>
        </Card>
      )}

      {classData.notes && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2">Class Notes</h3>
            <p className="text-sm text-muted-foreground">{classData.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnglishLiveClass;

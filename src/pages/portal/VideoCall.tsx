import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, PhoneOff, Copy, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useT } from "@/hooks/useT";

const VideoCall = () => {
  const t = useT();
  const { user } = useAuth();
  const [roomName, setRoomName] = useState("");
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  const generateRoom = () => {
    const id = `dome-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    setRoomName(id);
  };

  const startCall = () => {
    const room = roomName.trim();
    if (!room) {
      toast({ title: t("videoCall.enterRoom"), variant: "destructive" });
      return;
    }
    setActiveRoom(room);
  };

  const endCall = () => setActiveRoom(null);

  const meetingUrl = useMemo(
    () => activeRoom ? `https://meet.jit.si/${activeRoom}` : null,
    [activeRoom]
  );

  const copyLink = () => {
    if (meetingUrl) {
      navigator.clipboard.writeText(meetingUrl);
      toast({ title: t("videoCall.linkCopied") });
    }
  };

  if (activeRoom) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)]">
        <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium">{t("videoCall.room")}: {activeRoom}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyLink} className="gap-1">
              <Copy className="w-3 h-3" /> {t("videoCall.shareLink")}
            </Button>
            <Button variant="destructive" size="sm" onClick={endCall} className="gap-1">
              <PhoneOff className="w-3 h-3" /> {t("videoCall.end")}
            </Button>
          </div>
        </div>
        <iframe
          src={`https://meet.jit.si/${activeRoom}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.prejoinConfig.enabled=false`}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          className="flex-1 w-full border-0"
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-primary rounded-xl p-5 text-primary-foreground">
        <h1 className="font-display text-2xl font-bold">{t("videoCall.title")}</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">
          {t("videoCall.subtitle")}
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("videoCall.roomName")}</label>
            <div className="flex gap-2">
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder={t("videoCall.enterOrGenerate")}
              />
              <Button variant="outline" onClick={generateRoom} className="shrink-0">
                {t("videoCall.generate")}
              </Button>
            </div>
          </div>

          <Button onClick={startCall} className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 h-12 text-base">
            <Video className="w-5 h-5" /> {t("videoCall.startCall")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-base mb-2">{t("videoCall.howItWorks")}</h3>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>{t("videoCall.step1")}</li>
            <li>{t("videoCall.step2")}</li>
            <li>{t("videoCall.step3")}</li>
            <li>{t("videoCall.step4")}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoCall;

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Bell, CheckCircle2 } from "lucide-react";
import domeLogo from "@/assets/dome-logo.png";
import { useT } from "@/hooks/useT";

const InstallApp = () => {
  const t = useT();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    if (window.matchMedia("(display-mode: standalone)").matches) setIsInstalled(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <img src={domeLogo} alt="D.O.M.E." className="w-20 h-20 rounded-full object-contain mb-4" />
      <h1 className="font-display text-2xl font-bold text-center mb-1">{t("install.title")}</h1>
      <p className="text-muted-foreground text-sm text-center mb-6 max-w-sm">{t("install.description")}</p>

      {isInstalled ? (
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="font-display font-bold text-lg">{t("install.alreadyInstalled")}</h2>
            <p className="text-sm text-muted-foreground">{t("install.onHomeScreen")}</p>
          </CardContent>
        </Card>
      ) : isIOS ? (
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-display font-bold text-base text-center">{t("install.iosTitle")}</h2>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Tap the <strong>Share</strong> button (square with arrow) in Safari</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> to confirm</li>
            </ol>
          </CardContent>
        </Card>
      ) : deferredPrompt ? (
        <Button onClick={handleInstall} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 h-12 px-8 text-base">
          <Download className="w-5 h-5" /> {t("common.installApp")}
        </Button>
      ) : (
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-display font-bold text-base text-center">{t("install.androidTitle")}</h2>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Tap the <strong>menu</strong> (three dots) in Chrome</li>
              <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
              <li>Tap <strong>"Install"</strong> to confirm</li>
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 grid grid-cols-1 gap-3 w-full max-w-sm">
        <div className="flex items-center gap-3 text-sm"><Smartphone className="w-5 h-5 text-secondary shrink-0" /><span>{t("install.nativeApp")}</span></div>
        <div className="flex items-center gap-3 text-sm"><Bell className="w-5 h-5 text-secondary shrink-0" /><span>{t("install.receiveAlerts")}</span></div>
        <div className="flex items-center gap-3 text-sm"><Download className="w-5 h-5 text-secondary shrink-0" /><span>{t("install.noAppStore")}</span></div>
      </div>
    </div>
  );
};

export default InstallApp;

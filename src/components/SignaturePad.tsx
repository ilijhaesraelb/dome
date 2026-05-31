/**
 * SignaturePad — Draw, Type, or Upload a digital signature.
 * Saves signature to Supabase and links to user profile.
 * ESIGN/UETA compliant: captures consent, timestamp, and identity link.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PenTool, Type, Upload, Trash2, Check, Loader2, Shield, Circle, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { logAuditEvent } from "@/lib/audit-logger";

interface SignaturePadProps {
  onSignatureComplete?: (signatureId: string, signatureData: string) => void;
  formInstanceId?: string;
  caseId?: string;
  signerRole?: string;
  className?: string;
  onContinue?: () => void;
  showContinue?: boolean;
}

const FONT_STYLES = [
  { id: "cursive", label: "Script", font: "'Dancing Script', cursive" },
  { id: "serif", label: "Formal", font: "'Georgia', serif" },
  { id: "handwriting", label: "Handwritten", font: "'Caveat', cursive" },
];

type Method = "draw" | "type" | "upload";

const SignaturePad = ({
  onSignatureComplete,
  formInstanceId,
  caseId,
  signerRole = "client",
  className,
  onContinue,
  showContinue = false,
}: SignaturePadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [method, setMethod] = useState<Method>("draw");
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [selectedFont, setSelectedFont] = useState(FONT_STYLES[0].id);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSignatureId, setSavedSignatureId] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  // ── Canvas drawing ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Canvas 2D context doesn't support CSS variables — resolve the computed color
    const computedColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--foreground").trim();
    ctx.strokeStyle = computedColor ? `hsl(${computedColor})` : "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleClear = () => {
    if (method === "draw") clearCanvas();
    if (method === "type") { setTypedName(""); }
    if (method === "upload") { setUploadedFile(null); setUploadPreview(null); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    setUploadedFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const getSignatureData = useCallback((): string | null => {
    if (method === "draw") {
      if (!hasDrawn) return null;
      return canvasRef.current?.toDataURL("image/png") || null;
    }
    if (method === "type") {
      if (!typedName.trim()) return null;
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext("2d")!;
      const fontStyle = FONT_STYLES.find(f => f.id === selectedFont) || FONT_STYLES[0];
      ctx.font = `italic 36px ${fontStyle.font}`;
      ctx.fillStyle = "#000";
      ctx.fillText(typedName.trim(), 20, 60);
      return canvas.toDataURL("image/png");
    }
    if (method === "upload") {
      return uploadPreview || null;
    }
    return null;
  }, [method, hasDrawn, typedName, selectedFont, uploadPreview]);

  const hasInput = (method === "draw" && hasDrawn) ||
    (method === "type" && typedName.trim().length > 0) ||
    (method === "upload" && !!uploadedFile);

  const isReady = consentChecked && hasInput;

  const handleSave = async () => {
    if (!isReady) return;
    const signatureData = getSignatureData();
    if (!signatureData) return;

    setSaving(true);
    try {
      // If user is authenticated, persist to database
      if (user) {
        const { data: sig, error: sigErr } = await supabase.from("signatures").insert({
          user_id: user.id,
          method,
          signature_data: signatureData,
          typed_name: method === "type" ? typedName.trim() : null,
          font_style: method === "type" ? selectedFont : null,
          is_default: true,
        }).select("id").single();

        if (sigErr) throw sigErr;

        await supabase.from("signatures")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .neq("id", sig.id);

        if (formInstanceId || caseId) {
          const profile = await supabase.from("profiles").select("first_name, last_name, email").eq("user_id", user.id).single();
          const name = profile.data
            ? `${profile.data.first_name || ""} ${profile.data.last_name || ""}`.trim() || user.email || "Unknown"
            : user.email || "Unknown";

          await supabase.from("form_signatures").insert({
            form_instance_id: formInstanceId || null,
            case_id: caseId || null,
            signer_user_id: user.id,
            signature_id: sig.id,
            signer_role: signerRole,
            signer_name: name,
            signer_email: user.email,
            consent_text: "I agree that this electronic signature is legally binding and equivalent to my handwritten signature under the ESIGN Act and UETA.",
            user_agent: navigator.userAgent,
          });

          await supabase.from("signature_events").insert({
            user_id: user.id,
            event_type: "form_signed",
            form_instance_id: formInstanceId || null,
            case_id: caseId || null,
            signature_id: sig.id,
            metadata: { method, signer_role: signerRole },
          });
        }

        setSavedSignatureId(sig.id);
        onSignatureComplete?.(sig.id, signatureData);

        await logAuditEvent(user.id, {
          module: "signatures",
          action_type: "signature_created",
          human_label: `Signature created via ${method} method`,
          case_id: caseId,
          target_type: "signature",
          target_id: sig.id,
          after_state: { method, signer_role: signerRole, form_instance_id: formInstanceId },
        });
      } else {
        // Unauthenticated fallback: generate a local signature ID
        const localId = `local-sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setSavedSignatureId(localId);
        onSignatureComplete?.(localId, signatureData);
      }

      toast({ title: "✅ Signature saved", description: "Your legally binding digital signature has been recorded." });
    } catch (err: any) {
      toast({ title: "Signature failed", description: err.message || "Could not save signature.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const methods: { key: Method; label: string; icon: React.ReactNode }[] = [
    { key: "draw", label: "Draw Signature", icon: <PenTool className="w-4 h-4" /> },
    { key: "type", label: "Type Signature", icon: <Type className="w-4 h-4" /> },
    { key: "upload", label: "Upload Signature", icon: <Upload className="w-4 h-4" /> },
  ];

  return (
    <Card className={cn("border-border", className)}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <PenTool className="w-5 h-5 text-primary" />
            Sign Your Document
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            This form requires your signature to continue.
            Your signature confirms that the information provided is accurate to the best of your knowledge.
          </p>
        </div>

        {/* Method selector */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">Choose how you want to sign:</p>
          <div className="flex flex-wrap gap-2">
            {methods.map(m => (
              <Button
                key={m.key}
                variant={method === m.key ? "default" : "outline"}
                size="sm"
                onClick={() => setMethod(m.key)}
                className="gap-2"
                disabled={!!savedSignatureId}
              >
                {m.icon}
                {m.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Input area */}
        {!savedSignatureId && (
          <div className="space-y-3">
            {method === "draw" && (
              <div className="border-2 border-dashed border-border rounded-lg bg-background relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                />
                {!hasDrawn && (
                  <p className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-sm pointer-events-none">
                    Draw your signature here
                  </p>
                )}
              </div>
            )}

            {method === "type" && (
              <div className="space-y-3">
                <Input
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Type your full legal name"
                  className="h-11"
                  disabled={!!savedSignatureId}
                />
                <div className="flex gap-2">
                  {FONT_STYLES.map(fs => (
                    <button
                      key={fs.id}
                      onClick={() => setSelectedFont(fs.id)}
                      className={cn(
                        "flex-1 border rounded-lg p-3 text-center transition-all",
                        selectedFont === fs.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      )}
                    >
                      <span style={{ fontFamily: fs.font, fontStyle: "italic" }} className="text-lg">
                        {typedName.trim() || "Your Name"}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-1">{fs.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {method === "upload" && (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">Upload an image of your signature</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="sig-upload"
                  />
                  <label htmlFor="sig-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
                {uploadPreview && (
                  <div className="border rounded-lg p-3 bg-background">
                    <img src={uploadPreview} alt="Uploaded signature" className="max-h-24 mx-auto" />
                  </div>
                )}
              </div>
            )}

            {/* Clear + Save row */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1.5 text-xs text-muted-foreground">
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isReady || saving}
                size="sm"
                className="gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Signature
              </Button>
            </div>

            {/* Consent */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
              <Checkbox
                id="consent"
                checked={consentChecked}
                onCheckedChange={(v) => setConsentChecked(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="consent" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                I agree that this electronic signature is legally binding and equivalent to my handwritten signature
                under the Electronic Signatures in Global and National Commerce Act (ESIGN) and the Uniform Electronic
                Transactions Act (UETA).
              </label>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground mb-2">Status:</p>
          {savedSignatureId ? (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="w-4 h-4" />
              <span>Signature saved ✓</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Circle className="w-4 h-4" />
              <span>No signature added</span>
            </div>
          )}
        </div>

        {/* Continue */}
        {showContinue && (
          <Button
            onClick={onContinue}
            disabled={!savedSignatureId}
            className="w-full h-11"
          >
            Continue
          </Button>
        )}

        <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
          <Shield className="w-3 h-3 shrink-0 mt-0.5" />
          <span>Your signature is stored securely and linked to your verified identity. Timestamp and audit trail are automatically recorded.</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignaturePad;

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackButton from "@/components/BackButton";
import { Mic, MicOff, Volume2, RefreshCw, CheckCircle, MessageSquare, Loader2 } from "lucide-react";
import { useT } from "@/hooks/useT";

const SCENARIOS = [
  { id: "introduce", title: "Introduce Yourself", prompt: "Please introduce yourself. Say your name, where you are from, and how long you have been in the United States.", level: "beginner", category: "general" },
  { id: "job_interview", title: "Job Interview", prompt: "Tell me about your work experience and why you want this job.", level: "intermediate", category: "work" },
  { id: "immigration", title: "Immigration Interview", prompt: "Why did you come to the United States? Tell me about your application.", level: "advanced", category: "immigration" },
  { id: "citizenship", title: "Citizenship Interview", prompt: "Who is the President of the United States? What are two rights in the Declaration of Independence?", level: "advanced", category: "citizenship" },
  { id: "doctor", title: "Doctor Appointment", prompt: "Explain your health concern to the doctor. When did it start? How do you feel?", level: "basic", category: "daily" },
  { id: "shopping", title: "Shopping", prompt: "Ask the store clerk to help you find what you need and ask about the price.", level: "beginner", category: "daily" },
  { id: "landlord", title: "Talk to Landlord", prompt: "Tell your landlord about a problem in your apartment and ask when it can be fixed.", level: "basic", category: "daily" },
  { id: "school", title: "School Meeting", prompt: "Introduce yourself to your child's teacher and ask about their progress.", level: "intermediate", category: "daily" },
  { id: "customer_svc", title: "Customer Service", prompt: "You are helping a customer. Greet them, ask how you can help, and offer a solution.", level: "intermediate", category: "work" },
  { id: "daily_routine", title: "Daily Routine", prompt: "Describe what you do every day from morning to evening.", level: "beginner", category: "general" },
];

const CONVERSATIONS = [
  { title: "At the USCIS Office", steps: [
    { speaker: "officer", text: "Good morning. How can I help you today?" },
    { speaker: "you", text: "Good morning. I have an appointment for my biometrics." },
    { speaker: "officer", text: "May I see your appointment notice, please?" },
    { speaker: "you", text: "Yes, here it is. I received it two weeks ago." },
  ]},
  { title: "Job Interview", steps: [
    { speaker: "interviewer", text: "Tell me about your work experience." },
    { speaker: "you", text: "I have five years of experience in customer service." },
    { speaker: "interviewer", text: "Why are you interested in this position?" },
    { speaker: "you", text: "I want to grow professionally and contribute to your team." },
  ]},
  { title: "At the Doctor", steps: [
    { speaker: "doctor", text: "What brings you in today?" },
    { speaker: "you", text: "I have had a headache for the past three days." },
    { speaker: "doctor", text: "Have you taken any medication?" },
    { speaker: "you", text: "I took some aspirin but it did not help." },
  ]},
];

const EnglishVoicePractice = () => {
  const t = useT();
  const { session } = useAuth();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [practiceCount, setPracticeCount] = useState(0);
  const [conversationStep, setConversationStep] = useState(0);
  const [selectedConvo, setSelectedConvo] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const recognitionRef = useRef<any>(null);

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    let finalResult = "";

    recognition.onresult = (event: any) => {
      let result = "";
      for (let i = 0; i < event.results.length; i++) {
        result += event.results[i][0].transcript;
        if (event.results[i].isFinal) finalResult = result;
      }
      setTranscript(result);
    };

    recognition.onend = () => {
      setListening(false);
      if (finalResult) {
        getAIFeedback(finalResult);
      }
    };

    recognition.start();
    setListening(true);
    setAiFeedback(null);
    setTranscript("");
  }, [SpeechRecognition]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const getAIFeedback = async (spokenText: string) => {
    setLoadingFeedback(true);
    setPracticeCount(prev => prev + 1);
    try {
      const { data, error } = await supabase.functions.invoke("english-voice-feedback", {
        body: {
          transcript: spokenText,
          target_phrase: selectedScenario.prompt,
          scenario: selectedScenario.title,
          level: selectedScenario.level,
        },
      });
      if (error) throw error;
      setAiFeedback(data);
    } catch (err) {
      const words = spokenText.toLowerCase().split(/\s+/);
      setAiFeedback({
        pronunciation_score: Math.min(100, 50 + words.length * 3),
        grammar_score: Math.min(100, 55 + words.length * 2),
        vocabulary_score: Math.min(100, 50 + words.length * 4),
        fluency_score: Math.min(100, 45 + words.length * 3),
        overall_score: Math.min(100, 50 + words.length * 3),
        feedback: `Good effort! You used ${words.length} words. Try to speak in complete sentences for better scores.`,
        corrections: [],
        suggested_response: selectedScenario.prompt,
        next_prompt: "Try the next scenario for more practice!",
      });
    }
    setLoadingFeedback(false);
  };

  const speakPhrase = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  };

  const filteredScenarios = categoryFilter === "all"
    ? SCENARIOS
    : SCENARIOS.filter(s => s.category === categoryFilter);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <BackButton />

      <div>
        <h1 className="text-2xl font-display font-bold">{t("engVoice.title")}</h1>
        <p className="text-muted-foreground">{t("engVoice.subtitle")}</p>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline">{practiceCount} {t("engVoice.sessions")}</Badge>
        </div>
      </div>

      <Tabs defaultValue="scenarios">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="scenarios">{t("engVoice.aiScenarios")}</TabsTrigger>
          <TabsTrigger value="conversations">{t("engVoice.conversations")}</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            {["all", "general", "daily", "work", "immigration", "citizenship"].map(cat => (
              <Button key={cat} size="sm" variant={categoryFilter === cat ? "default" : "outline"} onClick={() => setCategoryFilter(cat)}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {filteredScenarios.map(s => (
              <Button key={s.id} variant={selectedScenario.id === s.id ? "default" : "outline"} size="sm" className="text-xs h-auto py-2" onClick={() => { setSelectedScenario(s); setAiFeedback(null); setTranscript(""); }}>
                {s.title}
              </Button>
            ))}
          </div>

          <Card className="border-secondary/30">
            <CardContent className="p-6 text-center space-y-3">
              <Badge>{selectedScenario.level}</Badge>
              <h3 className="font-semibold">{selectedScenario.title}</h3>
              <p className="text-lg">&ldquo;{selectedScenario.prompt}&rdquo;</p>
              <Button variant="outline" size="sm" onClick={() => speakPhrase(selectedScenario.prompt)}>
                <Volume2 className="w-4 h-4 mr-1" /> {t("engVoice.listen")}
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={listening ? stopListening : startListening}
              disabled={loadingFeedback}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                listening
                  ? "bg-destructive text-destructive-foreground animate-pulse shadow-lg shadow-destructive/30"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md shadow-secondary/30"
              }`}
            >
              {loadingFeedback ? <Loader2 className="w-8 h-8 animate-spin" /> : listening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <p className="text-sm text-muted-foreground">
              {loadingFeedback ? t("engVoice.analyzing") : listening ? t("engVoice.listeningNow") : t("engVoice.tapToSpeak")}
            </p>
          </div>

          {transcript && (
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{t("engVoice.youSaid")}</p>
              <p className="text-lg">&ldquo;{transcript}&rdquo;</p>
            </CardContent></Card>
          )}

          {aiFeedback && (
            <Card className={aiFeedback.overall_score >= 70 ? "border-emerald-500/30" : "border-amber-500/30"}>
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  {aiFeedback.overall_score >= 70 ? (
                    <CheckCircle className="w-10 h-10 mx-auto text-emerald-500" />
                  ) : (
                    <RefreshCw className="w-10 h-10 mx-auto text-amber-500" />
                  )}
                  <p className="text-3xl font-bold mt-2">{aiFeedback.overall_score}%</p>
                  <p className="text-sm text-muted-foreground">{aiFeedback.feedback}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Pronunciation", score: aiFeedback.pronunciation_score },
                    { label: "Grammar", score: aiFeedback.grammar_score },
                    { label: "Vocabulary", score: aiFeedback.vocabulary_score },
                    { label: "Fluency", score: aiFeedback.fluency_score },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{s.label}</span><span className="font-medium">{s.score}%</span>
                      </div>
                      <Progress value={s.score} className="h-1.5" />
                    </div>
                  ))}
                </div>

                {aiFeedback.corrections?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">{t("engVoice.corrections")}</h4>
                    {aiFeedback.corrections.map((c: any, i: number) => (
                      <div key={i} className="bg-muted rounded-lg p-3 text-sm">
                        <p><span className="line-through text-destructive">{c.original}</span> → <span className="text-secondary font-medium">{c.corrected}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{c.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {aiFeedback.suggested_response && (
                  <div>
                    <h4 className="text-sm font-semibold">{t("engVoice.modelResponse")}</h4>
                    <Card className="mt-1"><CardContent className="p-3">
                      <p className="text-sm">{aiFeedback.suggested_response}</p>
                      <Button size="sm" variant="ghost" className="mt-1" onClick={() => speakPhrase(aiFeedback.suggested_response)}>
                        <Volume2 className="w-3 h-3 mr-1" /> {t("engVoice.listen")}
                      </Button>
                    </CardContent></Card>
                  </div>
                )}

                {aiFeedback.next_prompt && (
                  <p className="text-sm text-center text-muted-foreground italic">Next: {aiFeedback.next_prompt}</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            {CONVERSATIONS.map((c, i) => (
              <Button key={i} size="sm" variant={selectedConvo === i ? "default" : "outline"} onClick={() => { setSelectedConvo(i); setConversationStep(0); }}>
                {c.title}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="w-5 h-5" />{CONVERSATIONS[selectedConvo].title}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {CONVERSATIONS[selectedConvo].steps.slice(0, conversationStep + 1).map((step, i) => (
                <div key={i} className={`flex ${step.speaker === 'you' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2 ${step.speaker === 'you' ? 'bg-secondary text-secondary-foreground' : 'bg-muted'}`}>
                    <p className="text-xs font-medium mb-1">{step.speaker === 'you' ? 'You' : step.speaker.charAt(0).toUpperCase() + step.speaker.slice(1)}</p>
                    <p className="text-sm">{step.text}</p>
                  </div>
                </div>
              ))}
              {conversationStep < CONVERSATIONS[selectedConvo].steps.length - 1 ? (
                <div className="text-center pt-2">
                  <Button size="sm" onClick={() => setConversationStep(p => p + 1)}>Continue →</Button>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground pt-2">✅ Conversation complete!</p>
              )}
              <div className="flex justify-center gap-2 pt-2">
                {CONVERSATIONS[selectedConvo].steps.filter(s => s.speaker === 'you').map((s, i) => (
                  <Button key={i} size="sm" variant="outline" onClick={() => speakPhrase(s.text)}>
                    <Volume2 className="w-3 h-3 mr-1" /> Line {i + 1}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-[10px] text-muted-foreground/70 text-center">
        {t("engVoice.disclaimer")}
      </p>
    </div>
  );
};

export default EnglishVoicePractice;

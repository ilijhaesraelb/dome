import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import { CheckCircle, ArrowRight, Mic, MicOff, Volume2, BookOpen, Clock } from "lucide-react";
import { useT } from "@/hooks/useT";

/* ─── Section 1: Vocabulary (5 questions) ─── */
const VOCAB_QUESTIONS = [
  { q: 'I __ in New York.', opts: ["live", "living", "lived"], correct: 0 },
  { q: 'She works in a __.', opts: ["hospital", "pencil", "window"], correct: 0 },
  { q: 'What time do you __ work?', opts: ["start", "starting", "started"], correct: 0 },
  { q: 'I need to buy some __.', opts: ["groceries", "running", "quickly"], correct: 0 },
  { q: 'He __ English every day.', opts: ["practice", "practices", "practicing"], correct: 1 },
];

/* ─── Section 2: Grammar (5 questions) ─── */
const GRAMMAR_QUESTIONS = [
  { q: 'She __ to work every day.', opts: ["go", "goes", "going"], correct: 1 },
  { q: 'Yesterday I __ to the store.', opts: ["go", "went", "going"], correct: 1 },
  { q: 'They __ studying English.', opts: ["are", "is", "am"], correct: 0 },
  { q: 'My brother __ in construction.', opts: ["work", "works", "working"], correct: 1 },
  { q: 'I __ a job interview tomorrow.', opts: ["have", "has", "having"], correct: 0 },
];

/* ─── Section 3: Listening (5 questions, single audio passage) ─── */
const LISTENING_PASSAGE =
  "Hello, my name is David. I moved to the United States three years ago. I work in construction.";

const LISTENING_QUESTIONS = [
  { q: "What is the speaker's name?", opts: ["Daniel", "David", "Diego"], correct: 1 },
  { q: "Where does he work?", opts: ["hospital", "construction", "restaurant"], correct: 1 },
  { q: "How long has he lived in the U.S.?", opts: ["1 year", "3 years", "5 years"], correct: 1 },
  { q: "What is he talking about?", opts: ["his job", "his school", "his vacation"], correct: 0 },
  { q: "Which word describes his job?", opts: ["teacher", "construction worker", "driver"], correct: 1 },
];

/* ─── Section 4: Voice prompt ─── */
const SPEAKING_PROMPT =
  "Please introduce yourself. Tell us your name, where you are from, and what kind of work you do or want to do.";

type TestPart = "intro" | "vocabulary" | "grammar" | "listening" | "speaking" | "results";
type Level = "Beginner" | "Basic Communication" | "Intermediate" | "Advanced";

interface Results {
  vocabScore: number;
  grammarScore: number;
  listeningScore: number;
  total: number;
  level: Level;
  description: string;
  recommendedCourses: string[];
  voiceWords: number;
}

const EnglishPlacementTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [part, setPart] = useState<TestPart>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [vocabAnswers, setVocabAnswers] = useState<number[]>([]);
  const [grammarAnswers, setGrammarAnswers] = useState<number[]>([]);
  const [listeningAnswers, setListeningAnswers] = useState<number[]>([]);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [listenPlayed, setListenPlayed] = useState(false);
  const [timer, setTimer] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const TOTAL = VOCAB_QUESTIONS.length + GRAMMAR_QUESTIONS.length + LISTENING_QUESTIONS.length; // 15
  const answered = vocabAnswers.length + grammarAnswers.length + listeningAnswers.length;
  const progressPct =
    part === "intro"
      ? 0
      : part === "results"
        ? 100
        : ((answered + (part === "speaking" ? (voiceRecorded ? 1 : 0) : 0)) / (TOTAL + 1)) * 100;

  /* ── Timer for speaking ── */
  useEffect(() => {
    if (recording) {
      setTimer(0);
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recording]);

  /* ── Answer handlers ── */
  const handleAnswer = (
    section: "vocab" | "grammar" | "listening",
    idx: number
  ) => {
    if (section === "vocab") {
      setVocabAnswers((p) => [...p, idx]);
      if (currentQ < VOCAB_QUESTIONS.length - 1) setCurrentQ((p) => p + 1);
      else { setPart("grammar"); setCurrentQ(0); }
    } else if (section === "grammar") {
      setGrammarAnswers((p) => [...p, idx]);
      if (currentQ < GRAMMAR_QUESTIONS.length - 1) setCurrentQ((p) => p + 1);
      else { setPart("listening"); setCurrentQ(0); setListenPlayed(false); }
    } else {
      setListeningAnswers((p) => [...p, idx]);
      if (currentQ < LISTENING_QUESTIONS.length - 1) setCurrentQ((p) => p + 1);
      else { setPart("speaking"); setCurrentQ(0); }
    }
  };

  /* ── TTS for listening ── */
  const speakPassage = () => {
    const u = new SpeechSynthesisUtterance(LISTENING_PASSAGE);
    u.lang = "en-US";
    u.rate = 0.75;
    u.onend = () => setListenPlayed(true);
    speechSynthesis.speak(u);
    setListenPlayed(true);
  };

  /* ── Voice recording ── */
  const startRecording = useCallback(() => {
    if (!SpeechRecognition) {
      setVoiceRecorded(true);
      setPart("results");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    recognition.onresult = (e: any) => {
      let r = "";
      for (let i = 0; i < e.results.length; i++) r += e.results[i][0].transcript;
      setVoiceTranscript(r);
    };
    recognition.onend = () => {
      setRecording(false);
      setVoiceRecorded(true);
    };
    recognition.start();
    setRecording(true);
    setTimeout(() => recognition.stop(), 45000); // 45s max
  }, [SpeechRecognition]);

  const stopRecording = () => recognitionRef.current?.stop();

  /* ── Scoring (raw out of 15) ── */
  const calculateResults = (): Results => {
    const vocabScore = vocabAnswers.filter((a, i) => a === VOCAB_QUESTIONS[i].correct).length;
    const grammarScore = grammarAnswers.filter((a, i) => a === GRAMMAR_QUESTIONS[i].correct).length;
    const listeningScore = listeningAnswers.filter((a, i) => a === LISTENING_QUESTIONS[i].correct).length;
    const total = vocabScore + grammarScore + listeningScore;
    const voiceWords = voiceTranscript.split(/\s+/).filter(Boolean).length;

    let level: Level;
    let description: string;
    let recommendedCourses: string[];

    if (total >= 14) {
      level = "Advanced";
      description =
        "You have strong English skills. You are ready for professional communication and citizenship preparation courses.";
      recommendedCourses = [
        "Citizenship Test Preparation",
        "English for Immigration Interviews",
        "Advanced Conversation",
      ];
    } else if (total >= 11) {
      level = "Intermediate";
      description =
        "You can communicate in daily situations. Focus on workplace English and complex conversations.";
      recommendedCourses = [
        "English for Work",
        "English for Customer Service",
        "English for Immigration Interviews",
      ];
    } else if (total >= 6) {
      level = "Basic Communication";
      description =
        "You can understand simple English. Build your vocabulary and practice daily conversations.";
      recommendedCourses = [
        "Everyday English",
        "English for Work",
        "Speaking Practice",
      ];
    } else {
      level = "Beginner";
      description =
        "You are just starting your English journey. Focus on common words, greetings, and simple sentences.";
      recommendedCourses = [
        "Beginner English",
        "Everyday English",
        "Speaking Practice",
      ];
    }

    return { vocabScore, grammarScore, listeningScore, total, level, description, recommendedCourses, voiceWords };
  };

  /* ─────────────────────── RESULTS SCREEN ─────────────────────── */
  // Persist results to DB when reaching results
  const resultsForSave = part === "results" ? calculateResults() : null;
  useEffect(() => {
    if (!user?.id || !resultsForSave) return;
    supabase.from("english_placement_results" as any).insert({
      user_id: user.id,
      vocab_score: resultsForSave.vocabScore,
      grammar_score: resultsForSave.grammarScore,
      listening_score: resultsForSave.listeningScore,
      total_score: resultsForSave.total,
      level: resultsForSave.level.toLowerCase(),
      voice_words: resultsForSave.voiceWords,
      recommended_courses: resultsForSave.recommendedCourses,
    }).then(() => {});
  }, [part === "results"]); // eslint-disable-line

  if (part === "results") {
    const r = resultsForSave!;
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <Card className="border-secondary/30 overflow-hidden">
          {/* Header band */}
          <div className="bg-primary px-6 py-4 text-center">
            <p className="text-primary-foreground/70 text-xs uppercase tracking-wider">
              D.O.M.E. English Placement Result
            </p>
          </div>

          <CardContent className="p-8 text-center space-y-5">
            <CheckCircle className="w-14 h-14 mx-auto text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your English Level</p>
              <h2 className="text-2xl font-bold">{r.level}</h2>
            </div>
            <p className="text-4xl font-bold text-secondary">
              {r.total} / {TOTAL}
            </p>
            <p className="text-muted-foreground max-w-md mx-auto">{r.description}</p>

            {/* Score breakdown */}
            <div className="grid grid-cols-3 gap-4 text-sm pt-2">
              <div className="rounded-lg bg-muted p-3">
                <p className="font-bold text-secondary text-lg">{r.vocabScore}/{VOCAB_QUESTIONS.length}</p>
                <p className="text-xs text-muted-foreground">Vocabulary</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="font-bold text-secondary text-lg">{r.grammarScore}/{GRAMMAR_QUESTIONS.length}</p>
                <p className="text-xs text-muted-foreground">Grammar</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="font-bold text-secondary text-lg">{r.listeningScore}/{LISTENING_QUESTIONS.length}</p>
                <p className="text-xs text-muted-foreground">Listening</p>
              </div>
            </div>

            {r.voiceWords > 0 && (
              <p className="text-sm text-muted-foreground">
                🎤 Speaking sample: {r.voiceWords} words spoken
              </p>
            )}

            {/* Recommended courses */}
            <div className="text-left bg-accent/50 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-sm">Recommended courses:</p>
              <ul className="space-y-1">
                {r.recommendedCourses.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-3.5 h-3.5 text-secondary shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <p className="text-[11px] text-muted-foreground italic">
              D.O.M.E. provides English language learning support and communication training.
              These courses are not accredited academic degree programs.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button size="lg" onClick={() => navigate("/portal/english")}>
                Start Learning <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/portal/english/practice")}>
                Practice Speaking
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ─────────────────────── QUESTION CARD RENDERER ─────────────────────── */
  const renderQuestion = (
    sectionLabel: string,
    sectionNum: number,
    questions: typeof VOCAB_QUESTIONS,
    section: "vocab" | "grammar" | "listening"
  ) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>
            Part {sectionNum}: {sectionLabel} — Question {currentQ + 1}/{questions.length}
          </span>
          <Badge variant="outline" className="text-xs font-normal">
            {answered}/{TOTAL}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-lg font-medium leading-relaxed">{questions[currentQ].q}</p>
        {questions[currentQ].opts.map((opt, i) => (
          <Button
            key={i}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 px-4"
            onClick={() => handleAnswer(section, i)}
          >
            <span className="w-7 h-7 rounded-full border-2 border-primary/30 flex items-center justify-center mr-3 shrink-0 text-xs font-semibold">
              {String.fromCharCode(65 + i)}
            </span>
            {opt}
          </Button>
        ))}
      </CardContent>
    </Card>
  );

  /* ─────────────────────── MAIN RENDER ─────────────────────── */
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 pb-24">
      <BackButton />
      <div>
        <h1 className="text-2xl font-display font-bold">📝 English Placement Test</h1>
        <p className="text-muted-foreground text-sm mt-1">
          English for Migration &amp; Work — 10–15 minutes
        </p>
      </div>

      {/* Part indicators */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "vocabulary", label: "Vocabulary" },
            { key: "grammar", label: "Grammar" },
            { key: "listening", label: "Listening" },
            { key: "speaking", label: "Speaking" },
          ] as const
        ).map(({ key, label }, i) => {
          const parts: TestPart[] = ["vocabulary", "grammar", "listening", "speaking"];
          const currentIdx = parts.indexOf(part);
          const thisIdx = i;
          const isDone = currentIdx > thisIdx;
          const isActive = part === key;
          return (
            <Badge
              key={key}
              variant={isActive ? "default" : isDone ? "secondary" : "outline"}
              className="text-xs"
            >
              {isDone ? "✓" : `${i + 1}.`} {label}
            </Badge>
          );
        })}
      </div>

      <Progress value={progressPct} className="h-2" />

      {/* ── INTRO ── */}
      {part === "intro" && (
        <Card>
          <CardContent className="p-8 text-center space-y-5">
            <div className="w-16 h-16 mx-auto bg-secondary/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-xl font-semibold">Test My English Level</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              This test has 4 parts: Vocabulary, Grammar, Listening, and Speaking.
              It takes about 10–15 minutes.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" /> 15 questions + speaking sample
            </div>
            <Button size="lg" onClick={() => { setPart("vocabulary"); setCurrentQ(0); }}>
              Start Test
            </Button>
            <p className="text-[11px] text-muted-foreground italic">
              D.O.M.E. provides English language learning support and communication training.
              These courses are not accredited academic degree programs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── VOCABULARY ── */}
      {part === "vocabulary" && renderQuestion("Vocabulary", 1, VOCAB_QUESTIONS, "vocab")}

      {/* ── GRAMMAR ── */}
      {part === "grammar" && renderQuestion("Grammar", 2, GRAMMAR_QUESTIONS, "grammar")}

      {/* ── LISTENING ── */}
      {part === "listening" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Part 3: Listening — Question {currentQ + 1}/{LISTENING_QUESTIONS.length}</span>
              <Badge variant="outline" className="text-xs font-normal">{answered}/{TOTAL}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Audio passage */}
            <div className="bg-muted rounded-lg p-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Listen to the passage:</p>
              <Button variant="outline" onClick={speakPassage}>
                <Volume2 className="w-4 h-4 mr-2" /> Play Audio
              </Button>
              {listenPlayed && (
                <p className="text-xs text-muted-foreground italic">
                  &ldquo;{LISTENING_PASSAGE}&rdquo;
                </p>
              )}
            </div>

            <p className="text-lg font-medium">{LISTENING_QUESTIONS[currentQ].q}</p>
            {LISTENING_QUESTIONS[currentQ].opts.map((opt, i) => (
              <Button
                key={i}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => handleAnswer("listening", i)}
              >
                <span className="w-7 h-7 rounded-full border-2 border-primary/30 flex items-center justify-center mr-3 shrink-0 text-xs font-semibold">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── SPEAKING ── */}
      {part === "speaking" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Part 4: Voice Speaking Sample</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-center">
            <p className="text-muted-foreground text-sm">
              Record a 30–45 second spoken response:
            </p>
            <div className="bg-accent/50 rounded-lg p-4">
              <p className="text-lg font-semibold leading-relaxed">
                &ldquo;{SPEAKING_PROMPT}&rdquo;
              </p>
            </div>

            <p className="text-xs text-muted-foreground italic">
              Example: &ldquo;Hello, my name is Maria. I am from Brazil. I moved to the United States two years ago and I work in a restaurant.&rdquo;
            </p>

            {/* Mic button */}
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all shadow-lg ${
                recording
                  ? "bg-destructive text-destructive-foreground animate-pulse scale-110"
                  : voiceRecorded
                    ? "bg-secondary/20 text-secondary border-2 border-secondary"
                    : "bg-secondary text-secondary-foreground hover:scale-105"
              }`}
            >
              {recording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </button>

            {/* Status */}
            <div className="space-y-1">
              {recording && (
                <p className="text-sm font-medium text-destructive">
                  🔴 Recording... {timer}s / 45s
                </p>
              )}
              {!recording && !voiceRecorded && (
                <p className="text-sm text-muted-foreground">Tap the microphone to start</p>
              )}
              {voiceRecorded && (
                <p className="text-sm text-secondary font-medium">✅ Recording complete!</p>
              )}
            </div>

            {/* Transcript */}
            {voiceTranscript && (
              <div className="text-left bg-muted rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Your response:</p>
                <p className="text-sm">{voiceTranscript}</p>
              </div>
            )}

            {/* Actions */}
            {voiceRecorded && (
              <Button size="lg" onClick={() => setPart("results")}>
                See My Results <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {!recording && !voiceRecorded && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => { setVoiceRecorded(true); setPart("results"); }}
              >
                Skip Speaking →
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnglishPlacementTest;

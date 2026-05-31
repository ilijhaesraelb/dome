import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { BookOpen, Mic, MicOff, Volume2, ChevronLeft, ChevronRight, CheckCircle2, RotateCcw, Clock } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useT } from "@/hooks/useT";

const EnglishLessonView = () => {
  const t = useT();
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<any>(null);
  const [vocab, setVocab] = useState<any[]>([]);
  const [dialogues, setDialogues] = useState<any[]>([]);
  const [voicePrompts, setVoicePrompts] = useState<any[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [siblingLessons, setSiblingLessons] = useState<any[]>([]);

  const [currentSection, setCurrentSection] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceDone, setVoiceDone] = useState(false);
  const recognitionRef = useRef<any>(null);

  const sections = ["vocabulary", "dialogue", "speaking", "quiz", "homework"];

  useEffect(() => {
    if (lessonId) loadAll();
  }, [lessonId]);

  async function loadAll() {
    const [l, v, d, vp, q, h] = await Promise.all([
      supabase.from("english_lessons").select("*, english_modules(title, level_id)").eq("id", lessonId!).single(),
      supabase.from("lesson_vocab_items").select("*").eq("lesson_id", lessonId!).order("order_index"),
      supabase.from("lesson_dialogues").select("*").eq("lesson_id", lessonId!).order("order_index"),
      supabase.from("lesson_voice_prompts").select("*").eq("lesson_id", lessonId!).order("order_index"),
      supabase.from("lesson_quiz_questions").select("*").eq("lesson_id", lessonId!).order("order_index"),
      supabase.from("lesson_homework_items").select("*").eq("lesson_id", lessonId!).order("order_index"),
    ]);
    if (l.data) {
      setLesson(l.data);
      // Load siblings
      const { data: siblings } = await supabase.from("english_lessons").select("id, title, order_index").eq("module_id", (l.data as any).module_id).order("order_index");
      if (siblings) setSiblingLessons(siblings as any);
    }
    setVocab((v.data || []) as any);
    setDialogues((d.data || []) as any);
    setVoicePrompts((vp.data || []) as any);
    setQuizQuestions((q.data || []) as any);
    setHomework((h.data || []) as any);
  }

  function speak(text: string) {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      u.lang = "en-US";
      speechSynthesis.speak(u);
    }
  }

  function startRecording() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast({ title: "Speech recognition not supported" }); return; }
    const r = new SR();
    r.lang = "en-US";
    r.continuous = false;
    r.onresult = () => { setVoiceDone(true); toast({ title: "Great job speaking!" }); };
    r.onerror = () => setIsRecording(false);
    r.onend = () => setIsRecording(false);
    recognitionRef.current = r;
    r.start();
    setIsRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }

  function quizScore() {
    let correct = 0;
    quizQuestions.forEach((q, i) => {
      if (quizAnswers[i] === q.correct_answer) correct++;
    });
    return correct;
  }

  async function markComplete() {
    if (!user) return;
    const score = quizQuestions.length > 0 ? Math.round((quizScore() / quizQuestions.length) * 100) : 100;
    await supabase.from("student_lesson_progress").upsert({
      user_id: user.id,
      lesson_id: lessonId!,
      status: "completed" as any,
      completion_percent: 100,
      quiz_score: score,
      voice_practice_completed: voiceDone,
      homework_completed: false,
      completed_at: new Date().toISOString(),
    } as any, { onConflict: "user_id,lesson_id" });
    toast({ title: "Lesson marked complete! 🎉" });
  }

  const currentIdx = siblingLessons.findIndex(s => s.id === lessonId);
  const prevLesson = currentIdx > 0 ? siblingLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < siblingLessons.length - 1 ? siblingLessons[currentIdx + 1] : null;

  if (!lesson) return <div className="p-6 text-center text-muted-foreground">Loading lesson...</div>;

  const progress = Math.round(((currentSection + 1) / sections.length) * 100);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4 pb-24">
      <BackButton />

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">{(lesson as any).english_modules?.title}</Badge>
          <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />{lesson.duration_minutes} min</Badge>
        </div>
        <h1 className="text-xl font-bold text-foreground">{lesson.title}</h1>
        {lesson.learning_objective && <p className="text-sm text-muted-foreground">{lesson.learning_objective}</p>}
        <Progress value={progress} className="h-2" />
        <div className="flex gap-1">
          {sections.map((s, i) => (
            <button key={s} onClick={() => setCurrentSection(i)} className={`text-xs px-2 py-1 rounded-full transition-colors ${i === currentSection ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Vocabulary ── */}
      {currentSection === 0 && (
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-secondary" /> Vocabulary</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {vocab.length === 0 && <p className="text-sm text-muted-foreground">No vocabulary items for this lesson.</p>}
            {vocab.map(v => (
              <div key={v.id} className="border border-border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{v.word}</span>
                  <Button size="sm" variant="ghost" onClick={() => speak(v.word)}><Volume2 className="w-4 h-4" /></Button>
                </div>
                <p className="text-sm text-muted-foreground">{v.definition}</p>
                {v.example_sentence && <p className="text-sm italic text-foreground/80">"{v.example_sentence}"</p>}
                {v.pronunciation_hint && <p className="text-xs text-muted-foreground">🔈 {v.pronunciation_hint}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Dialogue ── */}
      {currentSection === 1 && (
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-base">Dialogue</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {dialogues.length === 0 && <p className="text-sm text-muted-foreground">No dialogue for this lesson.</p>}
            {dialogues.map((d, i) => (
              <div key={d.id} className={`flex gap-3 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
                <div className={`max-w-[80%] rounded-xl p-3 ${i % 2 === 0 ? "bg-primary/10" : "bg-secondary/10"}`}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{d.speaker_name}</p>
                  <p className="text-sm text-foreground">{d.line_text}</p>
                </div>
                <Button size="icon" variant="ghost" className="self-end" onClick={() => speak(d.line_text)}><Volume2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Speaking Practice ── */}
      {currentSection === 2 && (
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-base flex items-center gap-2"><Mic className="w-4 h-4 text-secondary" /> Speaking Practice</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {voicePrompts.length === 0 && <p className="text-sm text-muted-foreground">No speaking exercises for this lesson.</p>}
            {voicePrompts.map(vp => (
              <div key={vp.id} className="space-y-3 border border-border rounded-lg p-4">
                {vp.prompt_title && <h4 className="font-semibold text-foreground">{vp.prompt_title}</h4>}
                <p className="text-sm bg-muted p-3 rounded-lg text-foreground">🎤 {vp.prompt_text}</p>
                <Button size="sm" variant="outline" onClick={() => speak(vp.prompt_text)}><Volume2 className="w-3 h-3 mr-1" /> Listen</Button>
                {vp.sample_answer && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-primary font-medium">Show sample answer</summary>
                    <p className="mt-1 text-muted-foreground italic">"{vp.sample_answer}"</p>
                  </details>
                )}
                {vp.feedback_hint && <p className="text-xs text-muted-foreground">💡 {vp.feedback_hint}</p>}
              </div>
            ))}
            <div className="flex justify-center">
              <Button size="lg" className={`rounded-full w-20 h-20 ${isRecording ? "bg-destructive hover:bg-destructive/90" : "bg-secondary hover:bg-secondary/90"}`} onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? <MicOff className="w-8 h-8 text-destructive-foreground" /> : <Mic className="w-8 h-8 text-secondary-foreground" />}
              </Button>
            </div>
            {isRecording && <p className="text-center text-sm text-destructive animate-pulse">Recording... Speak now</p>}
            {voiceDone && <p className="text-center text-sm text-success flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" /> Voice practice complete!</p>}
            <Button variant="outline" size="sm" onClick={() => { setVoiceDone(false); }}><RotateCcw className="w-3 h-3 mr-1" /> Try Again</Button>
          </CardContent>
        </Card>
      )}

      {/* ── Quiz ── */}
      {currentSection === 3 && (
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-base">Quiz</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {quizQuestions.length === 0 && <p className="text-sm text-muted-foreground">No quiz for this lesson.</p>}
            {quizQuestions.map((q, i) => (
              <div key={q.id} className="space-y-2 border border-border rounded-lg p-3">
                <p className="font-medium text-sm text-foreground">{i + 1}. {q.prompt}</p>
                <div className="grid gap-1">
                  {["A", "B", "C", "D"].map(opt => {
                    const val = q[`option_${opt.toLowerCase()}`];
                    if (!val) return null;
                    const selected = quizAnswers[i] === opt;
                    const isCorrect = quizSubmitted && opt === q.correct_answer;
                    const isWrong = quizSubmitted && selected && opt !== q.correct_answer;
                    return (
                      <button key={opt} onClick={() => !quizSubmitted && setQuizAnswers({ ...quizAnswers, [i]: opt })} className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${isCorrect ? "border-success bg-success/10 text-success" : isWrong ? "border-destructive bg-destructive/10 text-destructive" : selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}>
                        <span className="font-semibold mr-2">{opt})</span>{val}
                      </button>
                    );
                  })}
                </div>
                {quizSubmitted && q.explanation && <p className="text-xs text-muted-foreground">💡 {q.explanation}</p>}
              </div>
            ))}
            {quizQuestions.length > 0 && !quizSubmitted && (
              <Button onClick={() => setQuizSubmitted(true)} disabled={Object.keys(quizAnswers).length < quizQuestions.length}>Submit Answers</Button>
            )}
            {quizSubmitted && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-lg font-bold text-foreground">Score: {quizScore()} / {quizQuestions.length}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}><RotateCcw className="w-3 h-3 mr-1" /> Retry</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Homework ── */}
      {currentSection === 4 && (
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-base">Homework</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {homework.length === 0 && <p className="text-sm text-muted-foreground">No homework for this lesson.</p>}
            {homework.map(h => (
              <div key={h.id} className="border border-border rounded-lg p-3 space-y-1">
                <p className="font-medium text-sm text-foreground">{h.task_title}</p>
                {h.task_description && <p className="text-sm text-muted-foreground">{h.task_description}</p>}
                <Badge variant="outline" className="text-xs">{h.submission_type === "none" ? "No submission needed" : `Submit: ${h.submission_type}`}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Navigation ── */}
      <div className="flex justify-between items-center pt-4">
        <div className="flex gap-2">
          {currentSection > 0 && <Button variant="outline" size="sm" onClick={() => setCurrentSection(c => c - 1)}><ChevronLeft className="w-4 h-4 mr-1" /> Previous</Button>}
          {prevLesson && currentSection === 0 && <Button variant="ghost" size="sm" onClick={() => navigate(`/portal/english/lesson/${prevLesson.id}`)}><ChevronLeft className="w-4 h-4 mr-1" /> Prev Lesson</Button>}
        </div>
        <div className="flex gap-2">
          {currentSection < sections.length - 1 ? (
            <Button size="sm" onClick={() => setCurrentSection(c => c + 1)}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
          ) : (
            <>
              <Button size="sm" onClick={markComplete}><CheckCircle2 className="w-4 h-4 mr-1" /> Mark Complete</Button>
              {nextLesson && <Button variant="outline" size="sm" onClick={() => navigate(`/portal/english/lesson/${nextLesson.id}`)}>Next Lesson <ChevronRight className="w-4 h-4 ml-1" /></Button>}
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">D.O.M.E. provides English language learning support and communication training. These courses are not accredited academic degree programs.</p>
    </div>
  );
};

export default EnglishLessonView;

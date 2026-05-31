import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, ChevronRight, Upload, BookOpen, FileText, Mic, HelpCircle, ClipboardList, GraduationCap } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useT } from "@/hooks/useT";

/* ────────── tiny helpers ────────── */
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/* ────────── types ────────── */
interface Level { id: string; title: string; slug: string; description: string; order_index: number; certificate_name: string; is_active: boolean }
interface Module { id: string; level_id: string; title: string; slug: string; description: string; order_index: number; learning_goal: string; is_active: boolean }
interface Lesson { id: string; module_id: string; title: string; slug: string; description: string; order_index: number; duration_minutes: number; lesson_type: string; learning_objective: string; speaking_focus: string; grammar_focus: string; vocabulary_focus: string; homework_text: string; is_active: boolean }
interface VocabItem { id?: string; lesson_id: string; word: string; definition: string; example_sentence: string; pronunciation_hint: string; order_index: number }
interface DialogueLine { id?: string; lesson_id: string; speaker_name: string; line_text: string; order_index: number }
interface VoicePrompt { id?: string; lesson_id: string; prompt_title: string; prompt_text: string; sample_answer: string; feedback_hint: string; order_index: number }
interface QuizQuestion { id?: string; lesson_id: string; question_type: string; prompt: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_answer: string; explanation: string; order_index: number }
interface HomeworkItem { id?: string; lesson_id: string; task_title: string; task_description: string; submission_type: string; order_index: number }

const EnglishContentManager = () => {
  const t = useT();
  const [levels, setLevels] = useState<Level[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonTab, setLessonTab] = useState("overview");

  // Lesson detail data
  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [dialogues, setDialogues] = useState<DialogueLine[]>([]);
  const [voicePrompts, setVoicePrompts] = useState<VoicePrompt[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadLevels(); }, []);
  useEffect(() => { if (selectedLevel) loadModules(selectedLevel); }, [selectedLevel]);
  useEffect(() => { if (selectedModule) loadLessons(selectedModule); }, [selectedModule]);
  useEffect(() => { if (selectedLesson) loadLessonDetails(selectedLesson.id); }, [selectedLesson?.id]);

  async function loadLevels() {
    const { data } = await supabase.from("english_levels").select("*").order("order_index");
    if (data) setLevels(data as any);
  }
  async function loadModules(levelId: string) {
    const { data } = await supabase.from("english_modules").select("*").eq("level_id", levelId).order("order_index");
    if (data) setModules(data as any);
  }
  async function loadLessons(moduleId: string) {
    const { data } = await supabase.from("english_lessons").select("*").eq("module_id", moduleId).order("order_index");
    if (data) setLessons(data as any);
  }
  async function loadLessonDetails(lessonId: string) {
    const [v, d, vp, q, h] = await Promise.all([
      supabase.from("lesson_vocab_items").select("*").eq("lesson_id", lessonId).order("order_index"),
      supabase.from("lesson_dialogues").select("*").eq("lesson_id", lessonId).order("order_index"),
      supabase.from("lesson_voice_prompts").select("*").eq("lesson_id", lessonId).order("order_index"),
      supabase.from("lesson_quiz_questions").select("*").eq("lesson_id", lessonId).order("order_index"),
      supabase.from("lesson_homework_items").select("*").eq("lesson_id", lessonId).order("order_index"),
    ]);
    setVocab((v.data || []) as any);
    setDialogues((d.data || []) as any);
    setVoicePrompts((vp.data || []) as any);
    setQuizQuestions((q.data || []) as any);
    setHomework((h.data || []) as any);
  }

  /* ── Save helpers ── */
  async function saveLesson() {
    if (!selectedLesson) return;
    setSaving(true);
    const { id, english_modules, ...rest } = selectedLesson as any;
    const { error } = await supabase.from("english_lessons").update({
      ...rest,
      slug: slug(selectedLesson.title),
    }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Lesson saved" });
    setSaving(false);
  }

  async function saveVocab() {
    setSaving(true);
    for (const item of vocab) {
      await supabase.from("lesson_vocab_items").upsert({ ...item, lesson_id: selectedLesson!.id } as any, { onConflict: "id" });
    }
    toast({ title: "Vocabulary saved" });
    setSaving(false);
  }

  async function saveDialogues() {
    setSaving(true);
    for (const item of dialogues) {
      await supabase.from("lesson_dialogues").upsert({ ...item, lesson_id: selectedLesson!.id } as any, { onConflict: "id" });
    }
    toast({ title: "Dialogues saved" });
    setSaving(false);
  }

  async function saveVoicePrompts() {
    setSaving(true);
    for (const item of voicePrompts) {
      await supabase.from("lesson_voice_prompts").upsert({ ...item, lesson_id: selectedLesson!.id } as any, { onConflict: "id" });
    }
    toast({ title: "Voice prompts saved" });
    setSaving(false);
  }

  async function saveQuiz() {
    setSaving(true);
    for (const item of quizQuestions) {
      await supabase.from("lesson_quiz_questions").upsert({ ...item, lesson_id: selectedLesson!.id } as any, { onConflict: "id" });
    }
    toast({ title: "Quiz saved" });
    setSaving(false);
  }

  async function saveHomework() {
    setSaving(true);
    for (const item of homework) {
      await supabase.from("lesson_homework_items").upsert({ ...item, lesson_id: selectedLesson!.id } as any, { onConflict: "id" });
    }
    toast({ title: "Homework saved" });
    setSaving(false);
  }

  async function addNewLesson() {
    if (!selectedModule) return;
    const newLesson = {
      module_id: selectedModule,
      title: "New Lesson",
      slug: "new-lesson-" + Date.now(),
      order_index: lessons.length + 1,
      duration_minutes: 20,
      lesson_type: "self_paced" as const,
      learning_objective: "",
      is_active: true,
    };
    const { data, error } = await supabase.from("english_lessons").insert(newLesson as any).select().single();
    if (data) {
      await loadLessons(selectedModule);
      setSelectedLesson(data as any);
      toast({ title: "Lesson created" });
    }
  }

  async function deleteVocabItem(id: string) {
    await supabase.from("lesson_vocab_items").delete().eq("id", id);
    setVocab(prev => prev.filter(v => v.id !== id));
  }
  async function deleteDialogueLine(id: string) {
    await supabase.from("lesson_dialogues").delete().eq("id", id);
    setDialogues(prev => prev.filter(d => d.id !== id));
  }
  async function deleteQuizQuestion(id: string) {
    await supabase.from("lesson_quiz_questions").delete().eq("id", id);
    setQuizQuestions(prev => prev.filter(q => q.id !== id));
  }

  /* ── CSV/JSON Bulk Import ── */
  async function handleBulkImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedLesson) return;
    const text = await file.text();
    try {
      let items: any[];
      if (file.name.endsWith(".json")) {
        items = JSON.parse(text);
      } else {
        // CSV: first line headers, rest data
        const lines = text.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim());
        items = lines.slice(1).map(line => {
          const vals = line.split(",").map(v => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => obj[h] = vals[i] || "");
          return obj;
        });
      }
      // Detect type from headers
      if (items[0]?.word) {
        for (const item of items) {
          await supabase.from("lesson_vocab_items").insert({ lesson_id: selectedLesson.id, word: item.word, definition: item.definition, example_sentence: item.example_sentence, pronunciation_hint: item.pronunciation_hint || "", order_index: 0 } as any);
        }
        toast({ title: `${items.length} vocab items imported` });
      } else if (items[0]?.prompt) {
        for (const item of items) {
          await supabase.from("lesson_quiz_questions").insert({ lesson_id: selectedLesson.id, question_type: item.question_type || "multiple_choice", prompt: item.prompt, option_a: item.option_a, option_b: item.option_b, option_c: item.option_c, option_d: item.option_d || "", correct_answer: item.correct_answer, explanation: item.explanation || "", order_index: 0 } as any);
        }
        toast({ title: `${items.length} quiz questions imported` });
      }
      loadLessonDetails(selectedLesson.id);
    } catch { toast({ title: "Import failed — check file format", variant: "destructive" }); }
  }

  /* ── Breadcrumb bar ── */
  const levelTitle = levels.find(l => l.id === selectedLevel)?.title;
  const moduleTitle = modules.find(m => m.id === selectedModule)?.title;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 pb-24">
      <BackButton />
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><BookOpen className="w-6 h-6 text-secondary" /> Content Manager</h1>
      <p className="text-sm text-muted-foreground">Create and manage the English curriculum: levels → modules → lessons → content.</p>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        <button onClick={() => { setSelectedLevel(null); setSelectedModule(null); setSelectedLesson(null); }} className="text-primary hover:underline font-medium">All Levels</button>
        {selectedLevel && <><ChevronRight className="w-3 h-3" /><button onClick={() => { setSelectedModule(null); setSelectedLesson(null); }} className="text-primary hover:underline">{levelTitle}</button></>}
        {selectedModule && <><ChevronRight className="w-3 h-3" /><button onClick={() => setSelectedLesson(null)} className="text-primary hover:underline">{moduleTitle}</button></>}
        {selectedLesson && <><ChevronRight className="w-3 h-3" /><span className="text-muted-foreground">{selectedLesson.title}</span></>}
      </div>

      {/* ─── Level List ─── */}
      {!selectedLevel && (
        <div className="grid gap-3 sm:grid-cols-2">
          {levels.map(l => (
            <Card key={l.id} className="cursor-pointer hover:border-secondary transition-colors" onClick={() => setSelectedLevel(l.id)}>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-base flex items-center justify-between">{l.title} <Badge variant={l.is_active ? "default" : "secondary"}>{l.is_active ? "Active" : "Inactive"}</Badge></CardTitle></CardHeader>
              <CardContent className="p-4 pt-0"><p className="text-sm text-muted-foreground">{l.description}</p><p className="text-xs text-muted-foreground mt-1">Certificate: {l.certificate_name}</p></CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Module List ─── */}
      {selectedLevel && !selectedModule && (
        <div className="grid gap-3 sm:grid-cols-2">
          {modules.map(m => (
            <Card key={m.id} className="cursor-pointer hover:border-secondary transition-colors" onClick={() => setSelectedModule(m.id)}>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">{m.order_index}. {m.title}</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0"><p className="text-xs text-muted-foreground">{m.learning_goal}</p></CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Lesson List ─── */}
      {selectedModule && !selectedLesson && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{moduleTitle} — Lessons</h2>
            <Button size="sm" onClick={addNewLesson}><Plus className="w-4 h-4 mr-1" /> Add Lesson</Button>
          </div>
          <div className="space-y-2">
            {lessons.map(l => (
              <Card key={l.id} className="cursor-pointer hover:border-secondary transition-colors" onClick={() => setSelectedLesson(l)}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{l.order_index}. {l.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{l.duration_minutes} min · {l.lesson_type}</span>
                  </div>
                  <Badge variant={l.is_active ? "default" : "secondary"} className="text-xs">{l.is_active ? "Active" : "Draft"}</Badge>
                </CardContent>
              </Card>
            ))}
            {lessons.length === 0 && <p className="text-sm text-muted-foreground">No lessons yet. Click "Add Lesson" to create one.</p>}
          </div>
        </div>
      )}

      {/* ─── Lesson Builder ─── */}
      {selectedLesson && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <Tabs value={lessonTab} onValueChange={setLessonTab}>
              <TabsList className="w-full flex flex-wrap h-auto gap-1">
                <TabsTrigger value="overview" className="text-xs gap-1"><FileText className="w-3 h-3" /> Overview</TabsTrigger>
                <TabsTrigger value="vocabulary" className="text-xs gap-1"><BookOpen className="w-3 h-3" /> Vocabulary</TabsTrigger>
                <TabsTrigger value="dialogue" className="text-xs gap-1"><ClipboardList className="w-3 h-3" /> Dialogue</TabsTrigger>
                <TabsTrigger value="voice" className="text-xs gap-1"><Mic className="w-3 h-3" /> Voice</TabsTrigger>
                <TabsTrigger value="quiz" className="text-xs gap-1"><HelpCircle className="w-3 h-3" /> Quiz</TabsTrigger>
                <TabsTrigger value="homework" className="text-xs gap-1"><GraduationCap className="w-3 h-3" /> Homework</TabsTrigger>
                <TabsTrigger value="import" className="text-xs gap-1"><Upload className="w-3 h-3" /> Import</TabsTrigger>
              </TabsList>

              {/* ── Overview ── */}
              <TabsContent value="overview" className="space-y-3 mt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Title</Label><Input value={selectedLesson.title} onChange={e => setSelectedLesson({ ...selectedLesson, title: e.target.value })} /></div>
                  <div><Label>Duration (min)</Label><Input type="number" value={selectedLesson.duration_minutes} onChange={e => setSelectedLesson({ ...selectedLesson, duration_minutes: +e.target.value })} /></div>
                  <div><Label>Lesson Type</Label>
                    <Select value={selectedLesson.lesson_type} onValueChange={v => setSelectedLesson({ ...selectedLesson, lesson_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="self_paced">Self-paced</SelectItem><SelectItem value="live">Live</SelectItem><SelectItem value="mixed">Mixed</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Order</Label><Input type="number" value={selectedLesson.order_index} onChange={e => setSelectedLesson({ ...selectedLesson, order_index: +e.target.value })} /></div>
                </div>
                <div><Label>Learning Objective</Label><Textarea value={selectedLesson.learning_objective || ""} onChange={e => setSelectedLesson({ ...selectedLesson, learning_objective: e.target.value })} /></div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div><Label>Speaking Focus</Label><Input value={selectedLesson.speaking_focus || ""} onChange={e => setSelectedLesson({ ...selectedLesson, speaking_focus: e.target.value })} /></div>
                  <div><Label>Grammar Focus</Label><Input value={selectedLesson.grammar_focus || ""} onChange={e => setSelectedLesson({ ...selectedLesson, grammar_focus: e.target.value })} /></div>
                  <div><Label>Vocabulary Focus</Label><Input value={selectedLesson.vocabulary_focus || ""} onChange={e => setSelectedLesson({ ...selectedLesson, vocabulary_focus: e.target.value })} /></div>
                </div>
                <div className="flex items-center gap-2"><Switch checked={selectedLesson.is_active} onCheckedChange={v => setSelectedLesson({ ...selectedLesson, is_active: v })} /><Label>Active</Label></div>
                <Button onClick={saveLesson} disabled={saving}><Save className="w-4 h-4 mr-1" /> Save Lesson</Button>
              </TabsContent>

              {/* ── Vocabulary ── */}
              <TabsContent value="vocabulary" className="space-y-3 mt-4">
                {vocab.map((v, i) => (
                  <Card key={v.id || i} className="p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input placeholder="Word" value={v.word} onChange={e => { const n = [...vocab]; n[i] = { ...v, word: e.target.value }; setVocab(n); }} />
                      <Input placeholder="Definition" value={v.definition} onChange={e => { const n = [...vocab]; n[i] = { ...v, definition: e.target.value }; setVocab(n); }} />
                      <Input placeholder="Example sentence" value={v.example_sentence} onChange={e => { const n = [...vocab]; n[i] = { ...v, example_sentence: e.target.value }; setVocab(n); }} />
                      <div className="flex gap-2"><Input placeholder="Pronunciation hint" value={v.pronunciation_hint} onChange={e => { const n = [...vocab]; n[i] = { ...v, pronunciation_hint: e.target.value }; setVocab(n); }} />{v.id && <Button size="icon" variant="ghost" onClick={() => deleteVocabItem(v.id!)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}</div>
                    </div>
                  </Card>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setVocab([...vocab, { lesson_id: selectedLesson.id, word: "", definition: "", example_sentence: "", pronunciation_hint: "", order_index: vocab.length + 1 }])}><Plus className="w-3 h-3 mr-1" /> Add Word</Button>
                  <Button size="sm" onClick={saveVocab} disabled={saving}><Save className="w-3 h-3 mr-1" /> Save</Button>
                </div>
              </TabsContent>

              {/* ── Dialogue ── */}
              <TabsContent value="dialogue" className="space-y-3 mt-4">
                {dialogues.map((d, i) => (
                  <div key={d.id || i} className="flex gap-2 items-start">
                    <Input className="w-28" placeholder="Speaker" value={d.speaker_name} onChange={e => { const n = [...dialogues]; n[i] = { ...d, speaker_name: e.target.value }; setDialogues(n); }} />
                    <Input className="flex-1" placeholder="Line" value={d.line_text} onChange={e => { const n = [...dialogues]; n[i] = { ...d, line_text: e.target.value }; setDialogues(n); }} />
                    {d.id && <Button size="icon" variant="ghost" onClick={() => deleteDialogueLine(d.id!)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDialogues([...dialogues, { lesson_id: selectedLesson.id, speaker_name: "", line_text: "", order_index: dialogues.length + 1 }])}><Plus className="w-3 h-3 mr-1" /> Add Line</Button>
                  <Button size="sm" onClick={saveDialogues} disabled={saving}><Save className="w-3 h-3 mr-1" /> Save</Button>
                </div>
              </TabsContent>

              {/* ── Voice Practice ── */}
              <TabsContent value="voice" className="space-y-3 mt-4">
                {voicePrompts.map((vp, i) => (
                  <Card key={vp.id || i} className="p-3 space-y-2">
                    <Input placeholder="Prompt title" value={vp.prompt_title} onChange={e => { const n = [...voicePrompts]; n[i] = { ...vp, prompt_title: e.target.value }; setVoicePrompts(n); }} />
                    <Textarea placeholder="Prompt text (what to ask student)" value={vp.prompt_text} onChange={e => { const n = [...voicePrompts]; n[i] = { ...vp, prompt_text: e.target.value }; setVoicePrompts(n); }} />
                    <Textarea placeholder="Sample answer" value={vp.sample_answer || ""} onChange={e => { const n = [...voicePrompts]; n[i] = { ...vp, sample_answer: e.target.value }; setVoicePrompts(n); }} />
                    <Input placeholder="Feedback hint" value={vp.feedback_hint || ""} onChange={e => { const n = [...voicePrompts]; n[i] = { ...vp, feedback_hint: e.target.value }; setVoicePrompts(n); }} />
                  </Card>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setVoicePrompts([...voicePrompts, { lesson_id: selectedLesson.id, prompt_title: "", prompt_text: "", sample_answer: "", feedback_hint: "", order_index: voicePrompts.length + 1 }])}><Plus className="w-3 h-3 mr-1" /> Add Prompt</Button>
                  <Button size="sm" onClick={saveVoicePrompts} disabled={saving}><Save className="w-3 h-3 mr-1" /> Save</Button>
                </div>
              </TabsContent>

              {/* ── Quiz ── */}
              <TabsContent value="quiz" className="space-y-3 mt-4">
                {quizQuestions.map((q, i) => (
                  <Card key={q.id || i} className="p-3 space-y-2">
                    <div className="flex gap-2">
                      <Select value={q.question_type} onValueChange={v => { const n = [...quizQuestions]; n[i] = { ...q, question_type: v }; setQuizQuestions(n); }}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="multiple_choice">Multiple Choice</SelectItem><SelectItem value="true_false">True/False</SelectItem><SelectItem value="listening">Listening</SelectItem><SelectItem value="short_answer">Short Answer</SelectItem></SelectContent>
                      </Select>
                      {q.id && <Button size="icon" variant="ghost" onClick={() => deleteQuizQuestion(q.id!)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                    </div>
                    <Textarea placeholder="Question prompt" value={q.prompt} onChange={e => { const n = [...quizQuestions]; n[i] = { ...q, prompt: e.target.value }; setQuizQuestions(n); }} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input placeholder="A)" value={q.option_a} onChange={e => { const n = [...quizQuestions]; n[i] = { ...q, option_a: e.target.value }; setQuizQuestions(n); }} />
                      <Input placeholder="B)" value={q.option_b} onChange={e => { const n = [...quizQuestions]; n[i] = { ...q, option_b: e.target.value }; setQuizQuestions(n); }} />
                      <Input placeholder="C)" value={q.option_c || ""} onChange={e => { const n = [...quizQuestions]; n[i] = { ...q, option_c: e.target.value }; setQuizQuestions(n); }} />
                      <Input placeholder="D) (optional)" value={q.option_d || ""} onChange={e => { const n = [...quizQuestions]; n[i] = { ...q, option_d: e.target.value }; setQuizQuestions(n); }} />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div><Label>Correct Answer</Label><Select value={q.correct_answer} onValueChange={v => { const n = [...quizQuestions]; n[i] = { ...q, correct_answer: v }; setQuizQuestions(n); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem><SelectItem value="D">D</SelectItem></SelectContent></Select></div>
                      <div><Label>Explanation</Label><Input value={q.explanation || ""} onChange={e => { const n = [...quizQuestions]; n[i] = { ...q, explanation: e.target.value }; setQuizQuestions(n); }} /></div>
                    </div>
                  </Card>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setQuizQuestions([...quizQuestions, { lesson_id: selectedLesson.id, question_type: "multiple_choice", prompt: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "A", explanation: "", order_index: quizQuestions.length + 1 }])}><Plus className="w-3 h-3 mr-1" /> Add Question</Button>
                  <Button size="sm" onClick={saveQuiz} disabled={saving}><Save className="w-3 h-3 mr-1" /> Save</Button>
                </div>
              </TabsContent>

              {/* ── Homework ── */}
              <TabsContent value="homework" className="space-y-3 mt-4">
                {homework.map((h, i) => (
                  <Card key={h.id || i} className="p-3 space-y-2">
                    <Input placeholder="Task title" value={h.task_title} onChange={e => { const n = [...homework]; n[i] = { ...h, task_title: e.target.value }; setHomework(n); }} />
                    <Textarea placeholder="Task description" value={h.task_description || ""} onChange={e => { const n = [...homework]; n[i] = { ...h, task_description: e.target.value }; setHomework(n); }} />
                    <Select value={h.submission_type} onValueChange={v => { const n = [...homework]; n[i] = { ...h, submission_type: v }; setHomework(n); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="none">No submission</SelectItem><SelectItem value="text">Text</SelectItem><SelectItem value="voice">Voice recording</SelectItem><SelectItem value="worksheet_upload">File upload</SelectItem></SelectContent>
                    </Select>
                  </Card>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setHomework([...homework, { lesson_id: selectedLesson.id, task_title: "", task_description: "", submission_type: "none", order_index: homework.length + 1 }])}><Plus className="w-3 h-3 mr-1" /> Add Task</Button>
                  <Button size="sm" onClick={saveHomework} disabled={saving}><Save className="w-3 h-3 mr-1" /> Save</Button>
                </div>
              </TabsContent>

              {/* ── Bulk Import ── */}
              <TabsContent value="import" className="space-y-4 mt-4">
                <Card className="p-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Bulk Import</h3>
                  <p className="text-sm text-muted-foreground">Upload a CSV or JSON file to import vocabulary or quiz questions into this lesson.</p>
                  <p className="text-xs text-muted-foreground">Vocab CSV headers: word, definition, example_sentence, pronunciation_hint</p>
                  <p className="text-xs text-muted-foreground">Quiz CSV headers: question_type, prompt, option_a, option_b, option_c, option_d, correct_answer, explanation</p>
                  <Input type="file" accept=".csv,.json" onChange={handleBulkImport} />
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">D.O.M.E. provides English language learning support and communication training. These courses are not accredited academic degree programs.</p>
    </div>
  );
};

export default EnglishContentManager;

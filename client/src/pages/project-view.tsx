import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation, useParams } from "wouter";
import type { Project, Character, Scene, Prompt } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Copy, Check, Trash2, Wand2, ExternalLink,
  Camera, Film, Clapperboard, FileText, Download, User, Loader2, Zap, Upload
} from "lucide-react";

// ─── Copy button helper ───
function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleCopy} data-testid={`button-copy-${label || 'prompt'}`}>
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

// ─── Model badge ───
function ModelBadge({ model, isApi }: { model: string; isApi: boolean }) {
  const displayName: Record<string, string> = {
    "flux-2-pro": "Flux 2 Pro",
    "kling-3.0": "Kling 3.0",
    "seedance-2.0": "Seedance 2.0",
    "cinema-studio-2.5": "Cinema Studio 2.5",
    "soul-cinema": "Soul Cinema",
    "higgsfield-soul": "Higgsfield Soul",
  };
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${isApi ? "border-primary/40 text-primary" : "border-amber-500/40 text-amber-400"}`}>
      {isApi ? "API" : "UI"} · {displayName[model] || model}
    </Badge>
  );
}

// ─── Character Form ───
const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Thriller", "Horror", "Detective", "Romance", "Sci-Fi", "Fantasy", "War", "Western", "Historical", "Sitcom"];
const BUDGETS = ["Low", "Medium", "High"];
const ARCHETYPES = ["Innocent", "Everyman", "Hero", "Caregiver", "Explorer", "Rebel", "Lover", "Creator", "Jester", "Sage", "Magician", "Ruler"];

function CharacterForm({ projectId, onCreated }: { projectId: number; onCreated: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "", genre: "Drama", budget: "Medium", era: "2020s", archetype: "Everyman",
    gender: "", ethnicity: "", ageRange: "", height: "", build: "",
    eyeColor: "", hair: "", facialHair: "", details: "", outfit: "",
  });
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/characters", { ...form, projectId, saved: 0 });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "characters"] });
      onCreated();
      setForm({ name: "", genre: "Drama", budget: "Medium", era: "2020s", archetype: "Everyman", gender: "", ethnicity: "", ageRange: "", height: "", build: "", eyeColor: "", hair: "", facialHair: "", details: "", outfit: "" });
      toast({ title: "Character added" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add character", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card className="p-4 border-border/50 space-y-4">
      <h3 className="text-sm font-semibold">Add Character (Soul Cast Spec)</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Name *</Label>
          <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Character name" className="h-8 text-sm" data-testid="input-char-name" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Genre</Label>
          <Select value={form.genre} onValueChange={v => update("genre", v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Budget</Label>
          <Select value={form.budget} onValueChange={v => update("budget", v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{BUDGETS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Era</Label>
          <Input value={form.era} onChange={e => update("era", e.target.value)} placeholder="2020s" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Archetype</Label>
          <Select value={form.archetype} onValueChange={v => update("archetype", v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{ARCHETYPES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Gender</Label>
          <Input value={form.gender} onChange={e => update("gender", e.target.value)} placeholder="Male / Female / Non-binary" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Ethnicity</Label>
          <Input value={form.ethnicity} onChange={e => update("ethnicity", e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Age Range</Label>
          <Input value={form.ageRange} onChange={e => update("ageRange", e.target.value)} placeholder="25-35" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Build</Label>
          <Input value={form.build} onChange={e => update("build", e.target.value)} placeholder="Athletic" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Hair</Label>
          <Input value={form.hair} onChange={e => update("hair", e.target.value)} placeholder="Dark brown, wavy" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Eye Color</Label>
          <Input value={form.eyeColor} onChange={e => update("eyeColor", e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Facial Hair</Label>
          <Input value={form.facialHair} onChange={e => update("facialHair", e.target.value)} placeholder="None / Stubble / Beard" className="h-8 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Details (scars, tattoos, etc.)</Label>
          <Input value={form.details} onChange={e => update("details", e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Outfit</Label>
          <Input value={form.outfit} onChange={e => update("outfit", e.target.value)} placeholder="Casual streetwear..." className="h-8 text-sm" />
        </div>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!form.name.trim() || mutation.isPending} size="sm" className="gap-1.5" data-testid="button-add-character">
        {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
        Add Character
      </Button>
    </Card>
  );
}

// ─── Character Card ───
function CharacterCard({ char, onDelete, onSave, onRefresh }: { char: Character; onDelete: () => void; onSave: () => void; onRefresh: () => void }) {
  const { toast } = useToast();
  const [showSoulForm, setShowSoulForm] = useState(false);
  const [soulImageUrl, setSoulImageUrl] = useState("");
  const [creatingSoul, setCreatingSoul] = useState(false);
  const spec = `Genre: ${char.genre}\nBudget: ${char.budget}\nEra: ${char.era}\nArchetype: ${char.archetype}\nIdentity: ${[char.gender, char.ethnicity, char.ageRange].filter(Boolean).join(", ")}\nPhysical: ${[char.height, char.build, char.eyeColor, char.hair, char.facialHair].filter(Boolean).join(", ")}\nDetails: ${char.details || "None"}\nOutfit: ${char.outfit || "Not specified"}`;

  const handleCreateSoulId = async () => {
    if (!soulImageUrl.trim()) return;
    setCreatingSoul(true);
    try {
      const r = await apiRequest("POST", "/api/create-soul-id", {
        characterId: char.id,
        name: char.name,
        imageUrls: [soulImageUrl.trim()],
      });
      const data = await r.json() as { soulId?: string; error?: string };
      if (data.error) throw new Error(data.error);
      setSoulImageUrl("");
      setShowSoulForm(false);
      onRefresh();
      toast({ title: "Soul ID created", description: `ID: ${data.soulId}` });
    } catch (err: any) {
      toast({ title: "Soul ID failed", description: err.message, variant: "destructive" });
    } finally {
      setCreatingSoul(false);
    }
  };

  return (
    <Card className="p-4 border-border/50" data-testid={`card-character-${char.id}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">{char.name}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{char.archetype}</Badge>
          {char.soulId && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-primary/40 text-primary cursor-pointer font-mono"
              onClick={() => navigator.clipboard.writeText(char.soulId!)}
              title="Click to copy Soul ID"
              data-testid={`badge-soul-id-${char.id}`}
            >
              Soul ID: {char.soulId.substring(0, 8)}…
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <CopyButton text={spec} label={`char-${char.id}`} />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={() => setShowSoulForm(!showSoulForm)}
            data-testid={`button-soul-id-${char.id}`}
          >
            <Upload className="w-3 h-3" />
            Soul ID
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onSave} data-testid={`button-save-char-${char.id}`}>
            {char.saved ? "Saved" : "Save to Library"}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      {showSoulForm && (
        <div className="flex gap-2 mb-2">
          <Input
            value={soulImageUrl}
            onChange={e => setSoulImageUrl(e.target.value)}
            placeholder="Reference image URL (https://…)"
            className="h-7 text-xs flex-1"
          />
          <Button size="sm" className="h-7 text-xs gap-1" onClick={handleCreateSoulId} disabled={!soulImageUrl.trim() || creatingSoul}>
            {creatingSoul ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Create
          </Button>
        </div>
      )}
      <pre className="text-xs text-muted-foreground font-mono bg-muted/50 rounded p-3 whitespace-pre-wrap">{spec}</pre>
    </Card>
  );
}

// ─── Main Project View ───
export default function ProjectView() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("brief");

  const { data: project, isLoading: projLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
  });
  const { data: chars = [], refetch: refetchChars } = useQuery<Character[]>({
    queryKey: ["/api/projects", projectId, "characters"],
    queryFn: async () => { const r = await apiRequest("GET", `/api/projects/${projectId}/characters`); return r.json(); },
  });
  const { data: scenesData = [], refetch: refetchScenes } = useQuery<Scene[]>({
    queryKey: ["/api/projects", projectId, "scenes"],
    queryFn: async () => { const r = await apiRequest("GET", `/api/projects/${projectId}/scenes`); return r.json(); },
  });
  const { data: promptsData = [], refetch: refetchPrompts } = useQuery<Prompt[]>({
    queryKey: ["/api/projects", projectId, "prompts"],
    queryFn: async () => { const r = await apiRequest("GET", `/api/projects/${projectId}/prompts`); return r.json(); },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/projects/${projectId}/scenes/generate`);
    },
    onSuccess: () => {
      refetchScenes();
      refetchPrompts();
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({ title: "Storyboard generated", description: "Scenes and prompts are ready." });
      setActiveTab("storyboard");
    },
  });

  const deleteCharMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/characters/${id}`),
    onSuccess: () => refetchChars(),
  });

  const saveCharMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/characters/${id}`, { saved: 1 }),
    onSuccess: () => {
      refetchChars();
      queryClient.invalidateQueries({ queryKey: ["/api/characters/saved"] });
      toast({ title: "Saved to character library" });
    },
  });

  const updatePromptStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiRequest("PATCH", `/api/prompts/${id}`, { status }),
    onSuccess: () => refetchPrompts(),
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: Record<string, string>) => apiRequest("PATCH", `/api/projects/${projectId}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] }),
  });

  if (projLoading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-64 w-full" /></div>;
  if (!project) return <div className="p-6 text-muted-foreground">Project not found.</div>;

  const imagePrompts = promptsData.filter(p => p.type === "image");
  const videoPrompts = promptsData.filter(p => p.type === "video");
  const multiShotPrompt = promptsData.find(p => p.type === "multi-shot");
  const cinemaSpec = promptsData.find(p => p.type === "cinema-spec");

  const allPromptsText = promptsData.map(p => `[${p.type.toUpperCase()} — ${p.model}]\n${p.promptText}`).join("\n\n---\n\n");

  const exportData = {
    project,
    characters: chars,
    scenes: scenesData,
    prompts: promptsData,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-project-name">{project.name}</h1>
          <p className="text-xs text-muted-foreground">{project.client} · {project.contentType.replace(/-/g, " ")} · {project.duration} · {project.aspectRatio}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => updateProjectMutation.mutate({ status: "complete" })}
          data-testid="button-mark-complete"
        >
          <Check className="w-3 h-3" /> Mark Complete
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="brief" className="text-xs gap-1.5" data-testid="tab-brief">
            <FileText className="w-3 h-3" /> Brief
          </TabsTrigger>
          <TabsTrigger value="characters" className="text-xs gap-1.5" data-testid="tab-characters">
            <User className="w-3 h-3" /> Characters
          </TabsTrigger>
          <TabsTrigger value="storyboard" className="text-xs gap-1.5" data-testid="tab-storyboard">
            <Clapperboard className="w-3 h-3" /> Storyboard
          </TabsTrigger>
          <TabsTrigger value="shots" className="text-xs gap-1.5" data-testid="tab-shots">
            <Camera className="w-3 h-3" /> Shots & Prompts
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs gap-1.5" data-testid="tab-export">
            <Download className="w-3 h-3" /> Export
          </TabsTrigger>
        </TabsList>

        {/* ─── BRIEF TAB ─── */}
        <TabsContent value="brief" className="space-y-4 mt-4">
          <Card className="p-4 border-border/50">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Product", project.productName],
                ["Target Audience", project.targetAudience],
                ["Content Type", project.contentType.replace(/-/g, " ")],
                ["Duration", project.duration],
                ["Aspect Ratio", project.aspectRatio],
                ["Mood / Style", project.moodKeywords],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <dt className="text-xs text-muted-foreground font-medium">{label}</dt>
                  <dd className="font-medium mt-0.5">{val || "—"}</dd>
                </div>
              ))}
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground font-medium">Product Description</dt>
                <dd className="mt-0.5">{project.productDescription || "—"}</dd>
              </div>
              {project.referenceNotes && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground font-medium">Reference Notes</dt>
                  <dd className="mt-0.5">{project.referenceNotes}</dd>
                </div>
              )}
            </dl>
          </Card>
          <div className="flex gap-2">
            <Button onClick={() => setActiveTab("characters")} className="gap-1.5" data-testid="button-next-characters">
              Next: Characters <ArrowLeft className="w-3 h-3 rotate-180" />
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              data-testid="button-generate-storyboard"
            >
              {generateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              Generate Storyboard
            </Button>
          </div>
        </TabsContent>

        {/* ─── CHARACTERS TAB ─── */}
        <TabsContent value="characters" className="space-y-4 mt-4">
          <CharacterForm projectId={projectId} onCreated={() => refetchChars()} />
          {chars.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No characters yet. Add one above or skip to storyboard.
            </div>
          ) : (
            <div className="space-y-3">
              {chars.map((c) => (
                <CharacterCard
                  key={c.id}
                  char={c}
                  onDelete={() => deleteCharMutation.mutate(c.id)}
                  onSave={() => saveCharMutation.mutate(c.id)}
                  onRefresh={() => refetchChars()}
                />
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => setActiveTab("storyboard")} className="gap-1.5" data-testid="button-next-storyboard">
              Next: Storyboard <ArrowLeft className="w-3 h-3 rotate-180" />
            </Button>
            {scenesData.length === 0 && (
              <Button variant="outline" className="gap-1.5" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} data-testid="button-generate-2">
                {generateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                Generate Storyboard
              </Button>
            )}
          </div>
        </TabsContent>

        {/* ─── STORYBOARD TAB ─── */}
        <TabsContent value="storyboard" className="space-y-4 mt-4">
          {scenesData.length === 0 ? (
            <div className="text-center py-12">
              <Clapperboard className="w-8 h-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">No storyboard yet. Generate one from the brief.</p>
              <Button className="gap-1.5" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} data-testid="button-generate-3">
                {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Generate Storyboard
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{scenesData.length} Scenes</h2>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                  <Wand2 className="w-3 h-3" /> Regenerate
                </Button>
              </div>
              <div className="space-y-2">
                {scenesData.map((scene) => (
                  <Card key={scene.id} className="p-4 border-border/50" data-testid={`card-scene-${scene.id}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {scene.sceneNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono text-muted-foreground">{scene.timing}</span>
                          <ModelBadge model={scene.modelRecommendation} isApi={["kling-3.0", "flux-2-pro"].includes(scene.modelRecommendation)} />
                        </div>
                        <p className="text-sm leading-relaxed">{scene.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-muted-foreground font-mono">
                          <span>{scene.camera}</span>
                          <span>·</span>
                          <span>{scene.lens}</span>
                          <span>·</span>
                          <span>{scene.focalLength}</span>
                          <span>·</span>
                          <span>{scene.aperture}</span>
                          <span>·</span>
                          <span>{scene.movement}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <Button onClick={() => setActiveTab("shots")} className="gap-1.5" data-testid="button-next-shots">
                Next: Shots & Prompts <ArrowLeft className="w-3 h-3 rotate-180" />
              </Button>
            </>
          )}
        </TabsContent>

        {/* ─── SHOTS & PROMPTS TAB ─── */}
        <TabsContent value="shots" className="space-y-6 mt-4">
          {promptsData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="mb-4">Generate the storyboard first to see prompts.</p>
              <Button className="gap-1.5" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                <Wand2 className="w-4 h-4" /> Generate Storyboard
              </Button>
            </div>
          ) : (
            <>
              {/* Image Prompts */}
              <div>
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" /> Image Prompts ({imagePrompts.length})
                </h2>
                <div className="space-y-2">
                  {imagePrompts.map((p) => (
                    <PromptCard key={p.id} prompt={p} onStatusChange={(s) => updatePromptStatusMutation.mutate({ id: p.id, status: s })} onRefresh={refetchPrompts} />
                  ))}
                </div>
              </div>

              {/* Video Prompts */}
              <div>
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Film className="w-4 h-4 text-primary" /> Video Prompts ({videoPrompts.length})
                </h2>
                <div className="space-y-2">
                  {videoPrompts.map((p) => (
                    <PromptCard key={p.id} prompt={p} onStatusChange={(s) => updatePromptStatusMutation.mutate({ id: p.id, status: s })} onRefresh={refetchPrompts} />
                  ))}
                </div>
              </div>

              {/* Multi-shot Prompt */}
              {multiShotPrompt && (
                <div>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Clapperboard className="w-4 h-4 text-amber-400" /> Seedance 2.0 Multi-Shot Prompt
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-400">UI Only</Badge>
                  </h2>
                  <Card className="p-4 border-border/50 border-amber-500/20">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Copy this entire block into Seedance 2.0 multi-shot editor</span>
                      <div className="flex gap-1">
                        <CopyButton text={multiShotPrompt.promptText} label="multi-shot" />
                        <a href="https://www.higgsfield.ai" target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
                            <ExternalLink className="w-3 h-3" /> Open Higgsfield
                          </Button>
                        </a>
                      </div>
                    </div>
                    <pre className="text-xs font-mono bg-muted/50 rounded p-3 whitespace-pre-wrap leading-relaxed">{multiShotPrompt.promptText}</pre>
                  </Card>
                </div>
              )}

              {/* Cinema Studio Spec */}
              {cinemaSpec && (
                <div>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Film className="w-4 h-4 text-amber-400" /> Cinema Studio 2.5 Spec
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-400">UI Only</Badge>
                  </h2>
                  <Card className="p-4 border-border/50 border-amber-500/20">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Camera rig specification for Cinema Studio 2.5</span>
                      <CopyButton text={cinemaSpec.promptText} label="cinema-spec" />
                    </div>
                    <pre className="text-xs font-mono bg-muted/50 rounded p-3 whitespace-pre-wrap leading-relaxed">{cinemaSpec.promptText}</pre>
                  </Card>
                </div>
              )}

              <Button onClick={() => setActiveTab("export")} className="gap-1.5" data-testid="button-next-export">
                Next: Export <ArrowLeft className="w-3 h-3 rotate-180" />
              </Button>
            </>
          )}
        </TabsContent>

        {/* ─── EXPORT TAB ─── */}
        <TabsContent value="export" className="space-y-4 mt-4">
          <ExportTab
            project={project}
            projectId={projectId}
            scenesData={scenesData}
            promptsData={promptsData}
            chars={chars}
            allPromptsText={allPromptsText}
            exportData={exportData}
            onRefreshPrompts={refetchPrompts}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Export Tab Component ───
type ExportTabProps = {
  project: Project;
  projectId: number;
  scenesData: Scene[];
  promptsData: Prompt[];
  chars: Character[];
  allPromptsText: string;
  exportData: object;
  onRefreshPrompts: () => void;
};

function ExportTab({ project, projectId, scenesData, promptsData, chars, allPromptsText, exportData, onRefreshPrompts }: ExportTabProps) {
  const { toast } = useToast();
  const [batchState, setBatchState] = useState<Record<number, "idle" | "generating" | "done" | "error">>({});
  const [batchRunning, setBatchRunning] = useState(false);

  const apiImagePrompts = promptsData.filter(p => p.type === "image" && p.isApiAvailable);
  const apiVideoPrompts = promptsData.filter(p => p.type === "video" && p.isApiAvailable);
  const completedImages = promptsData.filter(p => p.type === "image" && p.generatedUrl).length;
  const completedVideos = promptsData.filter(p => p.type === "video" && p.generatedUrl).length;

  const generateAndPoll = async (prompt: Prompt, type: "image" | "video"): Promise<void> => {
    setBatchState(s => ({ ...s, [prompt.id]: "generating" }));
    try {
      const endpoint = type === "image" ? "/api/generate/image" : "/api/generate/video";
      const body: Record<string, unknown> = { promptId: prompt.id, model: prompt.model, prompt: prompt.promptText };
      if (type === "video" && prompt.sceneId) {
        const sceneImagePrompt = promptsData.find(p2 => p2.sceneId === prompt.sceneId && p2.type === "image" && p2.generatedUrl);
        if (sceneImagePrompt?.generatedUrl) body.inputImage = sceneImagePrompt.generatedUrl;
      }
      const r = await apiRequest("POST", endpoint, body);
      const data = await r.json() as { requestId?: string; error?: string };
      if (data.error) throw new Error(data.error);

      // Poll until complete
      const genId = data.requestId;
      if (!genId) throw new Error("No generation ID returned");

      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            const pollUrl = `/api/generate/status/${genId}?promptId=${prompt.id}` +
              (prompt.sceneId ? `&projectId=${projectId}&sceneNumber=${prompt.sceneId}&assetType=${type}` : "");
            const sr = await apiRequest("GET", pollUrl);
            const sd = await sr.json() as { status: string };
            if (sd.status === "completed") { clearInterval(interval); resolve(); }
          } catch (e) { clearInterval(interval); reject(e); }
        }, type === "video" ? 10000 : 2000);
      });

      setBatchState(s => ({ ...s, [prompt.id]: "done" }));
      onRefreshPrompts();
    } catch (err: any) {
      setBatchState(s => ({ ...s, [prompt.id]: "error" }));
      throw err;
    }
  };

  const handleGenerateAll = async () => {
    if (!apiImagePrompts.length) { toast({ title: "No API image prompts to generate", variant: "destructive" }); return; }
    setBatchRunning(true);
    let errors = 0;

    // Step 1: generate all images
    toast({ title: "Generating images…", description: `0 / ${apiImagePrompts.length}` });
    for (const p of apiImagePrompts) {
      try { await generateAndPoll(p, "image"); } catch { errors++; }
    }
    onRefreshPrompts();

    // Step 2: generate videos using the image outputs
    if (apiVideoPrompts.length) {
      toast({ title: "Generating videos…", description: `0 / ${apiVideoPrompts.length}` });
      for (const p of apiVideoPrompts) {
        try { await generateAndPoll(p, "video"); } catch { errors++; }
      }
      onRefreshPrompts();
    }

    setBatchRunning(false);
    toast({
      title: errors ? `Done with ${errors} error(s)` : "All assets generated",
      description: errors ? "Some generations failed — check individual prompts" : "Production package ready for export",
    });
  };

  const batchStatusBg: Record<string, string> = {
    idle: "bg-muted/30",
    generating: "bg-blue-500/10 border-blue-500/30",
    done: "bg-emerald-500/10 border-emerald-500/30",
    error: "bg-destructive/10 border-destructive/30",
  };

  return (
    <>
      {/* Actions header */}
      <Card className="p-4 border-border/50">
        <h2 className="text-sm font-semibold mb-3">Production Package</h2>
        <p className="text-xs text-muted-foreground mb-4">
          {scenesData.length} scenes · {promptsData.length} prompts · {chars.length} characters ·
          <span className="text-primary"> {completedImages} images</span> ·
          <span className="text-primary"> {completedVideos} videos</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleGenerateAll}
            disabled={batchRunning || !apiImagePrompts.length}
            data-testid="button-generate-all"
          >
            {batchRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {batchRunning ? "Generating…" : "Generate All"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => window.location.href = `/api/projects/${projectId}/export/zip`}
            data-testid="button-download-zip"
          >
            <Download className="w-3 h-3" /> Download ZIP
          </Button>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => navigator.clipboard.writeText(allPromptsText)} data-testid="button-copy-all-prompts">
            <Copy className="w-3 h-3" /> Copy All Prompts
          </Button>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))} data-testid="button-copy-json">
            <Copy className="w-3 h-3" /> Copy JSON
          </Button>
        </div>
      </Card>

      {/* Scene grid with live progress */}
      {scenesData.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Scene Grid</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {scenesData.map((scene) => {
              const imgPrompt = promptsData.find(p => p.sceneId === scene.id && p.type === "image");
              const vidPrompt = promptsData.find(p => p.sceneId === scene.id && p.type === "video");
              const imgState = imgPrompt ? (batchState[imgPrompt.id] || "idle") : "idle";
              const vidState = vidPrompt ? (batchState[vidPrompt.id] || "idle") : "idle";
              return (
                <Card key={scene.id} className={`p-3 border text-xs ${batchStatusBg[imgState === "generating" ? "generating" : vidState === "generating" ? "generating" : imgState === "done" || vidState === "done" ? "done" : "idle"]}`} data-testid={`card-export-scene-${scene.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-muted-foreground">S{scene.sceneNumber}</span>
                    <div className="flex gap-1">
                      {imgState === "generating" && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                      {imgState === "done" && <Check className="w-3 h-3 text-emerald-400" />}
                      {vidState === "done" && <Film className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </div>
                  {imgPrompt?.generatedUrl ? (
                    <img src={imgPrompt.generatedUrl} alt={`Scene ${scene.sceneNumber}`} className="w-full h-20 object-cover rounded mb-1.5 border border-border/20" />
                  ) : (
                    <div className="w-full h-20 bg-muted/30 rounded mb-1.5 flex items-center justify-center">
                      {imgState === "generating" ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Camera className="w-4 h-4 text-muted-foreground/40" />}
                    </div>
                  )}
                  {vidPrompt?.generatedUrl && (
                    <video src={vidPrompt.generatedUrl} controls className="w-full rounded border border-border/20" style={{ maxHeight: "4rem" }} />
                  )}
                  <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{scene.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick prompt reference */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">All Prompts</h2>
        {promptsData.map((p, i) => (
          <Card key={p.id} className="p-3 border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{p.type}</Badge>
              <ModelBadge model={p.model} isApi={!!p.isApiAvailable} />
              {p.generatedUrl && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-400">done</Badge>}
              <div className="ml-auto"><CopyButton text={p.promptText} label={`export-${p.id}`} /></div>
            </div>
            <pre className="text-xs font-mono text-muted-foreground bg-muted/30 rounded p-2 whitespace-pre-wrap line-clamp-2">{p.promptText}</pre>
          </Card>
        ))}
      </div>
    </>
  );
}

// ─── Prompt Card Component ───
function PromptCard({ prompt, onStatusChange, onRefresh }: { prompt: Prompt; onStatusChange: (s: string) => void; onRefresh: () => void }) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => {
    if (prompt.status === "generating" && prompt.generationId) {
      setGenerating(true);
      pollRef.current = setInterval(async () => {
        try {
          const r = await apiRequest("GET", `/api/generate/status/${prompt.generationId}?promptId=${prompt.id}`);
          const data = await r.json() as { status: string; outputUrl?: string };
          if (data.status === "completed") {
            stopPolling();
            setGenerating(false);
            onRefresh();
          }
        } catch { stopPolling(); setGenerating(false); }
      }, 2000);
    } else {
      setGenerating(false);
    }
    return stopPolling;
  }, [prompt.status, prompt.generationId, prompt.id, stopPolling, onRefresh]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await apiRequest("POST", "/api/generate/image", {
        promptId: prompt.id,
        model: prompt.model,
        prompt: prompt.promptText,
      });
      const data = await r.json() as { requestId?: string; error?: string };
      if (data.error) throw new Error(data.error);
      onRefresh();
    } catch (err: any) {
      setGenerating(false);
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    generating: "bg-blue-500/20 text-blue-400",
    complete: "bg-emerald-500/20 text-emerald-400",
    generated: "bg-blue-500/20 text-blue-400",
    approved: "bg-emerald-500/20 text-emerald-400",
  };
  const nextStatus: Record<string, string> = { pending: "generated", generated: "approved", approved: "pending", complete: "approved" };

  return (
    <Card className="p-3 border-border/50" data-testid={`card-prompt-${prompt.id}`}>
      <div className="flex items-center gap-2 mb-2">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 cursor-pointer ${statusColors[prompt.status] || statusColors.pending}`}
          onClick={() => !generating && onStatusChange(nextStatus[prompt.status] || "generated")}
          data-testid={`badge-status-${prompt.id}`}
        >
          {generating ? <Loader2 className="w-2.5 h-2.5 animate-spin inline mr-1" /> : null}
          {generating ? "generating" : prompt.status}
        </Badge>
        <ModelBadge model={prompt.model} isApi={!!prompt.isApiAvailable} />
        {prompt.sceneId && <span className="text-[10px] text-muted-foreground font-mono">Scene #{prompt.sceneId}</span>}
        <div className="ml-auto flex gap-1">
          <CopyButton text={prompt.promptText} label={`prompt-${prompt.id}`} />
          {prompt.isApiAvailable ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-primary"
              onClick={handleGenerate}
              disabled={generating || prompt.status === "generating"}
              data-testid={`button-generate-${prompt.id}`}
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              {generating ? "Generating…" : "Generate"}
            </Button>
          ) : (
            <a href="https://www.higgsfield.ai" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-amber-400">
                <ExternalLink className="w-3 h-3" /> Copy to Higgsfield
              </Button>
            </a>
          )}
        </div>
      </div>
      <pre className="text-xs font-mono text-muted-foreground bg-muted/30 rounded p-2 whitespace-pre-wrap leading-relaxed">{prompt.promptText}</pre>
      {prompt.generatedUrl && (
        <div className="mt-2">
          <img
            src={prompt.generatedUrl}
            alt="Generated"
            className="rounded max-h-48 object-contain border border-border/30"
            data-testid={`img-generated-${prompt.id}`}
          />
        </div>
      )}
    </Card>
  );
}

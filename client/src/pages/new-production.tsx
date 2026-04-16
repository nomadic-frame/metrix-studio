import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Wand2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CONTENT_TYPES = [
  { value: "product-ad", label: "Product Ad (15–30s)" },
  { value: "character-brand", label: "Character-Driven Brand Content" },
  { value: "viral-clip", label: "Viral Social Clip (Reels/TikTok)" },
  { value: "cinematic-film", label: "Cinematic Brand Film (30–60s)" },
  { value: "3d-commercial", label: "3D Product Commercial" },
];

const ASPECT_RATIOS = ["16:9", "9:16", "21:9", "1:1"];
const DURATIONS = ["15s", "30s", "60s"];

interface SuggestedCharacter {
  name: string;
  genre: string;
  archetype: string;
  gender: string;
  ethnicity: string;
  ageRange: string;
  build: string;
  hair: string;
  outfit: string;
  personality: string;
  backstory: string;
}

interface BriefExpansion {
  name: string;
  client: string;
  productName: string;
  productDescription: string;
  targetAudience: string;
  contentType: string;
  aspectRatio: string;
  duration: string;
  moodKeywords: string;
  referenceNotes: string;
  suggestedCharacters: SuggestedCharacter[];
}

export default function NewProduction() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [quickBrief, setQuickBrief] = useState("");
  const [expanding, setExpanding] = useState(false);
  const [suggestedChars, setSuggestedChars] = useState<SuggestedCharacter[]>([]);

  const [form, setForm] = useState({
    name: "",
    client: "",
    productName: "",
    productDescription: "",
    targetAudience: "",
    contentType: "product-ad",
    aspectRatio: "16:9",
    duration: "15s",
    moodKeywords: "",
    referenceNotes: "",
  });

  const updateField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  // ─── Expand Brief with AI ───
  const handleExpand = async () => {
    if (!quickBrief.trim()) return;
    setExpanding(true);
    try {
      const r = await apiRequest("POST", "/api/expand-brief", { brief: quickBrief });
      const data = await r.json() as BriefExpansion;
      setForm({
        name: data.name || "",
        client: data.client || "",
        productName: data.productName || "",
        productDescription: data.productDescription || "",
        targetAudience: data.targetAudience || "",
        contentType: data.contentType || "product-ad",
        aspectRatio: data.aspectRatio || "16:9",
        duration: data.duration || "15s",
        moodKeywords: data.moodKeywords || "",
        referenceNotes: data.referenceNotes || "",
      });
      if (data.suggestedCharacters?.length) {
        setSuggestedChars(data.suggestedCharacters);
        toast({ title: `Brief expanded`, description: `${data.suggestedCharacters.length} character${data.suggestedCharacters.length > 1 ? "s" : ""} suggested` });
      } else {
        toast({ title: "Brief expanded" });
      }
    } catch (err: any) {
      toast({ title: "Expansion failed", description: err.message, variant: "destructive" });
    } finally {
      setExpanding(false);
    }
  };

  // ─── Create project + auto-create suggested characters ───
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/projects", {
        ...form,
        status: "brief",
        createdAt: new Date().toISOString(),
      });
      const project = await res.json() as { id: number };

      // Auto-create suggested characters
      for (const char of suggestedChars) {
        await apiRequest("POST", "/api/characters", {
          ...char,
          projectId: project.id,
          saved: 0,
          era: "2020s",
          budget: "Medium",
          eyeColor: "",
          facialHair: "",
          height: "",
          details: "",
          soulId: "",
        });
      }
      return project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      const charNote = suggestedChars.length ? ` · ${suggestedChars.length} characters pre-loaded` : "";
      toast({ title: "Production created", description: `"${form.name}" ready${charNote}` });
      navigate(`/project/${data.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const canSubmit = form.name.trim().length > 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-page-title">New Production</h1>
          <p className="text-sm text-muted-foreground">From brief to full Higgsfield production package</p>
        </div>
      </div>

      {/* ─── Quick Brief ─── */}
      <Card className="p-4 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Quick Brief</h2>
          <span className="text-xs text-muted-foreground ml-1">— describe in plain language, AI fills the rest</span>
        </div>
        <div className="flex gap-2">
          <Textarea
            placeholder='e.g. "STC telecom 30s brand film for Saudi youth, 9:16, two friends connecting across cities, cinematic and emotional"'
            value={quickBrief}
            onChange={e => setQuickBrief(e.target.value)}
            rows={2}
            className="flex-1 text-sm resize-none"
            data-testid="input-quick-brief"
          />
          <Button
            onClick={handleExpand}
            disabled={!quickBrief.trim() || expanding}
            className="gap-1.5 self-start"
            data-testid="button-expand-brief"
          >
            {expanding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {expanding ? "Expanding…" : "Expand"}
          </Button>
        </div>
        {suggestedChars.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Characters suggested:</span>
            {suggestedChars.map((c, i) => (
              <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                {c.name} · {c.archetype}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 border-border/50 space-y-6">
        {/* Project Info */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Production Name *</Label>
              <Input id="name" placeholder="e.g. Nike Summer 2026" value={form.name} onChange={e => updateField("name", e.target.value)} data-testid="input-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Input id="client" placeholder="e.g. Nike" value={form.client} onChange={e => updateField("client", e.target.value)} data-testid="input-client" />
            </div>
          </div>
        </div>

        {/* Product */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product / Brand Name</Label>
              <Input id="productName" placeholder="e.g. Air Max DN" value={form.productName} onChange={e => updateField("productName", e.target.value)} data-testid="input-product-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input id="targetAudience" placeholder="e.g. Saudi youth 18–25" value={form.targetAudience} onChange={e => updateField("targetAudience", e.target.value)} data-testid="input-audience" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="productDescription">Product Description</Label>
            <Textarea id="productDescription" placeholder="Describe the product, its key value, and what makes it compelling…" value={form.productDescription} onChange={e => updateField("productDescription", e.target.value)} rows={3} data-testid="input-product-desc" />
          </div>
        </div>

        {/* Format */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Format</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={form.contentType} onValueChange={v => updateField("contentType", v)}>
                <SelectTrigger data-testid="select-content-type"><SelectValue /></SelectTrigger>
                <SelectContent>{CONTENT_TYPES.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select value={form.aspectRatio} onValueChange={v => updateField("aspectRatio", v)}>
                <SelectTrigger data-testid="select-aspect-ratio"><SelectValue /></SelectTrigger>
                <SelectContent>{ASPECT_RATIOS.map(ar => <SelectItem key={ar} value={ar}>{ar}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={form.duration} onValueChange={v => updateField("duration", v)}>
                <SelectTrigger data-testid="select-duration"><SelectValue /></SelectTrigger>
                <SelectContent>{DURATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Style */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Style & Mood</h2>
          <div className="space-y-2">
            <Label htmlFor="moodKeywords">Mood / Style Keywords</Label>
            <Input id="moodKeywords" placeholder="e.g. cinematic, warm, premium, raw energy" value={form.moodKeywords} onChange={e => updateField("moodKeywords", e.target.value)} data-testid="input-mood" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referenceNotes">Reference Notes</Label>
            <Textarea id="referenceNotes" placeholder="Director references, brand guidelines, platform targets, specific requirements…" value={form.referenceNotes} onChange={e => updateField("referenceNotes", e.target.value)} rows={3} data-testid="input-references" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit || createMutation.isPending}
            className="gap-2"
            data-testid="button-create-production"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {suggestedChars.length ? `Create with ${suggestedChars.length} Character${suggestedChars.length > 1 ? "s" : ""}` : "Create Production"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

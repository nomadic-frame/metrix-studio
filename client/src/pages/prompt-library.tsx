import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PromptLibraryEntry } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Copy, Check, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      data-testid="button-copy-lib-prompt"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

const CATEGORIES = [
  { value: "product-ad", label: "Product Ad" },
  { value: "character-brand", label: "Character Brand" },
  { value: "viral-clip", label: "Viral Clip" },
  { value: "cinematic-film", label: "Cinematic Film" },
  { value: "3d-commercial", label: "3D Commercial" },
  { value: "general", label: "General" },
];

const TYPES = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "multi-shot", label: "Multi-Shot" },
  { value: "cinema-spec", label: "Cinema Spec" },
];

const MODELS = [
  "flux-2-pro", "kling-3.0", "seedance-2.0", "cinema-studio-2.5", "higgsfield-soul", "soul-cinema", "kling-2.6", "dop-standard",
];

export default function PromptLibrary() {
  const { data: entries, isLoading } = useQuery<PromptLibraryEntry[]>({
    queryKey: ["/api/prompt-library"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/prompt-library/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/prompt-library"] }),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "general", type: "image", model: "flux-2-pro", promptText: "" });
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/prompt-library", { ...form, isApiAvailable: ["flux-2-pro", "kling-3.0", "higgsfield-soul", "kling-2.6", "dop-standard"].includes(form.model) ? 1 : 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-library"] });
      setForm({ name: "", category: "general", type: "image", model: "flux-2-pro", promptText: "" });
      setDialogOpen(false);
    },
  });

  const [filter, setFilter] = useState("all");

  const filtered = entries?.filter(e => filter === "all" || e.category === filter) || [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-page-title">Prompt Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Saved and proven prompt templates</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" data-testid="button-add-library-prompt">
              <Plus className="w-3 h-3" /> Add Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add to Prompt Library</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Cinematic Product Hero" className="h-8 text-sm" data-testid="input-lib-name" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select value={form.category} onValueChange={v => update("category", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select value={form.type} onValueChange={v => update("type", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Model</Label>
                  <Select value={form.model} onValueChange={v => update("model", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Prompt Text</Label>
                <Textarea value={form.promptText} onChange={e => update("promptText", e.target.value)} rows={5} className="text-sm font-mono" placeholder="Enter the prompt text..." data-testid="input-lib-prompt" />
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!form.name.trim() || !form.promptText.trim() || createMutation.isPending} className="w-full gap-1.5" data-testid="button-save-lib-prompt">
                {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Save to Library
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        <Button variant={filter === "all" ? "secondary" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setFilter("all")}>All</Button>
        {CATEGORIES.map(c => (
          <Button key={c.value} variant={filter === c.value ? "secondary" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setFilter(c.value)}>
            {c.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">{entries?.length ? "No prompts in this category" : "No saved prompts"}</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Add proven prompt templates to quickly reuse across productions.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <Card key={entry.id} className="p-3 border-border/50" data-testid={`card-lib-prompt-${entry.id}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold">{entry.name}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{entry.type}</Badge>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${entry.isApiAvailable ? "border-primary/40 text-primary" : "border-amber-500/40 text-amber-400"}`}>
                  {entry.isApiAvailable ? "API" : "UI"} · {entry.model}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{entry.category}</Badge>
                <div className="ml-auto flex gap-1">
                  <CopyBtn text={entry.promptText} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(entry.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <pre className="text-xs font-mono text-muted-foreground bg-muted/30 rounded p-2 whitespace-pre-wrap line-clamp-4">{entry.promptText}</pre>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

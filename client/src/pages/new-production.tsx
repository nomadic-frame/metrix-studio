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
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CONTENT_TYPES = [
  { value: "product-ad", label: "Product Ad (15-30s)" },
  { value: "character-brand", label: "Character-Driven Brand Content" },
  { value: "viral-clip", label: "Viral Social Clip (Reels/TikTok)" },
  { value: "cinematic-film", label: "Cinematic Brand Film (30-60s)" },
  { value: "3d-commercial", label: "3D Product Commercial" },
];

const ASPECT_RATIOS = ["16:9", "9:16", "21:9", "1:1"];
const DURATIONS = ["15s", "30s", "60s"];

export default function NewProduction() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/projects", {
        ...form,
        status: "brief",
        createdAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Production created", description: `"${form.name}" is ready for setup.` });
      navigate(`/project/${data.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit = form.name.trim().length > 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-page-title">New Production</h1>
          <p className="text-sm text-muted-foreground">Define the client brief to generate a complete production package</p>
        </div>
      </div>

      <Card className="p-6 border-border/50 space-y-6">
        {/* Project Info */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Project</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Production Name *</Label>
              <Input id="name" placeholder="e.g., Nike Summer 2025" value={form.name} onChange={(e) => updateField("name", e.target.value)} data-testid="input-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Input id="client" placeholder="e.g., Nike" value={form.client} onChange={(e) => updateField("client", e.target.value)} data-testid="input-client" />
            </div>
          </div>
        </div>

        {/* Product */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Product</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input id="productName" placeholder="e.g., Air Max DN" value={form.productName} onChange={(e) => updateField("productName", e.target.value)} data-testid="input-product-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input id="targetAudience" placeholder="e.g., Gen Z sneaker enthusiasts" value={form.targetAudience} onChange={(e) => updateField("targetAudience", e.target.value)} data-testid="input-audience" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="productDescription">Product Description</Label>
            <Textarea id="productDescription" placeholder="Describe the product, its features, and key selling points..." value={form.productDescription} onChange={(e) => updateField("productDescription", e.target.value)} rows={3} data-testid="input-product-desc" />
          </div>
        </div>

        {/* Format */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Format</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={form.contentType} onValueChange={(v) => updateField("contentType", v)}>
                <SelectTrigger data-testid="select-content-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select value={form.aspectRatio} onValueChange={(v) => updateField("aspectRatio", v)}>
                <SelectTrigger data-testid="select-aspect-ratio"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map((ar) => (
                    <SelectItem key={ar} value={ar}>{ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={form.duration} onValueChange={(v) => updateField("duration", v)}>
                <SelectTrigger data-testid="select-duration"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Style */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Style & Mood</h2>
          <div className="space-y-2">
            <Label htmlFor="moodKeywords">Mood / Style Keywords</Label>
            <Input id="moodKeywords" placeholder="e.g., cinematic, warm, premium, energetic" value={form.moodKeywords} onChange={(e) => updateField("moodKeywords", e.target.value)} data-testid="input-mood" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referenceNotes">Reference Notes</Label>
            <Textarea id="referenceNotes" placeholder="Any reference links, style notes, or specific requirements..." value={form.referenceNotes} onChange={(e) => updateField("referenceNotes", e.target.value)} rows={3} data-testid="input-references" />
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
            Create Production
          </Button>
        </div>
      </Card>
    </div>
  );
}

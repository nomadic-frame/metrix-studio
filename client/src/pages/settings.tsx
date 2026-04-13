import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Key, Monitor, ExternalLink, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const [apiKey, setApiKey] = useState("");
  const [defaultAspectRatio, setDefaultAspectRatio] = useState("16:9");
  const [defaultDuration, setDefaultDuration] = useState("15s");
  const [preferredModel, setPreferredModel] = useState("kling-3.0");

  useEffect(() => {
    if (settings) {
      setApiKey(settings.higgsfield_api_key || "");
      setDefaultAspectRatio(settings.default_aspect_ratio || "16:9");
      setDefaultDuration(settings.default_duration || "15s");
      setPreferredModel(settings.preferred_model || "kling-3.0");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (pairs: { key: string; value: string }[]) => {
      for (const p of pairs) {
        await apiRequest("POST", "/api/settings", p);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate([
      { key: "higgsfield_api_key", value: apiKey },
      { key: "default_aspect_ratio", value: defaultAspectRatio },
      { key: "default_duration", value: defaultDuration },
      { key: "preferred_model", value: preferredModel },
    ]);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-page-title">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your METRIX Studio environment</p>
      </div>

      {/* API Key */}
      <Card className="p-5 border-border/50 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Higgsfield API</h2>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">
            {apiKey ? "Connected" : "Not configured"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Required for API-available models (Flux 2 Pro, Kling 3.0, Soul ID, etc.). UI-only models (Seedance 2.0, Cinema Studio 2.5) don't need an API key.
        </p>
        <div className="space-y-2">
          <Label htmlFor="apiKey" className="text-xs">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="hf_xxxxxxxxxxxxxxxxxxxx"
            className="font-mono text-sm"
            data-testid="input-api-key"
          />
        </div>
        <a href="https://www.higgsfield.ai/account" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <ExternalLink className="w-3 h-3" /> Get your API key from Higgsfield
        </a>
      </Card>

      {/* Defaults */}
      <Card className="p-5 border-border/50 space-y-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Default Preferences</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Default Aspect Ratio</Label>
            <Select value={defaultAspectRatio} onValueChange={setDefaultAspectRatio}>
              <SelectTrigger className="text-sm" data-testid="select-default-aspect"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["16:9", "9:16", "21:9", "1:1"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Default Duration</Label>
            <Select value={defaultDuration} onValueChange={setDefaultDuration}>
              <SelectTrigger className="text-sm" data-testid="select-default-duration"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["15s", "30s", "60s"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Preferred Video Model</Label>
            <Select value={preferredModel} onValueChange={setPreferredModel}>
              <SelectTrigger className="text-sm" data-testid="select-preferred-model"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kling-3.0">Kling 3.0 (API)</SelectItem>
                <SelectItem value="kling-2.6">Kling 2.6 (API)</SelectItem>
                <SelectItem value="seedance-2.0">Seedance 2.0 (UI)</SelectItem>
                <SelectItem value="cinema-studio-2.5">Cinema Studio 2.5 (UI)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Model Reference */}
      <Card className="p-5 border-border/50 space-y-3">
        <h2 className="text-sm font-semibold">Model Availability Reference</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          <div className="font-medium text-muted-foreground py-1 border-b border-border/50">API Models (direct generation)</div>
          <div className="font-medium text-muted-foreground py-1 border-b border-border/50">UI-Only Models (prompt export)</div>
          {[
            ["Flux 2 Pro — Text to Image", "Seedance 2.0 — Multi-shot Video"],
            ["Kling 3.0 Standard — Text/Image to Video", "Cinema Studio 2.5 — Cinematic Video"],
            ["Kling 2.6 — Image to Video", "Veo 3.1 — Video"],
            ["Kling 2.1 Pro/Standard — Image to Video", "Sora 2 — Video"],
            ["DOP Standard — Image to Video", "Recast — Character"],
            ["Higgsfield Soul — Text to Image", "Vibe Motion — Motion"],
            ["Soul ID — Character", ""],
          ].map(([api, ui], i) => (
            <div key={i} className="contents">
              <span className="py-1 text-primary">{api}</span>
              <span className="py-1 text-amber-400">{ui}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-1.5" data-testid="button-save-settings">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}

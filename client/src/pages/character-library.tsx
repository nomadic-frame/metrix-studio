import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Character } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Copy, Check, Trash2, Users } from "lucide-react";
import { useState } from "react";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1 text-xs"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      data-testid="button-copy-char"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy Spec"}
    </Button>
  );
}

export default function CharacterLibrary() {
  const { data: characters, isLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters/saved"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/characters/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/characters/saved"] }),
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-page-title">Character Library</h1>
        <p className="text-sm text-muted-foreground mt-1">Saved Soul Cast characters for reuse across productions</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
      ) : !characters?.length ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">No saved characters</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Characters saved during production will appear here for reuse.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {characters.map((c) => {
            const spec = `Genre: ${c.genre}\nBudget: ${c.budget}\nEra: ${c.era}\nArchetype: ${c.archetype}\nIdentity: ${[c.gender, c.ethnicity, c.ageRange].filter(Boolean).join(", ")}\nPhysical: ${[c.height, c.build, c.eyeColor, c.hair, c.facialHair].filter(Boolean).join(", ")}\nDetails: ${c.details || "None"}\nOutfit: ${c.outfit || "Not specified"}`;
            return (
              <Card key={c.id} className="p-4 border-border/50" data-testid={`card-saved-char-${c.id}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-semibold text-sm">{c.name}</span>
                      <div className="flex gap-1 mt-0.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{c.archetype}</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{c.genre}</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{c.era}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <CopyBtn text={spec} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(c.id)}
                      data-testid={`button-delete-saved-char-${c.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <pre className="text-xs font-mono text-muted-foreground bg-muted/50 rounded p-3 whitespace-pre-wrap">{spec}</pre>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { Project } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Trash2, Film, Clock, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  brief: { label: "Brief", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  characters: { label: "Characters", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  storyboard: { label: "Storyboard", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  production: { label: "Production", color: "bg-primary/20 text-primary border-primary/30" },
  complete: { label: "Complete", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

const CONTENT_TYPE_MAP: Record<string, string> = {
  "product-ad": "Product Ad",
  "character-brand": "Character Brand",
  "viral-clip": "Viral Clip",
  "cinematic-film": "Cinematic Film",
  "3d-commercial": "3D Commercial",
};

export default function Dashboard() {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/projects"] }),
  });

  const completedCount = projects?.filter((p) => p.status === "complete").length || 0;
  const activeCount = projects?.filter((p) => p.status !== "complete").length || 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-page-title">Productions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your Higgsfield video production pipeline</p>
        </div>
        <Link href="/new">
          <Button data-testid="button-new-production" className="gap-2">
            <Plus className="w-4 h-4" />
            New Production
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-border/50">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Projects</div>
          <div className="text-2xl font-bold mt-1" data-testid="text-total-projects">{projects?.length || 0}</div>
        </Card>
        <Card className="p-4 border-border/50">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active</div>
          <div className="text-2xl font-bold mt-1 text-primary" data-testid="text-active-projects">{activeCount}</div>
        </Card>
        <Card className="p-4 border-border/50">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Completed</div>
          <div className="text-2xl font-bold mt-1 text-emerald-400" data-testid="text-completed-projects">{completedCount}</div>
        </Card>
      </div>

      {/* Project List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : !projects?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
            <FolderOpen className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">No productions yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">Create your first production to start generating Higgsfield-ready content packages.</p>
          <Link href="/new">
            <Button data-testid="button-empty-new" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Production
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => {
            const statusInfo = STATUS_MAP[project.status] || STATUS_MAP.brief;
            return (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card
                  className="p-4 border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
                  data-testid={`card-project-${project.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Film className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{project.name}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {project.client && <span>{project.client}</span>}
                        <span>{CONTENT_TYPE_MAP[project.contentType] || project.contentType}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {project.duration}
                        </span>
                        <span>{project.aspectRatio}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        data-testid={`button-delete-project-${project.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteMutation.mutate(project.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertCharacterSchema, insertSceneSchema, insertPromptSchema, insertPromptLibrarySchema } from "@shared/schema";
import { generateScenes, generatePrompts } from "./prompt-engine";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── Projects ───
  app.get("/api/projects", async (_req, res) => {
    const data = await storage.getProjects();
    res.json(data);
  });

  app.get("/api/projects/:id", async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  });

  app.post("/api/projects", async (req, res) => {
    const parsed = insertProjectSchema.safeParse({ ...req.body, createdAt: new Date().toISOString() });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const project = await storage.createProject(parsed.data);
    res.json(project);
  });

  app.patch("/api/projects/:id", async (req, res) => {
    const updated = await storage.updateProject(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Project not found" });
    res.json(updated);
  });

  app.delete("/api/projects/:id", async (req, res) => {
    const id = Number(req.params.id);
    await storage.deletePromptsByProject(id);
    await storage.deleteScenesByProject(id);
    await storage.deleteProject(id);
    res.json({ ok: true });
  });

  // ─── Characters ───
  app.get("/api/projects/:id/characters", async (req, res) => {
    const data = await storage.getCharactersByProject(Number(req.params.id));
    res.json(data);
  });

  app.get("/api/characters/saved", async (_req, res) => {
    const data = await storage.getSavedCharacters();
    res.json(data);
  });

  app.post("/api/characters", async (req, res) => {
    const parsed = insertCharacterSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const character = await storage.createCharacter(parsed.data);
    res.json(character);
  });

  app.patch("/api/characters/:id", async (req, res) => {
    const updated = await storage.updateCharacter(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Character not found" });
    res.json(updated);
  });

  app.delete("/api/characters/:id", async (req, res) => {
    await storage.deleteCharacter(Number(req.params.id));
    res.json({ ok: true });
  });

  // ─── Scenes ───
  app.get("/api/projects/:id/scenes", async (req, res) => {
    const data = await storage.getScenesByProject(Number(req.params.id));
    res.json(data);
  });

  app.post("/api/projects/:id/scenes/generate", async (req, res) => {
    const projectId = Number(req.params.id);
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Delete existing scenes & prompts
    await storage.deletePromptsByProject(projectId);
    await storage.deleteScenesByProject(projectId);

    // Generate scenes from templates
    const sceneTemplates = generateScenes(project);
    const createdScenes = [];
    for (const st of sceneTemplates) {
      const created = await storage.createScene(st);
      createdScenes.push(created);
    }

    // Generate prompts from scenes
    const promptTemplates = generatePrompts(project, createdScenes);
    for (const pt of promptTemplates) {
      await storage.createPrompt(pt);
    }

    // Update project status
    await storage.updateProject(projectId, { status: "storyboard" });

    res.json(createdScenes);
  });

  app.post("/api/scenes", async (req, res) => {
    const parsed = insertSceneSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const scene = await storage.createScene(parsed.data);
    res.json(scene);
  });

  app.patch("/api/scenes/:id", async (req, res) => {
    const updated = await storage.updateScene(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Scene not found" });
    res.json(updated);
  });

  app.delete("/api/scenes/:id", async (req, res) => {
    await storage.deleteScene(Number(req.params.id));
    res.json({ ok: true });
  });

  // ─── Prompts ───
  app.get("/api/projects/:id/prompts", async (req, res) => {
    const data = await storage.getPromptsByProject(Number(req.params.id));
    res.json(data);
  });

  app.patch("/api/prompts/:id", async (req, res) => {
    const updated = await storage.updatePrompt(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Prompt not found" });
    res.json(updated);
  });

  app.delete("/api/prompts/:id", async (req, res) => {
    await storage.deletePrompt(Number(req.params.id));
    res.json({ ok: true });
  });

  // ─── Prompt Library ───
  app.get("/api/prompt-library", async (_req, res) => {
    const data = await storage.getPromptLibrary();
    res.json(data);
  });

  app.post("/api/prompt-library", async (req, res) => {
    const parsed = insertPromptLibrarySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const entry = await storage.createPromptLibraryEntry(parsed.data);
    res.json(entry);
  });

  app.delete("/api/prompt-library/:id", async (req, res) => {
    await storage.deletePromptLibraryEntry(Number(req.params.id));
    res.json({ ok: true });
  });

  // ─── Settings ───
  app.get("/api/settings", async (_req, res) => {
    const data = await storage.getAllSettings();
    const obj: Record<string, string> = {};
    data.forEach(s => { obj[s.key] = s.value; });
    res.json(obj);
  });

  app.post("/api/settings", async (req, res) => {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "key is required" });
    await storage.setSetting(key, value || "");
    res.json({ ok: true });
  });

  // ─── Higgsfield API Proxy (for API-available models) ───
  app.post("/api/generate/image", async (req, res) => {
    const apiKey = await storage.getSetting("higgsfield_api_key");
    if (!apiKey) return res.status(400).json({ error: "Higgsfield API key not configured. Go to Settings." });

    try {
      const response = await fetch("https://api.higgsfield.ai/v1/generations", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ task: "text-to-image", ...req.body }),
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/generate/video", async (req, res) => {
    const apiKey = await storage.getSetting("higgsfield_api_key");
    if (!apiKey) return res.status(400).json({ error: "Higgsfield API key not configured. Go to Settings." });

    try {
      const response = await fetch("https://api.higgsfield.ai/v1/generations", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ task: "image-to-video", ...req.body }),
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/generations/:id", async (req, res) => {
    const apiKey = await storage.getSetting("higgsfield_api_key");
    if (!apiKey) return res.status(400).json({ error: "Higgsfield API key not configured." });

    try {
      const response = await fetch(`https://api.higgsfield.ai/v1/generations/${req.params.id}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}

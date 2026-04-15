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

  // ─── Higgsfield API ───

  // Validate API key
  app.post("/api/validate-key", async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ valid: false, error: "No key provided" });
    try {
      const response = await fetch("https://api.higgsfield.ai/v1/generations", {
        method: "GET",
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      res.json({ valid: response.ok || response.status === 422 });
    } catch (err: any) {
      res.json({ valid: false, error: err.message });
    }
  });

  // POST /api/generate/image — kicks off text-to-image, updates prompt record
  app.post("/api/generate/image", async (req, res) => {
    const apiKey = await storage.getSetting("higgsfield_api_key");
    if (!apiKey) return res.status(400).json({ error: "Higgsfield API key not configured. Go to Settings." });

    const { promptId, model, prompt, width = 1280, height = 720 } = req.body;

    try {
      const response = await fetch("https://api.higgsfield.ai/v1/generations", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ task: "text-to-image", model: model || "flux-2-pro", prompt, width, height }),
      });
      const data = await response.json() as any;
      if (!response.ok) return res.status(response.status).json({ error: data.message || data.error || "Higgsfield error" });

      const generationId: string = data.id || data.generation_id;
      if (promptId) {
        await storage.updatePrompt(Number(promptId), { status: "generating", generationId });
      }
      res.json({ generationId, status: "generating" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/generate/video — kicks off image-to-video, updates prompt record
  app.post("/api/generate/video", async (req, res) => {
    const apiKey = await storage.getSetting("higgsfield_api_key");
    if (!apiKey) return res.status(400).json({ error: "Higgsfield API key not configured. Go to Settings." });

    const { promptId, model, prompt, inputImage, duration = 5, fps = 24 } = req.body;

    try {
      const response = await fetch("https://api.higgsfield.ai/v1/generations", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ task: "image-to-video", model: model || "kling-3.0-standard", prompt, input_image: inputImage, duration, fps }),
      });
      const data = await response.json() as any;
      if (!response.ok) return res.status(response.status).json({ error: data.message || data.error || "Higgsfield error" });

      const generationId: string = data.id || data.generation_id;
      if (promptId) {
        await storage.updatePrompt(Number(promptId), { status: "generating", generationId });
      }
      res.json({ generationId, status: "generating" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/generate/status/:genId — poll Higgsfield, update prompt if complete
  app.get("/api/generate/status/:genId", async (req, res) => {
    const apiKey = await storage.getSetting("higgsfield_api_key");
    if (!apiKey) return res.status(400).json({ error: "Higgsfield API key not configured." });

    const { promptId } = req.query;

    try {
      const response = await fetch(`https://api.higgsfield.ai/v1/generations/${req.params.genId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      const data = await response.json() as any;
      if (!response.ok) return res.status(response.status).json({ error: data.message || "Higgsfield error" });

      const status: string = data.status;
      const outputUrl: string | undefined = data.output_url || data.url || data.result?.url;

      if (status === "completed" && outputUrl && promptId) {
        await storage.updatePrompt(Number(promptId), { status: "complete", generatedUrl: outputUrl });
      }

      res.json({ status, outputUrl: outputUrl || null });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/upload/soul-id — upload reference image, returns soulId
  app.post("/api/upload/soul-id", async (req, res) => {
    const apiKey = await storage.getSetting("higgsfield_api_key");
    if (!apiKey) return res.status(400).json({ error: "Higgsfield API key not configured." });

    const { characterId, imageBase64, filename = "reference.jpg" } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required" });

    try {
      const buffer = Buffer.from(imageBase64, "base64");
      const formData = new FormData();
      const blob = new Blob([buffer], { type: "image/jpeg" });
      formData.append("file", blob, filename);

      const response = await fetch("https://api.higgsfield.ai/v1/soul-id", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}` },
        body: formData,
      });
      const data = await response.json() as any;
      if (!response.ok) return res.status(response.status).json({ error: data.message || "Soul ID upload failed" });

      const soulId: string = data.soul_id || data.id;
      if (characterId && soulId) {
        await storage.updateCharacter(Number(characterId), { soulId });
      }
      res.json({ soulId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}

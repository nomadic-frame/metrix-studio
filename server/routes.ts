import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertCharacterSchema, insertSceneSchema, insertPromptSchema, insertPromptLibrarySchema } from "@shared/schema";
import { generateScenes, generatePrompts } from "./prompt-engine";
import fs from "fs";
import path from "path";
import archiver from "archiver";

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

  // GET /api/generate/status/:genId — poll Higgsfield, update prompt if complete, optionally download asset
  app.get("/api/generate/status/:genId", async (req, res) => {
    const apiKey = await storage.getSetting("higgsfield_api_key");
    if (!apiKey) return res.status(400).json({ error: "Higgsfield API key not configured." });

    const { promptId, projectId, sceneNumber, assetType } = req.query;

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

        // Download asset to disk if project context is provided
        if (projectId && sceneNumber) {
          const ext = (assetType === "video") ? "mp4" : "jpg";
          const localPath = await downloadAsset(outputUrl, Number(projectId), Number(sceneNumber), ext);
          return res.json({ status, outputUrl, localPath });
        }
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

  // ─── Phase 2: Export + Webhooks ───

  // GET /api/projects/:id/export/zip — bundle all generated assets into a ZIP
  app.get("/api/projects/:id/export/zip", async (req, res) => {
    const projectId = Number(req.params.id);
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const prompts = await storage.getPromptsByProject(projectId);
    const uploadsDir = path.resolve("uploads", `project_${projectId}`);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${project.name.replace(/\s+/g, "_")}_export.zip"`);

    const zip = archiver("zip", { zlib: { level: 6 } });
    zip.on("error", (err) => res.destroy(err));
    zip.pipe(res);

    // Add manifest JSON
    const scenes = await storage.getScenesByProject(projectId);
    const characters = await storage.getCharactersByProject(projectId);
    const manifest = { project, scenes, characters, prompts };
    zip.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });

    // Add all prompts as text
    const promptsText = prompts.map(p => `[${p.type.toUpperCase()} — ${p.model}]\n${p.promptText}`).join("\n\n---\n\n");
    zip.append(promptsText, { name: "prompts.txt" });

    // Add downloaded asset files if they exist
    if (fs.existsSync(uploadsDir)) {
      zip.directory(uploadsDir, "assets");
    }

    await zip.finalize();
  });

  // POST /api/webhooks/higgsfield — async completion callbacks from Higgsfield
  app.post("/api/webhooks/higgsfield", async (req, res) => {
    const { generation_id, status, output_url, metadata } = req.body;
    res.json({ received: true });

    if (status === "completed" && output_url && metadata?.promptId) {
      try {
        const promptId = Number(metadata.promptId);
        await storage.updatePrompt(promptId, { status: "complete", generatedUrl: output_url });
        if (metadata.projectId && metadata.sceneNumber) {
          const ext = metadata.assetType === "video" ? "mp4" : "jpg";
          await downloadAsset(output_url, Number(metadata.projectId), Number(metadata.sceneNumber), ext);
        }
      } catch (err) {
        console.error("Webhook processing error:", err);
      }
    }
  });

  // Serve uploaded assets
  app.use("/uploads", (req, res, next) => {
    const uploadsDir = path.resolve("uploads");
    const filePath = path.join(uploadsDir, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });

  return httpServer;
}

// ─── Helper: download asset to disk ───
async function downloadAsset(url: string, projectId: number, sceneNumber: number, ext: string): Promise<string> {
  const dir = path.resolve("uploads", `project_${projectId}`, `scene_${sceneNumber}`);
  fs.mkdirSync(dir, { recursive: true });
  const filename = ext === "mp4" ? "video.mp4" : "image.jpg";
  const filePath = path.join(dir, filename);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download asset: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return `/uploads/project_${projectId}/scene_${sceneNumber}/${filename}`;
}
